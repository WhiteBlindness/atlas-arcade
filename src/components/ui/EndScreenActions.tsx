"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore, type GameSlug } from "@/store/gameStore";
import { useDailyStore } from "@/store/dailyStore";
import { useCoinStore } from "@/store/coinStore";
import { ATLAS_JACKPOT_COST } from "@/lib/supabase/coins";
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
  const spendTokens = useCoinStore((s) => s.spendTokens);
  const spending = useCoinStore((s) => s.spending);
  const t = useT();
  const isDaily = mode === "daily";
  const isJackpot = slug === "atlas-jackpot";
  const [replayPending, setReplayPending] = useState(false);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);
  const busy = replayPending || spending;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isDaily) markCompleted(slug, { score, performance, squares });
  }, [isDaily, slug, score, performance, squares, markCompleted]);

  const playAgain = async () => {
    if (pendingRef.current || useCoinStore.getState().spending) return;
    const before = useGameStore.getState();
    if (before.activeGame !== slug || before.mode !== "arcade") return;
    pendingRef.current = true;
    setReplayPending(true);
    sfx.click();
    try {
      // Atlas Jackpot re-entry costs the full token price (daily first, then premium).
      const paid = isJackpot ? await spendTokens(ATLAS_JACKPOT_COST) : await spend();
      const current = useGameStore.getState();
      if (
        paid
        && mountedRef.current
        && pendingRef.current
        && current.activeGame === slug
        && current.mode === "arcade"
        && current.runId === before.runId
      ) {
        startGame(slug, "arcade");
      }
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) setReplayPending(false);
    }
  };

  const exitWhenIdle = () => {
    if (pendingRef.current || useCoinStore.getState().spending) return;
    onExit();
  };

  return (
    <div className="flex flex-wrap justify-center gap-3" aria-busy={busy || undefined}>
      {isDaily ? (
        <>
          <ShareButton gameTitle={gameTitle} score={score} performance={performance} squares={squares} />
          <button
            onClick={exitWhenIdle}
            disabled={busy}
            className="min-h-[44px] py-2 px-4 font-pixel text-[9px] border border-arcade-border text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-900 hover:border-white light:hover:border-gray-900 active:scale-95 active:bg-white/10 transition-all duration-200"
          >
            {t("backToGames")}
          </button>
        </>
      ) : (
        <>
          <button
            onClick={playAgain}
            disabled={busy}
            aria-busy={busy || undefined}
            className="min-h-[44px] py-2 px-4 font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow hover:bg-arcade-neon-yellow hover:text-black active:scale-95 active:bg-current/30 transition-all duration-200 disabled:cursor-wait"
          >
            {isJackpot ? t("playAgainTokens").replace("{X}", String(ATLAS_JACKPOT_COST)) : t("playAgainCoin")}
          </button>
          <button
            onClick={exitWhenIdle}
            disabled={busy}
            className="min-h-[44px] py-2 px-4 font-pixel text-[9px] border border-arcade-border text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-900 hover:border-white light:hover:border-gray-900 active:scale-95 active:bg-white/10 transition-all duration-200 disabled:cursor-wait"
          >
            {t("backToArcade")}
          </button>
        </>
      )}
    </div>
  );
}
