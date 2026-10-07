"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, CalendarDays, Gamepad2 } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useCoinStore } from "@/store/coinStore";
import { useT } from "@/lib/i18n";
import { useDialogFocus } from "@/components/ui/useDialogFocus";
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
  const coins = useCoinStore((s) => s.coins);
  const spend = useCoinStore((s) => s.spend);
  const spending = useCoinStore((s) => s.spending);
  const t = useT();
  const [arcadePending, setArcadePending] = useState(false);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);
  const busy = arcadePending || spending;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const closeWhenIdle = useCallback(() => {
    if (pendingRef.current || useCoinStore.getState().spending) return;
    closeModeSelect();
  }, [closeModeSelect]);
  const dialogRef = useDialogFocus<HTMLDivElement>(!!pendingGame, closeWhenIdle);

  if (!pendingGame) return null;

  const theme = GAME_THEME[pendingGame];

  const playDaily = () => {
    if (pendingRef.current || useCoinStore.getState().spending) return;
    sfx.click();
    startGame(pendingGame, "daily");
  };

  const playArcade = async () => {
    if (pendingRef.current || useCoinStore.getState().spending) return;
    const selectedGame = pendingGame;
    if (!selectedGame) return;
    pendingRef.current = true;
    setArcadePending(true);
    sfx.click();
    try {
      const ok = await spend();
      const current = useGameStore.getState();
      if (ok && mountedRef.current && pendingRef.current && current.pendingGame === selectedGame && current.activeGame === null) {
        startGame(selectedGame, "arcade");
      }
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) setArcadePending(false);
    }
    // spend() opens the OUT OF COINS modal itself when broke
  };

  // No backdrop-click-to-close — matches AuthModal. Only the X button closes it.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-busy={busy || undefined} aria-labelledby="mode-select-title mode-select-description" tabIndex={-1} className={`relative w-full max-w-sm max-h-[85dvh] overflow-y-auto border ${theme.border} ${theme.shadow} bg-arcade-bg p-6 space-y-4 modal-enter`}>
        <button
          onClick={closeWhenIdle}
          disabled={busy}
          aria-label={t("cancel")}
          data-dialog-initial-focus
          className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center text-gray-300 light:text-gray-700 hover:text-arcade-neon-cyan active:scale-90 active:bg-white/10 transition-all duration-200"
        >
          <X size={16} />
        </button>

        <div className="text-center space-y-1">
          <h2 id="mode-select-title" className={`font-pixel text-xs tracking-widest ${theme.text}`}>{title}</h2>
          <p id="mode-select-description" className="font-pixel text-[9px] text-gray-300 light:text-gray-700 tracking-widest">{t("modeTitle")}</p>
        </div>

        {/* Pre-game instructions — read the rules before spending a token */}
        <HowToPlayButton slug={pendingGame} accent={theme.text} variant="block" disabled={busy} />

        {/* Daily */}
        <button
          onClick={playDaily}
          disabled={busy}
          className="w-full flex flex-col gap-2 p-4 border border-arcade-neon-green text-left hover:shadow-neon-green active:scale-95 transition-all duration-200 group disabled:cursor-wait"
        >
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-pixel text-[10px] text-arcade-neon-green neon-text-green">
              <CalendarDays size={13} /> {t("dailyChallenge")}
            </span>
            <span className="font-pixel text-[8px] px-2 py-1 border border-arcade-neon-green text-arcade-neon-green">
              {t("free")}
            </span>
          </span>
          <span className="font-mono text-sm text-gray-300 light:text-gray-700 leading-relaxed">{t("dailyDesc")}</span>
          <span className="font-pixel text-[7px] text-gray-300 light:text-gray-700">{todayUTC()} UTC</span>
        </button>

        {/* Arcade */}
        <button
          onClick={playArcade}
          disabled={busy}
          aria-busy={busy || undefined}
          className="w-full flex flex-col gap-2 p-4 border border-arcade-neon-yellow text-left hover:shadow-neon-yellow active:scale-95 transition-all duration-200 disabled:cursor-wait"
        >
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-pixel text-[10px] text-arcade-neon-yellow neon-text-yellow">
              <Gamepad2 size={13} /> {t("arcadeMode")}
            </span>
            <span className="font-pixel text-[8px] px-2 py-1 border border-arcade-neon-yellow text-arcade-neon-yellow">
              {t("oneCoin")}
            </span>
          </span>
          <span className="font-mono text-sm text-gray-300 light:text-gray-700 leading-relaxed">{t("arcadeDesc")}</span>
          {coins !== null && (
            <span className={`font-pixel text-[7px] ${coins > 0 ? "text-gray-300 light:text-gray-700" : "text-arcade-neon-red"}`}>
              {t("coinsLeft").replace("{X}", String(coins))}
            </span>
          )}
        </button>

        <button
          onClick={closeWhenIdle}
          disabled={busy}
          className="w-full min-h-[44px] py-2 font-pixel text-[8px] text-gray-300 light:text-gray-700 hover:text-arcade-neon-cyan active:scale-95 active:bg-white/10 transition-all duration-200 disabled:cursor-wait"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
