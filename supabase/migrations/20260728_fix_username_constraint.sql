-- Atlas Arcade — fix "null value in column 'username' of relation 'profiles'
-- violates not-null constraint" (500 on signup)
--
-- Root cause: public.profiles.username is NOT NULL and predates every migration
-- in this repo (20260726_admin_and_referrals.sql only ever added is_admin,
-- referral_code, referred_by — never username). The ORIGINAL handle_new_user
-- (before this project's admin/referral work touched it) must have populated
-- username; 20260726/20260727's `create or replace function
-- public.handle_new_user()` overwrote that logic without knowing it existed.
--
-- Run this in the Supabase SQL editor, after 20260727_repair_signup_trigger.sql.

create extension if not exists pgcrypto with schema extensions;

-- Defensive only: no-ops if the column already exists (it does, per the error
-- report). Guarantees this migration also works on an environment where
-- `profiles` doesn't have the column yet.
alter table public.profiles add column if not exists username text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
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
  -- so it lands in raw_user_meta_data. Google OAuth sends none — profiles.username
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
$$;

-- ── Backfill: anyone created while this was broken and has no profile row ───
do $$
declare
  r record;
  v_username text;
  v_attempt  int;
begin
  for r in select u.id, u.raw_user_meta_data from auth.users u
           where not exists (select 1 from public.profiles p where p.id = u.id)
  loop
    v_username := nullif(trim(r.raw_user_meta_data ->> 'username'), '');
    if v_username is null then
      v_username := 'player_' || substr(replace(r.id::text, '-', ''), 1, 8);
    end if;
    v_attempt := 0;
    loop
      v_attempt := v_attempt + 1;
      begin
        insert into public.profiles (id, is_admin, referral_code, username)
        values (r.id, false, encode(extensions.gen_random_bytes(4), 'hex'), v_username);
        exit;
      exception
        when unique_violation then
          exit when v_attempt >= 5;
          v_username := v_username || '_' || substr(encode(extensions.gen_random_bytes(2), 'hex'), 1, 4);
        when others then
          raise warning 'backfill: profiles insert failed for %: %', r.id, sqlerrm;
          exit;
      end;
    end loop;
  end loop;
end
$$;

-- Anyone who slipped through with a null username (shouldn't happen after the
-- backfill above, but covers a NOT NULL column added after rows already existed).
update public.profiles
set username = 'player_' || substr(replace(id::text, '-', ''), 1, 8)
where username is null;

-- ── Verify ──────────────────────────────────────────────────────────────────
--   select id, username, referral_code from public.profiles order by created_at desc limit 10;
--   select count(*) from public.profiles where username is null;  -- must be 0
