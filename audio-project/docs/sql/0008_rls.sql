-- =============================================================================
-- 0008 — Row Level Security
-- Principe : le client LIT ses données, il n'ÉCRIT jamais de valeur.
-- =============================================================================

-- Helpers -------------------------------------------------------------------
create or replace function is_employee()
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (select 1 from employees
                  where id = auth.uid() and status = 'active');
$$;

create or replace function employee_has(p_permission text)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from employees e
    join role_permissions rp on rp.role = e.role
    where e.id = auth.uid() and e.status = 'active'
      and rp.permission = p_permission);
$$;

-- Activation ----------------------------------------------------------------
alter table profiles                  enable row level security;
alter table device_installations      enable row level security;
alter table consents                  enable row level security;
alter table employees                 enable row level security;
alter table role_permissions          enable row level security;
alter table system_settings           enable row level security;
alter table deleted_accounts          enable row level security;
alter table geographic_zones          enable row level security;
alter table telecom_operators         enable row level security;
alter table companies                 enable row level security;
alter table campaigns                 enable row level security;
alter table advertisements            enable row level security;
alter table campaign_zones            enable row level security;
alter table ad_bundle_versions        enable row level security;
alter table calls                     enable row level security;
alter table advertisement_impressions enable row level security;
alter table sync_events               enable row level security;
alter table daily_campaign_stats      enable row level security;
alter table daily_user_stats          enable row level security;
alter table point_rules               enable row level security;
alter table points_wallets            enable row level security;
alter table points_ledger             enable row level security;
alter table data_packages             enable row level security;
alter table reward_redemptions        enable row level security;
alter table fraud_events              enable row level security;
alter table audit_logs                enable row level security;
alter table campaign_invoices         enable row level security;

-- CLIENT : lecture de soi uniquement, aucune écriture ------------------------
create policy p_profiles_select_own on profiles
  for select to authenticated using (id = auth.uid());
-- Pas de policy UPDATE : les modifications passent par /functions/v1/profile

create policy p_wallet_select_own on points_wallets
  for select to authenticated using (user_id = auth.uid());

create policy p_ledger_select_own on points_ledger
  for select to authenticated using (user_id = auth.uid());

create policy p_calls_select_own on calls
  for select to authenticated using (user_id = auth.uid());

create policy p_imp_select_own on advertisement_impressions
  for select to authenticated using (user_id = auth.uid());

create policy p_red_select_own on reward_redemptions
  for select to authenticated using (user_id = auth.uid());

create policy p_consents_select_own on consents
  for select to authenticated using (user_id = auth.uid());

create policy p_devices_select_own on device_installations
  for select to authenticated using (user_id = auth.uid());

-- Référentiels lisibles par tout utilisateur authentifié ---------------------
create policy p_zones_read on geographic_zones
  for select to authenticated using (is_active);
create policy p_operators_read on telecom_operators
  for select to authenticated using (is_active);
create policy p_packages_read on data_packages
  for select to authenticated using (is_active);
create policy p_rules_read on point_rules
  for select to authenticated using (true);

-- EMPLOYÉS : accès piloté par role_permissions -------------------------------
create policy p_emp_profiles on profiles
  for select to authenticated using (employee_has('customers:read'));
create policy p_emp_profiles_upd on profiles
  for update to authenticated using (employee_has('customers:write'))
                              with check (employee_has('customers:write'));

create policy p_emp_companies on companies
  for all to authenticated using (employee_has('companies:read'))
                         with check (employee_has('companies:write'));
create policy p_emp_campaigns on campaigns
  for all to authenticated using (employee_has('campaigns:read'))
                         with check (employee_has('campaigns:write'));
create policy p_emp_ads on advertisements
  for all to authenticated using (employee_has('ads:read'))
                         with check (employee_has('ads:write'));
create policy p_emp_cz on campaign_zones
  for all to authenticated using (employee_has('campaigns:read'))
                         with check (employee_has('campaigns:write'));
create policy p_emp_red on reward_redemptions
  for all to authenticated using (employee_has('redemptions:read'))
                         with check (employee_has('redemptions:write'));
create policy p_emp_fraud on fraud_events
  for all to authenticated using (employee_has('fraud:read'))
                         with check (employee_has('fraud:write'));
create policy p_emp_stats_c on daily_campaign_stats
  for select to authenticated using (employee_has('analytics:read'));
create policy p_emp_stats_u on daily_user_stats
  for select to authenticated using (employee_has('analytics:read'));
create policy p_emp_audit on audit_logs
  for select to authenticated using (employee_has('audit:read'));
create policy p_emp_inv on campaign_invoices
  for all to authenticated using (employee_has('billing:read'))
                         with check (employee_has('billing:write'));
create policy p_emp_settings on system_settings
  for all to authenticated using (employee_has('settings:read'))
                         with check (employee_has('settings:write'));
create policy p_emp_employees on employees
  for all to authenticated using (employee_has('employees:read'))
                         with check (employee_has('employees:write'));
create policy p_emp_ledger on points_ledger
  for select to authenticated using (employee_has('wallets:read'));
create policy p_emp_wallets on points_wallets
  for select to authenticated using (employee_has('wallets:read'));
create policy p_emp_calls on calls
  for select to authenticated using (employee_has('customers:read'));
create policy p_emp_imp on advertisement_impressions
  for select to authenticated using (employee_has('analytics:read'));
create policy p_emp_sync on sync_events
  for select to authenticated using (employee_has('analytics:read'));
create policy p_emp_packages on data_packages
  for all to authenticated using (employee_has('rewards:read'))
                         with check (employee_has('rewards:write'));
create policy p_emp_zones on geographic_zones
  for all to authenticated using (employee_has('zones:read'))
                         with check (employee_has('zones:write'));
create policy p_emp_rules on point_rules
  for all to authenticated using (employee_has('settings:read'))
                         with check (employee_has('settings:write'));

-- Garde-fou : aucune table du schéma public sans RLS -------------------------
create or replace function assert_rls_everywhere()
returns setof text language sql stable as $$
  select c.relname
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and not c.relrowsecurity
    and c.relname not like '%\_20%';   -- partitions héritent du parent
$$;
