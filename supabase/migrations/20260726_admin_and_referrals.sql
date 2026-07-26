-- Atlas Arcade — admin flag + referral system
--
-- Idempotent: safe to run more than once, and safe whether or not a `profiles`
-- table already exists. Run it in the Supabase SQL editor.
--
-- NOTE: this app previously had no `profiles` table (per-user data lived in
-- public.user_coins and auth.users metadata), so this creates one.

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  is_admin    boolean not null default false,
  referral_code text,
  referred_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Columns added separately so an existing profiles table is upgraded in place.
alter table public.profiles add column if not exists is_admin      boolean not null default false;
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by   uuid references public.profiles(id) on delete set null;

create unique index if not exists profiles_referral_code_key on public.profiles(referral_code);
create index if not exists profiles_referred_by_idx on public.profiles(referred_by);

alter table public.profiles enable row level security;

-- Own row only. Note is_admin is intentionally NOT self-updatable.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

-- NOTE: this must NOT sub-select public.profiles — a policy on a table that
-- queries the same table raises "infinite recursion detected in policy".
-- is_admin is protected by the protect_admin_flag() trigger instead
-- (see 20260727_repair_signup_trigger.sql).
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── referral code generation ────────────────────────────────────────────────
-- 8 chars, unambiguous alphabet (no 0/O/1/I), retried on the unique index.
create or replace function public.gen_referral_code()
returns text
language plpgsql
as $$
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
$$;

-- ── signup trigger ─────────────────────────────────────────────────────────
-- Deliberately NOT defined here. This project already had a public.handle_new_user()
-- (it creates the public.user_coins row), and defining it here with CREATE OR
-- REPLACE silently overwrote it — which is what broke signup. The trigger is
-- owned by 20260727_repair_signup_trigger.sql, which replaces the body while
-- keeping BOTH the user_coins and profiles inserts.

-- ── redeem a referral code ──────────────────────────────────────────────────
-- SECURITY DEFINER: needs to look up the referrer's row, which RLS hides.
-- Rules: one redemption per user, cannot refer yourself, code must exist.
-- Bonus lands in user_coins.premium_tokens (the permanent balance) because the
-- daily token balance is capped at 5 by design.
create or replace function public.redeem_referral(p_code text, p_bonus int default 100)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_referrer uuid;
begin
  if v_me is null or p_code is null or length(trim(p_code)) = 0 then
    return false;
  end if;

  -- already referred? then this is a no-op (single redemption per account)
  if exists (select 1 from public.profiles where id = v_me and referred_by is not null) then
    return false;
  end if;

  select id into v_referrer
  from public.profiles
  where referral_code = upper(trim(p_code))
  limit 1;

  if v_referrer is null or v_referrer = v_me then
    return false;
  end if;

  update public.profiles set referred_by = v_referrer where id = v_me;

  -- Grant the signup bonus. user_coins row may not exist yet for brand-new users.
  insert into public.user_coins (user_id, premium_tokens)
  values (v_me, p_bonus)
  on conflict (user_id) do update
    set premium_tokens = coalesce(public.user_coins.premium_tokens, 0) + p_bonus;

  return true;
end;
$$;

grant execute on function public.redeem_referral(text, int) to authenticated;

-- ── how to make someone an admin ────────────────────────────────────────────
-- Run manually, replacing the email:
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
