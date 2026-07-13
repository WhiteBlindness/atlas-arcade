"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Zap } from "lucide-react";
import { COUNTRIES, type Country } from "@/data/countries";
import { COUNTRY_META } from "@/data/countryMeta";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { gameRng, seededShuffle, type Rng } from "@/lib/daily";

const QUESTION_TIME = 8;
const TOTAL_FLAGS = 20;

interface FlagQuestion {
  country: Country;
  alpha2: string;
  options: Country[];
}

function buildQuestions(rng: Rng): FlagQuestion[] {
  const pool = COUNTRIES.filter((c) => COUNTRY_META[c.numeric]);
  const selected = seededShuffle(pool, rng).slice(0, TOTAL_FLAGS);
  return selected.map((country) => {
    const distractors = seededShuffle(
      pool.filter((c) => c.numeric !== country.numeric),
      rng
    ).slice(0, 3);
    return {
      country,
      alpha2: COUNTRY_META[country.numeric].alpha2,
      options: seededShuffle([...distractors, country], rng),
    };
  });
}

const flagUrl = (alpha2: string) => `https://flagcdn.com/w160/${alpha2}.webp`;

export default function FlagRush({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const [questions] = useState<FlagQuestion[]>(() =>
    buildQuestions(gameRng("flag-rush", useGameStore.getState().mode))
  );
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "done">("playing");

  const questionStartRef = useRef(Date.now());
  const scoreSavedRef = useRef(false);
  const isAnswered = chosen !== null;
  const current = questions[idx];

  useEffect(() => { questionStartRef.current = Date.now(); }, [idx]);

  // Preload next flag
  useEffect(() => {
    const next = questions[idx + 1];
    if (!next) return;
    const img = new Image();
    img.src = flagUrl(next.alpha2);
  }, [idx, questions]);

  // Timeout
  useEffect(() => {
    if (status !== "playing" || isAnswered) return;
    const id = setTimeout(() => {
      setStreak(0);
      setChosen(-1);
    }, QUESTION_TIME * 1000);
    return () => clearTimeout(id);
  }, [idx, status, isAnswered]);

  // Advance
  useEffect(() => {
    if (!isAnswered) return;
    const id = setTimeout(() => {
      if (idx + 1 >= TOTAL_FLAGS) setStatus("done");
      else { setIdx((i) => i + 1); setChosen(null); }
    }, 900);
    return () => clearTimeout(id);
  }, [isAnswered, idx]);

  // Save
  useEffect(() => {
    if (status === "done" && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      saveHighScore("flag-rush", score);
    }
  }, [status, score]);

  const handleAnswer = useCallback((optionIdx: number) => {
    if (isAnswered || status !== "playing") return;
    const isCorrect = current.options[optionIdx].numeric === current.country.numeric;
    setChosen(optionIdx);

    if (isCorrect) {
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const speedBonus = Math.floor(50 * Math.max(0, (QUESTION_TIME - elapsed) / QUESTION_TIME));
      const newStreak = streak + 1;
      const streakBonus = Math.min(newStreak, 5) * 10;
      const pts = 100 + speedBonus + streakBonus;
      setStreak(newStreak);
      setScore((s) => s + pts);
      addScore(pts);
    } else {
      setStreak(0);
    }
  }, [isAnswered, status, current, streak, addScore]);

  if (status === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-yellow neon-text-yellow">FLAG FRENZY</h1>
        <div className="border border-arcade-neon-yellow p-10 text-center space-y-3">
          <p className="font-pixel text-[8px] text-gray-500">FINAL SCORE</p>
          <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{score}</p>
          <p className="font-pixel text-[8px] text-gray-500">{TOTAL_FLAGS} FLAGS</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="py-2 px-4 font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow hover:bg-arcade-neon-yellow hover:text-black transition-all">
            PLAY AGAIN
          </button>
          <button onClick={onExit} className="py-2 px-4 font-pixel text-[9px] border border-arcade-border text-gray-500 hover:text-white hover:border-white transition-all">
            ARCADE
          </button>
        </div>
      </div>
    );
  }

  const isLastCorrect = isAnswered && chosen !== -1 && current.options[chosen as number]?.numeric === current.country.numeric;

  return (
    <div className="min-h-screen flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <button onClick={onExit} className="flex items-center gap-2 font-pixel text-[9px] text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={12} /> ARCADE
        </button>
        <h1 className="font-pixel text-[10px] text-arcade-neon-yellow neon-text-yellow">FLAG FRENZY</h1>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[9px] text-arcade-neon-yellow">{score}</span>
          {streak >= 2 && (
            <div className="flex items-center gap-1 text-arcade-neon-green">
              <Zap size={10} className="fill-current" />
              <span className="font-pixel text-[9px]">{streak}×</span>
            </div>
          )}
        </div>
      </div>

      {!isAnswered && (
        <div key={`tb-${idx}`} className="h-1.5 bg-arcade-border overflow-hidden">
          <div className="h-full w-full origin-left" style={{ backgroundColor: "#ffe600", animation: `shrinkBar ${QUESTION_TIME}s linear forwards` }} />
        </div>
      )}
      {isAnswered && (
        <div className="h-1.5" style={{ backgroundColor: isLastCorrect ? "#00ff41" : "#ef4444" }} />
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6 max-w-md mx-auto w-full">
        <p className="font-pixel text-[8px] text-gray-600 self-end">{idx + 1} / {TOTAL_FLAGS}</p>

        <div className={`border-2 transition-colors ${
          !isAnswered ? "border-arcade-neon-yellow shadow-neon-yellow"
          : isLastCorrect ? "border-arcade-neon-green shadow-neon-green"
          : "border-red-500"
        }`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(current.alpha2)}
            alt="Flag"
            width={320}
            height={213}
            className="block w-80 max-w-full"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {current.options.map((country, i) => {
            const isCorrectOpt = country.numeric === current.country.numeric;
            const isChosen = chosen === i;

            let cls = "border-arcade-border text-gray-300 enabled:hover:border-arcade-neon-yellow enabled:hover:text-arcade-neon-yellow";
            if (isAnswered) {
              if (isCorrectOpt) cls = "border-arcade-neon-green text-arcade-neon-green bg-arcade-neon-green/10";
              else if (isChosen) cls = "border-red-500 text-red-400 bg-red-500/10";
            }

            return (
              <button
                key={country.numeric}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered}
                className={`py-3 px-3 border font-mono text-sm transition-all disabled:cursor-default ${cls}`}
              >
                {country.name}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <p className={`font-pixel text-[10px] ${isLastCorrect ? "text-arcade-neon-green neon-text-green" : "text-red-400"}`}>
            {chosen === -1
              ? `TIME! → ${current.country.name}`
              : isLastCorrect
                ? streak >= 2 ? `+${streak}× STREAK!` : "CORRECT!"
                : `WRONG → ${current.country.name}`}
          </p>
        )}
      </div>
    </div>
  );
}
