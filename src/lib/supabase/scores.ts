import { supabase } from "./client";

export async function saveHighScore(gameSlug: string, score: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (!Number.isSafeInteger(score) || score < 0 || !/^[a-z0-9-]{1,40}$/.test(gameSlug)) return;

  // The RPC supplies the authenticated identity and applies the server-side
  // slug and score ceiling. Browser-reported scores remain client-claimed.
  await supabase.rpc("arcade_submit_high_score", {
    p_game_slug: gameSlug,
    p_score: score,
  });
}
