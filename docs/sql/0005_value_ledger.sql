-- =============================================================================
-- 0005 — Valeur : barèmes, wallet, ledger append-only chaîné
-- =============================================================================

create table point_rules (
  version                    integer primary key,
  effective_from             timestamptz not null,
  points_per_impression      integer not null default 2  check (points_per_impression >= 0),
  points_per_call_bonus      integer not null default 1  check (points_per_call_bonus >= 0),
  min_call_seconds_for_bonus integer not null default 30,
  monthly_bonus_points       integer not null default 20,
  welcome_bonus_points       integer not null default 20,
  referral_bonus_points      integer not null default 30,
  daily_impression_cap       integer not null default 12 check (daily_impression_cap > 0),
  freq_cap_minutes           integer not null default 10,
  daily_call_bonus_cap       integer not null default 10,
  points_validity_months     integer not null default 12,
  created_by                 uuid references employees(id),
  created_at                 timestamptz not null default now()
);

create table points_wallets (
  user_id          uuid primary key references profiles(id) on delete cascade,
  confirmed_points integer not null default 0 check (confirmed_points >= 0),
  pending_points   integer not null default 0 check (pending_points >= 0),
  lifetime_earned  integer not null default 0,
  lifetime_spent   integer not null default 0,
  last_entry_id    bigint,
  last_wallet_seq  bigint not null default 0,
  last_row_hash    bytea,
  updated_at       timestamptz not null default now()
);

create table points_ledger (
  id                  bigint generated always as identity primary key,
  user_id             uuid not null references profiles(id) on delete restrict,
  wallet_seq          bigint not null,
  entry_type          ledger_entry_type not null,
  direction           char(1) not null check (direction in ('C','D')),
  amount              integer not null check (amount > 0),
  balance_after       integer not null check (balance_after >= 0),
  origin              ledger_origin not null,
  impression_id       uuid,
  call_id             uuid,
  campaign_id         uuid references campaigns(id) on delete set null,
  advertisement_id    uuid references advertisements(id) on delete set null,
  redemption_id       uuid,
  reverses_entry_id   bigint references points_ledger(id),
  rule_version        integer not null references point_rules(version),
  expires_at          timestamptz,
  expired_by_entry_id bigint references points_ledger(id),
  transaction_id      uuid not null,
  idempotency_key     uuid not null unique,
  created_at          timestamptz not null default now(),
  actor_type          text not null default 'system'
                        check (actor_type in ('system','employee','user')),
  actor_id            uuid,
  reason              text,
  prev_hash           bytea,
  row_hash            bytea not null,
  constraint reason_required_for_manual
    check (origin not in ('manual_correction','reversal') or reason is not null),
  constraint expiry_only_on_credit
    check (expires_at is null or direction = 'C')
);

create unique index idx_ledger_wallet_seq on points_ledger(user_id, wallet_seq);
create index idx_ledger_user_time  on points_ledger(user_id, created_at desc);
create index idx_ledger_campaign   on points_ledger(campaign_id) where campaign_id is not null;
create index idx_ledger_txn        on points_ledger(transaction_id);
create index idx_ledger_to_expire  on points_ledger(expires_at)
  where expires_at is not null and expired_by_entry_id is null and direction = 'C';

-- ----------------------------------------------------------------------------
-- IMMUABILITÉ : aucune ligne du ledger ne peut être modifiée ou supprimée.
-- Une correction est TOUJOURS un nouveau mouvement inverse.
-- ----------------------------------------------------------------------------
create or replace function ledger_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'points_ledger est append-only : DELETE interdit. '
                    'Utilisez un mouvement de compensation (origin = reversal).';
  end if;
  -- Seule mutation tolérée : marquer un crédit comme expiré.
  if new.id                  is distinct from old.id
  or new.user_id             is distinct from old.user_id
  or new.wallet_seq          is distinct from old.wallet_seq
  or new.entry_type          is distinct from old.entry_type
  or new.direction           is distinct from old.direction
  or new.amount              is distinct from old.amount
  or new.balance_after       is distinct from old.balance_after
  or new.origin              is distinct from old.origin
  or new.impression_id       is distinct from old.impression_id
  or new.call_id             is distinct from old.call_id
  or new.campaign_id         is distinct from old.campaign_id
  or new.advertisement_id    is distinct from old.advertisement_id
  or new.redemption_id       is distinct from old.redemption_id
  or new.reverses_entry_id   is distinct from old.reverses_entry_id
  or new.rule_version        is distinct from old.rule_version
  or new.expires_at          is distinct from old.expires_at
  or new.transaction_id      is distinct from old.transaction_id
  or new.idempotency_key     is distinct from old.idempotency_key
  or new.created_at          is distinct from old.created_at
  or new.actor_type          is distinct from old.actor_type
  or new.actor_id            is distinct from old.actor_id
  or new.reason              is distinct from old.reason
  or new.prev_hash           is distinct from old.prev_hash
  or new.row_hash            is distinct from old.row_hash
  then
    raise exception 'points_ledger est append-only : seul expired_by_entry_id '
                    'peut etre renseigne, et une seule fois.';
  end if;
  if old.expired_by_entry_id is not null then
    raise exception 'ce mouvement est deja marque comme expire';
  end if;
  return new;
end $$;

create trigger trg_ledger_guard_delete
  before delete on points_ledger
  for each row execute function ledger_guard();

create trigger trg_ledger_guard_update
  before update on points_ledger
  for each row execute function ledger_guard();

revoke delete on points_ledger from public, anon, authenticated;
revoke update on points_ledger from public, anon, authenticated;
revoke insert on points_ledger from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- post_ledger_entry : LE SEUL chemin d'écriture de valeur.
-- Atomique, idempotent, chaîné par hash, verrou par wallet.
-- ----------------------------------------------------------------------------
create or replace function post_ledger_entry(
  p_user_id          uuid,
  p_direction        char(1),
  p_amount           integer,
  p_origin           ledger_origin,
  p_entry_type       ledger_entry_type,
  p_idempotency_key  uuid,
  p_transaction_id   uuid default gen_random_uuid(),
  p_rule_version     integer default null,
  p_impression_id    uuid default null,
  p_call_id          uuid default null,
  p_campaign_id      uuid default null,
  p_advertisement_id uuid default null,
  p_redemption_id    uuid default null,
  p_reverses_entry_id bigint default null,
  p_actor_type       text default 'system',
  p_actor_id         uuid default null,
  p_reason           text default null
) returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing   bigint;
  v_wallet     points_wallets;
  v_new_balance integer;
  v_seq        bigint;
  v_prev_hash  bytea;
  v_row_hash   bytea;
  v_rule       integer;
  v_expires    timestamptz;
  v_validity   integer;
  v_id         bigint;
begin
  if p_amount <= 0 then
    raise exception 'amount doit être strictement positif';
  end if;

  -- 1. idempotence : un rejeu renvoie l'entrée existante sans rien modifier
  select id into v_existing
    from points_ledger where idempotency_key = p_idempotency_key;
  if v_existing is not null then
    return v_existing;
  end if;

  -- 2. verrou exclusif sur le wallet : sérialise les mouvements concurrents
  select * into v_wallet from points_wallets
    where user_id = p_user_id for update;
  if not found then
    insert into points_wallets(user_id) values (p_user_id)
      returning * into v_wallet;
  end if;

  -- 3. barème
  v_rule := coalesce(p_rule_version,
                     (select version from point_rules
                       where effective_from <= now()
                       order by effective_from desc limit 1));
  if v_rule is null then
    raise exception 'aucun point_rules actif';
  end if;
  select points_validity_months into v_validity from point_rules where version = v_rule;

  -- 4. nouveau solde
  v_new_balance := case p_direction
                     when 'C' then v_wallet.confirmed_points + p_amount
                     else          v_wallet.confirmed_points - p_amount
                   end;
  if v_new_balance < 0 then
    raise exception 'solde insuffisant: % disponible, % demandé',
      v_wallet.confirmed_points, p_amount
      using errcode = 'check_violation';
  end if;

  v_seq       := v_wallet.last_wallet_seq + 1;
  v_prev_hash := v_wallet.last_row_hash;
  if p_direction = 'C' then
    v_expires := now() + (v_validity || ' month')::interval;
  end if;

  -- 5. chaînage de hash (détection de falsification a posteriori)
  v_row_hash := digest(
    coalesce(encode(v_prev_hash,'hex'),'') || '|' ||
    p_user_id::text     || '|' || v_seq::text        || '|' ||
    p_direction         || '|' || p_amount::text     || '|' ||
    v_new_balance::text || '|' || p_origin::text     || '|' ||
    p_idempotency_key::text,
    'sha256');

  insert into points_ledger(
    user_id, wallet_seq, entry_type, direction, amount, balance_after, origin,
    impression_id, call_id, campaign_id, advertisement_id, redemption_id,
    reverses_entry_id, rule_version, expires_at, transaction_id, idempotency_key,
    actor_type, actor_id, reason, prev_hash, row_hash)
  values (
    p_user_id, v_seq, p_entry_type, p_direction, p_amount, v_new_balance, p_origin,
    p_impression_id, p_call_id, p_campaign_id, p_advertisement_id, p_redemption_id,
    p_reverses_entry_id, v_rule, v_expires, p_transaction_id, p_idempotency_key,
    p_actor_type, p_actor_id, p_reason, v_prev_hash, v_row_hash)
  returning id into v_id;

  update points_wallets set
    confirmed_points = v_new_balance,
    lifetime_earned  = lifetime_earned + case when p_direction='C' then p_amount else 0 end,
    lifetime_spent   = lifetime_spent  + case when p_direction='D' then p_amount else 0 end,
    last_entry_id    = v_id,
    last_wallet_seq  = v_seq,
    last_row_hash    = v_row_hash,
    updated_at       = now()
  where user_id = p_user_id;

  return v_id;
end $$;

revoke all on function post_ledger_entry from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Vérification d'intégrité de la chaîne (job quotidien)
-- ----------------------------------------------------------------------------
create or replace function verify_ledger_chain(p_user_id uuid)
returns table(broken_at bigint, expected bytea, found bytea)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare r record; v_prev bytea; v_calc bytea;
begin
  for r in
    select * from points_ledger where user_id = p_user_id order by wallet_seq
  loop
    v_calc := digest(
      coalesce(encode(v_prev,'hex'),'') || '|' ||
      r.user_id::text      || '|' || r.wallet_seq::text    || '|' ||
      r.direction          || '|' || r.amount::text        || '|' ||
      r.balance_after::text|| '|' || r.origin::text         || '|' ||
      r.idempotency_key::text, 'sha256');
    if v_calc is distinct from r.row_hash then
      return query select r.id, v_calc, r.row_hash;
      return;
    end if;
    v_prev := r.row_hash;
  end loop;
end $$;
