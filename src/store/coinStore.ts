"use client";

import { create } from "zustand";
import { fetchCoins, spendCoin, addCoin, DAILY_COINS } from "@/lib/supabase/coins";
import { msUntilNextUtcMidnight } from "@/lib/daily";

interface CoinStore {
  /** null = signed out / not yet loaded */
  coins: number | null;
  loading: boolean;
  outOfCoinsOpen: boolean;
  load: () => Promise<void>;
  /** Try to spend 1 coin. Returns true if the game may start. */
  spend: () => Promise<boolean>;
  /** "Watch ad" placeholder: +1 coin. */
  earnOne: () => Promise<void>;
  openOutOfCoins: () => void;
  closeOutOfCoins: () => void;
  reset: () => void;
}

let midnightTimer: ReturnType<typeof setTimeout> | null = null;

export const useCoinStore = create<CoinStore>((set, get) => ({
  coins: null,
  loading: false,
  outOfCoinsOpen: false,

  load: async () => {
    set({ loading: true });
    const coins = await fetchCoins();
    set({ coins, loading: false });

    // refill automatically when UTC midnight passes mid-session
    if (midnightTimer) clearTimeout(midnightTimer);
    midnightTimer = setTimeout(() => {
      set({ coins: get().coins === null ? null : DAILY_COINS });
      get().load();
    }, msUntilNextUtcMidnight() + 1000);
  },

  spend: async () => {
    const { coins } = get();
    if (coins === null) return false;
    if (coins <= 0) {
      set({ outOfCoinsOpen: true });
      return false;
    }
    set({ coins: coins - 1 }); // optimistic
    const confirmed = await spendCoin(coins);
    if (confirmed !== null) set({ coins: confirmed });
    return true;
  },

  earnOne: async () => {
    const { coins } = get();
    if (coins === null) return;
    const next = await addCoin(coins);
    if (next !== null) set({ coins: next, outOfCoinsOpen: next <= 0 });
  },

  openOutOfCoins: () => set({ outOfCoinsOpen: true }),
  closeOutOfCoins: () => set({ outOfCoinsOpen: false }),
  reset: () => {
    if (midnightTimer) clearTimeout(midnightTimer);
    midnightTimer = null;
    set({ coins: null, outOfCoinsOpen: false });
  },
}));
