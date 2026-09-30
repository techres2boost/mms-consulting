# 07 — Database schema

Migrations exécutables dans [`sql/`](sql/). Ce document explique les choix.

## 7.1 Révision de votre liste de tables

Votre liste comportait 27 tables. Voici ce que j'en fais et pourquoi.

| Votre table | Décision | Motif |
|---|---|---|
| `users` | **Remplacée** par `auth.users` (Supabase) | Ne jamais dupliquer la table d'auth |
| `profiles` | **Gardée** | Le bon endroit pour les données métier de l'utilisateur |
| `customers` | **Supprimée — fusionnée dans `profiles`** | `customers` et `profiles` désignaient la même entité. Deux tables = deux sources de vérité |
| `employees` | **Gardée** | Séparée de `profiles` : un employé n'est pas un client |
| `roles` | **Remplacée** par un ENUM + table `role_permissions` | 4 rôles fixes ne justifient pas une table ; les permissions, oui |
| `companies` / `advertisers` | **Fusionnées en `companies`** | Même entité. La distinction n'apparaît qu'avec des régies tierces (Phase 4) |
| `campaigns` | **Gardée** | Porte dates, budget, priorité, statut |
| `advertisements` | **Gardée** (= le créatif) | Une campagne peut avoir plusieurs créatifs (A/B, versions AR/FR) |
| `audio_files` | **Supprimée — fusionnée dans `advertisements`** | 1 créatif = 1 fichier. Une table séparée n'apporte rien. Le versionnement se fait par `advertisements.version` |
| `geographic_zones` | **Gardée**, hiérarchique (`parent_id`) | Gouvernorat → délégation, extensible |
| `campaign_zones` | **Gardée** | Table de jonction |
| `calls` | **Gardée**, mais **fortement minimisée** | Aucun numéro stocké (§12). **Partitionnée par mois** |
| `call_events` | **Supprimée au MVP** | `calls` avec `started_at`/`ended_at`/`outcome` suffit. Une table d'événements d'appel triple le volume sans usage identifié |
| `advertisement_impressions` | **Gardée**, **partitionnée par mois** | La table la plus volumineuse du système |
| `points_wallets` | **Gardée** (solde matérialisé) | Lecture rapide ; la vérité reste le ledger |
| `points_ledger` | **Gardée**, append-only + chaînage de hash | Le cœur de confiance |
| `rewards` | **Renommée `data_packages`** | Au MVP la seule récompense est de la data. Un catalogue générique viendra plus tard |
| `reward_redemptions` | **Gardée** avec machine à états | |
| `telecom_operators` | **Gardée** | Référentiel |
| `data_packages` | **Gardée** | Catalogue par opérateur |
| `data_purchases` | **Supprimée au MVP** | C'est de la comptabilité fournisseur. `reward_redemptions.cost_*` suffit jusqu'à ce qu'il y ait des achats en gros |
| `data_allocations` | **Supprimée** | Redondant avec `reward_redemptions` |
| `fraud_events` | **Gardée** | |
| `audit_logs` | **Gardée** | |
| `device_installations` | **Gardée** | Porte la clé publique et l'attestation |
| `device_tokens` | **Fusionnée dans `device_installations`** | Le token push est un attribut de l'installation |
| `sync_events` | **Gardée**, rétention 30 j | Observabilité de la synchro |

**Ajouts nécessaires :**

| Table ajoutée | Pourquoi |
|---|---|
| `system_settings` | Barèmes, plafonds, feature flags **en données** (principe P5) |
| `point_rules` | Barème versionné et daté : indispensable pour rejouer un calcul historique |
| `consents` | Preuve horodatée et versionnée du consentement (obligation légale, §12) |
| `ad_bundle_versions` | Version du bundle par zone, pour l'invalidation du cache |
| `daily_campaign_stats` | Rollup — les dashboards ne touchent jamais les tables brutes |
| `daily_user_stats` | Rollup — détection de fraude et KPI |
| `role_permissions` | RBAC en données, modifiable sans déploiement |
| `campaign_invoices` | Facturation annonceur : figée, ne doit jamais bouger même si les stats sont purgées |
| `deleted_accounts` | Tombstone après suppression : conserve le hash du numéro pour bloquer la réinscription frauduleuse, sans conserver le numéro |

**Total : 24 tables.** Moins que votre liste, avec plus de fonctions couvertes.

---

## 7.2 Tables — détail

### Domaine identité

#### `profiles`
**Rôle** : données métier de l'utilisateur final.

| Colonne | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK**, FK → `auth.users(id)` ON DELETE CASCADE | |
| `phone_e164` | `text UNIQUE NOT NULL` | **Donnée personnelle.** Format `+216XXXXXXXX` |
| `phone_hash` | `bytea NOT NULL` | HMAC-SHA256 du numéro avec un secret serveur. Sert aux jointures anti-fraude sans exposer le numéro |
| `display_name` | `text` | Facultatif |
| `governorate_id` | `uuid` FK → `geographic_zones(id)` **NOT NULL** | Ciblage |
| `delegation_id` | `uuid` FK → `geographic_zones(id)` | Facultatif |
| `operator_id` | `uuid` FK → `telecom_operators(id)` | Déclaré |
| `language` | `text` CHECK in ('ar','fr') | |
| `status` | `profile_status` | `active`, `limited`, `suspended`, `deleted` |
| `suspended_reason` | `text` | |
| `created_at`, `updated_at` | `timestamptz` | |
| `last_active_at` | `timestamptz` | Pour DAU/MAU |

**Index** : `UNIQUE(phone_e164)`, `UNIQUE(phone_hash)`, `(governorate_id) WHERE status='active'`,
`(status, last_active_at DESC)`.
**Sensible** : `phone_e164`, `display_name`.

#### `device_installations`
**Rôle** : lie un compte à une installation physique, porte la clé de signature.

| Colonne | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `user_id` | `uuid` FK → `profiles(id)` | |
| `install_id` | `text NOT NULL` | Généré à la 1ʳᵉ ouverture, stable |
| `platform` | `text` CHECK in ('android','ios') | |
| `public_key` | `bytea NOT NULL` | Clé publique P-256 du Keystore/Enclave |
| `key_attested` | `boolean` | Clé attestée matériellement (StrongBox / Secure Enclave) |
| `integrity_verdict` | `jsonb` | Dernier verdict Play Integrity / App Attest |
| `integrity_checked_at` | `timestamptz` | |
| `last_seq` | `bigint NOT NULL DEFAULT 0` | **Compteur monotone serveur** |
| `push_token` | `text` | |
| `app_version`, `os_version`, `device_model` | `text` | |
| `status` | `text` | `active`, `revoked`, `blocked` |
| `first_seen_at`, `last_seen_at` | `timestamptz` | |

**Index** : `UNIQUE(install_id)`, `(user_id) WHERE status='active'`,
`(integrity_checked_at)`.
**Contrainte** : un index unique partiel garantit **au plus une installation active par
utilisateur** (paramétrable si le multi-device est autorisé plus tard).

#### `consents`
Append-only. `(user_id, consent_type, version, granted, granted_at, ip_hash, user_agent)`.
**Ne jamais mettre à jour une ligne** : un retrait de consentement est une nouvelle ligne
avec `granted = false`. C'est la preuve légale (§12).

#### `employees`
`(id → auth.users, email, full_name, role employee_role, zone_scope uuid[], mfa_enabled,
status, created_by, created_at)`.
**Index** : `UNIQUE(email)`, `(role, status)`.

#### `role_permissions`
`(role employee_role, permission text, PRIMARY KEY (role, permission))`.
Permissions sous forme `domaine:action` (voir §14).

---

### Domaine géographie

#### `geographic_zones`
**Rôle** : hiérarchie géographique, extensible.

| Colonne | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `parent_id` | `uuid` FK → self | NULL = racine (pays) |
| `level` | `zone_level` | `country`, `governorate`, `delegation`, `custom` |
| `code` | `text UNIQUE` | ex. `TN-11` (ISO 3166-2) |
| `name_fr`, `name_ar` | `text NOT NULL` | |
| `path` | `ltree` | Chemin matérialisé : `tn.tunis.bardo` |
| `centroid` | `geography(Point,4326)` | Facultatif, pour le ciblage par rayon (Phase 3) |
| `is_active` | `boolean` | |

**Index** : `GIST(path)`, `UNIQUE(code)`, `GIST(centroid)` si PostGIS activé.

**Choix pour le MVP :** **ciblage par gouvernorat uniquement** (24 valeurs). Les
délégations (~264) sont dans le modèle mais non exposées dans l'UI. Le ciblage par rayon
est modélisé mais désactivé. Motif : avec moins de ~50 campagnes, un ciblage plus fin
n'améliore pas les résultats et complique l'UI, le moteur et le cache de bundle. `ltree`
rend l'extension gratuite le jour où c'est utile.

---

### Domaine inventaire

#### `companies`
`(id, legal_name, brand_name, tax_id, sector, contact_name, contact_phone, contact_email,
address, zone_id, status, notes, created_by, created_at, updated_at)`.
**Index** : `UNIQUE(tax_id) WHERE tax_id IS NOT NULL`, `(status)`, GIN trigram sur
`brand_name` pour la recherche.
**Sensible** : coordonnées de contact.

#### `campaigns`
| Colonne | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `company_id` | `uuid` FK → `companies` | |
| `name` | `text NOT NULL` | |
| `status` | `campaign_status` | machine à états §02 W4 |
| `starts_on`, `ends_on` | `date NOT NULL` | CHECK `ends_on >= starts_on` |
| `priority` | `smallint` CHECK 1..10 DEFAULT 5 | |
| `weight` | `integer` CHECK > 0 DEFAULT 100 | Part de voix |
| `pricing_model` | `pricing_model` | `cpm`, `flat_monthly`, `cpl` (cost per listen) |
| `unit_price_millimes` | `bigint` | **Entier en millimes** (1 TND = 1000 millimes). Jamais de flottant sur de l'argent |
| `budget_millimes` | `bigint` | NULL = illimité |
| `spent_millimes` | `bigint DEFAULT 0` | Mis à jour par le rollup |
| `daily_impression_cap` | `integer` | Par campagne |
| `user_daily_cap` | `integer DEFAULT 3` | Par utilisateur et par jour |
| `user_freq_cap_minutes` | `integer DEFAULT 60` | Intervalle minimum |
| `target_operator_ids` | `uuid[]` | Facultatif |
| `target_languages` | `text[]` | Facultatif |
| `created_by`, `approved_by` | `uuid` FK → `employees` | Séparation des rôles |
| `created_at`, `updated_at`, `archived_at` | `timestamptz` | |

**Index** : `(status, starts_on, ends_on)`, `(company_id)`,
`(status) WHERE status = 'active'`.
**Contraintes** : `CHECK (budget_millimes IS NULL OR spent_millimes <= budget_millimes)`
appliqué en trigger plutôt qu'en CHECK pour permettre le dépassement toléré du dernier
batch.

#### `advertisements` (le créatif)
| Colonne | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `campaign_id` | `uuid` FK → `campaigns` | |
| `version` | `integer NOT NULL DEFAULT 1` | Versionnement du créatif |
| `language` | `text` | Permet AR + FR dans une même campagne |
| `storage_path` | `text NOT NULL` | `/advertisements/{company}/{campaign}/{id}-v{n}.opus` |
| `original_path` | `text` | Master conservé jusqu'à l'archivage |
| `codec` | `text` | `opus` / `aac` |
| `bitrate_kbps` | `smallint` | |
| `duration_ms` | `integer NOT NULL` | CHECK entre 2000 et 8000 |
| `size_bytes` | `integer NOT NULL` | CHECK <= 204800 |
| `sha256` | `bytea NOT NULL` | Vérifié par le client après téléchargement |
| `loudness_lufs` | `numeric(4,1)` | |
| `status` | `ad_status` | `uploaded`, `transcoding`, `pending_review`, `approved`, `rejected`, `archived`, `purged` |
| `rejection_reason` | `text` | |
| `reviewed_by`, `reviewed_at` | | |
| `created_at`, `archived_at`, `purged_at` | `timestamptz` | |

**Index** : `(campaign_id, status)`, `UNIQUE(campaign_id, version, language)`,
`(status) WHERE status = 'approved'`, `(archived_at) WHERE purged_at IS NULL`.

#### `campaign_zones`
`(campaign_id, zone_id, PRIMARY KEY (campaign_id, zone_id))`.
**Index** : `(zone_id)` — c'est le sens de lecture du moteur (« quelles campagnes pour
cette zone »).

#### `ad_bundle_versions`
`(zone_id PK, version text NOT NULL, updated_at timestamptz)`.
Bumpé par trigger sur tout changement de campagne/créatif/zone. Permet au client de
savoir en un aller-retour trivial s'il doit retélécharger.

---

### Domaine mesure

#### `calls` — **partitionnée par mois**
**Minimalisme délibéré.** Voir §12 pour la justification.

| Colonne | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `user_id` | `uuid` | |
| `occurred_at` | `timestamptz NOT NULL` | **Horodatage serveur**, clé de partition |
| `client_reported_at` | `timestamptz` | Indicatif seulement |
| `duration_seconds` | `integer` | NULL sur iOS |
| `outcome` | `call_outcome` | `completed`, `unanswered`, `unknown` |
| `measured` | `boolean NOT NULL` | `false` sur iOS : la durée n'est pas mesurée |
| `idempotency_key` | `uuid NOT NULL` | |
| `install_id` | `text` | |

**PK** : `(occurred_at, id)` — obligatoire pour une table partitionnée par `occurred_at`.
**Index** : `UNIQUE(idempotency_key, occurred_at)`, `(user_id, occurred_at DESC)`.
**Ce qui n'est PAS stocké** : le numéro appelé, le nom du contact, aucune localisation.

#### `advertisement_impressions` — **partitionnée par mois**
| Colonne | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `user_id` | `uuid` | |
| `advertisement_id` | `uuid` | |
| `campaign_id` | `uuid` | Dénormalisé volontairement (évite une jointure sur le chemin chaud) |
| `zone_id` | `uuid` | Zone de l'utilisateur au moment de la diffusion |
| `occurred_at` | `timestamptz NOT NULL` | Serveur ; clé de partition |
| `client_reported_at` | `timestamptz` | |
| `played_ms` | `integer NOT NULL` | |
| `completion_pct` | `smallint NOT NULL` | CHECK 0..100 |
| `state` | `impression_state` | `complete`, `partial`, `rejected` |
| `credited` | `boolean NOT NULL DEFAULT false` | |
| `points_awarded` | `integer NOT NULL DEFAULT 0` | |
| `reject_reason` | `text` | `daily_cap`, `freq_cap`, `stale_bundle`, `campaign_inactive`, `integrity` |
| `call_id` | `uuid` | Facultatif |
| `idempotency_key` | `uuid NOT NULL` | |
| `install_id` | `text` | |

**PK** : `(occurred_at, id)`.
**Index** : `UNIQUE(idempotency_key, occurred_at)`,
`(campaign_id, occurred_at)`, `(user_id, occurred_at DESC)`,
`(advertisement_id, occurred_at) WHERE state='complete'`.

**Rétention** : 90 jours en ligne, puis suppression de la partition — les
`daily_campaign_stats` et `campaign_invoices` portent la vérité facturable.

#### `sync_events`
`(id, user_id, install_id, received_at, batch_size, accepted, rejected, rejection_summary
jsonb, latency_ms, app_version, integrity_ok, ip_hash)`.
Rétention 30 jours. **Index** : `(user_id, received_at DESC)`, `(received_at)`.

---

### Domaine valeur — le cœur

#### `points_ledger` — **append-only, chaîné**

C'est la table la plus importante du système. Réponse directe à votre question
« un modèle wallet/ledger est-il préférable ? » : **oui, sans hésitation, et pour trois
raisons concrètes** — (1) vous devez pouvoir répondre « pourquoi ai-je 340 points ? » à un
utilisateur en colère ; (2) vous devez pouvoir facturer un annonceur et prouver le lien
impression → point ; (3) vous devez pouvoir corriger une erreur sans jamais réécrire
l'histoire.

| Colonne | Type | Notes |
|---|---|---|
| `id` | `bigint GENERATED ALWAYS AS IDENTITY` **PK** | Ordre global |
| `user_id` | `uuid NOT NULL` | |
| `wallet_seq` | `bigint NOT NULL` | Séquence **par wallet**, sans trou |
| `entry_type` | `ledger_entry_type NOT NULL` | voir ci-dessous |
| `direction` | `char(1)` CHECK in ('C','D') | Crédit / Débit |
| `amount` | `integer NOT NULL` CHECK > 0 | Toujours positif ; le signe est dans `direction` |
| `balance_after` | `integer NOT NULL` CHECK >= 0 | Solde après ce mouvement |
| `origin` | `ledger_origin NOT NULL` | `impression`, `call_bonus`, `monthly_bonus`, `welcome`, `referral`, `redemption`, `expiration`, `manual_correction`, `reversal` |
| `impression_id` | `uuid` | |
| `call_id` | `uuid` | |
| `campaign_id` | `uuid` | **Conservé pour la traçabilité annonceur** |
| `advertisement_id` | `uuid` | |
| `redemption_id` | `uuid` | |
| `reverses_entry_id` | `bigint` FK → self | Pour les annulations |
| `rule_version` | `integer NOT NULL` | FK → `point_rules(version)` : quel barème a produit ce mouvement |
| `expires_at` | `timestamptz` | Sur les crédits uniquement |
| `expired_by_entry_id` | `bigint` | Renseigné quand le lot est expiré |
| `transaction_id` | `uuid NOT NULL` | Regroupe les mouvements d'une même opération |
| `idempotency_key` | `uuid UNIQUE NOT NULL` | Anti-rejeu |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | **Serveur, toujours** |
| `actor_type` | `text` | `system`, `employee`, `user` |
| `actor_id` | `uuid` | |
| `reason` | `text` | Obligatoire si `manual_correction` ou `reversal` |
| `prev_hash` | `bytea` | Hash de l'entrée précédente du même wallet |
| `row_hash` | `bytea NOT NULL` | SHA-256 des champs significatifs + `prev_hash` |

**Contraintes d'immuabilité :**
```sql
REVOKE UPDATE, DELETE ON points_ledger FROM PUBLIC, authenticated, anon, service_role;
-- + trigger BEFORE UPDATE OR DELETE → RAISE EXCEPTION
```
**Index** : `UNIQUE(user_id, wallet_seq)`, `UNIQUE(idempotency_key)`,
`(user_id, created_at DESC)`, `(campaign_id) WHERE campaign_id IS NOT NULL`,
`(expires_at) WHERE expires_at IS NOT NULL AND expired_by_entry_id IS NULL`,
`(transaction_id)`.

**Le chaînage de hash** (`prev_hash` / `row_hash`) rend toute modification a posteriori
détectable : un job quotidien recalcule la chaîne des wallets actifs et alerte en cas de
rupture. Ce n'est pas de la blockchain, et ce n'est pas une protection contre un
administrateur de base malveillant — c'est de la **détection de falsification**, ce qui
suffit largement à l'objectif.

#### `points_wallets` (solde matérialisé)
`(user_id PK, confirmed_points, pending_points, lifetime_earned, lifetime_spent,
last_entry_id, last_wallet_seq, last_row_hash, updated_at)`.

`CHECK (confirmed_points >= 0)`. Mis à jour **uniquement** par la fonction
`post_ledger_entry()`. `pending_points` est renseigné par le client via `/sync` mais n'a
aucune valeur transactionnelle : c'est un affichage.

#### `point_rules`
`(version PK, effective_from, points_per_impression, points_per_call_bonus,
min_call_seconds_for_bonus, monthly_bonus_points, welcome_bonus_points,
referral_bonus_points, daily_impression_cap, freq_cap_minutes, daily_call_bonus_cap,
points_validity_months, created_by, created_at)`.

**Chaque mouvement de ledger référence sa `rule_version`.** Cela permet de répondre, un an
plus tard, à « pourquoi 2 points et pas 3 ? » et de rejouer un calcul sans ambiguïté.

---

### Domaine récompenses

#### `telecom_operators`
`(id, code, name, mcc_mnc, is_active)`. 3 lignes + extension MVNO.

#### `data_packages`
`(id, operator_id, name_fr, name_ar, data_mb, points_cost, cost_millimes,
stock_limit_monthly, sort_order, is_active, valid_from, valid_to, created_at)`.

`cost_millimes` = **votre coût d'achat**, indispensable pour le pilotage de la marge (§16).
**Index** : `(operator_id, is_active, points_cost)`.

#### `reward_redemptions`
| Colonne | Notes |
|---|---|
| `id` | PK |
| `user_id`, `data_package_id`, `operator_id` | |
| `points_spent` | Figé à la création |
| `data_mb`, `cost_millimes` | **Copiés** du package (le catalogue peut changer) |
| `target_msisdn_hash` | `bytea` — on stocke le hash, plus le numéro en clair après fulfillment |
| `target_msisdn_enc` | `bytea` — numéro chiffré, purgé après 90 j |
| `status` | `pending`, `approved`, `processing`, `fulfilled`, `failed`, `cancelled` |
| `ledger_debit_entry_id` | FK → `points_ledger` |
| `ledger_reversal_entry_id` | Si échec |
| `provider`, `provider_reference`, `provider_response` | `manual` au MVP |
| `proof_storage_path` | Reçu / capture (MVP manuel) |
| `processed_by` | FK → `employees` |
| `requested_at`, `processed_at`, `fulfilled_at`, `failed_at`, `failure_reason` | |

**Index** : `(status, requested_at)` — c'est la file back-office,
`(user_id, requested_at DESC)`,
`UNIQUE(user_id) WHERE status IN ('pending','approved','processing')` — **un seul en cours**.

---

### Domaine confiance et pilotage

#### `fraud_events`
`(id, user_id, install_id, rule_code, severity(low|medium|high|critical), score,
evidence jsonb, status(open|reviewing|confirmed|dismissed), auto_action
(none|limit|suspend|block_redemptions), reviewed_by, reviewed_at, notes, created_at)`.
**Index** : `(status, severity, created_at DESC)`, `(user_id, created_at DESC)`,
`(rule_code)`.

#### `audit_logs`
`(id, actor_type, actor_id, action, entity_type, entity_id, before jsonb, after jsonb,
reason, ip_hash, user_agent, created_at)`.
Append-only, `REVOKE UPDATE, DELETE`. **Index** : `(entity_type, entity_id, created_at DESC)`,
`(actor_id, created_at DESC)`, `(action, created_at DESC)`.

#### `daily_campaign_stats`
`(day, campaign_id, advertisement_id, zone_id, impressions, complete_impressions,
unique_users, points_awarded, billable_impressions, spend_millimes,
PRIMARY KEY (day, campaign_id, advertisement_id, zone_id))`.
Alimentée par le job quotidien. **C'est la seule source des dashboards.**

#### `daily_user_stats`
`(day, user_id, impressions, complete_impressions, calls, call_seconds, points_earned,
points_spent, sync_count, distinct_installs, PRIMARY KEY (day, user_id))`.
Sert aux KPI **et** à la détection d'anomalie (§13).

#### `campaign_invoices`
`(id, company_id, campaign_id, period_start, period_end, billable_impressions,
unique_reach, unit_price_millimes, pricing_model, amount_millimes, currency,
status(draft|issued|paid|void), issued_at, paid_at, snapshot jsonb, created_by)`.
**`snapshot` figé** : la facture ne doit jamais dépendre de tables purgeables.

#### `system_settings`
`(key PK, value jsonb, description, updated_by, updated_at)` + historique dans
`audit_logs`.

#### `deleted_accounts`
`(phone_hash PK, deleted_at, reason, had_fraud_events boolean, lifetime_points_earned)`.
Permet de détecter une réinscription après suppression, **sans conserver le numéro**.

---

## 7.3 Index les plus importants

Par ordre d'impact :

```sql
-- 1. Chemin chaud du moteur de sélection
CREATE INDEX idx_cz_zone_active ON campaign_zones(zone_id)
  INCLUDE (campaign_id);
CREATE INDEX idx_campaigns_servable ON campaigns(id)
  WHERE status = 'active';

-- 2. Anti-doublon d'ingestion (le plus sollicité en écriture)
CREATE UNIQUE INDEX idx_imp_idem ON advertisement_impressions(idempotency_key, occurred_at);
CREATE UNIQUE INDEX idx_calls_idem ON calls(idempotency_key, occurred_at);

-- 3. Intégrité du ledger
CREATE UNIQUE INDEX idx_ledger_wallet_seq ON points_ledger(user_id, wallet_seq);
CREATE UNIQUE INDEX idx_ledger_idem ON points_ledger(idempotency_key);

-- 4. Job d'expiration (index partiel : ne scanne que ce qui reste à expirer)
CREATE INDEX idx_ledger_to_expire ON points_ledger(expires_at)
  WHERE expires_at IS NOT NULL AND expired_by_entry_id IS NULL AND direction = 'C';

-- 5. File back-office des conversions
CREATE INDEX idx_redemptions_queue ON reward_redemptions(status, requested_at)
  WHERE status IN ('pending','approved','processing');

-- 6. Historique utilisateur (écran le plus consulté de l'app)
CREATE INDEX idx_ledger_user_time ON points_ledger(user_id, created_at DESC);

-- 7. Plafonds par utilisateur/campagne sur la journée
CREATE INDEX idx_imp_user_campaign_day ON advertisement_impressions(user_id, campaign_id, occurred_at DESC);

-- 8. Recherche back-office
CREATE INDEX idx_profiles_phone_trgm ON profiles USING gin (phone_e164 gin_trgm_ops);
CREATE INDEX idx_companies_name_trgm ON companies USING gin (brand_name gin_trgm_ops);
```

## 7.4 Partitionnement

`calls` et `advertisement_impressions` sont **partitionnées par RANGE sur `occurred_at`,
par mois**, créées dès le MVP.

Motif : à 10 000 utilisateurs, `advertisement_impressions` reçoit ~12 M lignes/mois. Sans
partitionnement, la purge devient un `DELETE` massif qui bloque la base et laisse la table
gonflée. Avec partitionnement, la purge est un `DROP TABLE` instantané.

`pg_partman` automatise la création des partitions futures (3 mois d'avance) et la
rétention. À défaut, un job `pg_cron` de 20 lignes suffit.
