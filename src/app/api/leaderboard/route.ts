import { NextResponse, type NextRequest } from "next/server";
import { getLeaderboard } from "@/lib/supabase/leaderboard";

// Known game slugs — validated before any DB work so junk never reaches Supabase.
const GAME_SLUGS = new Set([
  "globle", "capital-invaders", "flag-rush", "peaks-valleys",
  "tectonic-snap", "frontier-faceoff", "one-strike", "urban-legends",
  "skyline-silhouette", "border-blitz", "atlas-jackpot",
]);

// NOTE (rate limiting): this handler is the single choke point for leaderboard
// reads. To add global rate limiting later, gate it in middleware.ts (or wrap the
// body) BEFORE getLeaderboard — the input validation below already rejects the
// cheap/abusive cases without touching the database.
export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get("game")?.trim();
  if (!game || !GAME_SLUGS.has(game)) {
    return NextResponse.json({ error: "invalid or missing 'game'" }, { status: 400 });
  }

  const rawLimit = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 20;

  try {
    const leaderboard = await getLeaderboard(game, limit);
    // s-maxage=60 lets the Vercel Edge/CDN also serve this for 60s (double shield
    // over the Data Cache); SWR keeps it warm while it revalidates.
    return NextResponse.json(
      { game, leaderboard },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch {
    // RPC not yet applied, or DB down — fail closed, don't leak internals.
    return NextResponse.json({ error: "leaderboard unavailable" }, { status: 500 });
  }
}
