import { supabase } from "./client";

export async function saveHighScore(gameSlug: string, score: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("high_scores").upsert(
    {
      user_id: user.id,
      game_slug: gameSlug,
      score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,game_slug", ignoreDuplicates: false }
  );
}
