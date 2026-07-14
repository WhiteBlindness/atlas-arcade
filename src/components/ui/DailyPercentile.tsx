"use client";

import { useGameStore } from "@/store/gameStore";
import { mockPercentile } from "@/lib/daily";
import { useT } from "@/lib/i18n";

/**
 * "You beat X% of players today" — daily end screens only.
 * `performance` is normalized 0..1 (1 = perfect run).
 * Renders nothing in arcade mode.
 */
export function DailyPercentile({ performance }: { performance: number }) {
  const mode = useGameStore((s) => s.mode);
  const t = useT();

  if (mode !== "daily") return null;

  const pct = mockPercentile(performance);
  return (
    <p className="font-pixel text-[9px] text-arcade-neon-cyan neon-text-cyan leading-relaxed">
      ★ {t("betterThan").replace("{X}", String(pct))} ★
    </p>
  );
}
