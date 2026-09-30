-- =============================================================================
-- 0003 — Inventaire publicitaire
-- =============================================================================

create table companies (
  id            uuid primary key default gen_random_uuid(),
  legal_name    text not null,
  brand_name    text not null,
  tax_id        text,
  sector        text,
  contact_name  text,
  contact_phone text,
  contact_email text,
  address       text,
  zone_id       uuid references geographic_zones(id),
  status        company_status not null default 'prospect',
  notes         text,
  created_by    uuid references employees(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index idx_companies_tax on companies(tax_id) where tax_id is not null;
create index idx_companies_status     on companies(status);
create index idx_companies_name_trgm  on companies using gin (brand_name gin_trgm_ops);

create table campaigns (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references companies(id) on delete restrict,
  name                  text not null,
  status                campaign_status not null default 'draft',
  starts_on             date not null,
  ends_on               date not null,
  priority              smallint not null default 5 check (priority between 1 and 10),
  weight                integer not null default 100 check (weight > 0),
  pricing_model         pricing_model not null default 'cpm',
  unit_price_millimes   bigint not null default 0 check (unit_price_millimes >= 0),
  budget_millimes       bigint check (budget_millimes is null or budget_millimes > 0),
  spent_millimes        bigint not null default 0 check (spent_millimes >= 0),
  daily_impression_cap  integer check (daily_impression_cap is null or daily_impression_cap > 0),
  user_daily_cap        integer not null default 3 check (user_daily_cap > 0),
  user_freq_cap_minutes integer not null default 60 check (user_freq_cap_minutes >= 0),
  target_operator_ids   uuid[] not null default '{}',
  target_languages      text[] not null default '{}',
  created_by            uuid references employees(id),
  approved_by           uuid references employees(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  archived_at           timestamptz,
  constraint campaign_dates check (ends_on >= starts_on),
  -- séparation des rôles : le créateur ne peut pas être l'approbateur
  constraint campaign_segregation check (approved_by is null or approved_by <> created_by)
);
create index idx_campaigns_window  on campaigns(status, starts_on, ends_on);
create index idx_campaigns_company on campaigns(company_id);
create index idx_campaigns_servable on campaigns(id) where status = 'active';

create table advertisements (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references campaigns(id) on delete cascade,
  version         integer not null default 1,
  language        text not null default 'ar' check (language in ('ar','fr')),
  storage_path    text not null,
  original_path   text,
  codec           text not null default 'opus',
  bitrate_kbps    smallint,
  duration_ms     integer not null check (duration_ms between 2000 and 8000),
  size_bytes      integer not null check (size_bytes <= 204800),
  sha256          bytea not null,
  loudness_lufs   numeric(4,1),
  status          ad_status not null default 'uploaded',
  rejection_reason text,
  reviewed_by     uuid references employees(id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  archived_at     timestamptz,
  purged_at       timestamptz,
  unique (campaign_id, version, language)
);
create index idx_ads_campaign  on advertisements(campaign_id, status);
create index idx_ads_approved  on advertisements(campaign_id) where status = 'approved';
create index idx_ads_to_purge  on advertisements(archived_at) where purged_at is null;

create table campaign_zones (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  zone_id     uuid not null references geographic_zones(id) on delete restrict,
  primary key (campaign_id, zone_id)
);
-- sens de lecture du moteur : « quelles campagnes pour cette zone »
create index idx_cz_zone on campaign_zones(zone_id) include (campaign_id);

create table ad_bundle_versions (
  zone_id    uuid primary key references geographic_zones(id) on delete cascade,
  version    text not null,
  updated_at timestamptz not null default now()
);
