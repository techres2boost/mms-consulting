-- =============================================================================
-- 0002 — Identité, devices, consentements, employés, RBAC
-- =============================================================================

create table geographic_zones (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references geographic_zones(id),
  level       zone_level not null,
  code        text not null unique,
  name_fr     text not null,
  name_ar     text not null,
  path        ltree not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index idx_zones_path      on geographic_zones using gist (path);
create index idx_zones_level     on geographic_zones(level) where is_active;
create index idx_zones_parent    on geographic_zones(parent_id);

create table telecom_operators (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,          -- 'TT','ORANGE','OOREDOO'
  name       text not null,
  mcc_mnc    text,
  is_active  boolean not null default true
);

create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  phone_e164       text not null unique
                     check (phone_e164 ~ '^\+216[0-9]{8}$'),
  phone_hash       bytea not null unique,
  display_name     text,
  governorate_id   uuid not null references geographic_zones(id),
  delegation_id    uuid references geographic_zones(id),
  operator_id      uuid references telecom_operators(id),
  language         text not null default 'ar' check (language in ('ar','fr')),
  status           profile_status not null default 'active',
  suspended_reason text,
  referred_by      uuid references profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_active_at   timestamptz
);
create index idx_profiles_gov        on profiles(governorate_id) where status = 'active';
create index idx_profiles_status     on profiles(status, last_active_at desc);
create index idx_profiles_phone_trgm on profiles using gin (phone_e164 gin_trgm_ops);

create table device_installations (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references profiles(id) on delete cascade,
  install_id           text not null unique,
  platform             text not null check (platform in ('android','ios')),
  public_key           bytea not null,
  key_attested         boolean not null default false,
  integrity_verdict    jsonb,
  integrity_checked_at timestamptz,
  last_seq             bigint not null default 0,
  push_token           text,
  app_version          text,
  os_version           text,
  device_model         text,
  status               text not null default 'active'
                         check (status in ('active','revoked','blocked')),
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now()
);
-- Au plus une installation active par utilisateur (retirer si multi-device autorisé)
create unique index idx_device_one_active on device_installations(user_id)
  where status = 'active';
create index idx_device_integrity on device_installations(integrity_checked_at);

create table consents (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references profiles(id) on delete cascade,
  consent_type text not null,   -- 'audio_ads','zone','precise_location','call_metrics','tos'
  version      text not null,
  granted      boolean not null,
  granted_at   timestamptz not null default now(),
  ip_hash      bytea,
  user_agent   text
);
create index idx_consents_user on consents(user_id, consent_type, granted_at desc);

create table employees (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  full_name  text not null,
  role       employee_role not null,
  zone_scope uuid[] not null default '{}',   -- vide = toutes les zones
  mfa_enabled boolean not null default false,
  status     text not null default 'active'
               check (status in ('active','disabled')),
  created_by uuid references employees(id),
  created_at timestamptz not null default now()
);
create index idx_employees_role on employees(role, status);

create table role_permissions (
  role       employee_role not null,
  permission text not null,
  primary key (role, permission)
);

create table system_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references employees(id),
  updated_at  timestamptz not null default now()
);

create table deleted_accounts (
  phone_hash             bytea primary key,
  deleted_at             timestamptz not null default now(),
  reason                 text,
  had_fraud_events       boolean not null default false,
  lifetime_points_earned integer not null default 0
);
