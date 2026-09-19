-- =============================================================================
-- 0006 — Récompenses : catalogue data, conversions
-- =============================================================================

create table data_packages (
  id                 uuid primary key default gen_random_uuid(),
  operator_id        uuid not null references telecom_operators(id),
  name_fr            text not null,
  name_ar            text not null,
  data_mb            integer not null check (data_mb > 0),
  points_cost        integer not null check (points_cost > 0),
  cost_millimes      bigint  not null check (cost_millimes >= 0), -- VOTRE coût d'achat
  validity_days      integer,
  stock_limit_monthly integer,
  sort_order         integer not null default 0,
  is_active          boolean not null default true,
  valid_from         timestamptz,
  valid_to           timestamptz,
  created_at         timestamptz not null default now()
);
create index idx_dp_catalog on data_packages(operator_id, is_active, points_cost);

create table reward_redemptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references profiles(id) on delete restrict,
  data_package_id          uuid not null references data_packages(id) on delete restrict,
  operator_id              uuid not null references telecom_operators(id),
  points_spent             integer not null check (points_spent > 0),
  data_mb                  integer not null,          -- copié : le catalogue peut changer
  cost_millimes            bigint  not null,          -- copié
  target_msisdn_hash       bytea not null,
  target_msisdn_enc        bytea,                     -- purgé après 90 j
  status                   redemption_status not null default 'pending',
  ledger_debit_entry_id    bigint references points_ledger(id),
  ledger_reversal_entry_id bigint references points_ledger(id),
  provider                 text not null default 'manual',
  provider_reference       text,
  provider_response        jsonb,
  proof_storage_path       text,
  processed_by             uuid references employees(id),
  requested_at             timestamptz not null default now(),
  processed_at             timestamptz,
  fulfilled_at             timestamptz,
  failed_at                timestamptz,
  failure_reason           text
);
create index idx_red_queue on reward_redemptions(status, requested_at)
  where status in ('pending','approved','processing');
create index idx_red_user  on reward_redemptions(user_id, requested_at desc);
-- Une seule conversion en cours par utilisateur
create unique index idx_red_one_open on reward_redemptions(user_id)
  where status in ('pending','approved','processing');

-- ----------------------------------------------------------------------------
-- redeem_points : débit + demande, dans UNE transaction
-- ----------------------------------------------------------------------------
create or replace function redeem_points(
  p_user_id          uuid,
  p_package_id       uuid,
  p_msisdn_hash      bytea,
  p_msisdn_enc       bytea,
  p_idempotency_key  uuid
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pkg     data_packages;
  v_profile profiles;
  v_txn     uuid := gen_random_uuid();
  v_red     uuid;
  v_entry   bigint;
  v_min_age interval;
begin
  select * into v_profile from profiles where id = p_user_id;
  if v_profile.status <> 'active' then
    raise exception 'compte non actif (%)' , v_profile.status using errcode = 'check_violation';
  end if;

  -- délai d'attente anti compte-jetable
  v_min_age := coalesce(
    (select (value->>'min_account_age_hours')::int from system_settings
      where key = 'redemption'), 72) * interval '1 hour';
  if now() - v_profile.created_at < v_min_age then
    raise exception 'compte trop recent pour une conversion' using errcode = 'check_violation';
  end if;

  -- blocage si fraude ouverte de sévérité élevée
  if exists (select 1 from fraud_events
              where user_id = p_user_id and status in ('open','reviewing')
                and severity in ('high','critical')) then
    raise exception 'conversions bloquees : verification en cours' using errcode = 'check_violation';
  end if;

  select * into v_pkg from data_packages
    where id = p_package_id and is_active
      and (valid_from is null or valid_from <= now())
      and (valid_to   is null or valid_to   >= now());
  if not found then
    raise exception 'offre indisponible' using errcode = 'check_violation';
  end if;

  insert into reward_redemptions(
    user_id, data_package_id, operator_id, points_spent, data_mb, cost_millimes,
    target_msisdn_hash, target_msisdn_enc, status)
  values (p_user_id, v_pkg.id, v_pkg.operator_id, v_pkg.points_cost, v_pkg.data_mb,
          v_pkg.cost_millimes, p_msisdn_hash, p_msisdn_enc, 'pending')
  returning id into v_red;

  -- lève une exception si le solde est insuffisant → rollback complet
  v_entry := post_ledger_entry(
    p_user_id          => p_user_id,
    p_direction        => 'D',
    p_amount           => v_pkg.points_cost,
    p_origin           => 'redemption',
    p_entry_type       => 'spend',
    p_idempotency_key  => p_idempotency_key,
    p_transaction_id   => v_txn,
    p_redemption_id    => v_red,
    p_actor_type       => 'user',
    p_actor_id         => p_user_id);

  update reward_redemptions set ledger_debit_entry_id = v_entry where id = v_red;
  return v_red;
end $$;

revoke all on function redeem_points from public, anon;

-- ----------------------------------------------------------------------------
-- fail_redemption : échec → reversal (jamais de suppression)
-- ----------------------------------------------------------------------------
create or replace function fail_redemption(
  p_redemption_id uuid, p_reason text, p_actor_id uuid default null)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_red reward_redemptions; v_entry bigint;
begin
  select * into v_red from reward_redemptions where id = p_redemption_id for update;
  if v_red.status = 'failed' then
    return v_red.ledger_reversal_entry_id;
  end if;
  if v_red.status = 'fulfilled' then
    raise exception 'conversion deja honoree';
  end if;

  v_entry := post_ledger_entry(
    p_user_id          => v_red.user_id,
    p_direction        => 'C',
    p_amount           => v_red.points_spent,
    p_origin           => 'reversal',
    p_entry_type       => 'adjust',
    p_idempotency_key  => md5('reversal:' || p_redemption_id::text)::uuid,
    p_redemption_id    => p_redemption_id,
    p_reverses_entry_id => v_red.ledger_debit_entry_id,
    p_actor_type       => case when p_actor_id is null then 'system' else 'employee' end,
    p_actor_id         => p_actor_id,
    p_reason           => 'Echec de conversion: ' || p_reason);

  update reward_redemptions
     set status = 'failed', failed_at = now(), failure_reason = p_reason,
         ledger_reversal_entry_id = v_entry
   where id = p_redemption_id;
  return v_entry;
end $$;
