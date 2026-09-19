-- =============================================================================
-- 0010 — Jobs planifiés
-- =============================================================================

-- Rollup quotidien : les dashboards ne touchent JAMAIS les tables brutes
create or replace function job_aggregate_daily(p_day date default (current_date - 1))
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  delete from daily_campaign_stats where day = p_day;
  insert into daily_campaign_stats (
    day, campaign_id, advertisement_id, zone_id, impressions, complete_impressions,
    unique_users, points_awarded, billable_impressions, spend_millimes)
  select p_day, i.campaign_id, i.advertisement_id, i.zone_id,
         count(*),
         count(*) filter (where i.state = 'complete'),
         count(distinct i.user_id),
         coalesce(sum(i.points_awarded),0),
         count(*) filter (where i.state = 'complete' and i.credited),
         case c.pricing_model
           when 'cpm' then (count(*) filter (where i.state='complete' and i.credited)
                            * c.unit_price_millimes) / 1000
           when 'cpl' then  count(*) filter (where i.state='complete' and i.credited)
                            * c.unit_price_millimes
           else 0
         end
  from advertisement_impressions i
  join campaigns c on c.id = i.campaign_id
  where i.occurred_at >= p_day and i.occurred_at < p_day + 1
  group by i.campaign_id, i.advertisement_id, i.zone_id,
           c.pricing_model, c.unit_price_millimes;

  delete from daily_user_stats where day = p_day;
  insert into daily_user_stats (
    day, user_id, impressions, complete_impressions, calls, call_seconds,
    points_earned, points_spent, sync_count, distinct_installs)
  select p_day, u.id,
    coalesce(i.n,0), coalesce(i.n_ok,0),
    coalesce(k.n,0), coalesce(k.secs,0),
    coalesce(l.earned,0), coalesce(l.spent,0),
    coalesce(s.n,0), coalesce(s.installs,0)
  from profiles u
  left join (select user_id, count(*) n, count(*) filter (where state='complete') n_ok
             from advertisement_impressions
             where occurred_at >= p_day and occurred_at < p_day + 1
             group by user_id) i on i.user_id = u.id
  left join (select user_id, count(*) n, coalesce(sum(duration_seconds),0) secs
             from calls where occurred_at >= p_day and occurred_at < p_day + 1
             group by user_id) k on k.user_id = u.id
  left join (select user_id,
               coalesce(sum(amount) filter (where direction='C'),0) earned,
               coalesce(sum(amount) filter (where direction='D'),0) spent
             from points_ledger
             where created_at >= p_day and created_at < p_day + 1
             group by user_id) l on l.user_id = u.id
  left join (select user_id, count(*) n, count(distinct install_id) installs
             from sync_events
             where received_at >= p_day and received_at < p_day + 1
             group by user_id) s on s.user_id = u.id
  where coalesce(i.n,0) + coalesce(k.n,0) + coalesce(s.n,0) > 0;

  -- consommation de budget
  update campaigns c set spent_millimes = agg.total, updated_at = now()
  from (select campaign_id, sum(spend_millimes) total
        from daily_campaign_stats group by campaign_id) agg
  where agg.campaign_id = c.id;
end $$;

-- Expiration FIFO des points
create or replace function job_expire_points()
returns integer language plpgsql security definer
set search_path = public, pg_temp as $$
declare r record; n int := 0; v_entry bigint; v_remaining int;
begin
  for r in
    select l.id, l.user_id, l.amount, w.confirmed_points
    from points_ledger l
    join points_wallets w on w.user_id = l.user_id
    where l.direction = 'C' and l.expires_at is not null
      and l.expires_at <= now() and l.expired_by_entry_id is null
    order by l.expires_at
    limit 5000
  loop
    -- on n'expire que ce qui est encore effectivement au solde
    v_remaining := least(r.amount, r.confirmed_points);
    if v_remaining > 0 then
      v_entry := post_ledger_entry(
        p_user_id         => r.user_id,
        p_direction       => 'D',
        p_amount          => v_remaining,
        p_origin          => 'expiration',
        p_entry_type      => 'expire',
        p_idempotency_key => md5('expire:' || r.id::text)::uuid,
        p_reverses_entry_id => r.id,
        p_reason          => 'Expiration a 12 mois');
      update points_ledger set expired_by_entry_id = v_entry where id = r.id;
      n := n + 1;
    else
      update points_ledger set expired_by_entry_id = r.id where id = r.id;
    end if;
  end loop;
  return n;
end $$;

-- Cycle de vie des campagnes
create or replace function job_campaign_lifecycle()
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare v_changed int;
begin
  update campaigns set status = 'active', updated_at = now()
   where status = 'approved' and starts_on <= current_date and ends_on >= current_date
     and exists (select 1 from advertisements a
                  where a.campaign_id = campaigns.id and a.status = 'approved')
     and exists (select 1 from campaign_zones z where z.campaign_id = campaigns.id);

  update campaigns set status = 'completed', updated_at = now()
   where status = 'active'
     and (ends_on < current_date
          or (budget_millimes is not null and spent_millimes >= budget_millimes));

  -- invalidation des bundles des zones touchées
  get diagnostics v_changed = row_count;
  if v_changed > 0 then
    update ad_bundle_versions set version = to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),
                                  updated_at = now();
  end if;
end $$;

-- Archivage / purge audio (conserve TOUJOURS les stats et les factures)
create or replace function job_archive_purge()
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare v_archive_days int; v_purge_days int;
begin
  select (value->>'audio_archive_days')::int, (value->>'audio_purge_days')::int
    into v_archive_days, v_purge_days
  from system_settings where key = 'retention';

  update campaigns set status = 'archived', archived_at = now()
   where status in ('completed','expired')
     and updated_at < now() - (v_archive_days || ' days')::interval;

  update advertisements a set status = 'archived', archived_at = now()
   from campaigns c
   where c.id = a.campaign_id and c.status = 'archived'
     and a.status in ('approved','rejected');

  -- la suppression physique du fichier est faite par un worker qui lit cette liste
  update advertisements set status = 'purged', purged_at = now()
   where status = 'archived'
     and archived_at < now() - ((v_purge_days - v_archive_days) || ' days')::interval;
end $$;

-- Bonus mensuel de fidélité
create or replace function job_monthly_bonus()
returns integer language plpgsql security definer
set search_path = public, pg_temp as $$
declare r record; n int := 0; v_rule point_rules; v_period text;
begin
  select * into v_rule from point_rules
    where effective_from <= now() order by effective_from desc limit 1;
  v_period := to_char(now() - interval '1 month','YYYY-MM');

  for r in
    select s.user_id
    from daily_user_stats s
    join profiles p on p.id = s.user_id
    where s.day >= date_trunc('month', now() - interval '1 month')
      and s.day <  date_trunc('month', now())
      and p.status = 'active'
      and s.complete_impressions > 0
    group by s.user_id
    having count(distinct s.day) >= 10
  loop
    perform post_ledger_entry(
      p_user_id         => r.user_id,
      p_direction       => 'C',
      p_amount          => v_rule.monthly_bonus_points,
      p_origin          => 'monthly_bonus',
      p_entry_type      => 'earn',
      p_idempotency_key => md5('monthly:' || r.user_id::text || ':' || v_period)::uuid,
      p_rule_version    => v_rule.version);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Rétention
create or replace function job_retention()
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare v jsonb;
begin
  select value into v from system_settings where key = 'retention';
  delete from sync_events
   where received_at < now() - ((v->>'sync_events_days')::int || ' days')::interval;
  -- purge du numéro chiffré des conversions honorées
  update reward_redemptions set target_msisdn_enc = null
   where target_msisdn_enc is not null
     and fulfilled_at < now() - ((v->>'msisdn_enc_days')::int || ' days')::interval;
  perform drop_old_partitions('advertisement_impressions',
            greatest(1, (v->>'impressions_days')::int / 30));
  perform drop_old_partitions('calls',
            greatest(1, (v->>'calls_days')::int / 30));
  perform ensure_monthly_partitions(3);
end $$;

-- Planification -------------------------------------------------------------
select cron.schedule('aggregate_daily',    '0 2 * * *',  $$select job_aggregate_daily()$$);
select cron.schedule('expire_points',      '0 4 * * *',  $$select job_expire_points()$$);
select cron.schedule('campaign_lifecycle', '*/5 * * * *',$$select job_campaign_lifecycle()$$);
select cron.schedule('monthly_bonus',      '30 0 1 * *', $$select job_monthly_bonus()$$);
select cron.schedule('archive_purge',      '0 5 * * 0',  $$select job_archive_purge()$$);
select cron.schedule('retention',          '0 6 * * 0',  $$select job_retention()$$);
select cron.schedule('partitions_ahead',   '0 1 1 * *',  $$select ensure_monthly_partitions(3)$$);
