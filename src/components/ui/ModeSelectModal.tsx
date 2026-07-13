"use client";

import { X, CalendarDays, Gamepad2 } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useCoinStore } from "@/store/coinStore";
import { useT } from "@/lib/i18n";
import { todayUTC } from "@/lib/daily";
import { sfx } from "@/lib/sfx";

export function ModeSelectModal() {
  const { pendingGame, closeModeSelect, startGame } = useGameStore();
  const { coins, spend } = useCoinStore();
  const t = useT();

  if (!pendingGame) return null;

  const playDaily = () => {
    sfx.click();
    startGame(pendingGame, "daily");
  };

  const playArcade = async () => {
    sfx.click();
    const ok = await spend();
    if (ok) startGame(pendingGame, "arcade");
    // spend() opens the OUT OF COINS modal itself when broke
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4" onClick={closeModeSelect}>
      <div
        className="relative w-full max-w-sm border border-arcade-neon-cyan bg-arcade-bg p-6 space-y-4 modal-enter"
        style={{ boxShadow: "0 0 40px #00d4ff44" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModeSelect}
          aria-label={t("cancel")}
          className="absolute top-3 right-3 text-gray-600 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>

        <p className="font-pixel text-[11px] text-arcade-neon-cyan neon-text-cyan tracking-widest text-center">
          {t("modeTitle")}
        </p>

        {/* Daily */}
        <button
          onClick={playDaily}
          className="w-full flex flex-col gap-2 p-4 border border-arcade-neon-green text-left hover:bg-arcade-neon-green/10 hover:shadow-neon-green transition-all group"
        >
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-pixel text-[10px] text-arcade-neon-green neon-text-green">
              <CalendarDays size={13} /> {t("dailyChallenge")}
            </span>
            <span className="font-pixel text-[8px] px-2 py-1 border border-arcade-neon-green text-arcade-neon-green">
              {t("free")}
            </span>
          </span>
          <span className="font-mono text-sm text-gray-400 leading-relaxed">{t("dailyDesc")}</span>
          <span className="font-pixel text-[7px] text-gray-600">{todayUTC()} UTC</span>
        </button>

        {/* Arcade */}
        <button
          onClick={playArcade}
          className="w-full flex flex-col gap-2 p-4 border border-arcade-neon-yellow text-left hover:bg-arcade-neon-yellow/10 hover:shadow-neon-yellow transition-all"
        >
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-pixel text-[10px] text-arcade-neon-yellow neon-text-yellow">
              <Gamepad2 size={13} /> {t("arcadeMode")}
            </span>
            <span className="font-pixel text-[8px] px-2 py-1 border border-arcade-neon-yellow text-arcade-neon-yellow">
              {t("oneCoin")}
            </span>
          </span>
          <span className="font-mono text-sm text-gray-400 leading-relaxed">{t("arcadeDesc")}</span>
          {coins !== null && (
            <span className={`font-pixel text-[7px] ${coins > 0 ? "text-gray-600" : "text-arcade-neon-red"}`}>
              ● {coins} {coins === 1 ? "COIN" : "COINS"} LEFT
            </span>
          )}
        </button>

        <button
          onClick={closeModeSelect}
          className="w-full py-2 font-pixel text-[8px] text-gray-600 hover:text-white transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
