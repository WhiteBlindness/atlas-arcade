import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Server-only global leaderboard reads. Uses a no-cookie anon client (never the
// service-role key) — the get_leaderboard RPC is SECURITY DEFINER, so anon
// receives global data (username + score only, no emails). The cookie-based
// server client is per-user and would poison the shared cache, so it's avoided.
//
// Singleton: one anon client for the whole server module instead of a fresh
// client per request. It holds no per-user session (persistSession: false), so
// it's safe to share across all invocations.
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export interface LeaderboardRow {
  username: string;
  score: number;
}

/**
 * Cached leaderboard fetch, hoisted to module scope so the wrapper keeps a
 * stable cache identity across the build (the idiomatic Next.js App Router
 * pattern) instead of being re-created on every request. The gameSlug/limit
 * arguments are part of the cache key, so each game+limit is cached separately.
 * Bust early with revalidateTag("leaderboard") after a score write if desired.
 */
const getCachedLeaderboard = unstable_cache(
  async (gameSlug: string, limit: number): Promise<LeaderboardRow[]> => {
    const { data, error } = await anonClient.rpc("get_leaderboard", {
      p_game_slug: gameSlug,
      p_limit: limit,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as LeaderboardRow[];
  },
  ["leaderboard"],
  { revalidate: 60, tags: ["leaderboard"] },
);

/**
 * Top scores for a game, cached in the Vercel Data Cache for 60s per game.
 * This collapses any number of concurrent requests into a maximum of ONE
 * Supabase hit per minute per game — the free-tier shield.
 */
export function getLeaderboard(gameSlug: string, limit = 20): Promise<LeaderboardRow[]> {
  return getCachedLeaderboard(gameSlug, limit);
}
