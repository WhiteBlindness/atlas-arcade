"use client";

import { useEffect } from "react";
import { Globe2, Zap, Flag, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useGameStore, type GameSlug } from "@/store/gameStore";
import { ArcadeHeader } from "@/components/ui/ArcadeHeader";
import { GameCard } from "@/components/ui/GameCard";
import { GameErrorBoundary } from "@/components/ui/ErrorBoundary";
import { GlobleGame, CapitalInvaders, FlagRush, PeaksValleys } from "@/components/games";

const GAMES = [
  { slug: "globle" as GameSlug,          title: "GEORADAR",         description: "Mystery country. Guess by distance. Hot or cold?",        Icon: Globe2    },
  { slug: "capital-invaders" as GameSlug, title: "CAPITAL STRIKE",  description: "Match capitals to countries before time runs out.",        Icon: Zap       },
  { slug: "flag-rush" as GameSlug,        title: "FLAG FRENZY",     description: "Name the flag. Fast. Faster. Don't miss.",                Icon: Flag      },
  { slug: "peaks-valleys" as GameSlug,    title: "PEAKS & VALLEYS", description: "Higher or lower? Compare oddly mismatched world stats.",   Icon: TrendingUp },
];

export default function HomePage() {
  const { user, openModal } = useAuthStore();
  const { activeGame, highScores, startGame, exitGame, loadHighScores } = useGameStore();

  useEffect(() => {
    if (user) loadHighScores();
  }, [user, loadHighScores]);

  const handlePlay = (slug: GameSlug) => {
    startGame(slug);
  };

  if (activeGame === "globle")
    return <GameErrorBoundary onExit={exitGame}><GlobleGame onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "capital-invaders")
    return <GameErrorBoundary onExit={exitGame}><CapitalInvaders onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "flag-rush")
    return <GameErrorBoundary onExit={exitGame}><FlagRush onExit={exitGame} /></GameErrorBoundary>;
  if (activeGame === "peaks-valleys")
    return <GameErrorBoundary onExit={exitGame}><PeaksValleys onExit={exitGame} /></GameErrorBoundary>;

  return (
    <div className="min-h-screen flex flex-col">
      <ArcadeHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-12">
        <div className="text-center space-y-3">
          <h2 className="font-pixel text-2xl text-arcade-neon-green neon-text-green tracking-widest">SELECT GAME</h2>
          {!user && (
            <p className="font-pixel text-[9px] text-gray-600 animate-blink">▶ SIGN IN TO SAVE SCORES ◀</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {GAMES.map(({ slug, title, description, Icon }) => (
            <GameCard
              key={slug}
              slug={slug}
              title={title}
              description={description}
              Icon={Icon}
              highScore={highScores[slug]}
              onPlay={() => handlePlay(slug)}
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
