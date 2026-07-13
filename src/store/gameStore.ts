"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

export type GameSlug =
  | "globle"
  | "capital-invaders"
  | "flag-rush"
  | "peaks-valleys"
  | "tectonic-snap"
  | "frontier-faceoff"
  | "one-strike"
  | "urban-legends";

interface GameStore {
  activeGame: GameSlug | null;
  sessionScore: number;
  highScores: Partial<Record<GameSlug, number>>;
  startGame: (slug: GameSlug) => void;
  exitGame: () => void;
  addScore: (points: number) => void;
  loadHighScores: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set) => ({
  activeGame: null,
  sessionScore: 0,
  highScores: {},

  startGame: (slug) => set({ activeGame: slug, sessionScore: 0 }),
  exitGame: () => set({ activeGame: null, sessionScore: 0 }),
  addScore: (points) => set((s) => ({ sessionScore: s.sessionScore + points })),

  loadHighScores: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("high_scores")
      .select("game_slug, score")
      .eq("user_id", user.id);
    if (!data) return;
    const map = Object.fromEntries(data.map((r) => [r.game_slug, r.score]));
    set({ highScores: map as Partial<Record<GameSlug, number>> });
  },
}));
