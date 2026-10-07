"use client";

import { todayUTC } from "./daily";

// Wordle-style share text for daily results.
// 🌍 Atlas Arcade | GEORADAR
// Score: 850
// 🟧🟨🟩
// 2026-07-14 · atlasarcade.app

const SITE = "atlasarcade.app";

export function buildShareText(opts: {
  gameTitle: string;
  score: number;
  performance: number;
  squares?: string;
}): string {
  const lines = [
    `🌍 Atlas Arcade | ${opts.gameTitle}`,
    `Score: ${opts.score}`,
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
