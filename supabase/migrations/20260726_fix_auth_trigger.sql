-- Atlas Arcade — fix "Database error saving new user" on sign-up
--
-- Run this AFTER 20260726_admin_and_referrals.sql. Idempotent.
--
-- Two problems are fixed here:
--
-- 1. The signup trigger called gen_referral_code(), which SELECTs from
--    public.profiles in a retry loop. Doing table reads inside the auth
--    transaction is fragile and aborts user creation.
--
-- 2. THE ACTUAL BLOCKER: the profiles UPDATE policy in the previous migration
--    had a WITH CHECK that sub-selected public.profiles *from a policy on
--    public.profiles*. Postgres raises "infinite recursion detected in policy
--    for relation profiles" for that, which makes every read/write of the table
--    fail — including the trigger's own lookup. That policy is replaced below
--    with a non-recursive one.

-- pgcrypto provides gen_random_bytes; on Supabase it lives in `extensions`.
create extension if not exists pgcrypto with schema extensions;

-- ── 1. Safe signup trigger ──────────────────────────────────────────────────
drop trigger if exists on_auth_user_created_profile on auth.users;
drop function if exists public.handle_new_user();

-- search_path includes `extensions` so gen_random_bytes resolves. With only
-- `public` on the path the function would fail at runtime.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.profiles (id, is_admin, referral_code)
  values (
    new.id,
    false,
    encode(gen_random_bytes(4), 'hex')   -- 8 hex chars, no table reads
  )
  on conflict (id) do nothing;
  return new;
exception
  -- A profile is not worth blocking account creation for. If anything here
  -- fails, let the signup succeed; the app backfills the row on next load.
  when others then
    return new;
end;
$$;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. Replace the recursive RLS policy ─────────────────────────────────────
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

-- Non-recursive: no sub-select on public.profiles. Self-promotion to admin is
-- instead blocked by a trigger below, which can read the old row safely.
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Lets the client self-heal a missing profile row.
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- Keep is_admin out of users' hands without an RLS sub-select.
create or replace function public.protect_admin_flag()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    new.is_admin := old.is_admin;   -- silently ignore attempts to change it
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_admin on public.profiles;
create trigger profiles_protect_admin
  before update on public.profiles
  for each row execute function public.protect_admin_flag();

-- ── 3. Backfill anyone created while signups were broken ────────────────────
insert into public.profiles (id, is_admin, referral_code)
select u.id, false, encode(gen_random_bytes(4), 'hex')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

update public.profiles
set referral_code = encode(extensions.gen_random_bytes(4), 'hex')
where referral_code is null;

-- ── Verify ──────────────────────────────────────────────────────────────────
--   select count(*) from auth.users;
--   select id, is_admin, referral_code from public.profiles;
