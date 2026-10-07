import type { GameSlug } from "@/store/gameStore";

export interface GameTheme {
  border: string;
  text: string;
  hover: string;
  shadow: string;
  /** Light-mode-only solid accent block (Game Boy cartridge-label style) — always paired with white text. */
  solidLight: string;
  actionColor: string;
}

/** Per-game neon identity color, shared by GameCard and ModeSelectModal. */
export const GAME_THEME: Record<GameSlug, GameTheme> = {
  "globle":             { border: "border-arcade-neon-cyan",    text: "text-arcade-neon-cyan neon-text-cyan",       hover: "hover:shadow-neon-cyan hover:border-arcade-neon-cyan focus-visible:shadow-neon-cyan focus-visible:border-arcade-neon-cyan",       shadow: "shadow-neon-cyan",    solidLight: "light:bg-arcade-neon-cyan", actionColor: "var(--color-arcade-neon-cyan)" },
  "capital-invaders":   { border: "border-arcade-neon-orange",  text: "text-arcade-neon-orange neon-text-orange",   hover: "hover:shadow-neon-orange hover:border-arcade-neon-orange focus-visible:shadow-neon-orange focus-visible:border-arcade-neon-orange",   shadow: "shadow-neon-orange",  solidLight: "light:bg-arcade-neon-orange", actionColor: "var(--color-arcade-neon-orange)" },
  "flag-rush":          { border: "border-arcade-neon-blue",    text: "text-arcade-neon-blue neon-text-blue",       hover: "hover:shadow-neon-blue hover:border-arcade-neon-blue focus-visible:shadow-neon-blue focus-visible:border-arcade-neon-blue",       shadow: "shadow-neon-blue",    solidLight: "light:bg-arcade-neon-blue", actionColor: "var(--color-arcade-neon-blue)" },
  "peaks-valleys":      { border: "border-arcade-neon-green",   text: "text-arcade-neon-green neon-text-green",     hover: "hover:shadow-neon-green hover:border-arcade-neon-green focus-visible:shadow-neon-green focus-visible:border-arcade-neon-green",     shadow: "shadow-neon-green",   solidLight: "light:bg-arcade-neon-green", actionColor: "var(--color-arcade-neon-green)" },
  "tectonic-snap":      { border: "border-arcade-neon-mint",    text: "text-arcade-neon-mint neon-text-mint",       hover: "hover:shadow-neon-mint hover:border-arcade-neon-mint focus-visible:shadow-neon-mint focus-visible:border-arcade-neon-mint",       shadow: "shadow-neon-mint",    solidLight: "light:bg-arcade-neon-mint", actionColor: "var(--color-arcade-neon-mint)" },
  "frontier-faceoff":   { border: "border-arcade-neon-purple",  text: "text-arcade-neon-purple neon-text-purple",   hover: "hover:shadow-neon-purple hover:border-arcade-neon-purple focus-visible:shadow-neon-purple focus-visible:border-arcade-neon-purple",   shadow: "shadow-neon-purple",  solidLight: "light:bg-arcade-neon-purple", actionColor: "var(--color-arcade-neon-purple)" },
  "one-strike":         { border: "border-arcade-neon-red",     text: "text-arcade-neon-red neon-text-red",         hover: "hover:shadow-neon-red hover:border-arcade-neon-red focus-visible:shadow-neon-red focus-visible:border-arcade-neon-red",         shadow: "shadow-neon-red",     solidLight: "light:bg-arcade-neon-red", actionColor: "var(--color-arcade-neon-red)" },
  "urban-legends":      { border: "border-arcade-neon-magenta", text: "text-arcade-neon-magenta neon-text-magenta", hover: "hover:shadow-neon-magenta hover:border-arcade-neon-magenta focus-visible:shadow-neon-magenta focus-visible:border-arcade-neon-magenta", shadow: "shadow-neon-magenta", solidLight: "light:bg-arcade-neon-magenta", actionColor: "var(--color-arcade-neon-magenta)" },
  "skyline-silhouette": { border: "border-arcade-neon-white",   text: "text-arcade-neon-white neon-text-white",     hover: "hover:shadow-neon-white hover:border-arcade-neon-white focus-visible:shadow-neon-white focus-visible:border-arcade-neon-white",     shadow: "shadow-neon-white",   solidLight: "light:bg-arcade-neon-white", actionColor: "var(--color-arcade-neon-white)" },
  "border-blitz":       { border: "border-arcade-neon-lime",    text: "text-arcade-neon-lime neon-text-lime",       hover: "hover:shadow-neon-lime hover:border-arcade-neon-lime focus-visible:shadow-neon-lime focus-visible:border-arcade-neon-lime",       shadow: "shadow-neon-lime",    solidLight: "light:bg-arcade-neon-lime", actionColor: "var(--color-arcade-neon-lime)" },
  "stat-attack":        { border: "border-arcade-neon-pink",    text: "text-arcade-neon-pink neon-text-pink",       hover: "hover:shadow-neon-pink hover:border-arcade-neon-pink focus-visible:shadow-neon-pink focus-visible:border-arcade-neon-pink",       shadow: "shadow-neon-pink",    solidLight: "light:bg-arcade-neon-pink", actionColor: "var(--color-arcade-neon-pink)" },
  "atlas-jackpot":      { border: "border-arcade-neon-yellow",  text: "text-arcade-neon-yellow neon-text-yellow",   hover: "",                                                            shadow: "shadow-neon-yellow",  solidLight: "light:bg-arcade-neon-yellow", actionColor: "var(--color-arcade-neon-yellow)" },
};
