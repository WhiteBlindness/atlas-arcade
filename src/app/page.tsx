"use client";

import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import { useT } from "@/lib/i18n";
import { GAME_REGISTRY, GAMES_GRID } from "@/lib/games";
import { ArcadeHeader } from "@/components/ui/ArcadeHeader";
import { GameCard } from "@/components/ui/GameCard";
import { ModeSelectModal } from "@/components/ui/ModeSelectModal";
import { OutOfCoinsModal } from "@/components/ui/OutOfCoinsModal";
import { GameErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AtlasJackpotBanner } from "@/components/ui/AtlasJackpotBanner";
import { DailyResultScreen } from "@/components/ui/DailyResultScreen";
import { useDailyStore } from "@/store/dailyStore";
import { useCoinStore } from "@/store/coinStore";

export default function HomePage() {
  const { user } = useAuthStore();
  const { activeGame, mode, runId, highScores, pendingGame, openModeSelect, exitGame, retryGame } = useGameStore();
  const getDailyResult = useDailyStore((s) => s.getResult);
  const refundCoin = useCoinStore((s) => s.refund);
  const t = useT();

  if (activeGame) {
    const Game = GAME_REGISTRY[activeGame]?.Component;
    const title = GAME_REGISTRY[activeGame]?.title ?? activeGame.toUpperCase();
    if (Game) {
      // daily lockout: already finished today → straight to the result screen
      const done = mode === "daily" ? getDailyResult(activeGame) : null;
      return (
        <>
          {done ? (
            <DailyResultScreen slug={activeGame} gameTitle={title} result={done} onExit={exitGame} />
          ) : (
            <GameErrorBoundary
              onExit={exitGame}
              paid={mode === "arcade"}
              onRefund={refundCoin}
              onRetry={retryGame}
            >
              <Game key={`${activeGame}-${runId}`} onExit={exitGame} />
            </GameErrorBoundary>
          )}
          <OutOfCoinsModal />
        </>
      );
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <ArcadeHeader />
      <main className="flex-1 flex flex-col items-center px-4 py-10 gap-10">
        {/* Boss Stage hero — above the standard grid */}
        <AtlasJackpotBanner />

        <div className="text-center space-y-3">
          <h2 className="font-pixel text-2xl text-arcade-neon-green neon-text-green tracking-widest">{t("selectGame")}</h2>
          {!user && (
            <p className="font-pixel text-[9px] text-gray-600 animate-blink">{t("signInHint")}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {GAMES_GRID.map(({ slug, title, descKey, Icon, comingSoon, locked }) => (
            <GameCard
              key={slug}
              slug={slug}
              title={title}
              description={t(descKey)}
              Icon={Icon}
              highScore={highScores[slug]}
              comingSoon={comingSoon}
              locked={locked}
              onPlay={() => openModeSelect(slug)}
            />
          ))}
        </div>

        <p className="font-pixel text-[8px] text-gray-700 tracking-widest">
          © ATLAS ARCADE — {new Date().getFullYear()}
        </p>
      </main>

      <ModeSelectModal title={pendingGame ? GAME_REGISTRY[pendingGame]?.title ?? "" : ""} />
      <OutOfCoinsModal />
    </div>
  );
}
