"use client";

import { create } from "zustand";

export type GameSlug =
  | "globle"
  | "capital-invaders"
  | "flag-rush"
  | "peaks-valleys"
  | "tectonic-snap"
  | "frontier-faceoff"
  | "one-strike"
  | "urban-legends"
  | "skyline-silhouette"
  | "border-blitz"
  | "stat-attack"
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
  /** remount the current game (retry a failed chunk load) */
  retryGame: () => void;
  exitGame: () => void;
  addScore: (points: number) => void;
  /** Set all high scores at once (hydrated from the consolidated get_user_state RPC). */
  setHighScores: (scores: Record<string, number>) => void;
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
  retryGame: () => set((s) => ({ runId: s.runId + 1 })),
  exitGame: () => set({ activeGame: null, mode: null, sessionScore: 0 }),
  addScore: (points) => set((s) => ({ sessionScore: s.sessionScore + points })),

  setHighScores: (scores) => set({ highScores: scores as Partial<Record<GameSlug, number>> }),
}));
