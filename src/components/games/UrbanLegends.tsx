"use client";

import { useState, useCallback, useRef } from "react";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { CITIES, type CityEntry, type CityTier } from "@/data/cities";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { sfx } from "@/lib/sfx";

const ROUNDS = 6;
const CLUE_POINTS = [300, 200, 100]; // points by number of clues revealed
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRounds(tier: CityTier): Round[] {
  const pool = CITIES.filter((c) => c.tier === tier);
  const picked = shuffle(pool).slice(0, ROUNDS);
  return picked.map((city) => ({
    city,
    options: shuffle([city, ...shuffle(pool.filter((c) => c.id !== city.id)).slice(0, 3)]),
  }));
}

export default function UrbanLegends({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const [tier, setTier] = useState<CityTier | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [idx, setIdx] = useState(0);
  const [cluesShown, setCluesShown] = useState(1);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"pick-tier" | "playing" | "done">("pick-tier");

  const scoreSavedRef = useRef(false);
  const isAnswered = chosen !== null;
  const current = rounds[idx];

  const startTier = useCallback((t: CityTier) => {
    sfx.click();
    setTier(t);
    setRounds(buildRounds(t));
    setIdx(0);
    setCluesShown(1);
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
      const pts = Math.round(CLUE_POINTS[cluesShown - 1] * TIER_MULTIPLIER[tier]);
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
      setCluesShown(1);
      setChosen(null);
    }
  }, [idx, rounds.length, score]);

  // ——— Tier select ———
  if (status === "pick-tier") {
    return (
      <div className="min-h-screen flex flex-col bg-arcade-bg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
          <button onClick={onExit} className="flex items-center gap-2 font-pixel text-[9px] text-gray-500 hover:text-white transition-colors">
            <ArrowLeft size={12} /> ARCADE
          </button>
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
                className={`flex flex-col gap-3 p-6 bg-arcade-surface border ${border} hover:scale-105 transition-transform text-left`}
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-green neon-text-green">URBAN LEGENDS</h1>
        <div className="border border-arcade-neon-green p-10 text-center space-y-3">
          <p className="font-pixel text-[8px] text-gray-500">FINAL SCORE</p>
          <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{score}</p>
          <p className="font-pixel text-[8px] text-gray-500">{ROUNDS} CITIES · {tier?.toUpperCase()}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="py-2 px-4 font-pixel text-[9px] border border-arcade-neon-green text-arcade-neon-green hover:bg-arcade-neon-green hover:text-black transition-all">
            PLAY AGAIN
          </button>
          <button onClick={onExit} className="py-2 px-4 font-pixel text-[9px] border border-arcade-border text-gray-500 hover:text-white hover:border-white transition-all">
            ARCADE
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const wasCorrect = isAnswered && chosen === current.city.id;

  return (
    <div className="min-h-screen flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <button onClick={onExit} className="flex items-center gap-2 font-pixel text-[9px] text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={12} /> ARCADE
        </button>
        <h1 className="font-pixel text-[10px] text-arcade-neon-green neon-text-green">URBAN LEGENDS</h1>
        <span className="font-pixel text-[9px] text-arcade-neon-yellow">{score}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between w-full">
          <p className="font-pixel text-[8px] text-gray-600">{idx + 1} / {ROUNDS} · {tier?.toUpperCase()}</p>
          <p className="font-pixel text-[8px] text-arcade-neon-yellow">
            WORTH {tier ? Math.round(CLUE_POINTS[cluesShown - 1] * TIER_MULTIPLIER[tier]) : 0} PTS
          </p>
        </div>

        {/* Clues */}
        <div className="w-full border border-arcade-neon-green shadow-neon-green p-5 space-y-4">
          <p className="font-pixel text-[8px] text-gray-500 tracking-[0.3em]">WHICH CITY?</p>
          {current.city.clues.slice(0, cluesShown).map((clue, i) => (
            <p key={i} className="font-mono text-base text-gray-300 leading-relaxed" style={{ animation: "fadeUp 0.25s ease-out" }}>
              <span className="text-arcade-neon-green mr-2">{i + 1}▸</span>{clue}
            </p>
          ))}
          {!isAnswered && cluesShown < 3 && (
            <button
              onClick={revealClue}
              className="flex items-center gap-2 font-pixel text-[8px] text-gray-500 border border-arcade-border px-3 py-2 hover:text-arcade-neon-yellow hover:border-arcade-neon-yellow transition-colors"
            >
              <Lightbulb size={10} /> REVEAL CLUE ({CLUE_POINTS[cluesShown]} PTS)
            </button>
          )}
        </div>

        {/* Options */}
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
                className={`py-3 px-3 border font-mono text-sm transition-all disabled:cursor-default ${cls}`}
              >
                {city.name}
              </button>
            );
          })}
        </div>

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
