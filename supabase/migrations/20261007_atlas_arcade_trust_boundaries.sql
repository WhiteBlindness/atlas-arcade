-- Atlas Arcade: secure account balances, scores, and referral attribution.
--
-- This migration expects the application tables already used by the codebase.
-- It checks their required columns before changing permissions. It does not
-- create or delete user rows, change admin flags, or expose a service key.
-- Apply only through the Supabase migration runner, which wraps a migration
-- file in a transaction. Do not run this statement-by-statement in SQL Editor:
-- a late function or assertion error must roll back the earlier policy changes.
-- Review the target schema and validate the assertions in a non-production DB.

do $preflight$
begin
  if to_regclass('public.user_coins') is null
    or to_regclass('public.high_scores') is null
    or to_regclass('public.profiles') is null then
    raise exception 'Trust migration requires public.user_coins, public.high_scores, and public.profiles';
  end if;

  if exists (
    select required.table_name, required.column_name
    from (values
      ('user_coins', 'user_id'),
      ('user_coins', 'coins'),
      ('user_coins', 'granted_today'),
      ('user_coins', 'accrual_at'),
      ('user_coins', 'last_reset'),
      ('user_coins', 'premium_tokens'),
      ('user_coins', 'updated_at'),
      ('high_scores', 'user_id'),
      ('high_scores', 'game_slug'),
      ('high_scores', 'score'),
      ('high_scores', 'updated_at'),
      ('profiles', 'id'),
      ('profiles', 'is_admin'),
      ('profiles', 'referral_code'),
      ('profiles', 'referred_by')
    ) as required(table_name, column_name)
    where not exists (
      select 1
      from information_schema.columns actual
      where actual.table_schema = 'public'
        and actual.table_name = required.table_name
        and actual.column_name = required.column_name
    )
  ) then
    raise exception 'Trust migration found an unexpected application table shape; inspect the required columns in this migration before proceeding';
  end if;

  if exists (
    select expected.table_name, expected.column_name
    from (values
      ('user_coins', 'user_id', 'uuid'),
      ('user_coins', 'coins', 'integer'),
      ('user_coins', 'granted_today', 'integer'),
      ('user_coins', 'accrual_at', 'timestamp with time zone'),
      ('user_coins', 'last_reset', 'date'),
      ('user_coins', 'premium_tokens', 'integer'),
      ('high_scores', 'user_id', 'uuid'),
      ('high_scores', 'game_slug', 'text'),
      ('high_scores', 'score', 'integer'),
      ('profiles', 'id', 'uuid'),
      ('profiles', 'is_admin', 'boolean'),
      ('profiles', 'referral_code', 'text'),
      ('profiles', 'referred_by', 'uuid')
    ) as expected(table_name, column_name, data_type)
    where not exists (
      select 1
      from information_schema.columns actual
      where actual.table_schema = 'public'
        and actual.table_name = expected.table_name
        and actual.column_name = expected.column_name
        and actual.data_type = expected.data_type
    )
  ) then
    raise exception 'Trust migration found a column with an unexpected type; inspect the target schema before proceeding';
  end if;

  if exists (
    select upper(referral_code)
    from public.profiles
    where referral_code is not null
    group by upper(referral_code)
    having count(*) > 1
  ) then
    raise exception 'Trust migration found referral codes that collide when compared without case; resolve them before proceeding';
  end if;

  if not exists (
    select 1 from pg_index i
    where i.indrelid = 'public.user_coins'::regclass
      and i.indisunique and i.indisvalid and i.indpred is null and i.indexprs is null
      and i.indnkeyatts = 1
      and (
        select array_agg(a.attname::text order by k.ordinality)
        from unnest(i.indkey::smallint[]) with ordinality as k(attnum, ordinality)
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
        where k.ordinality <= i.indnkeyatts
      ) = array['user_id']::text[]
  ) or not exists (
    select 1 from pg_index i
    where i.indrelid = 'public.high_scores'::regclass
      and i.indisunique and i.indisvalid and i.indpred is null and i.indexprs is null
      and i.indnkeyatts = 2
      and (
        select array_agg(a.attname::text order by k.ordinality)
        from unnest(i.indkey::smallint[]) with ordinality as k(attnum, ordinality)
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
        where k.ordinality <= i.indnkeyatts
      ) = array['user_id', 'game_slug']::text[]
  ) or not exists (
    select 1 from pg_index i
    where i.indrelid = 'public.profiles'::regclass
      and i.indisunique and i.indisvalid and i.indpred is null and i.indexprs is null
      and i.indnkeyatts = 1
      and (
        select array_agg(a.attname::text order by k.ordinality)
        from unnest(i.indkey::smallint[]) with ordinality as k(attnum, ordinality)
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
        where k.ordinality <= i.indnkeyatts
      ) = array['id']::text[]
  ) or not exists (
    select 1 from pg_index i
    where i.indrelid = 'public.profiles'::regclass
      and i.indisunique and i.indisvalid and i.indpred is null and i.indexprs is null
      and i.indnkeyatts = 1
      and (
        select array_agg(a.attname::text order by k.ordinality)
        from unnest(i.indkey::smallint[]) with ordinality as k(attnum, ordinality)
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
        where k.ordinality <= i.indnkeyatts
      ) = array['referral_code']::text[]
  ) then
    raise exception 'Trust migration requires valid unique indexes on user_coins.user_id, high_scores(user_id, game_slug), profiles.id, and profiles.referral_code';
  end if;
end
$preflight$;

-- Existing referral codes include mixed-case hexadecimal values. Normalize
-- lookups and prevent new case-only duplicates without changing stored codes.
create unique index if not exists profiles_referral_code_upper_key
  on public.profiles (upper(referral_code))
  where referral_code is not null;

-- Replace row-level policies on these app-owned tables with own-row reads.
-- Sensitive mutations are performed only by the SECURITY DEFINER functions
-- below. Direct grants assigned to service_role and the table owner are not
-- revoked. Public-role access is intentionally removed.
do $policies$
declare
  v_policy record;
begin
  for v_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('user_coins', 'high_scores', 'profiles')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename
    );
  end loop;
end
$policies$;

alter table public.user_coins enable row level security;
alter table public.high_scores enable row level security;
alter table public.profiles enable row level security;

create policy user_coins_select_own on public.user_coins
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy high_scores_select_own on public.high_scores
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

-- Remove direct client writes even if a permissive RLS policy or table-level
-- grant existed. The anonymous keep-alive query needs only the user_id column;
-- RLS still returns no rows to anon.
revoke all on table public.user_coins from public, anon, authenticated;
revoke all on table public.high_scores from public, anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;

grant select on table public.user_coins to authenticated;
grant select on table public.high_scores to authenticated;
grant select on table public.profiles to authenticated;
grant select (user_id) on table public.user_coins to anon;

-- Revoke any known client-claimed premium mint RPC while preserving the
-- function definition for privileged server-side callers that may depend on it.
do $premium_mint$
begin
  if to_regprocedure('public.add_premium_tokens(integer)') is not null then
    execute 'revoke all on function public.add_premium_tokens(integer) from public, anon, authenticated';
  end if;
end
$premium_mint$;

-- Apply daily reset and two-hour regeneration using database time and a locked
-- row. The client cannot submit a desired balance or move the grant counter.
create or replace function public.arcade_refresh_user_tokens()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_today date := (v_now at time zone 'utc')::date;
  v_row public.user_coins%rowtype;
  v_coins integer;
  v_granted integer;
  v_accrual_at timestamptz;
  v_premium integer;
  v_ticks numeric := 0;
  v_grant integer := 0;
begin
  if v_me is null then
    return null;
  end if;

  insert into public.user_coins (user_id)
  values (v_me)
  on conflict (user_id) do nothing;

  select *
  into v_row
  from public.user_coins
  where user_id = v_me
  for update;

  if not found or v_row.last_reset > v_today then
    return null;
  end if;

  if v_row.last_reset is null or v_row.last_reset < v_today then
    v_coins := 5;
    v_granted := 5;
    v_accrual_at := v_now;
  else
    v_coins := greatest(0, least(5, coalesce(v_row.coins, 5)));
    v_granted := greatest(5, least(10, coalesce(v_row.granted_today, 5)));
    v_accrual_at := coalesce(v_row.accrual_at, v_now);

    if v_coins < 5 and v_granted < 10 and v_accrual_at <= v_now then
      v_ticks := floor(extract(epoch from (v_now - v_accrual_at)) / 7200);
      v_grant := least(v_ticks, 5 - v_coins, 10 - v_granted)::integer;
      if v_grant > 0 then
        v_coins := v_coins + v_grant;
        v_granted := v_granted + v_grant;
        if v_coins >= 5 or v_granted >= 10 then
          v_accrual_at := v_now;
        else
          v_accrual_at := v_accrual_at + (v_grant * interval '2 hours');
        end if;
      end if;
    end if;
  end if;

  v_premium := coalesce(v_row.premium_tokens, 0);
  if v_premium < 0 then
    return null;
  end if;

  update public.user_coins
  set coins = v_coins,
      granted_today = v_granted,
      accrual_at = v_accrual_at,
      last_reset = v_today,
      updated_at = v_now
  where user_id = v_me;

  return jsonb_build_object(
    'coins', v_coins,
    'granted_today', v_granted,
    'accrual_at', v_accrual_at,
    'last_reset', v_today,
    'premium_tokens', v_premium
  );
end;
$$;

revoke all on function public.arcade_refresh_user_tokens() from public, anon, authenticated;
grant execute on function public.arcade_refresh_user_tokens() to authenticated;

-- Consume daily tokens first, followed by premium balance, in one transaction.
-- Admin status is read from the protected profile row, never from client state.
create or replace function public.arcade_consume_user_tokens(p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_refresh jsonb;
  v_admin boolean := false;
  v_row public.user_coins%rowtype;
  v_coins integer;
  v_premium integer;
  v_daily_spent integer;
  v_premium_spent integer;
  v_now timestamptz := clock_timestamp();
begin
  if v_me is null or p_amount is null or p_amount < 1 or p_amount > 5 then
    return null;
  end if;

  v_refresh := public.arcade_refresh_user_tokens();
  if v_refresh is null then
    return null;
  end if;

  select coalesce(is_admin, false)
  into v_admin
  from public.profiles
  where id = v_me;
  v_admin := coalesce(v_admin, false);

  select *
  into v_row
  from public.user_coins
  where user_id = v_me
  for update;
  if not found then
    return null;
  end if;

  v_coins := greatest(0, least(5, coalesce(v_row.coins, 0)));
  v_premium := coalesce(v_row.premium_tokens, 0);
  if v_premium < 0 then
    return null;
  end if;

  if v_admin then
    return jsonb_build_object(
      'ok', true,
      'is_admin', true,
      'coins', v_coins,
      'granted_today', v_row.granted_today,
      'accrual_at', v_row.accrual_at,
      'last_reset', v_row.last_reset,
      'premium_tokens', v_premium
    );
  end if;

  v_daily_spent := least(v_coins, p_amount);
  v_premium_spent := p_amount - v_daily_spent;
  if v_premium < v_premium_spent then
    return jsonb_build_object(
      'ok', false,
      'is_admin', false,
      'coins', v_coins,
      'granted_today', v_row.granted_today,
      'accrual_at', v_row.accrual_at,
      'last_reset', v_row.last_reset,
      'premium_tokens', v_premium
    );
  end if;

  update public.user_coins
  set coins = v_coins - v_daily_spent,
      premium_tokens = v_premium - v_premium_spent,
      accrual_at = case when v_coins = 5 then v_now else v_row.accrual_at end,
      updated_at = v_now
  where user_id = v_me;

  return jsonb_build_object(
    'ok', true,
    'is_admin', false,
    'coins', v_coins - v_daily_spent,
    'granted_today', v_row.granted_today,
    'accrual_at', case when v_coins = 5 then v_now else v_row.accrual_at end,
    'last_reset', v_row.last_reset,
    'premium_tokens', v_premium - v_premium_spent
  );
end;
$$;

revoke all on function public.arcade_consume_user_tokens(integer) from public, anon, authenticated;
grant execute on function public.arcade_consume_user_tokens(integer) to authenticated;

-- The browser may report its score, but the database derives user_id, accepts
-- only known game slugs and enforces generous integer ceilings. This limits
-- malformed and extreme submissions; it does not validate gameplay outcomes.
create or replace function public.arcade_submit_high_score(p_game_slug text, p_score integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_cap integer;
  v_saved integer;
  v_now timestamptz := clock_timestamp();
begin
  v_cap := case p_game_slug
    when 'globle' then 1000
    when 'capital-invaders' then 100000
    when 'flag-rush' then 100000
    when 'peaks-valleys' then 1000000
    when 'tectonic-snap' then 100000
    when 'frontier-faceoff' then 100000
    when 'one-strike' then 1000000
    when 'urban-legends' then 10000
    when 'skyline-silhouette' then 5000
    when 'border-blitz' then 100000
    when 'stat-attack' then 1000000
    when 'atlas-jackpot' then 15
    else null
  end;

  if v_me is null or v_cap is null or p_score is null or p_score < 0 or p_score > v_cap then
    return null;
  end if;

  insert into public.high_scores (user_id, game_slug, score, updated_at)
  values (v_me, p_game_slug, p_score, v_now)
  on conflict (user_id, game_slug) do update
    set score = greatest(public.high_scores.score, excluded.score),
        updated_at = case
          when excluded.score > public.high_scores.score then v_now
          else public.high_scores.updated_at
        end
  returning score into v_saved;

  return v_saved;
end;
$$;

revoke all on function public.arcade_submit_high_score(text, integer) from public, anon, authenticated;
grant execute on function public.arcade_submit_high_score(text, integer) to authenticated;

-- Lock the current profile before checking referral state. Concurrent requests
-- for one account can therefore redeem at most once. The caller's p_bonus is
-- ignored; the bonus depends only on the protected referrer's admin flag.
create or replace function public.redeem_referral(p_code text, p_bonus integer default 100)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_code text;
  v_referred_by uuid;
  v_referrer uuid;
  v_referrer_admin boolean;
  v_bonus integer;
  v_updated integer;
  v_now timestamptz := clock_timestamp();
  v_today date := (v_now at time zone 'utc')::date;
begin
  if v_me is null or p_code is null then
    return false;
  end if;

  v_code := upper(trim(p_code));
  if length(v_code) <> 8 or v_code !~ '^[A-HJ-NP-Z0-9]{8}$' then
    return false;
  end if;

  select referred_by
  into v_referred_by
  from public.profiles
  where id = v_me
  for update;
  if not found or v_referred_by is not null then
    return false;
  end if;

  select id, is_admin
  into v_referrer, v_referrer_admin
  from public.profiles
  where upper(referral_code) = v_code
  limit 1;
  if v_referrer is null or v_referrer = v_me then
    return false;
  end if;

  v_bonus := case when coalesce(v_referrer_admin, false) then 100 else 20 end;

  update public.profiles
  set referred_by = v_referrer
  where id = v_me and referred_by is null;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    return false;
  end if;

  insert into public.user_coins (
    user_id, coins, granted_today, accrual_at, last_reset, premium_tokens, updated_at
  )
  values (v_me, 5, 5, v_now, v_today, v_bonus, v_now)
  on conflict (user_id) do update
    set premium_tokens = coalesce(public.user_coins.premium_tokens, 0) + v_bonus,
        updated_at = v_now;

  return true;
end;
$$;

revoke all on function public.redeem_referral(text, integer) from public, anon, authenticated;
grant execute on function public.redeem_referral(text, integer) to authenticated;

-- Migration-time regression checks for the data boundary and RPC grants.
do $assertions$
declare
  v_role text;
  v_table text;
begin
  foreach v_role in array array['anon', 'authenticated'] loop
    foreach v_table in array array[
      'public.user_coins', 'public.high_scores', 'public.profiles'
    ] loop
      if has_table_privilege(v_role, v_table, 'INSERT')
        or has_table_privilege(v_role, v_table, 'UPDATE')
        or has_table_privilege(v_role, v_table, 'DELETE')
        or has_table_privilege(v_role, v_table, 'TRUNCATE')
        or has_any_column_privilege(v_role, v_table, 'INSERT')
        or has_any_column_privilege(v_role, v_table, 'UPDATE') then
        raise exception 'Direct client write privilege remains on % for role %', v_table, v_role;
      end if;
    end loop;
  end loop;

  if not (select relrowsecurity from pg_class where oid = 'public.user_coins'::regclass)
    or not (select relrowsecurity from pg_class where oid = 'public.high_scores'::regclass)
    or not (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) then
    raise exception 'RLS must remain enabled on account tables';
  end if;

  if has_function_privilege('anon', 'public.arcade_refresh_user_tokens()', 'EXECUTE')
    or has_function_privilege('anon', 'public.arcade_consume_user_tokens(integer)', 'EXECUTE')
    or has_function_privilege('anon', 'public.arcade_submit_high_score(text,integer)', 'EXECUTE')
    or has_function_privilege('anon', 'public.redeem_referral(text,integer)', 'EXECUTE') then
    raise exception 'An anonymous role can execute an account mutation RPC';
  end if;

  if not has_function_privilege('authenticated', 'public.arcade_refresh_user_tokens()', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.arcade_consume_user_tokens(integer)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.arcade_submit_high_score(text,integer)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.redeem_referral(text,integer)', 'EXECUTE') then
    raise exception 'Authenticated clients are missing a required guarded RPC';
  end if;

  if to_regprocedure('public.add_premium_tokens(integer)') is not null
    and (
      has_function_privilege('anon', 'public.add_premium_tokens(integer)', 'EXECUTE')
      or has_function_privilege('authenticated', 'public.add_premium_tokens(integer)', 'EXECUTE')
    ) then
    raise exception 'Client-callable premium mint RPC remains enabled';
  end if;

  if not exists (
    select 1
    from pg_index i
    where i.indexrelid = to_regclass('public.profiles_referral_code_upper_key')
      and i.indrelid = 'public.profiles'::regclass
      and i.indisunique and i.indisvalid and i.indpred is not null
      and i.indexprs is not null and i.indnkeyatts = 1
      and pg_get_expr(i.indexprs, i.indrelid) = 'upper(referral_code)'
      and pg_get_expr(i.indpred, i.indrelid) like '%referral_code IS NOT NULL%'
  ) then
    raise exception 'Case-insensitive referral lookup requires a valid unique expression index';
  end if;
end
$assertions$;
