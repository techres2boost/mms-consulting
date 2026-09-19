# 21 — Déploiement, CI/CD et monitoring

## 21.1 Monorepo

```
mms-consulting/
├── apps/
│   ├── admin/            Next.js — back-office
│   ├── portal/           Next.js — portail client (Phase 2)
│   └── mobile/           Capacitor + React
├── packages/
│   ├── core/             types, AdDeliveryChannel, RewardProvider
│   ├── adengine/         moteur de sélection PARTAGÉ client/serveur ← critique
│   ├── ui/               design system RTL, partagé mobile/web
│   └── db/               types générés depuis Postgres
├── supabase/
│   ├── migrations/       0001 → 0010 (voir docs/sql/)
│   ├── functions/        sync, ad-bundle, redemptions, attest, jobs, webhooks
│   └── seed.sql
├── docs/                 ce dossier
└── .github/workflows/
```

**`packages/adengine` est partagé délibérément** : la même logique de pondération s'exécute
sur le téléphone et dans la validation serveur. Deux implémentations divergeraient et
rendraient la facturation indéfendable (§08).

---

## 21.2 Environnements

| Env | Base | Web | Mobile | Données | Accès |
|---|---|---|---|---|---|
| **local** | Supabase CLI (Docker) | `next dev` | émulateur / device | seed + données factices | développeur |
| **dev** | projet Supabase dédié | preview Vercel | build debug | factices | équipe |
| **staging** | projet Supabase dédié | preview Vercel | **build interne (Play Internal Testing / TestFlight)** | **anonymisées**, jamais de copie de prod | équipe + testeurs |
| **prod** | projet Supabase | prod Vercel | stores | réelles | restreint, MFA |

**Jamais de copie de la production vers staging.** Un script de génération de données
anonymisées (`pnpm seed:staging`) est à écrire dès la Phase 1 — c'est une exigence de
conformité (§12) autant qu'une commodité.

### Secrets

| Secret | Emplacement | Rotation |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (serveur) + Supabase Functions | 6 mois |
| `SUPABASE_ANON_KEY` | client (publique par conception) | — |
| `PHONE_HMAC_SECRET` | Supabase Vault | **jamais** (sinon les hachages divergent) |
| `MSISDN_ENC_KEY` | Supabase Vault | 12 mois, avec réchiffrement |
| `SMS_PROVIDER_TOKEN` | Supabase Functions | 6 mois |
| `CRON_SHARED_SECRET` | Vault + Functions | 3 mois |
| Clés de signature Android / iOS | GitHub Secrets (chiffrés) | jamais |

**Contrôles de CI :** `gitleaks` sur chaque PR ; grep du bundle client à la recherche de
`service_role` ; échec du build si un secret est détecté.

---

## 21.3 CI/CD

### Sur chaque pull request

```yaml
jobs:
  quality:
    - lint, typecheck, prettier
    - tests unitaires (dont packages/adengine : la sélection pondérée)
    - gitleaks
  db:
    - démarrage d'un Postgres éphémère
    - application de toutes les migrations   ← valide 0001→0010
    - exécution de sql/tests/test_ledger.sql  ← les 14 assertions
    - assert_rls_everywhere() doit renvoyer 0 ligne
  security:
    - ÉCHEC si READ_CALL_LOG / WRITE_CALL_LOG / PROCESS_OUTGOING_CALLS
      apparaît dans AndroidManifest.xml
    - ÉCHEC si service_role apparaît dans un bundle client
  web:
    - build admin + portal
    - déploiement preview Vercel
  mobile:
    - build debug Android (APK en artefact)
    - budget de performance : taille du bundle, temps de démarrage
```

**Le job `db` est le plus important de la chaîne.** Les tests du ledger sont la garantie
que l'intégrité de la valeur n'est pas cassée par une migration — c'est le composant dont
une régression est la plus coûteuse et la plus difficile à réparer.

### Sur merge vers `main` → staging

```
1. Migrations appliquées à staging (supabase db push)
2. Déploiement des Edge Functions
3. Déploiement web sur staging
4. Tests de fumée (smoke tests) contre staging
5. Build Android → Play Internal Testing
6. Build iOS → TestFlight
```

### Mise en production (manuelle, sur tag)

```
1. Approbation humaine obligatoire
2. Sauvegarde de la base + point PITR noté
3. Migrations appliquées à la production
4. Déploiement des Edge Functions
5. Déploiement web
6. Vérifications post-déploiement :
   - verify_ledger_chain() sur un échantillon
   - cohérence wallet ↔ ledger
   - p95 /sync sur 5 minutes
7. Promotion mobile vers production (déploiement progressif : 10 % → 50 % → 100 %)
```

**Le déploiement progressif mobile est indispensable** : un bug dans la file de
synchronisation ou la signature d'événements peut corrompre l'expérience de toute la base
d'un coup. 10 % pendant 48 h avant d'élargir.

---

## 21.4 Migrations de base de données

| Règle | Raison |
|---|---|
| Migrations **additives uniquement** en production | Un rollback de schéma en production est presque toujours destructeur |
| Jamais de `DROP COLUMN` direct : dépréciation → arrêt d'usage → suppression 2 versions plus tard | Compatibilité avec les clients mobiles anciens, qui restent installés des mois |
| Une migration = un fichier numéroté, jamais modifié après merge | Traçabilité |
| Tester sur un dump anonymisé de volume comparable | Un `CREATE INDEX` sur 20 M de lignes bloque |
| `CREATE INDEX CONCURRENTLY` en production | Évite le verrou |
| Modifier `point_rules` = **nouvelle version**, jamais un `UPDATE` | Les mouvements historiques référencent leur version |

### Rollback

```
Web / Edge Functions   → rollback instantané (déploiement précédent Vercel/Supabase)
Schéma de base         → PITR au point noté avant migration.
                         ⚠ Perd les données écrites depuis. Décision consciente,
                         jamais réflexe.
Mobile                 → arrêt du déploiement progressif + feature flag serveur.
                         On ne peut pas désinstaller une version chez l'utilisateur :
                         les FEATURE FLAGS SERVEUR sont le seul vrai rollback mobile.
```

**Conséquence de conception :** toute fonctionnalité mobile risquée doit être derrière un
flag lu dans `system_settings.features` et envoyé dans la réponse de `/sync`. C'est le
seul mécanisme qui permette de neutraliser un comportement mobile sans attendre une revue
de store.

---

## 21.5 Monitoring

### Nécessaire au MVP

| Outil | Usage | Coût |
|---|---|---|
| **Sentry** | Erreurs mobile (Android + iOS) et web, avec traces | 0 → 26 USD |
| **Logs Supabase** | Edge Functions, Postgres, Auth | inclus |
| **Uptime** (UptimeRobot / Better Stack) | `/health` + `/sync` toutes les 5 min | 0 → 10 USD |
| **Table `sync_events`** | Observabilité métier de la synchro | 0 |
| **`fraud_events`** | Détections | 0 |
| **Alertes critiques** (e-mail + SMS) | Les 5 alertes ci-dessous | ~0 |

**Les cinq alertes indispensables au jour 1 :**
```
1. verify_ledger_chain() détecte une rupture          → CRITIQUE, réveil
2. Écart wallet ↔ ledger                              → CRITIQUE, réveil
3. Marge brute glissante 7 j < 20 %                   → CRITIQUE, business
4. Volume d'OTP > 3× la moyenne horaire               → CRITIQUE, SMS pumping
5. Taux d'erreur /sync > 5 % sur 15 min               → CRITIQUE, service
```

### Peut attendre la Phase 2

- APM détaillé et traces distribuées (inutile sur un monolithe).
- Dashboards Grafana / Metabase (les rollups + le dashboard admin suffisent).
- Session replay (coûteux, faible valeur sur ce produit).
- Alertes fines sur les requêtes lentes.

### À ne jamais faire

- Journaliser un numéro de téléphone complet, un JWT ou une clé de service.
- Envoyer des données personnelles à un outil tiers d'analytics sans base légale
  déclarée (§12).
- Utiliser un outil d'analytics mobile qui collecte l'identifiant publicitaire sans
  consentement.

---

## 21.6 Runbook des incidents

| Incident | Première action | Escalade |
|---|---|---|
| **Rupture d'intégrité du ledger** | Geler les conversions (`features.redemptions_enabled=false`), identifier la ligne via `verify_ledger_chain()` | Immédiate |
| **Écart wallet ↔ ledger** | Geler les conversions, recalculer depuis le ledger, écrire des mouvements de correction motivés | Immédiate |
| `/sync` en échec massif | Vérifier les connexions, Supavisor, le CPU. La file locale protège les utilisateurs — pas de perte de données | 15 min |
| Facture SMS anormale | Couper l'envoi d'OTP au fournisseur, analyser les journaux, resserrer les limites | Immédiate |
| Créatif litigieux en diffusion | Passer la campagne en `paused` + **kill-switch push** (Phase 2). Avant la Phase 2 : le retrait prend jusqu'à 7 jours — **limite à annoncer aux annonceurs** | 1 h |
| Vague de conversions inattendue | Vérifier `fraud_events`, plafonner temporairement via `system_settings` | 1 h |
| Rejet store | Lire le motif, corriger, resoumettre. Le service continue pour les installations existantes | 24 h |
| Fuite de la clé de service | Rotation immédiate, audit de `audit_logs`, notification si données personnelles touchées | Immédiate |

**Le geste réflexe à documenter et à répéter :** en cas de doute sur l'intégrité de la
valeur, **geler les conversions** est toujours la bonne première action. Les points ne
partent pas, les utilisateurs attendent quelques heures, et vous évitez de distribuer de
la data sur la base de données corrompues.
