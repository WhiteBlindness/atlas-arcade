// Shared contract for Atlas Jackpot "boss rush" mode.
//
// Every mini-game accepts these optional props. When `isMashupMode` is false or
// absent, the game runs its normal standalone path (byte-identical to before).
// When true, the game renders a single daily-constrained round with no header /
// end-screen / score-save of its own, and reports the outcome via onMashupComplete.

export interface MashupProps {
  /** Render one boss-rush round instead of the full standalone game. */
  isMashupMode?: boolean;
  /** Called exactly once when the single round resolves. */
  onMashupComplete?: (success: boolean) => void;
  /** Deterministic seed for this round (folds day + ladder level + game slug). */
  mashupSeed?: string;
  /** 1-based ladder rung — drives progressive difficulty (e.g. GeoRadar clues). */
  mashupLevel?: number;
}
