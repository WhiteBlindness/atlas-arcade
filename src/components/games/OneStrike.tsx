"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ArrowLeft, Skull } from "lucide-react";
import { COUNTRIES, type Country } from "@/data/countries";
import { COUNTRY_META } from "@/data/countryMeta";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { sfx } from "@/lib/sfx";

// Sudden death: the timer shrinks as the streak grows. One wrong answer ends the run.
const BASE_TIME = 6;
const MIN_TIME = 2.5;
const TIME_STEP = 0.35; // seconds removed every 5 questions

type QuestionKind = "capital" | "flag" | "reverse-capital";

interface Question {
  kind: QuestionKind;
  prompt: string;       // capital name, or empty for flag questions
  alpha2?: string;      // for flag questions
  correct: Country;
  options: Country[];
  optionLabels?: string[]; // for reverse-capital: capital names aligned with options
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const flagUrl = (alpha2: string) => `https://flagcdn.com/w160/${alpha2}.webp`;

function makeQuestion(pool: Country[]): Question {
  const kind: QuestionKind = (["capital", "flag", "reverse-capital"] as const)[Math.floor(Math.random() * 3)];
  const correct = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(pool.filter((c) => c.numeric !== correct.numeric)).slice(0, 3);
  const options = shuffle([correct, ...distractors]);

  if (kind === "capital") {
    return { kind, prompt: COUNTRY_META[correct.numeric].capital, correct, options };
  }
  if (kind === "flag") {
    return { kind, prompt: "", alpha2: COUNTRY_META[correct.numeric].alpha2, correct, options };
  }
  // reverse-capital: show country, pick its capital
  return {
    kind,
    prompt: correct.name,
    correct,
    options,
    optionLabels: options.map((c) => COUNTRY_META[c.numeric].capital),
  };
}

export default function OneStrike({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const pool = useMemo(() => COUNTRIES.filter((c) => COUNTRY_META[c.numeric]), []);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(pool));
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "done">("playing");

  const scoreSavedRef = useRef(false);
  const isAnswered = chosen !== null;

  const timePerQuestion = Math.max(MIN_TIME, BASE_TIME - Math.floor(streak / 5) * TIME_STEP);

  // Preload next flag batch lazily — cheap: preload one random flag each question
  useEffect(() => {
    const c = pool[Math.floor(Math.random() * pool.length)];
    const img = new Image();
    img.src = flagUrl(COUNTRY_META[c.numeric].alpha2);
  }, [streak, pool]);

  // Sudden-death timeout
  useEffect(() => {
    if (status !== "playing" || isAnswered) return;
    const id = setTimeout(() => {
      setChosen(-1);
      sfx.gameOver();
    }, timePerQuestion * 1000);
    return () => clearTimeout(id);
  }, [streak, status, isAnswered, timePerQuestion]);

  // Advance or end
  useEffect(() => {
    if (!isAnswered) return;
    const wasCorrect = chosen !== -1 && chosen === question.correct.numeric;
    const id = setTimeout(() => {
      if (!wasCorrect) setStatus("done");
      else {
        setQuestion(makeQuestion(pool));
        setChosen(null);
      }
    }, wasCorrect ? 500 : 1400);
    return () => clearTimeout(id);
  }, [isAnswered, chosen, question, pool]);

  useEffect(() => {
    if (status === "done" && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      saveHighScore("one-strike", score);
    }
  }, [status, score]);

  const handleAnswer = useCallback((numeric: number) => {
    if (isAnswered || status !== "playing") return;
    setChosen(numeric);
    if (numeric === question.correct.numeric) {
      const pts = 100 + Math.min(streak, 20) * 10;
      setStreak((s) => s + 1);
      setScore((s) => s + pts);
      addScore(pts);
      sfx.correct();
    } else {
      sfx.gameOver();
    }
  }, [isAnswered, status, question, streak, addScore]);

  if (status === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-yellow neon-text-yellow">ONE STRIKE</h1>
        <div className="border border-arcade-neon-yellow p-10 text-center space-y-3">
          <Skull size={28} className="mx-auto text-arcade-neon-red" />
          <p className="font-pixel text-[8px] text-gray-500">SURVIVED {streak} QUESTIONS</p>
          <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{score}</p>
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

  const isLastCorrect = isAnswered && chosen !== -1 && chosen === question.correct.numeric;

  return (
    <div className="min-h-screen flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <button onClick={onExit} className="flex items-center gap-2 font-pixel text-[9px] text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={12} /> ARCADE
        </button>
        <h1 className="font-pixel text-[10px] text-arcade-neon-yellow neon-text-yellow">ONE STRIKE</h1>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[9px] text-arcade-neon-yellow">{score}</span>
          <div className="flex items-center gap-1 text-arcade-neon-red">
            <Skull size={10} />
            <span className="font-pixel text-[9px]">{streak}</span>
          </div>
        </div>
      </div>

      {!isAnswered && (
        <div key={`tb-${streak}`} className="h-1.5 bg-arcade-border overflow-hidden">
          <div className="h-full w-full origin-left" style={{ backgroundColor: "#ff3333", animation: `shrinkBar ${timePerQuestion}s linear forwards` }} />
        </div>
      )}
      {isAnswered && (
        <div className="h-1.5" style={{ backgroundColor: isLastCorrect ? "#00ff41" : "#ef4444" }} />
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6 max-w-md mx-auto w-full">
        <p className="font-pixel text-[8px] text-gray-600 self-end">NO MISTAKES ALLOWED</p>

        {question.kind === "flag" ? (
          <div className={`border-2 transition-colors ${
            !isAnswered ? "border-arcade-neon-yellow shadow-neon-yellow"
            : isLastCorrect ? "border-arcade-neon-green shadow-neon-green"
            : "border-red-500"
          }`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flagUrl(question.alpha2!)} alt="Flag" width={320} height={213} className="block w-80 max-w-full" loading="eager" decoding="async" />
          </div>
        ) : (
          <div className="text-center space-y-3 w-full border border-arcade-neon-yellow shadow-neon-yellow p-6">
            <p className="font-pixel text-[8px] text-gray-500 tracking-[0.3em]">
              {question.kind === "capital" ? "CAPITAL OF?" : "CAPITAL IS?"}
            </p>
            <h2 className="font-pixel text-lg text-arcade-neon-yellow neon-text-yellow leading-tight">
              {question.prompt}
            </h2>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 w-full">
          {question.options.map((country, i) => {
            const isCorrectOpt = country.numeric === question.correct.numeric;
            const isChosen = chosen === country.numeric;
            const label = question.optionLabels ? question.optionLabels[i] : country.name;

            let cls = "border-arcade-border text-gray-300 enabled:hover:border-arcade-neon-yellow enabled:hover:text-arcade-neon-yellow";
            if (isAnswered) {
              if (isCorrectOpt) cls = "border-arcade-neon-green text-arcade-neon-green bg-arcade-neon-green/10";
              else if (isChosen) cls = "border-red-500 text-red-400 bg-red-500/10";
            }

            return (
              <button
                key={country.numeric}
                onClick={() => handleAnswer(country.numeric)}
                disabled={isAnswered}
                className={`py-3 px-3 border font-mono text-sm transition-all disabled:cursor-default ${cls}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {isAnswered && !isLastCorrect && (
          <p className="font-pixel text-[10px] text-red-400">
            {chosen === -1 ? "TIME!" : "WRONG!"} → {question.kind === "reverse-capital" ? COUNTRY_META[question.correct.numeric].capital : question.correct.name}
          </p>
        )}
      </div>
    </div>
  );
}
