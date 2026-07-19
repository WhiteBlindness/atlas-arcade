"use client";

import { Globe2, Zap, Flag, TrendingUp, Puzzle, Swords, Skull, Building2, Landmark } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useGameStore, type GameSlug } from "@/store/gameStore";
import { useT, type TKey } from "@/lib/i18n";
import { ArcadeHeader } from "@/components/ui/ArcadeHeader";
import { GameCard } from "@/components/ui/GameCard";
import { ModeSelectModal } from "@/components/ui/ModeSelectModal";
import { OutOfCoinsModal } from "@/components/ui/OutOfCoinsModal";
import { GameErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AtlasJackpotBanner } from "@/components/ui/AtlasJackpotBanner";
import { DailyResultScreen } from "@/components/ui/DailyResultScreen";
import { useDailyStore } from "@/store/dailyStore";
import { useCoinStore } from "@/store/coinStore";
import { GlobleGame, CapitalInvaders, FlagRush, PeaksValleys, TectonicSnap, FrontierFaceOff, OneStrike, UrbanLegends, SkylineSilhouette, AtlasJackpot } from "@/components/games";

interface GameEntry {
  slug: GameSlug;
  title: string;
  descKey: TKey;
  Icon: typeof Globe2;
  comingSoon?: boolean;
  locked?: boolean;
}

const GAMES: GameEntry[] = [
  { slug: "globle",           title: "GEORADAR",          descKey: "descGloble",    Icon: Globe2 },
  { slug: "capital-invaders", title: "CAPITAL STRIKE",    descKey: "descCapital",   Icon: Zap },
  { slug: "flag-rush",        title: "FLAG FRENZY",       descKey: "descFlag",      Icon: Flag },
  { slug: "peaks-valleys",    title: "PEAKS & VALLEYS",   descKey: "descPeaks",     Icon: TrendingUp },
  { slug: "tectonic-snap",    title: "TECTONIC SNAP",     descKey: "descTectonic",  Icon: Puzzle },
  { slug: "frontier-faceoff", title: "FRONTIER FACE-OFF", descKey: "descFrontier",  Icon: Swords },
  { slug: "one-strike",       title: "ONE STRIKE",        descKey: "descOneStrike", Icon: Skull },
  { slug: "urban-legends",    title: "URBAN LEGENDS",     descKey: "descUrban",     Icon: Building2 },
  { slug: "skyline-silhouette", title: "SKYLINE SILHOUETTE", descKey: "descSkyline", Icon: Landmark },
  // atlas-jackpot is the Boss Stage — rendered as a hero banner, not a grid card.
];

const GAME_COMPONENTS: Partial<Record<GameSlug, React.ComponentType<{ onExit: () => void }>>> = {
  "globle": GlobleGame,
  "capital-invaders": CapitalInvaders,
  "flag-rush": FlagRush,
  "peaks-valleys": PeaksValleys,
  "tectonic-snap": TectonicSnap,
  "frontier-faceoff": FrontierFaceOff,
  "one-strike": OneStrike,
  "urban-legends": UrbanLegends,
  "skyline-silhouette": SkylineSilhouette,
  "atlas-jackpot": AtlasJackpot,
};

export default function HomePage() {
  const { user } = useAuthStore();
  const { activeGame, mode, runId, highScores, openModeSelect, exitGame, retryGame } = useGameStore();
  const getDailyResult = useDailyStore((s) => s.getResult);
  const refundCoin = useCoinStore((s) => s.refund);
  const t = useT();

  if (activeGame) {
    const Game = GAME_COMPONENTS[activeGame];
    const title = GAMES.find((g) => g.slug === activeGame)?.title ?? activeGame.toUpperCase();
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
          {GAMES.map(({ slug, title, descKey, Icon, comingSoon, locked }) => (
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

      <ModeSelectModal />
      <OutOfCoinsModal />
    </div>
  );
}
