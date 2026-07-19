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

export interface UserState {
  tokens: TokenState;        // raw stored token row (pre-accrual)
  premiumTokens: number;
  highScores: Record<string, number>; // game_slug → score
}

/**
 * ONE round-trip for the whole signed-in bootstrap: token row + premium balance
 * + every high score, via the get_user_state RPC. Replaces the three separate
 * reads (token row, premium, high scores) — the real free-tier saver.
 */
export async function fetchUserState(): Promise<UserState | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_user_state");
  if (error || !data) return null;

  const d = data as {
    coins: number | null; granted_today: number | null; accrual_at: string | null;
    last_reset: string | null; premium_tokens: number | null;
    high_scores: { game_slug: string; score: number }[] | null;
  };

  const tokens: TokenState = d.coins != null
    ? {
        coins: d.coins,
        grantedToday: d.granted_today ?? DAILY_COINS,
        accrualAt: d.accrual_at ? Date.parse(d.accrual_at) : Date.now(),
        day: d.last_reset ?? todayUTC(),
      }
    : freshDay(Date.now());

  const highScores: Record<string, number> = {};
  for (const r of d.high_scores ?? []) highScores[r.game_slug] = r.score;

  return { tokens, premiumTokens: d.premium_tokens ?? 0, highScores };
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
