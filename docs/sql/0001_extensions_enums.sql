-- =============================================================================
-- 0001 — Extensions et types énumérés
-- =============================================================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "ltree";
create extension if not exists "pg_cron";
-- create extension if not exists "pgmq";      -- activer via le dashboard Supabase
-- create extension if not exists "postgis";   -- seulement si ciblage par rayon (Phase 3)

create type profile_status      as enum ('active','limited','suspended','deleted');
create type employee_role       as enum ('admin','manager','operator','analyst');
create type zone_level          as enum ('country','governorate','delegation','custom');
create type company_status      as enum ('prospect','active','inactive','blacklisted');
create type campaign_status     as enum ('draft','pending_review','approved','active',
                                         'paused','completed','expired','rejected',
                                         'archived');
create type ad_status           as enum ('uploaded','transcoding','pending_review',
                                         'approved','rejected','archived','purged');
create type pricing_model       as enum ('cpm','flat_monthly','cpl');
create type call_outcome        as enum ('completed','unanswered','unknown');
create type impression_state    as enum ('complete','partial','rejected');
create type ledger_entry_type   as enum ('earn','spend','adjust','expire');
create type ledger_origin       as enum ('impression','call_bonus','monthly_bonus',
                                         'welcome','referral','redemption','expiration',
                                         'manual_correction','reversal');
create type redemption_status   as enum ('pending','approved','processing','fulfilled',
                                         'failed','cancelled');
create type fraud_severity      as enum ('low','medium','high','critical');
create type fraud_status        as enum ('open','reviewing','confirmed','dismissed');
create type fraud_action        as enum ('none','limit','suspend','block_redemptions');
create type invoice_status      as enum ('draft','issued','paid','void');
