-- Application catalog inspected read-only on 07/10/2026. No production rows.
-- Minimal auth tables below are SQL test scaffolding; GoTrue creates the full
-- auth schema when this fixture is used with the real local Auth service.
create role anon noinherit;
create role authenticated noinherit;
create role service_role noinherit;
create schema if not exists auth;
create schema if not exists extensions;
create table if not exists auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}'::jsonb);
create table if not exists auth.identities (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade);
create table if not exists auth.sessions (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade);
create or replace function auth.uid() returns uuid language sql stable set search_path='' as $$
select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create table public.profiles (
  id uuid not null,
  username text not null,
  created_at timestamp with time zone not null default now(),
  is_admin boolean not null default false,
  referral_code text,
  referred_by uuid,
  constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint profiles_pkey PRIMARY KEY (id),
  constraint profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES profiles(id) ON DELETE SET NULL,
  constraint profiles_username_key UNIQUE (username)
);
alter table public.profiles enable row level security;
grant all on table public.profiles to anon, authenticated, service_role;
create table public.user_coins (
  user_id uuid not null,
  coins integer not null default 5,
  granted_today integer not null default 5,
  accrual_at timestamp with time zone not null default now(),
  last_reset date not null default ((now() AT TIME ZONE 'utc'::text))::date,
  premium_tokens integer not null default 0,
  updated_at timestamp with time zone not null default now(),
  constraint user_coins_pkey PRIMARY KEY (user_id),
  constraint user_coins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.user_coins enable row level security;
grant all on table public.user_coins to anon, authenticated, service_role;
create table public.high_scores (
  user_id uuid not null,
  game_slug text not null,
  score integer not null default 0,
  updated_at timestamp with time zone not null default now(),
  constraint high_scores_pkey PRIMARY KEY (user_id, game_slug),
  constraint high_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.high_scores enable row level security;
grant all on table public.high_scores to anon, authenticated, service_role;
create unique index profiles_referral_code_key on public.profiles (referral_code);
create index profiles_referred_by_idx on public.profiles (referred_by);
CREATE OR REPLACE FUNCTION public.delete_own_user()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  delete from auth.users where id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.gen_referral_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = code);
  end loop;
  return code;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_game_slug text, p_limit integer DEFAULT 20)
 RETURNS TABLE(username text, score integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.username, hs.score
  from public.high_scores hs
  join public.profiles p on p.id = hs.user_id
  where hs.game_slug = p_game_slug
  order by hs.score desc
  limit greatest(1, least(p_limit, 100));
$function$;

CREATE OR REPLACE FUNCTION public.get_user_state()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare uid uuid := auth.uid();
begin
  if uid is null then return null; end if;
  -- ensure a coins row exists (parity with the old insert-on-missing fetch)
  insert into public.user_coins (user_id) values (uid) on conflict (user_id) do nothing;
  return (
    select json_build_object(
      'coins',          uc.coins,
      'granted_today',  uc.granted_today,
      'accrual_at',     uc.accrual_at,
      'last_reset',     uc.last_reset,
      'premium_tokens', uc.premium_tokens,
      'high_scores', coalesce(
        (select json_agg(json_build_object('game_slug', hs.game_slug, 'score', hs.score))
         from public.high_scores hs where hs.user_id = uid), '[]'::json)
    )
    from public.user_coins uc where uc.user_id = uid
  );
end; $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_username text;
  v_attempt  int := 0;
begin
  -- token row (unchanged from 20260727)
  begin
    insert into public.user_coins (user_id, coins, granted_today, accrual_at, last_reset)
    values (new.id, 5, 5, now(), (now() at time zone 'utc')::date)
    on conflict (user_id) do nothing;
  exception when others then
    begin
      insert into public.user_coins (user_id) values (new.id)
      on conflict (user_id) do nothing;
    exception when others then
      raise warning 'handle_new_user: user_coins insert failed for %: %', new.id, sqlerrm;
    end;
  end;

  -- Username: email sign-up sends it via options.data.username (AuthModal.tsx),
  -- so it lands in raw_user_meta_data. Google OAuth sends none - profiles.username
  -- being NOT NULL means every OAuth sign-in would otherwise fail this insert the
  -- same way email sign-up just did, so a fallback is mandatory, not optional.
  v_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  if v_username is null then
    v_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  -- profile row; retry on a username collision (real for the OAuth fallback,
  -- which has no client-side is_username_taken pre-check like email sign-up does).
  loop
    v_attempt := v_attempt + 1;
    begin
      insert into public.profiles (id, is_admin, referral_code, username)
      values (new.id, false, encode(gen_random_bytes(4), 'hex'), v_username)
      on conflict (id) do nothing;
      exit;
    exception
      when unique_violation then
        exit when v_attempt >= 5;
        v_username := v_username || '_' || substr(encode(gen_random_bytes(2), 'hex'), 1, 4);
      when others then
        raise warning 'handle_new_user: profiles insert failed for %: %', new.id, sqlerrm;
        exit;
    end;
  end loop;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_username_taken(name text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.profiles where lower(username) = lower(name));
$function$;

CREATE OR REPLACE FUNCTION public.protect_admin_flag()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.is_admin is distinct from old.is_admin then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.redeem_referral(p_code text, p_bonus integer DEFAULT 100)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_me uuid := auth.uid();
  v_referrer uuid;
  v_referrer_admin boolean;
begin
  if v_me is null or p_code is null or length(trim(p_code)) = 0 then
    return false;
  end if;

  -- already referred? then this is a no-op (single redemption per account)
  if exists (select 1 from public.profiles where id = v_me and referred_by is not null) then
    return false;
  end if;

  select id, is_admin into v_referrer, v_referrer_admin
  from public.profiles
  where referral_code = upper(trim(p_code))
  limit 1;

  if v_referrer is null or v_referrer = v_me then
    return false;
  end if;

  -- Tiered bonus: admin-sourced invites are worth more. Overrides whatever the
  -- caller passed for p_bonus - this must never be client-controlled.
  p_bonus := case when v_referrer_admin then 100 else 20 end;

  update public.profiles set referred_by = v_referrer where id = v_me;

  -- Grant the signup bonus. user_coins row may not exist yet for brand-new users.
  insert into public.user_coins (user_id, premium_tokens)
  values (v_me, p_bonus)
  on conflict (user_id) do update
    set premium_tokens = coalesce(public.user_coins.premium_tokens, 0) + p_bonus;

  return true;
end;
$function$;

CREATE TRIGGER profiles_protect_admin BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_admin_flag();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
create policy hs_insert_own on public.high_scores as permissive for INSERT to public with check ((auth.uid() = user_id));
create policy hs_select_own on public.high_scores as permissive for SELECT to public using ((auth.uid() = user_id));
create policy hs_update_own on public.high_scores as permissive for UPDATE to public using ((auth.uid() = user_id));
create policy profiles_insert_own on public.profiles as permissive for INSERT to public with check ((auth.uid() = id));
create policy profiles_select_own on public.profiles as permissive for SELECT to public using ((auth.uid() = id));
create policy profiles_update_own on public.profiles as permissive for UPDATE to public using ((auth.uid() = id)) with check ((auth.uid() = id));
create policy uc_insert_own on public.user_coins as permissive for INSERT to public with check ((auth.uid() = user_id));
create policy uc_select_own on public.user_coins as permissive for SELECT to public using ((auth.uid() = user_id));
create policy uc_update_own on public.user_coins as permissive for UPDATE to public using ((auth.uid() = user_id));
