"use client";

import { CalendarCheck } from "lucide-react";
import type { GameSlug } from "@/store/gameStore";
import type { DailyResult } from "@/store/dailyStore";
import { useT } from "@/lib/i18n";
import { DailyPercentile } from "./DailyPercentile";
import { EndScreenActions } from "./EndScreenActions";

interface Props {
  slug: GameSlug;
  gameTitle: string;
  result: DailyResult;
  onExit: () => void;
}

/** Shown when a player re-opens a daily they already finished today. */
export function DailyResultScreen({ slug, gameTitle, result, onExit }: Props) {
  const t = useT();
  return (
    <div className="min-h-dvh flex flex-col items-center justify-start pt-8 md:justify-center md:pt-0 gap-6 bg-arcade-bg px-4 text-center">
      <h1 className="font-pixel text-xs text-arcade-neon-green neon-text-green tracking-widest">{gameTitle}</h1>
      <div className="border border-arcade-neon-green p-10 space-y-3" style={{ boxShadow: "0 0 30px #00ff4133" }}>
        <CalendarCheck size={24} className="mx-auto text-arcade-neon-green" />
        <p className="font-pixel text-[10px] text-arcade-neon-green neon-text-green">{t("dailyDone")}</p>
        <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{result.score}</p>
        {result.squares && <p className="text-lg tracking-widest">{result.squares}</p>}
        <DailyPercentile performance={result.performance} />
        <p className="font-pixel text-[7px] text-gray-600 tracking-widest animate-blink">{t("comeBack")}</p>
      </div>
      <EndScreenActions
        slug={slug}
        gameTitle={gameTitle}
        score={result.score}
        performance={result.performance}
        squares={result.squares}
        onExit={onExit}
      />
    </div>
  );
}
