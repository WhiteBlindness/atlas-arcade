import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Server-only global leaderboard reads. Uses a no-cookie anon client (never the
// service-role key) — the get_leaderboard RPC is SECURITY DEFINER, so anon
// receives global data (username + score only, no emails). The cookie-based
// server client is per-user and would poison the shared cache, so it's avoided.
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export interface LeaderboardRow {
  username: string;
  score: number;
}

/**
 * Top scores for a game, cached in the Vercel Data Cache for 60s per game.
 * This collapses any number of concurrent requests into a maximum of ONE
 * Supabase hit per minute per game — the free-tier shield. Bust early with
 * revalidateTag(`leaderboard:${slug}`) after a score write if desired.
 */
export function getLeaderboard(gameSlug: string, limit = 20): Promise<LeaderboardRow[]> {
  const cached = unstable_cache(
    async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await anonClient().rpc("get_leaderboard", {
        p_game_slug: gameSlug,
        p_limit: limit,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as LeaderboardRow[];
    },
    ["leaderboard", gameSlug, String(limit)],
    { revalidate: 60, tags: [`leaderboard:${gameSlug}`] },
  );
  return cached();
}
