-- =============================================================================
-- 0004 — Mesure : appels, impressions (tables partitionnées), sync
-- =============================================================================

-- ----------------------------------------------------------------------------
-- calls : volontairement minimale. AUCUN numéro appelé n'est stocké (cf. §12).
-- ----------------------------------------------------------------------------
create table calls (
  id                 uuid not null default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  occurred_at        timestamptz not null,          -- horodatage SERVEUR
  client_reported_at timestamptz,                   -- indicatif uniquement
  duration_seconds   integer check (duration_seconds is null
                                    or duration_seconds between 0 and 21600),
  outcome            call_outcome not null default 'unknown',
  measured           boolean not null default false, -- false sur iOS
  idempotency_key    uuid not null,
  install_id         text,
  primary key (occurred_at, id)
) partition by range (occurred_at);

create unique index idx_calls_idem on calls(idempotency_key, occurred_at);
create index idx_calls_user        on calls(user_id, occurred_at desc);

-- ----------------------------------------------------------------------------
-- advertisement_impressions : la table la plus volumineuse du système
-- ----------------------------------------------------------------------------
create table advertisement_impressions (
  id                 uuid not null default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  advertisement_id   uuid not null references advertisements(id) on delete restrict,
  campaign_id        uuid not null references campaigns(id) on delete restrict,
  zone_id            uuid not null references geographic_zones(id),
  occurred_at        timestamptz not null,
  client_reported_at timestamptz,
  played_ms          integer not null check (played_ms >= 0),
  completion_pct     smallint not null check (completion_pct between 0 and 100),
  state              impression_state not null,
  credited           boolean not null default false,
  points_awarded     integer not null default 0 check (points_awarded >= 0),
  reject_reason      text,
  call_id            uuid,
  idempotency_key    uuid not null,
  install_id         text,
  primary key (occurred_at, id)
) partition by range (occurred_at);

create unique index idx_imp_idem     on advertisement_impressions(idempotency_key, occurred_at);
create index idx_imp_campaign        on advertisement_impressions(campaign_id, occurred_at);
create index idx_imp_user            on advertisement_impressions(user_id, occurred_at desc);
create index idx_imp_ad_complete     on advertisement_impressions(advertisement_id, occurred_at)
  where state = 'complete';
create index idx_imp_user_campaign   on advertisement_impressions(user_id, campaign_id, occurred_at desc);

-- ----------------------------------------------------------------------------
-- Création automatique des partitions mensuelles
-- ----------------------------------------------------------------------------
create or replace function ensure_monthly_partitions(p_months_ahead int default 3)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  t text;
  m date;
  part_name text;
begin
  foreach t in array array['calls','advertisement_impressions'] loop
    for i in 0..p_months_ahead loop
      m := date_trunc('month', now())::date + (i || ' month')::interval;
      part_name := format('%s_%s', t, to_char(m, 'YYYY_MM'));
      if not exists (select 1 from pg_class where relname = part_name) then
        execute format(
          'create table %I partition of %I for values from (%L) to (%L)',
          part_name, t, m, (m + interval '1 month')::date);
      end if;
    end loop;
  end loop;
end $$;

select ensure_monthly_partitions(3);

-- Purge : DROP de partition, instantané (vs DELETE massif bloquant)
create or replace function drop_old_partitions(p_table text, p_keep_months int)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record; n int := 0; cutoff date;
begin
  cutoff := (date_trunc('month', now()) - (p_keep_months || ' month')::interval)::date;
  for r in
    select c.relname
    from pg_class c
    join pg_inherits i on i.inhrelid = c.oid
    join pg_class p on p.oid = i.inhparent
    where p.relname = p_table
      and c.relname ~ '\d{4}_\d{2}$'
      and to_date(right(c.relname, 7), 'YYYY_MM') < cutoff
  loop
    execute format('drop table %I', r.relname);
    n := n + 1;
  end loop;
  return n;
end $$;

-- ----------------------------------------------------------------------------
-- sync_events : observabilité de la synchronisation (rétention 30 j)
-- ----------------------------------------------------------------------------
create table sync_events (
  id                bigint generated always as identity primary key,
  user_id           uuid references profiles(id) on delete set null,
  install_id        text,
  received_at       timestamptz not null default now(),
  batch_size        integer not null default 0,
  accepted          integer not null default 0,
  rejected          integer not null default 0,
  rejection_summary jsonb,
  latency_ms        integer,
  app_version       text,
  integrity_ok      boolean,
  ip_hash           bytea
);
create index idx_sync_user on sync_events(user_id, received_at desc);
create index idx_sync_time on sync_events(received_at);

-- ----------------------------------------------------------------------------
-- Rollups quotidiens : SEULE source des dashboards
-- ----------------------------------------------------------------------------
create table daily_campaign_stats (
  day                  date not null,
  campaign_id          uuid not null references campaigns(id) on delete cascade,
  advertisement_id     uuid not null references advertisements(id) on delete cascade,
  zone_id              uuid not null references geographic_zones(id),
  impressions          integer not null default 0,
  complete_impressions integer not null default 0,
  unique_users         integer not null default 0,
  points_awarded       integer not null default 0,
  billable_impressions integer not null default 0,
  spend_millimes       bigint  not null default 0,
  primary key (day, campaign_id, advertisement_id, zone_id)
);
create index idx_dcs_campaign on daily_campaign_stats(campaign_id, day desc);

create table daily_user_stats (
  day                  date not null,
  user_id              uuid not null references profiles(id) on delete cascade,
  impressions          integer not null default 0,
  complete_impressions integer not null default 0,
  calls                integer not null default 0,
  call_seconds         integer not null default 0,
  points_earned        integer not null default 0,
  points_spent         integer not null default 0,
  sync_count           integer not null default 0,
  distinct_installs    integer not null default 0,
  primary key (day, user_id)
);
create index idx_dus_day on daily_user_stats(day desc);
