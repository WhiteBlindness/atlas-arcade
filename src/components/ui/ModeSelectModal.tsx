"use client";

import { X, CalendarDays, Gamepad2 } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useCoinStore } from "@/store/coinStore";
import { useT } from "@/lib/i18n";
import { todayUTC } from "@/lib/daily";
import { sfx } from "@/lib/sfx";
import { GAME_THEME } from "@/lib/gameTheme";
import { HowToPlayButton } from "@/components/ui/HowToPlay";

interface Props {
  /** Selected game's display title, e.g. "SKYLINE SILHOUETTE". */
  title: string;
}

export function ModeSelectModal({ title }: Props) {
  const { pendingGame, closeModeSelect, startGame } = useGameStore();
  const { coins, spend } = useCoinStore();
  const t = useT();

  if (!pendingGame) return null;

  const theme = GAME_THEME[pendingGame];

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

  // No backdrop-click-to-close — matches AuthModal. Only the X button closes it.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
      <div className={`relative w-full max-w-sm border ${theme.border} ${theme.shadow} bg-arcade-bg p-6 space-y-4 modal-enter`}>
        <button
          onClick={closeModeSelect}
          aria-label={t("cancel")}
          className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center text-gray-600 hover:text-white active:scale-90 transition-all duration-200"
        >
          <X size={16} />
        </button>

        <div className="text-center space-y-1">
          <p className={`font-pixel text-xs tracking-widest ${theme.text}`}>{title}</p>
          <p className="font-pixel text-[9px] text-gray-500 tracking-widest">{t("modeTitle")}</p>
        </div>

        {/* Pre-game instructions — read the rules before spending a token */}
        <HowToPlayButton slug={pendingGame} accent={theme.text} variant="block" />

        {/* Daily */}
        <button
          onClick={playDaily}
          className="w-full flex flex-col gap-2 p-4 border border-arcade-neon-green text-left hover:bg-arcade-neon-green/10 hover:shadow-neon-green active:scale-95 transition-all duration-200 group"
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
          className="w-full flex flex-col gap-2 p-4 border border-arcade-neon-yellow text-left hover:bg-arcade-neon-yellow/10 hover:shadow-neon-yellow active:scale-95 transition-all duration-200"
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
              {t("coinsLeft").replace("{X}", String(coins))}
            </span>
          )}
        </button>

        <button
          onClick={closeModeSelect}
          className="w-full min-h-[44px] py-2 font-pixel text-[8px] text-gray-600 hover:text-white active:scale-95 transition-all duration-200"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
