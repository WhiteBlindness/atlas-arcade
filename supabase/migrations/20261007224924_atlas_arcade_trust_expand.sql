-- Fase A: expansão compatível com o cliente master e o cliente RPC.
-- Aplicar numa transação própria, apenas após aprovação.
-- Conserva todas as concessões e políticas de escrita das três tabelas.
-- Esta fase disponibiliza RPCs seguros, mas ainda não fecha a autoridade antiga.
-- Não aplicar a fase B antes de publicar e verificar o novo cliente.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

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
      ('profiles', 'username'),
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
      ('profiles', 'username', 'text'),
      ('user_coins', 'updated_at', 'timestamp with time zone'),
      ('high_scores', 'updated_at', 'timestamp with time zone'),
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


  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name in ('profiles','user_coins','high_scores')
      and column_name in ('id','user_id','username','is_admin','coins','granted_today',
        'accrual_at','last_reset','premium_tokens','updated_at','game_slug','score')
      and is_nullable='YES'
  ) then
    raise exception 'Trust migration requires NOT NULL identity, balance, score, and authority columns';
  end if;

  if exists (select 1 from public.user_coins
    where coins is null or coins not between 0 and 5
      or granted_today is null or granted_today not between 5 and 10
      or premium_tokens is null or premium_tokens < 0
      or accrual_at is null or not isfinite(accrual_at) or accrual_at > now()
      or last_reset is null or not isfinite(last_reset)
      or last_reset > (now() at time zone 'utc')::date
      or updated_at is null or not isfinite(updated_at)) then
    raise exception 'Trust migration found an invalid token state; inspect aggregate anomalies before proceeding';
  end if;

  if exists (select 1 from public.profiles where referral_code is not null
    and upper(referral_code) !~ '^[A-HJ-NP-Z0-9]{8}$') then
    raise exception 'Trust migration found a malformed referral code';
  end if;

  if exists (
    select 1 from (values ('profiles','id'),('user_coins','user_id'),('high_scores','user_id')) v(t,c)
    where not exists (
      select 1 from pg_constraint k join pg_attribute a
        on a.attrelid=k.conrelid and a.attnum=k.conkey[1]
      where k.conrelid=('public.'||v.t)::regclass and k.contype='f'
        and k.confrelid='auth.users'::regclass and k.confdeltype='c'
        and k.convalidated and cardinality(k.conkey)=1 and a.attname=v.c
    )
  ) then
    raise exception 'Trust migration requires validated account foreign keys with ON DELETE CASCADE';
  end if;
end
$preflight$;


-- Reject malformed balances rather than silently repairing historical data.
alter table public.user_coins add constraint user_coins_trust_bounds
  check (coins between 0 and 5 and granted_today between 5 and 10 and premium_tokens >= 0
    and isfinite(accrual_at) and isfinite(last_reset) and isfinite(updated_at));

-- A deleted referrer's SET NULL relationship must not unlock a second reward.
alter table public.profiles add column referral_redeemed boolean not null default false;
update public.profiles set referral_redeemed = true where referred_by is not null;

-- Signup is atomic: unexpected bootstrap failures abort account creation.
-- User metadata supplies only the display name, never authority or balance.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_username text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  v_attempt integer := 0;
begin
  if v_username is null or length(v_username) > 64 then
    v_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  loop
    begin
      insert into public.profiles (id, username, is_admin, referral_code)
      values (new.id, v_username, false, substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
      on conflict (id) do nothing;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt >= 5 then raise; end if;
      v_username := left(v_username, 48) || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    end;
  end loop;
  insert into public.user_coins (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
-- Both observed triggers call this same idempotent function. Keep one.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
alter function public.gen_referral_code() set search_path = '';

create or replace function public.protect_admin_flag()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.is_admin is distinct from old.is_admin then
    new.is_admin := old.is_admin;
  end if;
  -- A coluna nova não faz parte das escritas do cliente antigo.
  -- Apenas o proprietário das funções e o serviço podem alterar esta marca.
  if current_user not in ('postgres', 'service_role') then
    new.referral_redeemed := old.referral_redeemed;
  end if;
  return new;
end;
$$;

revoke all on function public.gen_referral_code() from public, anon, authenticated;
revoke all on function public.protect_admin_flag() from public, anon, authenticated;

create or replace function public.get_user_state()
returns json language plpgsql security definer set search_path = '' as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null or not exists (select 1 from auth.users where id=v_me) then return null; end if;
  insert into public.user_coins (user_id) values (v_me) on conflict (user_id) do nothing;
  return (select json_build_object(
    'coins',c.coins,'granted_today',c.granted_today,'accrual_at',c.accrual_at,
    'last_reset',c.last_reset,'premium_tokens',c.premium_tokens,
    'high_scores',coalesce((select json_agg(json_build_object('game_slug',s.game_slug,'score',s.score))
      from public.high_scores s where s.user_id=v_me),'[]'::json)
  ) from public.user_coins c where c.user_id=v_me);
end;
$$;
revoke all on function public.get_user_state() from public, anon, authenticated;
grant execute on function public.get_user_state() to authenticated;

create or replace function public.delete_own_user()
returns void language plpgsql security definer set search_path = '' as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise insufficient_privilege using message='Authentication required'; end if;
  delete from auth.users where id=v_me;
  if not found then raise insufficient_privilege using message='Account unavailable'; end if;
end;
$$;
revoke all on function public.delete_own_user() from public, anon, authenticated;
grant execute on function public.delete_own_user() to authenticated;

-- Public reads disclose only leaderboard names/scores and name availability.
create or replace function public.get_leaderboard(p_game_slug text, p_limit integer default 20)
returns table(username text, score integer) language sql stable security definer set search_path = '' as $$
  select p.username,s.score from public.high_scores s join public.profiles p on p.id=s.user_id
  where s.game_slug=p_game_slug order by s.score desc,p.username
  limit greatest(1,least(coalesce(p_limit,20),100));
$$;
revoke all on function public.get_leaderboard(text,integer) from public, anon, authenticated;
grant execute on function public.get_leaderboard(text,integer) to anon, authenticated;
create or replace function public.is_username_taken(name text)
returns boolean language sql security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where lower(username)=lower(name));
$$;
revoke all on function public.is_username_taken(text) from public, anon, authenticated;
grant execute on function public.is_username_taken(text) to anon, authenticated;

-- Existing referral codes include mixed-case hexadecimal values. Normalize
-- lookups and prevent new case-only duplicates without changing stored codes.
create unique index if not exists profiles_referral_code_upper_key
  on public.profiles (upper(referral_code))
  where referral_code is not null;

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
  if v_me is null or not exists (select 1 from auth.users where id=v_me) then
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

  if v_me is null or not exists (select 1 from auth.users where id=v_me) or v_cap is null or p_score is null or p_score < 0 or p_score > v_cap then
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
  v_redeemed boolean;
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

  select referred_by, referral_redeemed
  into v_referred_by, v_redeemed
  from public.profiles
  where id = v_me
  for update;
  if not found or v_redeemed or v_referred_by is not null then
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
  set referred_by = v_referrer, referral_redeemed = true
  where id = v_me and not referral_redeemed and referred_by is null;
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


-- A expansão mantém os dois percursos até à adoção do cliente RPC.
do $expand_assertions$
declare v_table text;
begin
  foreach v_table in array array['public.profiles','public.user_coins','public.high_scores'] loop
    if not has_table_privilege('authenticated',v_table,'INSERT')
      or not has_table_privilege('authenticated',v_table,'UPDATE') then
      raise exception 'Expansion must preserve legacy authenticated INSERT/UPDATE on %',v_table;
    end if;
  end loop;
  if has_function_privilege('anon','public.arcade_refresh_user_tokens()','EXECUTE')
    or has_function_privilege('anon','public.arcade_consume_user_tokens(integer)','EXECUTE')
    or has_function_privilege('anon','public.arcade_submit_high_score(text,integer)','EXECUTE')
    or has_function_privilege('anon','public.redeem_referral(text,integer)','EXECUTE')
    or has_function_privilege('anon','public.get_user_state()','EXECUTE')
    or has_function_privilege('anon','public.delete_own_user()','EXECUTE') then
    raise exception 'Expansion exposed a private account RPC to anon';
  end if;
  if not has_function_privilege('authenticated','public.arcade_refresh_user_tokens()','EXECUTE')
    or not has_function_privilege('authenticated','public.arcade_consume_user_tokens(integer)','EXECUTE')
    or not has_function_privilege('authenticated','public.arcade_submit_high_score(text,integer)','EXECUTE')
    or not has_function_privilege('authenticated','public.get_user_state()','EXECUTE')
    or not has_function_privilege('authenticated','public.delete_own_user()','EXECUTE') then
    raise exception 'Expansion is missing a required authenticated RPC grant';
  end if;
end;
$expand_assertions$;
notify pgrst, 'reload schema';
