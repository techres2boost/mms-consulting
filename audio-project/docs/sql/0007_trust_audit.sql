-- =============================================================================
-- 0007 — Confiance : fraude, audit, facturation
-- =============================================================================

create table fraud_events (
  id          bigint generated always as identity primary key,
  user_id     uuid references profiles(id) on delete cascade,
  install_id  text,
  rule_code   text not null,
  severity    fraud_severity not null,
  score       integer not null default 0,
  evidence    jsonb not null default '{}',
  status      fraud_status not null default 'open',
  auto_action fraud_action not null default 'none',
  reviewed_by uuid references employees(id),
  reviewed_at timestamptz,
  notes       text,
  created_at  timestamptz not null default now()
);
create index idx_fraud_queue on fraud_events(status, severity, created_at desc);
create index idx_fraud_user  on fraud_events(user_id, created_at desc);
create index idx_fraud_rule  on fraud_events(rule_code, created_at desc);

create table audit_logs (
  id          bigint generated always as identity primary key,
  actor_type  text not null check (actor_type in ('system','employee','user')),
  actor_id    uuid,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  reason      text,
  ip_hash     bytea,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index idx_audit_entity on audit_logs(entity_type, entity_id, created_at desc);
create index idx_audit_actor  on audit_logs(actor_id, created_at desc);
create index idx_audit_action on audit_logs(action, created_at desc);

create or replace function audit_block_write()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_logs est append-only (op=%)', tg_op;
end $$;
create trigger trg_audit_no_update before update on audit_logs
  for each row execute function audit_block_write();
create trigger trg_audit_no_delete before delete on audit_logs
  for each row execute function audit_block_write();
revoke update, delete on audit_logs from public, anon, authenticated;

create table campaign_invoices (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references companies(id) on delete restrict,
  campaign_id          uuid not null references campaigns(id) on delete restrict,
  period_start         date not null,
  period_end           date not null,
  billable_impressions integer not null,
  unique_reach         integer not null,
  unit_price_millimes  bigint not null,
  pricing_model        pricing_model not null,
  amount_millimes      bigint not null,
  currency             text not null default 'TND',
  status               invoice_status not null default 'draft',
  issued_at            timestamptz,
  paid_at              timestamptz,
  snapshot             jsonb not null,   -- figé : ne dépend d'aucune table purgeable
  created_by           uuid references employees(id),
  created_at           timestamptz not null default now(),
  unique (campaign_id, period_start, period_end)
);
create index idx_inv_company on campaign_invoices(company_id, period_start desc);
create index idx_inv_status   on campaign_invoices(status, issued_at desc);
