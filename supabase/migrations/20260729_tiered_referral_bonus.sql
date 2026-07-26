-- Atlas Arcade — tiered referral bonus
--
-- redeem_referral() granted a flat 100 premium tokens regardless of who sent
-- the invite. New rule: the bonus depends on the REFERRER's tier —
--   referrer is_admin = true  -> 100 premium tokens
--   referrer is_admin = false -> 20 premium tokens
--
-- p_bonus stays in the signature (the RPC is called from the client as
-- redeem_referral({ p_code }), never passing p_bonus, and dropping the
-- parameter would break the existing `grant execute ... (text, int)` overload).
-- It is now computed server-side from the referrer's row and the caller-
-- supplied default is ignored — a client-controlled bonus amount would be a
-- straightforward exploit otherwise.
--
-- Run this in the Supabase SQL editor, after 20260728_fix_username_constraint.sql.

create or replace function public.redeem_referral(p_code text, p_bonus int default 100)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
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
  -- caller passed for p_bonus — this must never be client-controlled.
  p_bonus := case when v_referrer_admin then 100 else 20 end;

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

-- ── Verify ──────────────────────────────────────────────────────────────────
--   select p.referral_code, p.is_admin, count(r.id) as redemptions
--   from public.profiles p left join public.profiles r on r.referred_by = p.id
--   group by p.referral_code, p.is_admin;
