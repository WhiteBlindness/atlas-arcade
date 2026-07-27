import type { GameSlug } from "@/store/gameStore";

export interface GameTheme {
  border: string;
  text: string;
  hover: string;
  shadow: string;
}

/** Per-game neon identity color, shared by GameCard and ModeSelectModal. */
export const GAME_THEME: Record<GameSlug, GameTheme> = {
  "globle":             { border: "border-arcade-neon-cyan",    text: "text-arcade-neon-cyan neon-text-cyan",       hover: "hover:shadow-neon-cyan hover:border-arcade-neon-cyan",       shadow: "shadow-neon-cyan" },
  "capital-invaders":   { border: "border-arcade-neon-orange",  text: "text-arcade-neon-orange neon-text-orange",   hover: "hover:shadow-neon-orange hover:border-arcade-neon-orange",   shadow: "shadow-neon-orange" },
  "flag-rush":          { border: "border-arcade-neon-blue",    text: "text-arcade-neon-blue neon-text-blue",       hover: "hover:shadow-neon-blue hover:border-arcade-neon-blue",       shadow: "shadow-neon-blue" },
  "peaks-valleys":      { border: "border-arcade-neon-green",   text: "text-arcade-neon-green neon-text-green",     hover: "hover:shadow-neon-green hover:border-arcade-neon-green",     shadow: "shadow-neon-green" },
  "tectonic-snap":      { border: "border-arcade-neon-mint",    text: "text-arcade-neon-mint neon-text-mint",       hover: "hover:shadow-neon-mint hover:border-arcade-neon-mint",       shadow: "shadow-neon-mint" },
  "frontier-faceoff":   { border: "border-arcade-neon-purple",  text: "text-arcade-neon-purple neon-text-purple",   hover: "hover:shadow-neon-purple hover:border-arcade-neon-purple",   shadow: "shadow-neon-purple" },
  "one-strike":         { border: "border-arcade-neon-red",     text: "text-arcade-neon-red neon-text-red",         hover: "hover:shadow-neon-red hover:border-arcade-neon-red",         shadow: "shadow-neon-red" },
  "urban-legends":      { border: "border-arcade-neon-magenta", text: "text-arcade-neon-magenta neon-text-magenta", hover: "hover:shadow-neon-magenta hover:border-arcade-neon-magenta", shadow: "shadow-neon-magenta" },
  "skyline-silhouette": { border: "border-arcade-neon-white",   text: "text-arcade-neon-white neon-text-white",     hover: "hover:shadow-neon-white hover:border-arcade-neon-white",     shadow: "shadow-neon-white" },
  "border-blitz":       { border: "border-arcade-neon-lime",    text: "text-arcade-neon-lime neon-text-lime",       hover: "hover:shadow-neon-lime hover:border-arcade-neon-lime",       shadow: "shadow-neon-lime" },
  "stat-attack":        { border: "border-arcade-neon-pink",    text: "text-arcade-neon-pink neon-text-pink",       hover: "hover:shadow-neon-pink hover:border-arcade-neon-pink",       shadow: "shadow-neon-pink" },
  "atlas-jackpot":      { border: "border-arcade-neon-yellow",  text: "text-arcade-neon-yellow neon-text-yellow",   hover: "",                                                            shadow: "shadow-neon-yellow" },
};
