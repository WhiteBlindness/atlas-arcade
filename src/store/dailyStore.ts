"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameSlug } from "./gameStore";
import { todayUTC } from "@/lib/daily";

export interface DailyResult {
  day: string;          // UTC date the daily was completed
  score: number;
  performance: number;  // normalized 0..1 (drives the percentile)
  squares?: string;     // emoji progression for the share text
}

function yesterdayUTC(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

interface DailyStore {
  results: Partial<Record<GameSlug, DailyResult>>;
  streak: number;
  /** last UTC day that counted toward the streak */
  lastStreakDay: string | null;
  /** Record a finished daily. No-op if that game's daily was already done today. */
  markCompleted: (slug: GameSlug, result: Omit<DailyResult, "day">) => void;
  /** Today's result for a game, or null (stale days don't count). */
  getResult: (slug: GameSlug) => DailyResult | null;
}

export const useDailyStore = create<DailyStore>()(
  persist(
    (set, get) => ({
      results: {},
      streak: 0,
      lastStreakDay: null,

      markCompleted: (slug, result) => {
        const today = todayUTC();
        const { results, streak, lastStreakDay } = get();
        if (results[slug]?.day === today) return; // first result of the day is THE result

        const nextStreak =
          lastStreakDay === today ? streak
          : lastStreakDay === yesterdayUTC() ? streak + 1
          : 1;

        set({
          results: { ...results, [slug]: { ...result, day: today } },
          streak: nextStreak,
          lastStreakDay: today,
        });
      },

      getResult: (slug) => {
        const r = get().results[slug];
        return r && r.day === todayUTC() ? r : null;
      },
    }),
    { name: "atlas-arcade-daily" }
  )
);
