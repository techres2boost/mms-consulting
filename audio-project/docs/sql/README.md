# Migrations PostgreSQL

## Contenu

| Fichier | Contenu |
|---|---|
`0001_extensions_enums.sql` | Extensions et types énumérés
`0002_identity.sql` | Zones, opérateurs, profils, devices, consentements, employés, RBAC
`0003_inventory.sql` | Entreprises, campagnes, créatifs, ciblage géographique
`0004_measurement.sql` | `calls` et `advertisement_impressions` (partitionnées), sync, rollups
`0005_value_ledger.sql` | Barèmes, wallet, **ledger append-only chaîné** + `post_ledger_entry()`
`0006_rewards.sql` | Catalogue data, conversions, `redeem_points()`, `fail_redemption()`
`0007_trust_audit.sql` | Fraude, audit append-only, facturation
`0008_rls.sql` | Row Level Security complète + garde-fou `assert_rls_everywhere()`
`0009_seed.sql` | 24 gouvernorats, 3 opérateurs, barème v1, RBAC, réglages
`0010_jobs.sql` | Jobs `pg_cron` : agrégation, expiration, cycle de vie, archivage, rétention
`tests/test_ledger.sql` | 14 tests fonctionnels du cœur transactionnel

## État de validation

**Les 10 migrations et les 14 tests ont été exécutés avec succès sur PostgreSQL 16**
(19 septembre 2026). Résultats des tests :

| # | Test | Résultat |
|---|---|---|
| T1 | Crédit de points, solde et séquence | ✅ |
| T2 | **Idempotence** : même clé rejouée 3× → 1 seule ligne, solde inchangé | ✅ |
| T3 | Crédits successifs jusqu'à couvrir le plus petit palier, `wallet_seq` sans trou | ✅ |
| T4 | **Débit supérieur au solde rejeté** (`check_violation`) | ✅ |
| T5 | Conversion : débit atomique + demande `pending` | ✅ |
| T6 | Échec de conversion → **reversal**, solde restauré, motif tracé | ✅ |
| T7 | `UPDATE` sur le ledger **bloqué** | ✅ |
| T8 | `DELETE` sur le ledger **bloqué** | ✅ |
| T9 | Chaîne de hash intacte : 0 rupture | ✅ |
| T10 | **Falsification détectée** même en contournant le trigger | ✅ |
| T11 | Une seule conversion ouverte par utilisateur | ✅ |
| T12 | Compte de moins de 72 h : conversion refusée | ✅ |
| T13 | **Aucune table du schéma `public` sans RLS** | ✅ |
| T14 | Les 7 jobs s'exécutent ; 8 partitions créées | ✅ |

T10 est le test le plus important : il simule un attaquant ayant les droits de base de
données et désactivant le trigger d'immuabilité. La modification passe, **mais
`verify_ledger_chain()` la détecte et pointe la ligne exacte**. C'est la propriété
recherchée — détection de falsification, pas prévention absolue (cf. §13).

## Application

```bash
# Supabase CLI (recommandé)
supabase migration new init && cat docs/sql/*.sql >> supabase/migrations/<ts>_init.sql
supabase db push

# ou directement
for f in docs/sql/0*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

## Prérequis Supabase

À activer dans le dashboard avant d'appliquer :
- `pgcrypto`, `pg_trgm`, `ltree` (généralement déjà présents)
- **`pg_cron`** — requis par `0001` et `0010`
- **`pgmq`** — requis pour les files (§06) ; non utilisé par ces migrations
- `postgis` — **seulement** si le ciblage par rayon est activé (Phase 3)

## Reproduire la validation en local

```bash
export PATH=/usr/lib/postgresql/16/bin:$PATH
initdb -D /tmp/pg/data -U testuser --auth=trust
pg_ctl -D /tmp/pg/data -o "-k /tmp/pg -p 55432" start

# Shim de l'environnement Supabase absent d'un Postgres nu
psql -h /tmp/pg -p 55432 -U testuser -d postgres <<'SQL'
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
-- les rôles Supabase sont référencés par les REVOKE de 0005 et les policies de 0008
create role anon;
create role authenticated;
create role service_role;
create schema cron;
create function cron.schedule(text,text,text) returns bigint language sql as $$ select 1::bigint $$;
SQL

# pg_cron n'existe pas en local : le neutraliser pour le test uniquement
sed 's/^create extension if not exists "pg_cron";/-- shimmed/' docs/sql/0001_*.sql > /tmp/0001.sql

for f in /tmp/0001.sql docs/sql/000[2-9]*.sql docs/sql/0010*.sql; do
  psql -h /tmp/pg -p 55432 -U testuser -d postgres -v ON_ERROR_STOP=1 -f "$f"
done
psql -h /tmp/pg -p 55432 -U testuser -d postgres -f docs/sql/tests/test_ledger.sql
```

> Notes :
> - Dans T14, `job_x() is null` renvoie `f` — c'est normal, une fonction `void` ne renvoie
>   pas `NULL`. Le test vérifie que les jobs s'exécutent **sans erreur**.
> - Les tests T3, T5 et T6 sont **paramétrés sur le catalogue** (`order by points_cost
>   limit 1`) : ils restent valides si le barème ou le catalogue de `0009_seed.sql` change.
> - Les valeurs de `point_rules` et `data_packages` du seed sont **dérivées de la
>   contrainte d'économie unitaire** `coût_par_point ≤ 0,5 × revenu_par_point`
>   (voir [docs/16](../16-estimation-couts.md)), et non choisies arbitrairement. Le CPM
>   de référence (5 TND) **doit être validé auprès d'annonceurs réels** avant le lancement.
