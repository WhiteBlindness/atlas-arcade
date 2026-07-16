"use client";

import { useState, useCallback, useRef } from "react";
import { Lightbulb, Building2 } from "lucide-react";
import { CITIES, type CityEntry, type CityTier } from "@/data/cities";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { sfx } from "@/lib/sfx";
import { createDailyRng, seededShuffle, type Rng } from "@/lib/daily";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";

const ROUNDS = 6;
// index = clues revealed (0-3): guessing blind off the skyline pays the most
const CLUE_POINTS = [300, 200, 100, 50];
const TIER_MULTIPLIER: Record<CityTier, number> = { easy: 1, medium: 1.5, hard: 2 };

const TIERS: { tier: CityTier; label: string; desc: string; color: string; border: string }[] = [
  { tier: "easy",   label: "TOURIST",  desc: "World-famous cities. Warm-up run.",        color: "text-arcade-neon-green neon-text-green",     border: "border-arcade-neon-green" },
  { tier: "medium", label: "TRAVELER", desc: "You'll need more than postcards.",         color: "text-arcade-neon-yellow neon-text-yellow",   border: "border-arcade-neon-yellow" },
  { tier: "hard",   label: "LEGEND",   desc: "Obscure gems. Double points.",             color: "text-arcade-neon-magenta neon-text-magenta", border: "border-arcade-neon-magenta" },
];

interface Round {
  city: CityEntry;
  options: CityEntry[];
}

function buildRounds(tier: CityTier, rng: Rng): Round[] {
  const pool = CITIES.filter((c) => c.tier === tier);
  const picked = seededShuffle(pool, rng).slice(0, ROUNDS);
  return picked.map((city) => ({
    city,
    options: seededShuffle(
      [city, ...seededShuffle(pool.filter((c) => c.id !== city.id), rng).slice(0, 3)],
      rng
    ),
  }));
}

/**
 * City photo (Wikimedia Commons) tinted to the neon-green arcade palette.
 * Broken URL → plain glowing icon, no text.
 */
function SkylineImage({ city }: { city: CityEntry }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <Building2 size={56} className="text-arcade-neon-green/40" aria-label="Skyline unavailable" />;
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={city.imageUrl}
        alt="Mystery city"
        className="w-full h-full object-cover"
        style={{ filter: "grayscale(1) sepia(1) hue-rotate(65deg) saturate(3.2) brightness(0.75) contrast(1.15)" }}
        onError={() => setFailed(true)}
        draggable={false}
      />
      {/* scanline + vignette pass to sell the arcade monitor look */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 55%, #080810cc 100%)" }} />
    </div>
  );
}

export default function UrbanLegends({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const [tier, setTier] = useState<CityTier | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [idx, setIdx] = useState(0);
  const [cluesShown, setCluesShown] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"pick-tier" | "playing" | "done">("pick-tier");

  const scoreSavedRef = useRef(false);
  const isAnswered = chosen !== null;
  const current = rounds[idx];

  const startTier = useCallback((t: CityTier) => {
    sfx.click();
    // daily mode: seed includes the tier so each tier has its own shared daily run
    const mode = useGameStore.getState().mode;
    const rng: Rng = mode === "daily" ? createDailyRng(`urban-legends:${t}`) : Math.random;
    setTier(t);
    setRounds(buildRounds(t, rng));
    setIdx(0);
    setCluesShown(0);
    setScore(0);
    setStatus("playing");
  }, []);

  const revealClue = useCallback(() => {
    if (isAnswered || cluesShown >= 3) return;
    sfx.click();
    setCluesShown((c) => c + 1);
  }, [isAnswered, cluesShown]);

  const handleAnswer = useCallback((id: string) => {
    if (isAnswered || !current || !tier) return;
    setChosen(id);
    if (id === current.city.id) {
      const pts = Math.round(CLUE_POINTS[cluesShown] * TIER_MULTIPLIER[tier]);
      setScore((s) => s + pts);
      addScore(pts);
      sfx.correct();
    } else {
      sfx.wrong();
    }
  }, [isAnswered, current, tier, cluesShown, addScore]);

  const nextRound = useCallback(() => {
    sfx.click();
    if (idx + 1 >= rounds.length) {
      setStatus("done");
      if (!scoreSavedRef.current) {
        scoreSavedRef.current = true;
        saveHighScore("urban-legends", score);
      }
    } else {
      setIdx((i) => i + 1);
      setCluesShown(0);
      setChosen(null);
    }
  }, [idx, rounds.length, score]);

  // ——— Tier select ———
  if (status === "pick-tier") {
    return (
      <div className="min-h-dvh flex flex-col bg-arcade-bg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
          <GameBackButton onExit={onExit} />
          <h1 className="font-pixel text-[10px] text-arcade-neon-green neon-text-green">URBAN LEGENDS</h1>
          <span className="w-14" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
          <p className="font-pixel text-[10px] text-gray-400 tracking-widest">SELECT DIFFICULTY</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {TIERS.map(({ tier: t, label, desc, color, border }) => (
              <button
                key={t}
                onClick={() => startTier(t)}
                className={`flex flex-col gap-3 p-6 bg-arcade-surface border ${border} hover:scale-105 active:scale-95 transition-transform text-left`}
              >
                <span className={`font-pixel text-xs ${color}`}>{label}</span>
                <span className="font-mono text-sm text-gray-500">{desc}</span>
                <span className="font-pixel text-[8px] text-gray-600">×{TIER_MULTIPLIER[t]} POINTS</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ——— Done ———
  if (status === "done") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-start pt-8 md:justify-center md:pt-0 gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-green neon-text-green">URBAN LEGENDS</h1>
        <div className="border border-arcade-neon-green p-10 text-center space-y-3">
          <p className="font-pixel text-[8px] text-gray-500">FINAL SCORE</p>
          <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{score}</p>
          <p className="font-pixel text-[8px] text-gray-500">{ROUNDS} CITIES · {tier?.toUpperCase()}</p>
          <DailyPercentile performance={tier ? score / (ROUNDS * CLUE_POINTS[0] * TIER_MULTIPLIER[tier]) : 0} />
        </div>
        <EndScreenActions
          slug="urban-legends"
          gameTitle="URBAN LEGENDS"
          score={score}
          performance={tier ? score / (ROUNDS * CLUE_POINTS[0] * TIER_MULTIPLIER[tier]) : 0}
          squares={"🟩".repeat(Math.min(ROUNDS, 10))}
          onExit={onExit}
        />
      </div>
    );
  }

  if (!current) return null;
  const wasCorrect = isAnswered && chosen === current.city.id;

  return (
    <div className="min-h-dvh flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <GameBackButton onExit={onExit} />
        <h1 className="font-pixel text-[10px] text-arcade-neon-green neon-text-green">URBAN LEGENDS</h1>
        <span className="font-pixel text-[9px] text-arcade-neon-yellow">{score}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-6 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between w-full">
          <p className="font-pixel text-[8px] text-gray-600">{idx + 1} / {ROUNDS} · {tier?.toUpperCase()}</p>
          <p className="font-pixel text-[8px] text-arcade-neon-yellow">
            WORTH {tier ? Math.round(CLUE_POINTS[cluesShown] * TIER_MULTIPLIER[tier]) : 0} PTS
          </p>
        </div>

        {/* Skyline silhouette — the star of the show */}
        <div
          key={current.city.id}
          className="w-full h-44 sm:h-52 border border-arcade-neon-green shadow-neon-green bg-arcade-surface p-3 flex items-center justify-center"
          style={{ animation: "fadeUp 0.25s ease-out" }}
        >
          <SkylineImage city={current.city} />
        </div>

        <p className="font-pixel text-[9px] text-gray-400 tracking-[0.3em]">WHICH CITY IS THIS?</p>

        {/* Options — available immediately */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {current.options.map((city) => {
            const isCorrectOpt = city.id === current.city.id;
            const isChosen = chosen === city.id;
            let cls = "border-arcade-border text-gray-300 enabled:hover:border-arcade-neon-green enabled:hover:text-arcade-neon-green";
            if (isAnswered) {
              if (isCorrectOpt) cls = "border-arcade-neon-green text-arcade-neon-green bg-arcade-neon-green/10";
              else if (isChosen) cls = "border-red-500 text-red-400 bg-red-500/10";
            }
            return (
              <button
                key={city.id}
                onClick={() => handleAnswer(city.id)}
                disabled={isAnswered}
                className={`py-3 px-3 border font-mono text-sm active:scale-95 transition-all disabled:cursor-default ${cls}`}
              >
                {city.name}
              </button>
            );
          })}
        </div>

        {/* Clues — hidden behind REVEAL, each reveal costs potential points */}
        {(cluesShown > 0 || !isAnswered) && (
          <div className="w-full border border-arcade-border bg-arcade-surface p-4 space-y-3">
            {current.city.clues.slice(0, cluesShown).map((clue, i) => (
              <p key={i} className="font-mono text-sm text-gray-300 leading-relaxed" style={{ animation: "fadeUp 0.25s ease-out" }}>
                <span className="text-arcade-neon-green mr-2">{i + 1}▸</span>{clue}
              </p>
            ))}
            {!isAnswered && cluesShown < 3 && tier && (
              <button
                onClick={revealClue}
                className="flex items-center gap-2 font-pixel text-[8px] text-gray-500 border border-arcade-border px-3 py-2 hover:text-arcade-neon-yellow hover:border-arcade-neon-yellow active:scale-95 transition-all min-h-[44px]"
              >
                <Lightbulb size={10} />
                REVEAL CLUE (DROPS TO {Math.round(CLUE_POINTS[cluesShown + 1] * TIER_MULTIPLIER[tier])} PTS)
              </button>
            )}
          </div>
        )}

        {/* Fun fact + next */}
        {isAnswered && (
          <div className="w-full space-y-3" style={{ animation: "fadeUp 0.25s ease-out" }}>
            <p className={`font-pixel text-[10px] text-center ${wasCorrect ? "text-arcade-neon-green neon-text-green" : "text-red-400"}`}>
              {wasCorrect ? "CORRECT!" : `IT WAS ${current.city.name.toUpperCase()} ${current.city.emoji}`}
            </p>
            <div className="border border-arcade-border bg-arcade-surface p-4">
              <p className="font-pixel text-[7px] text-arcade-neon-yellow mb-2 tracking-widest">FUN FACT</p>
              <p className="font-mono text-sm text-gray-400 leading-relaxed">{current.city.funFact}</p>
            </div>
            <button
              onClick={nextRound}
              className="w-full py-2 font-pixel text-[9px] border border-arcade-neon-green text-arcade-neon-green hover:bg-arcade-neon-green hover:text-black transition-all"
            >
              {idx + 1 >= ROUNDS ? "FINISH" : "NEXT CITY →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
