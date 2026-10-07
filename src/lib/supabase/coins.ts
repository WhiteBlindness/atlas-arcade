import { supabase } from "./client";
import type { TokenState } from "@/lib/tokens";
import { parseTokenSpendResult, parseTokenState } from "@/lib/security/coin-state";
import type { TokenSpendResult } from "@/lib/security/coin-state";

export type { TokenSpendResult } from "@/lib/security/coin-state";

/** Atlas Jackpot entry price, in tokens (daily first, then premium). */
export const ATLAS_JACKPOT_COST = 5;

export interface UserState {
  premiumTokens: number;
  highScores: Record<string, number>;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/** Read the authenticated account's premium balance and personal bests. */
export async function fetchUserState(): Promise<UserState | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_user_state");
  const state = record(data);
  if (error || !state) return null;

  const premiumTokens = state.premium_tokens;
  if (!Number.isInteger(premiumTokens) || (premiumTokens as number) < 0) return null;

  const highScores: Record<string, number> = {};
  if (Array.isArray(state.high_scores)) {
    for (const entry of state.high_scores) {
      const row = record(entry);
      if (typeof row?.game_slug === "string" && Number.isSafeInteger(row.score) && (row.score as number) >= 0) {
        highScores[row.game_slug] = row.score as number;
      }
    }
  }

  return { premiumTokens: premiumTokens as number, highScores };
}

/** Advance UTC refill and regeneration using database time. */
export async function refreshUserTokens(): Promise<TokenState | null> {
  const { data, error } = await supabase.rpc("arcade_refresh_user_tokens");
  if (error) return null;
  return parseTokenState(data);
}

/** Atomically spend daily tokens first, then premium tokens, on the server. */
export async function consumeUserTokens(amount: number): Promise<TokenSpendResult | null> {
  if (!Number.isInteger(amount) || amount < 1 || amount > 5) return null;
  const { data, error } = await supabase.rpc("arcade_consume_user_tokens", { p_amount: amount });
  if (error) return null;
  return parseTokenSpendResult(data);
}
