"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "en" | "pt" | "es";

interface SettingsStore {
  lang: Lang;
  sound: boolean;
  setLang: (lang: Lang) => void;
  toggleSound: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      lang: "en",
      sound: true,
      setLang: (lang) => set({ lang }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
    }),
    { name: "atlas-arcade-settings" }
  )
);
