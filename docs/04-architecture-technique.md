# 04 — Architecture technique

## 4.1 Architecture cible (logique)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                          │
│                                                                               │
│  ┌────────────────────────┐   ┌────────────────────┐   ┌──────────────────┐  │
│  │ App mobile (Capacitor) │   │ Portail client Web │   │ Back-office Web  │  │
│  │ Android + iOS          │   │ Next.js            │   │ Next.js          │  │
│  │ ┌────────────────────┐ │   └────────────────────┘   └──────────────────┘  │
│  │ │ SQLite chiffrée    │ │             │                        │            │
│  │ │ cache audio        │ │             │                        │            │
│  │ │ file d'événements  │ │             │                        │            │
│  │ │ Keystore/Enclave   │ │             │                        │            │
│  │ └────────────────────┘ │             │                        │            │
│  └────────────────────────┘             │                        │            │
└───────────┬──────────────────────────────┴────────────────────────┴───────────┘
            │ HTTPS / JSON, JWT                                     │
            │                                                        │
┌───────────▼────────────────────────────────────────────────────────▼──────────┐
│                          COUCHE API / EDGE                                     │
│                                                                                │
│  Vercel (Next.js)                          Supabase                            │
│  ├─ SSR / RSC back-office                  ├─ Auth (JWT, refresh, OTP SMS)     │
│  ├─ Route Handlers (admin, BFF)            ├─ PostgREST (lecture RLS)          │
│  └─ Server Actions                         ├─ Edge Functions (Deno)            │
│                                            │   ├─ /sync          ← critique    │
│                                            │   ├─ /ad-bundle                   │
│                                            │   ├─ /redemptions                 │
│                                            │   ├─ /attest                      │
│                                            │   └─ /webhooks/*                  │
│                                            └─ Storage (S3 + CDN, privé)        │
└───────────┬────────────────────────────────────────────────────────┬──────────┘
            │                                                         │
┌───────────▼─────────────────────────────────────────────────────────▼──────────┐
│                              DONNÉES                                            │
│                                                                                 │
│  PostgreSQL (Supabase)                                                          │
│  ├─ Domaine identité / profils / devices                                        │
│  ├─ Domaine inventaire (companies, campaigns, advertisements, zones)             │
│  ├─ Domaine mesure (calls, advertisement_impressions)  ← PARTITIONNÉ par mois    │
│  ├─ Domaine valeur (points_wallets, points_ledger)     ← APPEND-ONLY             │
│  ├─ Domaine récompenses (data_packages, reward_redemptions)                      │
│  ├─ Domaine confiance (fraud_events, audit_logs, sync_events)                    │
│  └─ Agrégats (daily_campaign_stats, daily_user_stats)  ← alimentés par jobs      │
│                                                                                 │
│  Storage : /advertisements/{company}/{campaign}/{version}/{file}.opus            │
│            + /archive/ (froid)                                                   │
└───────────┬─────────────────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────────────────────────┐
│                       TRAITEMENTS ASYNCHRONES                                    │
│                                                                                  │
│  pg_cron (dans Postgres)              pgmq (queue dans Postgres)                 │
│  ├─ 02:00 agrégation J-1              ├─ transcode_audio                         │
│  ├─ 03:00 détection de fraude         ├─ send_push                               │
│  ├─ 04:00 expiration des points       ├─ fulfil_redemption (Phase 3)             │
│  ├─ J1     bonus mensuel              └─ invalidate_ad_bundle                    │
│  └─ dim.   archivage / purge                                                     │
│                                                                                  │
│  Workers : Edge Functions déclenchées par pg_cron (`net.http_post`)              │
└──────────────────────────────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────────────────────────┐
│                          EXTÉRIEUR                                               │
│  Fournisseur SMS OTP  │  Push (FCM/APNs)  │  Sentry  │  Agrégateur data (Ph.3)   │
│                       │                   │          │  Opérateur RBT (Ph.3+)    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Principes d'architecture

| # | Principe | Conséquence concrète |
|---|---|---|
| P1 | **Monolithe modulaire.** Un seul schéma Postgres, des modules logiques séparés par des schémas/préfixes, aucune découpe réseau | Pas de microservices, pas de Kubernetes, pas de service mesh |
| P2 | **Le serveur est la seule autorité sur la valeur.** Le client déclare, le serveur décide | RLS `SELECT`-only sur le ledger ; écritures via `SECURITY DEFINER` |
| P3 | **Tout événement est idempotent.** | `idempotency_key UNIQUE` sur chaque table d'ingestion |
| P4 | **Abstraction du canal de diffusion.** Le mécanisme d'appel est derrière une interface | Bascule ALT-D → ALT-E → ALT-A sans réécrire la plateforme |
| P5 | **Les barèmes sont des données.** | Table `system_settings` versionnée + `point_rules` |
| P6 | **Partitionner dès le jour 1** les tables d'événements | Évite une migration douloureuse à 10 k utilisateurs |
| P7 | **Agréger tôt, purger tard.** Rollups quotidiens ; rétention des lignes brutes bornée | Coût de stockage maîtrisé, facturation préservée |
| P8 | **Pas de donnée personnelle non nécessaire.** | Le numéro appelé n'est jamais transmis au serveur (§12) |

### P4 en pratique — l'abstraction de diffusion

```ts
// packages/core/src/delivery/AdDeliveryChannel.ts
export interface AdDeliveryChannel {
  readonly id: 'in_app_preroll' | 'android_dialer' | 'operator_rbt' | 'voip_bridge';
  /** Le canal peut-il diffuser maintenant, sur ce device ? */
  capabilities(): Promise<{ canPlayPreAnswer: boolean;
                            canMeasureCallDuration: boolean;
                            canRepeatUntilAnswer: boolean }>;
  /** Diffuse un créatif et retourne un fait d'impression signable. */
  deliver(creative: Creative, ctx: CallContext): Promise<ImpressionFact>;
}
```

Le moteur de sélection, le ledger, le back-office et la facturation ne connaissent que
`ImpressionFact`. Le passage à ALT-A remplace une implémentation côté client par un
ingesteur de CDR côté serveur — **sans toucher** aux 80 % de la plateforme. C'est la
décision d'architecture la plus rentable de tout le dossier.

---

## 4.3 Flux détaillés

### F1 — Ingestion d'événements (le chemin critique)

```
App ──POST /sync (batch ≤ 100 événements, gzip)──► Edge Function
                                                    │
     1. Vérif JWT (Supabase Auth)                   │
     2. Charge device_installations + clé publique   │
     3. Vérif attestation (cache 24 h)               │
     4. Pour chaque événement : vérif signature + seq + idem
     5. RPC Postgres unique : ingest_sync_batch(jsonb)
        └─► BEGIN
            ├─ INSERT ... ON CONFLICT (idempotency_key) DO NOTHING
            ├─ contrôle des plafonds (fonction pure, lit point_rules)
            ├─ INSERT points_ledger (credit)
            ├─ UPDATE points_wallets (balance matérialisé)
            ├─ INSERT sync_events (traçabilité)
            └─ COMMIT
     6. Réponse : accepted/rejected + solde + bundle + policy
```

**Pourquoi un seul RPC et pas N requêtes PostgREST :** un batch = une transaction = un
aller-retour. À 10 k utilisateurs, cela fait la différence entre ~0,5 rps et ~15 rps sur
la base, et cela rend l'atomicité triviale. **C'est le point de design le plus important
du backend.**

### F2 — Distribution des créatifs

```
Upload (back-office) ──► Storage /staging/ ──► pgmq:transcode_audio
                                                    │
                          Edge Function transcode ──┤ ffmpeg WASM ou service externe
                                                    │ → Opus 32k mono, −16 LUFS
                                                    ▼
                                       Storage /advertisements/... (privé)
                                                    │
                          validation humaine ───────┤
                                                    ▼
                                     campaign → active
                                                    │
                        pgmq:invalidate_ad_bundle ──┤ bump ad_bundle_version
                                                    │  des zones concernées
                                                    ▼
             App (prochaine synchro) ──► GET /ad-bundle ──► liste + URLs signées (TTL 7 j)
                                     ──► téléchargement direct depuis le CDN
                                     ──► vérif du hash SHA-256 ──► cache local
```

### F3 — Conversion en data

```
App ──POST /redemptions──► Edge Function
                            ├─ contrôles : solde confirmé, ancienneté, fraude, 1 en cours
                            ├─ RPC redeem_points() → ledger debit + redemption(pending)
                            └─ pgmq:notify_backoffice
                                          │
   MVP   ◄── file back-office ────────────┤ traitement humain → fulfilled
   Ph.3  ◄── pgmq:fulfil_redemption ──────┤ API agrégateur → processing
                                          └─ webhook → fulfilled | failed → reversal
```

---

## 4.4 Paliers d'architecture

### Palier 1 — 0 à 1 000 utilisateurs

```
Vercel Pro (1 projet, 2 apps)  +  Supabase Pro (Micro/Small compute)
Edge Functions pour /sync et /ad-bundle
pg_cron + pgmq dans la base
Sentry free/team, Supabase logs
```
**Aucune pièce supplémentaire.** C'est volontairement minimal. Les tables d'événements
sont déjà partitionnées par mois mais tiennent dans un seul volume.

### Palier 2 — 1 000 à 10 000 utilisateurs

Ce qui change :
- **Compute Supabase** : passage à Small puis Medium (le goulot est le CPU sur `/sync`,
  pas le stockage).
- **Supavisor en mode transaction** obligatoire pour les Edge Functions (sinon épuisement
  des connexions).
- **Rollups quotidiens indispensables** : les dashboards ne requêtent plus jamais les
  tables brutes.
- **Rétention** : lignes brutes d'impressions conservées 90 jours, puis seuls les agrégats.
- **CDN devant le Storage** pour les créatifs (Cloudflare gratuit suffit).
- **Read replica** non nécessaire à ce stade.

### Palier 3 — 10 000 à 100 000 utilisateurs

Ce qui change, dans l'ordre où la douleur apparaît :
1. **Ingestion** : `/sync` devient le point chaud. Découpler → écriture dans une table
   `raw_sync_batches` (append seul, très rapide) + worker de traitement. L'API répond
   « accepté pour traitement » et le solde est confirmé en asynchrone (secondes).
2. **Compute Supabase** : Large / XL, ou **sortie de Supabase pour la base** vers un
   Postgres managé (Neon, RDS, Cloud SQL) en gardant Supabase Auth/Storage. À évaluer
   sur le coût, pas par principe.
3. **Read replica** pour l'analytique, ou export vers un entrepôt (ClickHouse /
   BigQuery / Postgres+columnar) si les KPI deviennent lourds.
4. **Queue** : pgmq peut tenir, mais si le volume dépasse ~50 msg/s soutenus, passer à
   un broker dédié.

### Palier 4 — au-delà de 100 000

- Base dédiée, réplication, PITR agressif.
- Séparation physique OLTP / OLAP.
- Éventuellement une région d'hébergement plus proche (Europe : `eu-central-1` ou
  `eu-west-3` — Paris est le meilleur compromis de latence pour la Tunisie).
- **C'est le seul palier qui justifie de reconsidérer le monolithe**, et encore : un
  module d'ingestion extrait en service séparé suffit généralement. Pas de Kubernetes.

### Signaux déclencheurs (à instrumenter dès le MVP)

| Signal | Seuil | Action |
|---|---|---|
| p95 de `/sync` | > 800 ms | Upgrade compute, puis découplage (Palier 3.1) |
| CPU base soutenu | > 60 % | Upgrade compute |
| Taille de `advertisement_impressions` | > 20 Go | Activer la purge des partitions anciennes |
| Connexions actives | > 60 % du pool | Vérifier Supavisor, réduire les connexions directes |
| Egress Supabase | > 200 Go/mois | Mettre le CDN devant le Storage |
| Conversions manuelles/mois | > 300 | Prioriser l'automatisation (§11) |
