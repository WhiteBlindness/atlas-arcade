"use client";

import { todayUTC, mockPercentile } from "./daily";

// Wordle-style share text for daily results.
// 🌍 Atlas Arcade | GEORADAR
// Score: 850
// I beat 78% of players today!
// 🟧🟨🟩
// 2026-07-14 · atlasarcade.vercel.app

const SITE = "atlasarcade.vercel.app";

export function buildShareText(opts: {
  gameTitle: string;
  score: number;
  performance: number;
  squares?: string;
}): string {
  const lines = [
    `🌍 Atlas Arcade | ${opts.gameTitle}`,
    `Score: ${opts.score}`,
    `I beat ${mockPercentile(opts.performance)}% of players today!`,
  ];
  if (opts.squares) lines.push(opts.squares);
  lines.push(`${todayUTC()} · ${SITE}`);
  return lines.join("\n");
}

/** Copy to clipboard; resolves false when the Clipboard API is unavailable. */
export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
