# 06 — Architecture backend

## 6.1 Verdict sur Supabase

**Supabase est adapté, sans réserve, jusqu'à ~10 000 utilisateurs actifs.** C'est le bon
choix : Postgres managé + Auth + Storage + Functions + RLS pour 25 USD/mois, avec un
chemin de sortie propre (c'est du Postgres standard, pas un runtime propriétaire).

### Ce qui marche bien pour ce produit

| Brique | Usage | Appréciation |
|---|---|---|
| PostgreSQL | Tout le domaine métier, le ledger, les agrégats | ✅ Idéal. Le ledger *veut* des transactions ACID |
| `pg_cron` | Jobs planifiés | ✅ Évite un ordonnanceur externe |
| `pgmq` | Files de travail (transcodage, push, fulfillment) | ✅ Suffisant au MVP ; à réévaluer > 50 msg/s |
| Auth | OTP par SMS sur numéro tunisien | ⚠️ Vérifier le fournisseur SMS et le coût (voir 6.4) |
| RLS | Isolation par utilisateur | ✅ Mais **attention**, voir 6.3 |
| Storage | Créatifs audio privés + URLs signées | ✅ Adapté, taille des fichiers négligeable |
| Edge Functions | `/sync`, `/ad-bundle`, `/redemptions`, webhooks | ✅ Pour ce volume. Attention au cold start |
| Realtime | — | ❌ **Non nécessaire.** Rien dans ce produit n'est temps réel |

### Les trois réserves réelles

1. **Edge Functions et cold start.** `/sync` est le chemin critique. Un cold start de
   200–500 ms est acceptable, mais il faut : garder la fonction légère (pas de gros
   imports), faire tout le travail en **un seul RPC Postgres**, et mesurer le p95 dès le
   MVP. Si le p95 dérive, l'alternative est de déplacer `/sync` sur une Route Handler
   Next.js (Node runtime, connexion poolée) — le code est portable.
2. **Connexions Postgres.** Les Edge Functions sont éphémères et multiplient les
   connexions. **Supavisor en mode transaction est obligatoire**, pas optionnel. À câbler
   dès le premier jour, sinon vous découvrez le problème en production.
3. **Realtime : ne l'activez pas.** C'est la première source de coût et de complexité
   inutile sur Supabase pour un produit comme celui-ci.

---

## 6.2 Découpage des responsabilités

```
┌─ CLIENT MOBILE ───────────────────────────────────────────────┐
│ • lit son wallet, son historique, son bundle : PostgREST + RLS │
│ • écrit UNIQUEMENT via Edge Functions                          │
└────────────────────────────────────────────────────────────────┘

┌─ EDGE FUNCTIONS (clé service, jamais exposée au client) ───────┐
│ /sync            ingestion batch signée + crédit               │
│ /ad-bundle       liste des créatifs éligibles + URLs signées    │
│ /redemptions     création d'une demande de conversion           │
│ /attest          enregistrement/renouvellement d'attestation    │
│ /profile         écritures profil contrôlées                    │
│ /webhooks/sms    callbacks du fournisseur OTP                   │
│ /webhooks/topup  callbacks de l'agrégateur data (Phase 3)       │
│ /jobs/*          cibles appelées par pg_cron                    │
└────────────────────────────────────────────────────────────────┘

┌─ NEXT.JS / VERCEL ────────────────────────────────────────────┐
│ • Back-office : Server Components + Server Actions,             │
│   avec la clé service côté serveur uniquement                   │
│ • Portail client : PostgREST + RLS avec le JWT de l'utilisateur │
└────────────────────────────────────────────────────────────────┘

┌─ POSTGRES ────────────────────────────────────────────────────┐
│ • RLS pour toute lecture client                                 │
│ • Fonctions SECURITY DEFINER pour toute mutation de valeur      │
│ • Triggers : append-only sur le ledger, chaînage de hash        │
│ • pg_cron + pgmq                                                │
└────────────────────────────────────────────────────────────────┘
```

**Règle absolue :** la clé `service_role` n'existe que dans les Edge Functions et dans le
runtime serveur de Next.js. Elle n'est **jamais** dans le bundle mobile, jamais dans une
variable `NEXT_PUBLIC_*`, jamais dans un dépôt. Un test de CI grep le bundle client.

---

## 6.3 RLS : les pièges à éviter

RLS est excellent pour la **lecture**. Il est insuffisant, seul, pour protéger la valeur.

```sql
-- ✅ BON : lecture seule de son propre wallet
CREATE POLICY wallet_select_own ON points_wallets
  FOR SELECT USING (user_id = auth.uid());
-- Aucune policy INSERT/UPDATE/DELETE → aucune écriture possible par le client.

-- ✅ BON : ledger strictement en lecture
CREATE POLICY ledger_select_own ON points_ledger
  FOR SELECT USING (user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON points_ledger FROM authenticated, anon;

-- ❌ PIÈGE CLASSIQUE : donner l'INSERT au client sur les impressions
--    « puisque RLS vérifie user_id = auth.uid() »
--    → l'utilisateur peut alors insérer 10 000 impressions valides-en-apparence.
--    Les impressions DOIVENT passer par /sync, qui applique les plafonds
--    et vérifie la signature. Aucune policy d'écriture côté client.
```

Autres pièges :
- **Fonctions `SECURITY DEFINER` sans `search_path` fixé** → vecteur d'escalade.
  Toujours `SET search_path = public, pg_temp`.
- **Vues sans `security_invoker`** → contournent RLS. Sur Postgres 15+, déclarer
  `WITH (security_invoker = true)`.
- **Oubli de RLS sur une nouvelle table.** Mitigation : un test de CI qui échoue si une
  table du schéma `public` n'a pas `rowsecurity = true`.
- **Policies coûteuses** : `auth.uid()` est stable, mais une policy avec sous-requête sur
  une grosse table tue les performances. Garder les policies triviales
  (`user_id = auth.uid()`), et faire les jointures dans des vues côté serveur.

---

## 6.4 Auth et OTP — le coût caché

L'auth par numéro de téléphone avec OTP SMS est le bon choix produit (pas d'e-mail chez
une partie de la cible), mais :

- **Supabase ne fournit pas les SMS** : il faut brancher un fournisseur
  (Twilio, Vonage, MessageBird, ou un agrégateur local tunisien).
- **Le coût unitaire d'un SMS vers la Tunisie est de l'ordre de 0,03 à 0,08 USD.** À
  10 000 inscriptions, c'est 300 à 800 USD — plus que plusieurs mois d'infrastructure.
  Ce poste doit apparaître dans le budget (§16).
- **Un agrégateur SMS local est souvent 3 à 10 fois moins cher** qu'un CPaaS
  international pour du trafic domestique tunisien, et parfois requis par la
  réglementation sur les expéditeurs (Sender ID). À négocier avant le lancement.
- **Anti-abus obligatoire dès le jour 1** : le renvoi d'OTP est un vecteur de « SMS
  pumping » qui peut générer une facture de plusieurs milliers d'euros en une nuit.
  Rate-limit par numéro (3/h, 10/j), par IP (10/j), par plage de numéros, CAPTCHA au
  3ᵉ essai, et **plafond de dépense quotidien chez le fournisseur**.

---

## 6.5 Jobs et files

### `pg_cron`

| Planification | Job | Cible |
|---|---|---|
| `0 2 * * *` | `job_aggregate_daily` | Rollups `daily_campaign_stats`, `daily_user_stats` |
| `0 3 * * *` | `job_detect_fraud` | Règles d'anomalie → `fraud_events` |
| `0 4 * * *` | `job_expire_points` | Expiration FIFO des lots > 12 mois |
| `30 0 1 * *` | `job_monthly_bonus` | Bonus de fidélité |
| `*/5 * * * *` | `job_campaign_lifecycle` | `approved`→`active`, `active`→`completed` |
| `0 5 * * 0` | `job_archive_purge` | Archivage 90 j, purge audio 180 j |
| `*/1 * * * *` | `job_drain_queues` | Consomme pgmq et appelle les Edge Functions |

**Pattern :** `pg_cron` ne contient pas de logique métier. Il appelle soit une fonction
SQL, soit une Edge Function via `net.http_post` avec un secret partagé. La logique reste
testable et versionnée.

### `pgmq`

| File | Producteur | Consommateur | Idempotent ? |
|---|---|---|---|
| `transcode_audio` | Upload back-office | Edge Function transcodage | Oui (clé = hash du fichier) |
| `invalidate_ad_bundle` | Changement de campagne/zone | Bump de version | Oui |
| `send_push` | Conversions, alertes | FCM/APNs | Oui (clé = event_id) |
| `fulfil_redemption` | `/redemptions` (Phase 3) | API agrégateur | **Oui, impératif** — un doublon = un Go donné deux fois |
| `notify_backoffice` | `/redemptions` (MVP) | E-mail / Slack | Oui |

**Toute consommation de file écrit dans `sync_events` ou `audit_logs`.** Une file sans
trace est un incident non diagnosticable.

---

## 6.6 Le transcodage audio : où le faire

Trois options, par ordre de simplicité :

1. **MVP — côté navigateur, à l'upload.** `ffmpeg.wasm` dans le back-office : l'opérateur
   dépose un MP3/WAV, le navigateur transcode en Opus et envoie le résultat. Zéro
   infrastructure. **Mais le serveur doit revalider** (durée, format, taille) — la sortie
   du navigateur est une donnée non fiable comme une autre.
2. **Phase 2 — Edge Function + service de transcodage.** Un petit conteneur
   (Fly.io / Railway / Cloud Run, ~5 USD/mois) avec `ffmpeg`. Déclenché par `pgmq`.
   Robuste, normalisation de loudness fiable.
3. **À éviter :** un service de transcodage vidéo managé. Surdimensionné pour 4 secondes
   d'audio mono.

**Recommandation : commencer par 1, basculer sur 2 dès qu'il y a plus de ~50 créatifs par
mois ou dès qu'on veut une normalisation de loudness sérieuse.**

---

## 6.7 Contrat d'API (esquisse)

```
POST   /functions/v1/sync                  → ingestion batch       (JWT + signature)
GET    /functions/v1/ad-bundle?v=...       → bundle + URLs signées  (JWT)
POST   /functions/v1/redemptions           → demande de conversion  (JWT)
POST   /functions/v1/attest                → enregistrement device  (JWT)
PATCH  /functions/v1/profile               → zone, langue, consentements (JWT)
POST   /functions/v1/account/export        → export RGPD-like       (JWT)
DELETE /functions/v1/account               → suppression            (JWT + OTP)

GET    /rest/v1/points_ledger?...          → PostgREST + RLS (lecture historique)
GET    /rest/v1/reward_redemptions?...     → PostgREST + RLS
GET    /rest/v1/data_packages?...          → PostgREST (catalogue public)

# Back-office : Server Actions Next.js, pas d'API publique.
```

**Versionnement :** l'app mobile envoie `X-App-Version` et `X-Contract-Version`. Le
serveur peut refuser une version trop ancienne (`426 Upgrade Required`) — indispensable
quand les règles de points changent, car des clients anciens pourraient produire des
événements non conformes.
