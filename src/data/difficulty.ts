// Country difficulty tiers for the level-progression games (Flag Frenzy,
// Capital Strike). Names must match src/data/countries.ts exactly.
// Anything not listed below counts as "medium".

import type { Country } from "./countries";
import type { GameMode } from "@/store/gameStore";

export type Difficulty = "easy" | "medium" | "hard";

const EASY = new Set<string>([
  "United States", "United Kingdom", "France", "Germany", "Spain", "Italy",
  "Portugal", "Brazil", "Argentina", "Mexico", "Canada", "China", "Japan",
  "India", "Russia", "Australia", "Egypt", "South Africa", "Greece", "Turkey",
  "Netherlands", "Belgium", "Switzerland", "Sweden", "Norway", "Poland",
  "Ireland", "Austria", "Denmark", "Finland", "South Korea", "North Korea",
  "Cuba", "Colombia", "Chile", "Peru", "Morocco", "Saudi Arabia", "Israel",
  "Ukraine", "Thailand", "Vietnam", "Indonesia", "New Zealand", "Iceland",
]);

const HARD = new Set<string>([
  "Burkina Faso", "Burundi", "Central African Republic", "Chad", "Eritrea",
  "Gabon", "Guinea", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Laos",
  "Benin", "Togo", "Malawi", "Mauritania", "Niger", "Sierra Leone",
  "Liberia", "South Sudan", "Moldova", "North Macedonia",
  "Bosnia and Herzegovina", "Albania", "Republic of the Congo", "Rwanda",
  "Djibouti", "Bhutan", "Brunei", "Lesotho", "Eswatini", "Suriname",
  "Guyana", "Belize", "Comoros",
]);

export function countryDifficulty(name: string): Difficulty {
  if (EASY.has(name)) return "easy";
  if (HARD.has(name)) return "hard";
  return "medium";
}

export function splitByDifficulty(pool: Country[]): Record<Difficulty, Country[]> {
  const out: Record<Difficulty, Country[]> = { easy: [], medium: [], hard: [] };
  for (const c of pool) out[countryDifficulty(c.name)].push(c);
  return out;
}

/**
 * Which tier a given 1-based level belongs to.
 * Daily ladder (10 levels): 1-4 easy, 5-7 medium, 8-10 hard.
 * Arcade (endless): 1-5 easy, 6-12 medium, 13+ hard.
 */
export function tierForLevel(level: number, mode: GameMode | null): Difficulty {
  if (mode === "daily") {
    if (level <= 4) return "easy";
    if (level <= 7) return "medium";
    return "hard";
  }
  if (level <= 5) return "easy";
  if (level <= 12) return "medium";
  return "hard";
}
