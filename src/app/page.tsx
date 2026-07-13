"use client";

import { useEffect } from "react";
import { Globe2, Zap, Flag, TrendingUp, Puzzle, Swords, Skull, Building2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useGameStore, type GameSlug } from "@/store/gameStore";
import { useT, type TKey } from "@/lib/i18n";
import { ArcadeHeader } from "@/components/ui/ArcadeHeader";
import { GameCard } from "@/components/ui/GameCard";
import { GameErrorBoundary } from "@/components/ui/ErrorBoundary";
import { GlobleGame, CapitalInvaders, FlagRush, PeaksValleys, TectonicSnap, FrontierFaceOff, OneStrike, UrbanLegends } from "@/components/games";

interface GameEntry {
  slug: GameSlug;
  title: string;
  descKey: TKey;
  Icon: typeof Globe2;
  comingSoon?: boolean;
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
];

export default function HomePage() {
  const { user } = useAuthStore();
  const { activeGame, highScores, startGame, exitGame, loadHighScores } = useGameStore();
  const t = useT();

  useEffect(() => {
    if (user) loadHighScores();
  }, [user, loadHighScores]);

  if (activeGame === "globle")
    return <GameErrorBoundary onExit={exitGame}><GlobleGame onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "capital-invaders")
    return <GameErrorBoundary onExit={exitGame}><CapitalInvaders onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "flag-rush")
    return <GameErrorBoundary onExit={exitGame}><FlagRush onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "peaks-valleys")
    return <GameErrorBoundary onExit={exitGame}><PeaksValleys onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "tectonic-snap")
    return <GameErrorBoundary onExit={exitGame}><TectonicSnap onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "frontier-faceoff")
    return <GameErrorBoundary onExit={exitGame}><FrontierFaceOff onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "one-strike")
    return <GameErrorBoundary onExit={exitGame}><OneStrike onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "urban-legends")
    return <GameErrorBoundary onExit={exitGame}><UrbanLegends onExit={exitGame} /></GameErrorBoundary>;

  return (
    <div className="min-h-screen flex flex-col">
      <ArcadeHeader />
      <main className="flex-1 flex flex-col items-center px-4 py-10 gap-10">
        <div className="text-center space-y-3">
          <h2 className="font-pixel text-2xl text-arcade-neon-green neon-text-green tracking-widest">{t("selectGame")}</h2>
          {!user && (
            <p className="font-pixel text-[9px] text-gray-600 animate-blink">{t("signInHint")}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {GAMES.map(({ slug, title, descKey, Icon, comingSoon }) => (
            <GameCard
              key={slug}
              slug={slug}
              title={title}
              description={t(descKey)}
              Icon={Icon}
              highScore={highScores[slug]}
              comingSoon={comingSoon}
              onPlay={() => startGame(slug)}
            />
          ))}
        </div>

        <p className="font-pixel text-[8px] text-gray-700 tracking-widest">
          © ATLAS ARCADE — {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
}
