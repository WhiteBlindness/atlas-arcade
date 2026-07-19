"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import { fetchUserState, persistTokenRow, addPremium, spendPremium } from "@/lib/supabase/coins";
import { useGameStore } from "@/store/gameStore";
import {
  accrue, spend as spendTokensState, msToNextToken, freshDay,
  TOKEN_CEILING, type TokenState,
} from "@/lib/tokens";
import { msUntilNextUtcMidnight } from "@/lib/daily";

// Guests keep a token state in localStorage (same regen rules, UTC reset).
const GUEST_KEY = "atlas-arcade-guest-tokens";

function readGuestState(): TokenState {
  if (typeof window === "undefined") return freshDay(Date.now());
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw) {
      const s = JSON.parse(raw) as TokenState;
      if (typeof s.coins === "number" && typeof s.accrualAt === "number") return accrue(s, Date.now());
    }
  } catch { /* corrupted → reset */ }
  const fresh = freshDay(Date.now());
  writeGuestState(fresh);
  return fresh;
}

function writeGuestState(s: TokenState) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(s));
  } catch { /* storage unavailable — session-only balance */ }
}

interface CoinStore {
  /** Current daily token balance (0..5), or null before load. */
  coins: number | null;
  /** Full token state (for the regen countdown). */
  tokens: TokenState | null;
  /** Permanent earned balance. null = guest (premium is accounts-only). */
  premiumTokens: number | null;
  /** true = balance lives in localStorage, not Supabase */
  guest: boolean;
  loading: boolean;
  outOfCoinsOpen: boolean;
  load: () => Promise<void>;
  /** Regen tick — accrue elapsed tokens; called on an interval. */
  tick: () => void;
  /** Milliseconds until the next regenerated token, or null when idle. */
  msToNext: () => number | null;
  /** Try to spend 1 token. Returns true if the game may start. */
  spend: () => Promise<boolean>;
  /** Spend `cost` tokens for the Atlas Jackpot (daily first, then premium).
   *  Signed-in accounts only. Returns true if the boss stage may start. */
  spendTokens: (cost: number) => Promise<boolean>;
  /** Award n premium tokens (Atlas Jackpot milestone payout). */
  earnPremium: (n: number) => Promise<void>;
  /** "Watch ad" placeholder: +1 token (up to the ceiling). */
  earnOne: () => Promise<void>;
  /** Give back a spent token when a paid run fails to load. */
  refund: () => Promise<void>;
  openOutOfCoins: () => void;
  closeOutOfCoins: () => void;
  reset: () => void;
}

let midnightTimer: ReturnType<typeof setTimeout> | null = null;
let regenTimer: ReturnType<typeof setInterval> | null = null;

/** Persist a new token state to the right backend and reflect it in the store. */
function commit(set: (p: Partial<CoinStore>) => void, guest: boolean, next: TokenState) {
  set({ tokens: next, coins: next.coins });
  if (guest) writeGuestState(next);
  else persistTokenRow(next);
}

export const useCoinStore = create<CoinStore>((set, get) => ({
  coins: null,
  tokens: null,
  premiumTokens: null,
  guest: true,
  loading: false,
  outOfCoinsOpen: false,

  load: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    const now = Date.now();

    if (user) {
      // Single RPC: token row + premium + high scores (was 3 separate reads).
      const state = await fetchUserState();
      if (!state) {
        // RPC unavailable — do NOT fabricate a balance, or a later spend would
        // overwrite the real DB row. Leave it unknown (null) so spends no-op.
        set({ tokens: null, coins: null, premiumTokens: null, guest: false, loading: false });
      } else {
        const tokens = accrue(state.tokens, now);
        set({ tokens, coins: tokens.coins, premiumTokens: state.premiumTokens, guest: false, loading: false });
        if (tokens.coins !== state.tokens.coins || tokens.day !== state.tokens.day) persistTokenRow(tokens);
        useGameStore.getState().setHighScores(state.highScores);
      }
    } else {
      const tokens = readGuestState();
      set({ tokens, coins: tokens.coins, premiumTokens: null, guest: true, loading: false });
    }

    // refill automatically when UTC midnight passes mid-session
    if (midnightTimer) clearTimeout(midnightTimer);
    midnightTimer = setTimeout(() => get().load(), msUntilNextUtcMidnight() + 1000);

    // regen accrual tick (grants tokens 1/2h while below the ceiling)
    if (regenTimer) clearInterval(regenTimer);
    regenTimer = setInterval(() => get().tick(), 60_000);
  },

  tick: () => {
    const { tokens, guest } = get();
    if (!tokens) return;
    const next = accrue(tokens, Date.now());
    if (next === tokens) return; // no token granted, no day change
    commit(set, guest, next);
  },

  msToNext: () => {
    const { tokens } = get();
    return tokens ? msToNextToken(tokens, Date.now()) : null;
  },

  spend: async () => {
    const { tokens, guest } = get();
    if (!tokens) return false;
    const next = spendTokensState(tokens, 1, Date.now());
    if (!next) { set({ outOfCoinsOpen: true }); return false; }
    commit(set, guest, next);
    return true;
  },

  // Atlas Jackpot entry: spend `cost` tokens, daily first then premium. Accounts only.
  spendTokens: async (cost) => {
    const { tokens, premiumTokens, guest } = get();
    if (guest || !tokens) return false; // sign-in required for the boss stage
    const prem = premiumTokens ?? 0;
    if (tokens.coins + prem < cost) {
      set({ outOfCoinsOpen: true });
      return false;
    }
    const fromDaily = Math.min(tokens.coins, cost);
    const fromPrem = cost - fromDaily;

    if (fromDaily > 0) {
      const next = spendTokensState(tokens, fromDaily, Date.now());
      if (next) commit(set, false, next);
    }
    if (fromPrem > 0) {
      set({ premiumTokens: prem - fromPrem }); // optimistic
      const p = await spendPremium(prem, fromPrem);
      if (p !== null) set({ premiumTokens: p });
    }
    return true;
  },

  earnPremium: async (n) => {
    if (n <= 0) return;
    const { premiumTokens, guest } = get();
    if (guest || premiumTokens === null) return;
    set({ premiumTokens: premiumTokens + n }); // optimistic
    const p = await addPremium(premiumTokens, n);
    if (p !== null) set({ premiumTokens: p });
  },

  // Bonus token (watch-ad / refund). Tops up toward the ceiling without touching
  // the daily grant budget, so it never blocks or is blocked by regen.
  earnOne: async () => {
    const { tokens, guest } = get();
    if (!tokens || tokens.coins >= TOKEN_CEILING) return;
    commit(set, guest, { ...tokens, coins: tokens.coins + 1 });
  },

  refund: async () => {
    await get().earnOne();
  },

  openOutOfCoins: () => set({ outOfCoinsOpen: true }),
  closeOutOfCoins: () => set({ outOfCoinsOpen: false }),
  reset: () => {
    if (midnightTimer) clearTimeout(midnightTimer);
    if (regenTimer) clearInterval(regenTimer);
    midnightTimer = null;
    regenTimer = null;
    set({ coins: null, tokens: null, premiumTokens: null, guest: true, outOfCoinsOpen: false });
  },
}));
