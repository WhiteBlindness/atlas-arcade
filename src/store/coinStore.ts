"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import { fetchCoins, spendCoin, addCoin, DAILY_COINS } from "@/lib/supabase/coins";
import { msUntilNextUtcMidnight, todayUTC } from "@/lib/daily";

// Guests get a local 5-coin allowance too (localStorage), reset at UTC midnight.
const GUEST_KEY = "atlas-arcade-guest-coins";

function readGuestCoins(): number {
  if (typeof window === "undefined") return DAILY_COINS;
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw) {
      const { coins, day } = JSON.parse(raw);
      if (day === todayUTC() && typeof coins === "number") return coins;
    }
  } catch { /* corrupted → reset */ }
  writeGuestCoins(DAILY_COINS);
  return DAILY_COINS;
}

function writeGuestCoins(coins: number) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify({ coins, day: todayUTC() }));
  } catch { /* storage unavailable — session-only balance */ }
}

interface CoinStore {
  coins: number | null;
  /** true = balance lives in localStorage, not Supabase */
  guest: boolean;
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
  guest: true,
  loading: false,
  outOfCoinsOpen: false,

  load: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const coins = await fetchCoins();
      set({ coins, guest: false, loading: false });
    } else {
      set({ coins: readGuestCoins(), guest: true, loading: false });
    }

    // refill automatically when UTC midnight passes mid-session
    if (midnightTimer) clearTimeout(midnightTimer);
    midnightTimer = setTimeout(() => get().load(), msUntilNextUtcMidnight() + 1000);
  },

  spend: async () => {
    const { coins, guest } = get();
    if (coins === null) return false;
    if (coins <= 0) {
      set({ outOfCoinsOpen: true });
      return false;
    }
    set({ coins: coins - 1 }); // optimistic
    if (guest) writeGuestCoins(coins - 1);
    else {
      const confirmed = await spendCoin(coins);
      if (confirmed !== null) set({ coins: confirmed });
    }
    return true;
  },

  earnOne: async () => {
    const { coins, guest } = get();
    if (coins === null) return;
    if (guest) {
      const next = Math.min(99, coins + 1);
      writeGuestCoins(next);
      set({ coins: next });
    } else {
      const next = await addCoin(coins);
      if (next !== null) set({ coins: next });
    }
  },

  openOutOfCoins: () => set({ outOfCoinsOpen: true }),
  closeOutOfCoins: () => set({ outOfCoinsOpen: false }),
  reset: () => {
    if (midnightTimer) clearTimeout(midnightTimer);
    midnightTimer = null;
    set({ coins: null, guest: true, outOfCoinsOpen: false });
  },
}));
