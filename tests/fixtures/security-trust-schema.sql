create role anon noinherit;
create role authenticated noinherit;
create role service_role noinherit;

create schema auth;
create function auth.uid()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

create table public.profiles (
  id uuid primary key,
  is_admin boolean not null default false,
  referral_code text unique,
  referred_by uuid
);

create table public.user_coins (
  user_id uuid primary key,
  coins integer not null default 5,
  granted_today integer not null default 5,
  accrual_at timestamptz not null default clock_timestamp(),
  last_reset date not null default ((clock_timestamp() at time zone 'utc')::date),
  premium_tokens integer not null default 0,
  updated_at timestamptz not null default clock_timestamp()
);

create table public.high_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  game_slug text not null,
  score integer not null,
  updated_at timestamptz not null default clock_timestamp(),
  unique (user_id, game_slug)
);

grant insert, select, update, delete on public.profiles to authenticated;
grant insert, select, update, delete on public.user_coins to authenticated;
grant insert, select, update, delete on public.high_scores to authenticated;
