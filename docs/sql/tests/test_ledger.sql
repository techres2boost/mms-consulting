\set ON_ERROR_STOP on
-- Utilisateur de test
insert into auth.users(id) values ('11111111-1111-1111-1111-111111111111');
insert into profiles(id, phone_e164, phone_hash, governorate_id, created_at)
select '11111111-1111-1111-1111-111111111111','+21620000001',
       digest('+21620000001','sha256'), id, now() - interval '10 days'
from geographic_zones where code='TN-12';

\echo '--- T1: credit de 2 points ---'
select post_ledger_entry('11111111-1111-1111-1111-111111111111','C',2,'impression','earn',
  '22222222-0000-0000-0000-000000000001') as entry_id;
select confirmed_points, last_wallet_seq from points_wallets;

\echo '--- T2: IDEMPOTENCE (meme cle rejouee 3x) ---'
select post_ledger_entry('11111111-1111-1111-1111-111111111111','C',2,'impression','earn',
  '22222222-0000-0000-0000-000000000001');
select post_ledger_entry('11111111-1111-1111-1111-111111111111','C',2,'impression','earn',
  '22222222-0000-0000-0000-000000000001');
select (select confirmed_points from points_wallets) as should_still_be_2,
       (select count(*) from points_ledger) as should_be_1_ledger_row;

\echo '--- T3: 60 credits supplementaires ---'
do $$ begin
  for i in 2..61 loop
    perform post_ledger_entry('11111111-1111-1111-1111-111111111111','C',2,'impression','earn',
      md5('imp:'||i)::uuid);
  end loop;
end $$;
select confirmed_points as should_be_122, last_wallet_seq from points_wallets;

\echo '--- T4: SOLDE INSUFFISANT doit echouer ---'
do $$ begin
  begin
    perform post_ledger_entry('11111111-1111-1111-1111-111111111111','D',99999,'redemption','spend',
      gen_random_uuid());
    raise notice 'ECHEC DU TEST: le debit excessif a ete accepte';
  exception when check_violation then
    raise notice 'OK: debit excessif rejete (%)', sqlerrm;
  end;
end $$;
select confirmed_points as unchanged_122 from points_wallets;

\echo '--- T5: CONVERSION (redeem_points) ---'
select redeem_points('11111111-1111-1111-1111-111111111111',
  (select id from data_packages where points_cost=100 limit 1),
  digest('+21620000001','sha256'), null, gen_random_uuid()) as redemption_id \gset
select confirmed_points as should_be_22 from points_wallets;
select status, points_spent, data_mb from reward_redemptions;

\echo '--- T6: ECHEC DE CONVERSION -> reversal ---'
select fail_redemption(:'redemption_id', 'operateur indisponible') as reversal_entry;
select confirmed_points as back_to_122 from points_wallets;
select status, failure_reason from reward_redemptions;
select origin, direction, amount, reason from points_ledger order by id desc limit 1;

\echo '--- T7: LEDGER APPEND-ONLY : UPDATE doit echouer ---'
do $$ begin
  begin
    update points_ledger set amount = 99999 where wallet_seq = 1;
    raise notice 'ECHEC DU TEST: UPDATE accepte';
  exception when others then raise notice 'OK: UPDATE bloque (%)', sqlerrm;
  end;
end $$;

\echo '--- T8: LEDGER APPEND-ONLY : DELETE doit echouer ---'
do $$ begin
  begin
    delete from points_ledger where wallet_seq = 1;
    raise notice 'ECHEC DU TEST: DELETE accepte';
  exception when others then raise notice 'OK: DELETE bloque (%)', sqlerrm;
  end;
end $$;

\echo '--- T9: CHAINE DE HASH intacte ---'
select count(*) as broken_links from verify_ledger_chain('11111111-1111-1111-1111-111111111111');

\echo '--- T10: FALSIFICATION detectee ---'
-- on contourne le trigger comme le ferait un attaquant avec les droits DB
alter table points_ledger disable trigger trg_ledger_guard_update;
update points_ledger set amount = 500 where wallet_seq = 3;
alter table points_ledger enable trigger trg_ledger_guard_update;
select broken_at, 'FALSIFICATION DETECTEE' as verdict
from verify_ledger_chain('11111111-1111-1111-1111-111111111111');

\echo '--- T11: UNE SEULE conversion ouverte a la fois ---'
do $$ declare pkg uuid; begin
  select id into pkg from data_packages where points_cost=100 limit 1;
  perform redeem_points('11111111-1111-1111-1111-111111111111', pkg,
    digest('x','sha256'), null, gen_random_uuid());
  begin
    perform redeem_points('11111111-1111-1111-1111-111111111111', pkg,
      digest('y','sha256'), null, gen_random_uuid());
    raise notice 'ECHEC DU TEST: deuxieme conversion acceptee';
  exception when unique_violation then raise notice 'OK: 2e conversion bloquee';
  end;
end $$;

\echo '--- T12: compte trop recent -> conversion refusee ---'
insert into auth.users(id) values ('33333333-3333-3333-3333-333333333333');
insert into profiles(id, phone_e164, phone_hash, governorate_id)
select '33333333-3333-3333-3333-333333333333','+21620000002',
       digest('+21620000002','sha256'), id from geographic_zones where code='TN-11';
do $$ declare pkg uuid; begin
  select id into pkg from data_packages where points_cost=100 limit 1;
  begin
    perform redeem_points('33333333-3333-3333-3333-333333333333', pkg,
      digest('z','sha256'), null, gen_random_uuid());
    raise notice 'ECHEC DU TEST: compte recent accepte';
  exception when check_violation then raise notice 'OK: compte recent refuse (%)', sqlerrm;
  end;
end $$;

\echo '--- T13: garde-fou RLS sur toutes les tables ---'
select coalesce(string_agg(assert_rls_everywhere, ', '), 'AUCUNE table sans RLS')
from assert_rls_everywhere();

\echo '--- T14: jobs executables ---'
select job_campaign_lifecycle() is null as lifecycle_ok;
select job_aggregate_daily(current_date - 1) is null as aggregate_ok;
select job_expire_points() as expired_count;
select job_monthly_bonus() as bonus_count;
select job_archive_purge() is null as archive_ok;
select job_retention() is null as retention_ok;
select ensure_monthly_partitions(3) is null as partitions_ok;
select count(*) as partitions_created from pg_class
 where relname ~ '^(calls|advertisement_impressions)_\d{4}_\d{2}$';
