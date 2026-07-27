import type { GameSlug } from "@/store/gameStore";

export interface GameTheme {
  border: string;
  text: string;
  hover: string;
  shadow: string;
  /** High-opacity accent fill flashed on tap — the only "hover" feedback mobile users actually see. */
  activeBg: string;
  /** Light-mode-only solid accent block (Game Boy cartridge-label style) — always paired with white text. */
  solidLight: string;
}

/** Per-game neon identity color, shared by GameCard and ModeSelectModal. */
export const GAME_THEME: Record<GameSlug, GameTheme> = {
  "globle":             { border: "border-arcade-neon-cyan",    text: "text-arcade-neon-cyan neon-text-cyan",       hover: "hover:shadow-neon-cyan hover:border-arcade-neon-cyan",       shadow: "shadow-neon-cyan",    activeBg: "active:bg-arcade-neon-cyan/20",    solidLight: "light:bg-arcade-neon-cyan" },
  "capital-invaders":   { border: "border-arcade-neon-orange",  text: "text-arcade-neon-orange neon-text-orange",   hover: "hover:shadow-neon-orange hover:border-arcade-neon-orange",   shadow: "shadow-neon-orange",  activeBg: "active:bg-arcade-neon-orange/20",  solidLight: "light:bg-arcade-neon-orange" },
  "flag-rush":          { border: "border-arcade-neon-blue",    text: "text-arcade-neon-blue neon-text-blue",       hover: "hover:shadow-neon-blue hover:border-arcade-neon-blue",       shadow: "shadow-neon-blue",    activeBg: "active:bg-arcade-neon-blue/20",    solidLight: "light:bg-arcade-neon-blue" },
  "peaks-valleys":      { border: "border-arcade-neon-green",   text: "text-arcade-neon-green neon-text-green",     hover: "hover:shadow-neon-green hover:border-arcade-neon-green",     shadow: "shadow-neon-green",   activeBg: "active:bg-arcade-neon-green/20",   solidLight: "light:bg-arcade-neon-green" },
  "tectonic-snap":      { border: "border-arcade-neon-mint",    text: "text-arcade-neon-mint neon-text-mint",       hover: "hover:shadow-neon-mint hover:border-arcade-neon-mint",       shadow: "shadow-neon-mint",    activeBg: "active:bg-arcade-neon-mint/20",    solidLight: "light:bg-arcade-neon-mint" },
  "frontier-faceoff":   { border: "border-arcade-neon-purple",  text: "text-arcade-neon-purple neon-text-purple",   hover: "hover:shadow-neon-purple hover:border-arcade-neon-purple",   shadow: "shadow-neon-purple",  activeBg: "active:bg-arcade-neon-purple/20",  solidLight: "light:bg-arcade-neon-purple" },
  "one-strike":         { border: "border-arcade-neon-red",     text: "text-arcade-neon-red neon-text-red",         hover: "hover:shadow-neon-red hover:border-arcade-neon-red",         shadow: "shadow-neon-red",     activeBg: "active:bg-arcade-neon-red/20",     solidLight: "light:bg-arcade-neon-red" },
  "urban-legends":      { border: "border-arcade-neon-magenta", text: "text-arcade-neon-magenta neon-text-magenta", hover: "hover:shadow-neon-magenta hover:border-arcade-neon-magenta", shadow: "shadow-neon-magenta", activeBg: "active:bg-arcade-neon-magenta/20", solidLight: "light:bg-arcade-neon-magenta" },
  "skyline-silhouette": { border: "border-arcade-neon-white",   text: "text-arcade-neon-white neon-text-white",     hover: "hover:shadow-neon-white hover:border-arcade-neon-white",     shadow: "shadow-neon-white",   activeBg: "active:bg-arcade-neon-white/20",   solidLight: "light:bg-arcade-neon-white" },
  "border-blitz":       { border: "border-arcade-neon-lime",    text: "text-arcade-neon-lime neon-text-lime",       hover: "hover:shadow-neon-lime hover:border-arcade-neon-lime",       shadow: "shadow-neon-lime",    activeBg: "active:bg-arcade-neon-lime/20",    solidLight: "light:bg-arcade-neon-lime" },
  "stat-attack":        { border: "border-arcade-neon-pink",    text: "text-arcade-neon-pink neon-text-pink",       hover: "hover:shadow-neon-pink hover:border-arcade-neon-pink",       shadow: "shadow-neon-pink",    activeBg: "active:bg-arcade-neon-pink/20",    solidLight: "light:bg-arcade-neon-pink" },
  "atlas-jackpot":      { border: "border-arcade-neon-yellow",  text: "text-arcade-neon-yellow neon-text-yellow",   hover: "",                                                            shadow: "shadow-neon-yellow",  activeBg: "active:bg-arcade-neon-yellow/20",  solidLight: "light:bg-arcade-neon-yellow" },
};
