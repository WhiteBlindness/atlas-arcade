// Token regeneration model (energy/stamina system), shared by the guest
// (localStorage) and signed-in (Supabase) paths so both behave identically.
//
// Rules (decided with the user):
//   • Balance ceiling: 5 tokens at any moment — you can never hold more than 5.
//   • Regen: +1 token every 2 hours, but only while below the ceiling.
//   • Daily throughput cap: at most 10 tokens may be *granted* per UTC day
//     (the 5 morning refill + up to 5 regenerated). Once 10 are granted, regen
//     stops until the next UTC day even if the balance is below 5.
//   • Reset: UTC midnight (matches the daily challenge clock).

import { todayUTC } from "./daily";

export const TOKEN_CEILING = 5;        // max balance held at once
export const TOKEN_DAILY_GRANT_CAP = 10; // max tokens granted per UTC day
export const REGEN_MS = 2 * 60 * 60 * 1000; // one token every 2h

export interface TokenState {
  coins: number;        // current balance, 0..TOKEN_CEILING
  grantedToday: number; // total granted this UTC day, TOKEN_CEILING..TOKEN_DAILY_GRANT_CAP
  accrualAt: number;    // epoch ms — anchor the next regen tick counts from
  day: string;          // UTC day "YYYY-MM-DD" the above belong to
}

/** Fresh state for a new UTC day: refilled to the ceiling, grant budget reset. */
export function freshDay(nowMs: number): TokenState {
  return { coins: TOKEN_CEILING, grantedToday: TOKEN_CEILING, accrualAt: nowMs, day: todayUTC() };
}

/** True when regen is active (below ceiling AND daily budget remains). */
export function isRegening(s: TokenState): boolean {
  return s.coins < TOKEN_CEILING && s.grantedToday < TOKEN_DAILY_GRANT_CAP;
}

/**
 * Advance a token state to `nowMs`, granting any tokens earned since `accrualAt`.
 * Pure — returns a new state; callers persist it when it differs.
 */
export function accrue(s: TokenState, nowMs: number): TokenState {
  // New UTC day → refill and reset the daily budget.
  if (s.day !== todayUTC()) return freshDay(nowMs);

  // Timer idles at the ceiling or once the daily budget is spent — nothing to
  // grant. (spend() re-anchors the countdown when leaving a full balance.)
  if (!isRegening(s)) return s;

  const ticks = Math.floor((nowMs - s.accrualAt) / REGEN_MS);
  if (ticks <= 0) return s;

  const grant = Math.min(ticks, TOKEN_CEILING - s.coins, TOKEN_DAILY_GRANT_CAP - s.grantedToday);
  if (grant <= 0) return s;

  const coins = s.coins + grant;
  const grantedToday = s.grantedToday + grant;
  const next: TokenState = { coins, grantedToday, day: s.day, accrualAt: s.accrualAt + grant * REGEN_MS };
  // If that filled the ceiling / exhausted the budget, re-anchor to now.
  return isRegening(next) ? next : { ...next, accrualAt: nowMs };
}

/** Spend `n` tokens. Starts the regen countdown from now if we were at the ceiling. */
export function spend(s: TokenState, n: number, nowMs: number): TokenState | null {
  if (s.coins < n) return null;
  const wasFull = s.coins >= TOKEN_CEILING;
  return {
    ...s,
    coins: s.coins - n,
    // begin the 2h countdown at spend-time when leaving a full balance
    accrualAt: wasFull ? nowMs : s.accrualAt,
  };
}

/** Milliseconds until the next regenerated token, or null when regen is idle. */
export function msToNextToken(s: TokenState, nowMs: number): number | null {
  if (!isRegening(s)) return null;
  return Math.max(0, s.accrualAt + REGEN_MS - nowMs);
}
