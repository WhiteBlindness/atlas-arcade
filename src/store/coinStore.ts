"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import { fetchUserState, refreshUserTokens, consumeUserTokens } from "@/lib/supabase/coins";
import { fetchProfile } from "@/lib/supabase/profile";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/lib/i18n";
import { useSettingsStore } from "@/store/settingsStore";
import { toast } from "@/store/toastStore";
import {
  accrue,
  spend as spendTokensState,
  refundGuestToken,
  msToNextToken,
  freshDay,
  type TokenState,
} from "@/lib/tokens";
import { msUntilNextUtcMidnight } from "@/lib/daily";
import { classifyAuthLookup } from "@/lib/security/coin-state";

// Guest tokens are intentionally local and do not provide account value.
const GUEST_KEY = "atlas-arcade-guest-tokens";

function readGuestState(): TokenState {
  if (typeof window === "undefined") return freshDay(Date.now());
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw) {
      const state = JSON.parse(raw) as TokenState;
      if (typeof state.coins === "number" && typeof state.accrualAt === "number") {
        return accrue(state, Date.now());
      }
    }
  } catch { /* corrupted or unavailable storage falls back to a fresh guest balance */ }
  const fresh = freshDay(Date.now());
  writeGuestState(fresh);
  return fresh;
}

function writeGuestState(state: TokenState) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(state));
  } catch { /* storage unavailable; the balance lasts for this session */ }
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
  /** Admin/dev account: plays are free and the counter shows ∞. */
  isAdmin: boolean;
  loading: boolean;
  /** An account token spend is in flight; callers use this to prevent duplicate starts. */
  spending: boolean;
  outOfCoinsOpen: boolean;
  load: () => Promise<void>;
  /** Regen tick: accrue elapsed tokens; called on an interval. */
  tick: () => void;
  /** Milliseconds until the next regenerated token, or null when idle. */
  msToNext: () => number | null;
  /** Try to spend 1 token. Returns true if the game may start. */
  spend: () => Promise<boolean>;
  /** Spend `cost` tokens for the Atlas Jackpot (daily first, then premium). */
  spendTokens: (cost: number) => Promise<boolean>;
  /** Client-computed game results cannot authorize premium token grants. */
  earnPremium: (n: number) => Promise<void>;
  /** Give back a spent token when a guest run fails to load. */
  refund: () => Promise<boolean>;
  openOutOfCoins: () => void;
  closeOutOfCoins: () => void;
  reset: () => void;
}

let midnightTimer: ReturnType<typeof setTimeout> | null = null;
let regenTimer: ReturnType<typeof setInterval> | null = null;
let activeSpend: symbol | null = null;
let activeLoad: symbol | null = null;

function setTokenState(set: (patch: Partial<CoinStore>) => void, tokens: TokenState, premiumTokens?: number) {
  set({
    tokens,
    coins: tokens.coins,
    ...(premiumTokens === undefined ? {} : { premiumTokens }),
  });
}

function beginSpend(
  get: () => CoinStore,
  set: (patch: Partial<CoinStore>) => void,
): symbol | null {
  if (get().spending || activeSpend) return null;

  const attempt = Symbol("coin-spend");
  activeSpend = attempt;
  set({ spending: true });
  return attempt;
}

function finishSpend(attempt: symbol, set: (patch: Partial<CoinStore>) => void) {
  if (activeSpend !== attempt) return;
  activeSpend = null;
  set({ spending: false });
}

function markAccountBalanceUnavailable(set: (patch: Partial<CoinStore>) => void) {
  set({ tokens: null, coins: null, premiumTokens: null, isAdmin: false, outOfCoinsOpen: false });
  toast.error(t(useSettingsStore.getState().lang, "errBalanceUnavailable"));
}

export const useCoinStore = create<CoinStore>((set, get) => ({
  coins: null,
  tokens: null,
  premiumTokens: null,
  guest: true,
  isAdmin: false,
  loading: false,
  spending: false,
  outOfCoinsOpen: false,

  load: async () => {
    const request = Symbol("coin-load");
    activeLoad = request;
    set({ loading: true });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (activeLoad !== request) return;
    const authState = classifyAuthLookup(user, authError);

    if (authState === "unavailable") {
      set({ tokens: null, coins: null, premiumTokens: null, guest: false, isAdmin: false, loading: false });
    } else if (authState === "account") {
      // Let the database clock apply reset and regeneration before reading the
      // consolidated balance and score state.
      const tokens = await refreshUserTokens();
      if (activeLoad !== request) return;
      const [state, profile] = await Promise.all([fetchUserState(), fetchProfile()]);
      if (activeLoad !== request) return;
      set({ isAdmin: !!profile?.isAdmin });

      if (!tokens || !state) {
        // An unavailable RPC must never be replaced with a fabricated balance.
        set({ tokens: null, coins: null, premiumTokens: null, guest: false, loading: false });
      } else {
        setTokenState(set, tokens, state.premiumTokens);
        set({ guest: false, loading: false });
        useGameStore.getState().setHighScores(state.highScores);
      }
    } else {
      const tokens = readGuestState();
      set({ tokens, coins: tokens.coins, premiumTokens: null, guest: true, isAdmin: false, loading: false });
    }

    if (activeLoad !== request) return;
    if (midnightTimer) clearTimeout(midnightTimer);
    midnightTimer = setTimeout(() => get().load(), msUntilNextUtcMidnight() + 1000);

    if (regenTimer) clearInterval(regenTimer);
    regenTimer = setInterval(() => get().tick(), 60_000);
  },

  tick: () => {
    const { tokens, guest } = get();
    if (!tokens) return;
    const next = accrue(tokens, Date.now());
    if (next === tokens) return;

    // The authenticated value is only a display estimate. The database
    // computes accrual again during the next spend and remains authoritative.
    setTokenState(set, next);
    if (guest) writeGuestState(next);
  },

  msToNext: () => {
    const { tokens } = get();
    return tokens ? msToNextToken(tokens, Date.now()) : null;
  },

  spend: async () => {
    const attempt = beginSpend(get, set);
    if (!attempt) return false;

    try {
      if (activeSpend !== attempt) return false;
      const { tokens, guest } = get();
      if (guest) {
        if (!tokens) return false;
        const next = spendTokensState(tokens, 1, Date.now());
        if (!next) {
          set({ outOfCoinsOpen: true });
          return false;
        }
        setTokenState(set, next);
        if (activeSpend !== attempt) return false;
        writeGuestState(next);
        return true;
      }

      let result;
      try {
        result = await consumeUserTokens(1);
      } catch {
        if (activeSpend !== attempt) return false;
        markAccountBalanceUnavailable(set);
        return false;
      }
      if (activeSpend !== attempt) return false;
      if (!result) {
        markAccountBalanceUnavailable(set);
        return false;
      }
      set({
        tokens: result.tokens,
        coins: result.tokens.coins,
        premiumTokens: result.premiumTokens,
        isAdmin: result.isAdmin,
        ...(!result.ok ? { outOfCoinsOpen: true } : {}),
      });
      return result.ok;
    } finally {
      finishSpend(attempt, set);
    }
  },

  spendTokens: async (cost) => {
    if (!Number.isInteger(cost) || cost < 1 || cost > 5 || get().guest) return false;

    const attempt = beginSpend(get, set);
    if (!attempt) return false;

    try {
      if (activeSpend !== attempt) return false;
      let result;
      try {
        result = await consumeUserTokens(cost);
      } catch {
        if (activeSpend !== attempt) return false;
        markAccountBalanceUnavailable(set);
        return false;
      }
      if (activeSpend !== attempt) return false;
      if (!result) {
        markAccountBalanceUnavailable(set);
        return false;
      }
      set({
        tokens: result.tokens,
        coins: result.tokens.coins,
        premiumTokens: result.premiumTokens,
        isAdmin: result.isAdmin,
        ...(!result.ok ? { outOfCoinsOpen: true } : {}),
      });
      return result.ok;
    } finally {
      finishSpend(attempt, set);
    }
  },

  // Jackpot outcomes are computed in the browser, so they cannot safely mint
  // persistent premium balance. Keep the API while a verified attempt flow is absent.
  earnPremium: async () => {},

  refund: async () => {
    const { tokens, guest } = get();
    const next = refundGuestToken(tokens, guest);
    if (!next) return false;
    setTokenState(set, next);
    writeGuestState(next);
    return true;
  },

  openOutOfCoins: () => set({ outOfCoinsOpen: true }),
  closeOutOfCoins: () => set({ outOfCoinsOpen: false }),
  reset: () => {
    activeSpend = null;
    activeLoad = null;
    if (midnightTimer) clearTimeout(midnightTimer);
    if (regenTimer) clearInterval(regenTimer);
    midnightTimer = null;
    regenTimer = null;
    set({
      coins: null,
      tokens: null,
      premiumTokens: null,
      guest: true,
      isAdmin: false,
      loading: false,
      spending: false,
      outOfCoinsOpen: false,
    });
  },
}));
