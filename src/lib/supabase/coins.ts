import { supabase } from "./client";
import { todayUTC } from "@/lib/daily";

export const DAILY_COINS = 5;

// Coins live in public.user_coins (one row per user, RLS: own row only).
// Reset: first fetch after UTC midnight refills to DAILY_COINS.

export async function fetchCoins(): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = todayUTC();
  const { data } = await supabase
    .from("user_coins")
    .select("coins, last_reset")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    const { data: inserted } = await supabase
      .from("user_coins")
      .insert({ user_id: user.id, coins: DAILY_COINS, last_reset: today })
      .select("coins")
      .single();
    return inserted?.coins ?? DAILY_COINS;
  }

  if (data.last_reset < today) {
    const { data: updated } = await supabase
      .from("user_coins")
      .update({ coins: DAILY_COINS, last_reset: today, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select("coins")
      .single();
    return updated?.coins ?? DAILY_COINS;
  }

  return data.coins;
}

async function setCoins(next: number): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_coins")
    .update({ coins: next, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("coins")
    .single();
  return data?.coins ?? null;
}

/** Spend one coin. Returns the new balance, or null if broke/logged out. */
export async function spendCoin(current: number): Promise<number | null> {
  if (current <= 0) return null;
  return setCoins(current - 1);
}

/** Placeholder for the "watch ad" reward. */
export async function addCoin(current: number): Promise<number | null> {
  return setCoins(Math.min(99, current + 1));
}
