import type { TokenState } from "../tokens";
import { isAuthSessionMissingError } from "@supabase/supabase-js";

export type AuthLookupState = "account" | "guest" | "unavailable";

/** Distinguish a normal signed-out session from an auth/network failure. */
export function classifyAuthLookup(user: unknown, error: unknown): AuthLookupState {
  if (error && !isAuthSessionMissingError(error)) return "unavailable";
  if (error && user) return "unavailable";
  if (user) return "account";
  return "guest";
}

export interface TokenSpendResult {
  ok: boolean;
  isAdmin: boolean;
  tokens: TokenState;
  premiumTokens: number;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

/** Parse untrusted JSON from an authenticated token RPC into bounded UI state. */
export function parseTokenState(value: unknown): TokenState | null {
  const data = record(value);
  if (!data) return null;

  const coins = data.coins;
  const grantedToday = data.granted_today;
  const accrualAt = typeof data.accrual_at === "string" ? Date.parse(data.accrual_at) : NaN;
  const day = data.last_reset;
  if (
    !Number.isInteger(coins) || (coins as number) < 0 || (coins as number) > 5 ||
    !Number.isInteger(grantedToday) || (grantedToday as number) < 5 || (grantedToday as number) > 10 ||
    !Number.isFinite(accrualAt) || !isCalendarDate(day)
  ) {
    return null;
  }

  return { coins: coins as number, grantedToday: grantedToday as number, accrualAt, day };
}

/** Parse the authoritative result of an atomic spend RPC. */
export function parseTokenSpendResult(value: unknown): TokenSpendResult | null {
  const data = record(value);
  const tokens = parseTokenState(value);
  const premiumTokens = data?.premium_tokens;
  if (
    !data || !tokens || typeof data.ok !== "boolean" || typeof data.is_admin !== "boolean" ||
    !Number.isSafeInteger(premiumTokens) || (premiumTokens as number) < 0
  ) {
    return null;
  }

  return {
    ok: data.ok,
    isAdmin: data.is_admin,
    tokens,
    premiumTokens: premiumTokens as number,
  };
}
