"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { COUNTRIES, type Country } from "@/data/countries";
import { COUNTRY_META } from "@/data/countryMeta";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";

const QUESTION_TIME = 7;
const TOTAL_QUESTIONS = 10;
const START_LIVES = 3;

interface Question {
  correct: Country;
  capital: string;
  options: Country[];
}

function buildQuestions(): Question[] {
  const pool = COUNTRIES.filter((c) => COUNTRY_META[c.numeric]);
  const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
  return selected.map((correct) => {
    const distractors = pool
      .filter((c) => c.numeric !== correct.numeric)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return {
      correct,
      capital: COUNTRY_META[correct.numeric].capital,
      options: [...distractors, correct].sort(() => Math.random() - 0.5),
    };
  });
}

export default function CapitalInvaders({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const [questions] = useState<Question[]>(buildQuestions);
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "done">("playing");

  const livesRef = useRef(START_LIVES);
  const questionStartRef = useRef(Date.now());
  const scoreSavedRef = useRef(false);
  const isAnswered = chosen !== null;
  const current = questions[idx];

  useEffect(() => { questionStartRef.current = Date.now(); }, [idx]);

  // Timeout — cancelled automatically when isAnswered becomes true
  useEffect(() => {
    if (status !== "playing" || isAnswered) return;
    const id = setTimeout(() => {
      livesRef.current -= 1;
      setLives(livesRef.current);
      setChosen(-1);
    }, QUESTION_TIME * 1000);
    return () => clearTimeout(id);
  }, [idx, status, isAnswered]);

  // Advance after answer shown
  useEffect(() => {
    if (!isAnswered) return;
    const id = setTimeout(() => {
      const nextIdx = idx + 1;
      if (nextIdx >= TOTAL_QUESTIONS || livesRef.current <= 0) {
        setStatus("done");
      } else {
        setIdx(nextIdx);
        setChosen(null);
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [isAnswered, idx]);

  // Save score on done
  useEffect(() => {
    if (status === "done" && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      saveHighScore("capital-invaders", score);
    }
  }, [status, score]);

  const handleAnswer = useCallback((optionIdx: number) => {
    if (isAnswered || status !== "playing") return;
    const isCorrect = current.options[optionIdx].numeric === current.correct.numeric;
    setChosen(optionIdx);

    if (isCorrect) {
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const speedBonus = Math.floor(70 * Math.max(0, (QUESTION_TIME - elapsed) / QUESTION_TIME));
      const pts = 100 + speedBonus;
      setScore((s) => s + pts);
      addScore(pts);
    } else {
      livesRef.current -= 1;
      setLives(livesRef.current);
    }
  }, [isAnswered, status, current, addScore]);

  if (status === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-magenta neon-text-magenta">CAPITAL STRIKE</h1>
        <div className="border border-arcade-neon-magenta p-10 text-center space-y-3">
          <p className="font-pixel text-[8px] text-gray-500">FINAL SCORE</p>
          <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{score}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="py-2 px-4 font-pixel text-[9px] border border-arcade-neon-magenta text-arcade-neon-magenta hover:bg-arcade-neon-magenta hover:text-black transition-all">
            PLAY AGAIN
          </button>
          <button onClick={onExit} className="py-2 px-4 font-pixel text-[9px] border border-arcade-border text-gray-500 hover:text-white hover:border-white transition-all">
            ARCADE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <button onClick={onExit} className="flex items-center gap-2 font-pixel text-[9px] text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={12} /> ARCADE
        </button>
        <h1 className="font-pixel text-[10px] text-arcade-neon-magenta neon-text-magenta">CAPITAL STRIKE</h1>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[9px] text-arcade-neon-yellow">{score}</span>
          <div className="flex gap-1">
            {Array.from({ length: START_LIVES }).map((_, i) => (
              <Heart key={i} size={10} className={i < lives ? "fill-red-500 text-red-500" : "fill-gray-800 text-gray-800"} />
            ))}
          </div>
        </div>
      </div>

      {!isAnswered && (
        <div key={`tb-${idx}`} className="h-1 bg-arcade-border overflow-hidden">
          <div className="h-full w-full origin-left" style={{ backgroundColor: "#00ff41", animation: `shrinkBar ${QUESTION_TIME}s linear forwards` }} />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 py-8 max-w-md mx-auto w-full">
        <p className="font-pixel text-[8px] text-gray-600 self-end">{idx + 1} / {TOTAL_QUESTIONS}</p>

        <div className="text-center space-y-3 w-full border border-arcade-neon-magenta shadow-neon-magenta p-6">
          <p className="font-pixel text-[8px] text-gray-500 tracking-[0.3em]">CAPITAL OF?</p>
          <h2 className="font-pixel text-lg text-arcade-neon-magenta neon-text-magenta leading-tight">
            {current.capital}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {current.options.map((country, i) => {
            const isCorrectOpt = country.numeric === current.correct.numeric;
            const isChosen = chosen === i;

            let cls = "border-arcade-border text-gray-300 enabled:hover:border-arcade-neon-magenta enabled:hover:text-arcade-neon-magenta";
            if (isAnswered) {
              if (isCorrectOpt) cls = "border-arcade-neon-green text-arcade-neon-green bg-arcade-neon-green/10";
              else if (isChosen) cls = "border-red-500 text-red-400 bg-red-500/10";
            }

            return (
              <button
                key={country.numeric}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered}
                className={`py-4 px-3 border font-mono text-sm transition-all disabled:cursor-default ${cls}`}
              >
                {country.name}
              </button>
            );
          })}
        </div>

        {chosen === -1 && (
          <p className="font-pixel text-[9px] text-red-400 animate-blink">TIME!</p>
        )}
      </div>
    </div>
  );
}
