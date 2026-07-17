import { supabase } from "./client";
import { todayUTC } from "@/lib/daily";
import { freshDay, type TokenState } from "@/lib/tokens";

export const DAILY_COINS = 5;
/** Atlas Jackpot entry price, in tokens (daily first, then premium). */
export const ATLAS_JACKPOT_COST = 5;

// Tokens live in public.user_coins (one row per user, RLS: own row only):
//   coins           int         — current balance (0..5)
//   granted_today   int         — tokens granted this UTC day (5..10)
//   accrual_at      timestamptz — anchor the next 2h regen tick counts from
//   last_reset      date        — UTC day the above belong to
//   premium_tokens  int         — permanent earned balance
// Regen/reset maths live in src/lib/tokens.ts; this module only reads/writes.

/** Read the raw stored token state (pre-accrual), or null when logged out. */
export async function fetchTokenRow(): Promise<TokenState | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_coins")
    .select("coins, granted_today, accrual_at, last_reset")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    const fresh = freshDay(Date.now());
    await supabase.from("user_coins").insert({
      user_id: user.id,
      coins: fresh.coins,
      granted_today: fresh.grantedToday,
      accrual_at: new Date(fresh.accrualAt).toISOString(),
      last_reset: fresh.day,
    });
    return fresh;
  }

  return {
    coins: data.coins ?? DAILY_COINS,
    grantedToday: data.granted_today ?? DAILY_COINS,
    accrualAt: data.accrual_at ? Date.parse(data.accrual_at) : Date.now(),
    day: data.last_reset ?? todayUTC(),
  };
}

/** Persist a token state for the signed-in user. */
export async function persistTokenRow(s: TokenState): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_coins")
    .update({
      coins: s.coins,
      granted_today: s.grantedToday,
      accrual_at: new Date(s.accrualAt).toISOString(),
      last_reset: s.day,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
}

// ── Premium tokens ──────────────────────────────────────────────────────────
// Permanent, earned balance in user_coins.premium_tokens. Never touched by the
// daily refill or regen. Signed-in accounts only (no guest premium).

export async function fetchPremium(): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_coins")
    .select("premium_tokens")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.premium_tokens ?? 0;
}

async function setPremium(next: number): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_coins")
    .update({ premium_tokens: next, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("premium_tokens")
    .single();
  return data?.premium_tokens ?? null;
}

/** Award n premium tokens. Returns the new balance. */
export async function addPremium(current: number, n: number): Promise<number | null> {
  return setPremium(current + n);
}

/** Spend n premium tokens. Returns the new balance, or null if short. */
export async function spendPremium(current: number, n: number): Promise<number | null> {
  if (current < n) return null;
  return setPremium(current - n);
}
