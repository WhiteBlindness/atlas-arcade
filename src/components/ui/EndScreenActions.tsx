"use client";

import { useEffect } from "react";
import { useGameStore, type GameSlug } from "@/store/gameStore";
import { useDailyStore } from "@/store/dailyStore";
import { useCoinStore } from "@/store/coinStore";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";
import { ShareButton } from "./ShareButton";

interface Props {
  slug: GameSlug;
  gameTitle: string;
  score: number;
  performance: number;
  squares?: string;
  onExit: () => void;
}

/**
 * Mode-aware end-screen buttons.
 * Daily:  SHARE RESULT + BACK TO GAMES — and records the run for the daily
 *         lockout + streak the moment it renders.
 * Arcade: PLAY AGAIN (1 COIN) + BACK TO ARCADE.
 */
export function EndScreenActions({ slug, gameTitle, score, performance, squares, onExit }: Props) {
  const mode = useGameStore((s) => s.mode);
  const startGame = useGameStore((s) => s.startGame);
  const markCompleted = useDailyStore((s) => s.markCompleted);
  const spend = useCoinStore((s) => s.spend);
  const t = useT();
  const isDaily = mode === "daily";

  useEffect(() => {
    if (isDaily) markCompleted(slug, { score, performance, squares });
  }, [isDaily, slug, score, performance, squares, markCompleted]);

  const playAgain = async () => {
    sfx.click();
    if (await spend()) startGame(slug, "arcade");
  };

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {isDaily ? (
        <>
          <ShareButton gameTitle={gameTitle} score={score} performance={performance} squares={squares} />
          <button
            onClick={onExit}
            className="py-2 px-4 font-pixel text-[9px] border border-arcade-border text-gray-500 hover:text-white hover:border-white transition-all"
          >
            {t("backToGames")}
          </button>
        </>
      ) : (
        <>
          <button
            onClick={playAgain}
            className="py-2 px-4 font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow hover:bg-arcade-neon-yellow hover:text-black transition-all"
          >
            {t("playAgainCoin")}
          </button>
          <button
            onClick={onExit}
            className="py-2 px-4 font-pixel text-[9px] border border-arcade-border text-gray-500 hover:text-white hover:border-white transition-all"
          >
            {t("backToArcade")}
          </button>
        </>
      )}
    </div>
  );
}
