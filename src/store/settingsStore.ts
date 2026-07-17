"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "en" | "pt" | "es";
export type Theme = "dark" | "light";

interface SettingsStore {
  lang: Lang;
  sound: boolean;
  theme: Theme;
  setLang: (lang: Lang) => void;
  toggleSound: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/** Reflect the theme on <html> — client only. Manages both classes so the
 *  `.light` overrides and any `.dark` variant utilities stay in sync. */
function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.toggle("light", theme === "light");
  el.classList.toggle("dark", theme === "dark");
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      lang: "en",
      sound: true,
      theme: "dark",
      setLang: (lang) => set({ lang }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setTheme: (theme) => { applyTheme(theme); set({ theme }); },
      toggleTheme: () => set((s) => { const theme: Theme = s.theme === "dark" ? "light" : "dark"; applyTheme(theme); return { theme }; }),
    }),
    {
      name: "atlas-arcade-settings",
      // re-apply the persisted theme to <html> once state rehydrates on the client
      onRehydrateStorage: () => (state) => { if (state) applyTheme(state.theme); },
    }
  )
);
