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
  | "urban-legends"
  | "atlas-jackpot";

export type GameMode = "daily" | "arcade";

interface GameStore {
  activeGame: GameSlug | null;
  mode: GameMode | null;
  /** bumps on every start so replays remount the game component */
  runId: number;
  /** game awaiting Daily/Arcade choice in the pre-game modal */
  pendingGame: GameSlug | null;
  sessionScore: number;
  highScores: Partial<Record<GameSlug, number>>;
  openModeSelect: (slug: GameSlug) => void;
  closeModeSelect: () => void;
  startGame: (slug: GameSlug, mode: GameMode) => void;
  exitGame: () => void;
  addScore: (points: number) => void;
  loadHighScores: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set) => ({
  activeGame: null,
  mode: null,
  runId: 0,
  pendingGame: null,
  sessionScore: 0,
  highScores: {},

  openModeSelect: (slug) => set({ pendingGame: slug }),
  closeModeSelect: () => set({ pendingGame: null }),
  startGame: (slug, mode) => set((s) => ({ activeGame: slug, mode, pendingGame: null, sessionScore: 0, runId: s.runId + 1 })),
  exitGame: () => set({ activeGame: null, mode: null, sessionScore: 0 }),
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
