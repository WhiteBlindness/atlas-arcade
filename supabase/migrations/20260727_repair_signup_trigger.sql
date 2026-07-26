-- Atlas Arcade — repair signup (500 on POST /auth/v1/signup)
--
-- Run this in the Supabase SQL editor. Run it INSTEAD of
-- 20260726_fix_auth_trigger.sql if you have not already run that one
-- successfully — this file supersedes it and is safe to run on top of it.
--
-- ── WHAT BROKE ──────────────────────────────────────────────────────────────
-- 20260726_admin_and_referrals.sql did two damaging things:
--
--  A) `create or replace function public.handle_new_user()` — this project
--     already had a function with that exact name/signature (nothing in the app
--     ever INSERTs into public.user_coins, yet every new account started with a
--     token row, so a signup trigger must have been creating it). CREATE OR
--     REPLACE silently overwrote it with a profiles-only body, so new users
--     stopped getting their user_coins row.
--
--  B) The profiles UPDATE policy sub-selected public.profiles from a policy ON
--     public.profiles. Postgres then raises
--       "infinite recursion detected in policy for relation profiles"
--     on ANY access to that table — including the trigger's own
--     gen_referral_code() lookup. The trigger raised inside the auth
--     transaction, Postgres rolled the INSERT back, and GoTrue returned
--     500 from POST /auth/v1/signup. That is the line that caused the outage.
--
-- And 20260726_fix_auth_trigger.sql could not repair it, because
-- `drop function if exists public.handle_new_user()` aborts with a dependency
-- error when an existing trigger (e.g. on_auth_user_created) still references
-- it — taking the whole script down with it and applying none of the fixes.
--
-- ── DIAGNOSTIC (run first if you want to see the current state) ─────────────
--   select t.tgname, p.proname
--   from pg_trigger t
--   join pg_proc p on p.oid = t.tgfoid
--   where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal;
--
--   select polname, pg_get_expr(polqual, polrelid) as using_expr,
--          pg_get_expr(polwithcheck, polrelid) as check_expr
--   from pg_policy where polrelid = 'public.profiles'::regclass;

create extension if not exists pgcrypto with schema extensions;

-- ── 1. Kill the recursive policy (the actual 500) ───────────────────────────
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

-- No sub-select on public.profiles — that is what recursed.
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- is_admin stays out of users' hands without an RLS sub-select.
create or replace function public.protect_admin_flag()
returns trigger language plpgsql as $$
begin
  if new.is_admin is distinct from old.is_admin then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_admin on public.profiles;
create trigger profiles_protect_admin
  before update on public.profiles
  for each row execute function public.protect_admin_flag();

-- ── 2. Restore handle_new_user, doing BOTH jobs, and never failing ──────────
-- NOTE: the function is REPLACED, not dropped, so any pre-existing trigger that
-- references it (whatever it is named) keeps working and no dependency error can
-- abort this script.
--
-- Each insert has its own exception guard: a bookkeeping row must never be able
-- to roll back account creation again.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- token row (this is what the pre-existing trigger did; restored here).
  -- Tries the full shape first in case any column is NOT NULL without a
  -- default, then falls back to the bare key if this schema differs.
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

  -- profile row; referral code needs no table reads (no retry loop)
  begin
    insert into public.profiles (id, is_admin, referral_code)
    values (new.id, false, encode(gen_random_bytes(4), 'hex'))
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user: profiles insert failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

-- Ensure a trigger exists without duplicating a pre-existing one.
do $$
begin
  if not exists (
    select 1 from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
      and p.proname = 'handle_new_user'
  ) then
    create trigger on_auth_user_created_profile
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end
$$;

-- ── 3. Backfill anything missed while signup was broken ─────────────────────
insert into public.user_coins (user_id)
select u.id from auth.users u
where not exists (select 1 from public.user_coins c where c.user_id = u.id)
on conflict (user_id) do nothing;

insert into public.profiles (id, is_admin, referral_code)
select u.id, false, encode(extensions.gen_random_bytes(4), 'hex')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

update public.profiles
set referral_code = encode(extensions.gen_random_bytes(4), 'hex')
where referral_code is null;

-- ── Verify ──────────────────────────────────────────────────────────────────
--   select count(*) from auth.users;
--   select count(*) from public.profiles;
--   select count(*) from public.user_coins;
