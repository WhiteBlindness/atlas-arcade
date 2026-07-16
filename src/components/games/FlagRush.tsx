"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Zap, Shield } from "lucide-react";
import { COUNTRIES, type Country } from "@/data/countries";
import { COUNTRY_META } from "@/data/countryMeta";
import { splitByDifficulty, tierForLevel, type Difficulty } from "@/data/difficulty";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { gameRng, seededShuffle, seededPick, type Rng } from "@/lib/daily";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { sfx } from "@/lib/sfx";

const QUESTION_TIME = 8;
const DAILY_LEVELS = 10;

const TIER_LABEL: Record<Difficulty, string> = { easy: "EASY", medium: "MEDIUM", hard: "HARD" };
const TIER_COLOR: Record<Difficulty, string> = { easy: "#00ff41", medium: "#ffe600", hard: "#ff00ff" };

interface FlagQuestion {
  correct: Country;
  alpha2: string;
  options: Country[];
  tier: Difficulty;
}

const flagUrl = (alpha2: string) => `https://flagcdn.com/w160/${alpha2}.webp`;

export default function FlagRush({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const mode = useGameStore((s) => s.mode);
  const isDaily = mode === "daily";

  const tiers = useMemo(() => splitByDifficulty(COUNTRIES.filter((c) => COUNTRY_META[c.numeric])), []);
  const allPool = useMemo(() => COUNTRIES.filter((c) => COUNTRY_META[c.numeric]), []);

  const rngRef = useRef<Rng>(gameRng("flag-rush", useGameStore.getState().mode));
  const usedRef = useRef<Set<number>>(new Set());

  const makeQuestion = useCallback((level: number): FlagQuestion => {
    const tier = tierForLevel(level, useGameStore.getState().mode);
    const rng = rngRef.current;
    const pool = tiers[tier];
    let available = pool.filter((c) => !usedRef.current.has(c.numeric));
    if (available.length === 0) available = pool;
    const correct = seededPick(available, rng);
    usedRef.current.add(correct.numeric);
    let distractors = seededShuffle(pool.filter((c) => c.numeric !== correct.numeric), rng).slice(0, 3);
    if (distractors.length < 3) {
      const extra = seededShuffle(
        allPool.filter((c) => c.numeric !== correct.numeric && !distractors.some((d) => d.numeric === c.numeric)),
        rng
      ).slice(0, 3 - distractors.length);
      distractors = [...distractors, ...extra];
    }
    return {
      correct,
      alpha2: COUNTRY_META[correct.numeric].alpha2,
      options: seededShuffle([correct, ...distractors], rng),
      tier,
    };
  }, [tiers, allPool]);

  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState<FlagQuestion>(() => makeQuestion(1));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "done">("playing");

  const questionStartRef = useRef(Date.now());
  const scoreSavedRef = useRef(false);
  const isAnswered = chosen !== null;

  useEffect(() => { questionStartRef.current = Date.now(); }, [level]);

  // Preload the next level's likely flags (cheap: one random from next tier)
  useEffect(() => {
    const tier = tierForLevel(level + 1, mode);
    const pool = tiers[tier];
    if (pool.length === 0) return;
    const img = new Image();
    img.src = flagUrl(COUNTRY_META[pool[Math.floor(Math.random() * pool.length)].numeric].alpha2);
  }, [level, mode, tiers]);

  // Sudden death timeout
  useEffect(() => {
    if (status !== "playing" || isAnswered) return;
    const id = setTimeout(() => { setChosen(-1); sfx.gameOver(); }, QUESTION_TIME * 1000);
    return () => clearTimeout(id);
  }, [level, status, isAnswered]);

  // Advance only on correct; one mistake ends the run
  useEffect(() => {
    if (!isAnswered) return;
    const wasCorrect = chosen !== -1 && chosen === question.correct.numeric;
    const id = setTimeout(() => {
      if (!wasCorrect) { setStatus("done"); return; }
      const next = level + 1;
      if (isDaily && next > DAILY_LEVELS) { setStatus("done"); return; }
      setLevel(next);
      setQuestion(makeQuestion(next));
      setChosen(null);
    }, wasCorrect ? 700 : 1400);
    return () => clearTimeout(id);
  }, [isAnswered, chosen, question, level, isDaily, makeQuestion]);

  useEffect(() => {
    if (status === "done" && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      saveHighScore("flag-rush", score);
    }
  }, [status, score]);

  const handleAnswer = useCallback((numeric: number) => {
    if (isAnswered || status !== "playing") return;
    setChosen(numeric);
    if (numeric === question.correct.numeric) {
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const speedBonus = Math.floor(50 * Math.max(0, (QUESTION_TIME - elapsed) / QUESTION_TIME));
      const newStreak = streak + 1;
      const streakBonus = Math.min(newStreak, 5) * 10;
      const pts = 100 + speedBonus + streakBonus;
      setStreak(newStreak);
      setScore((s) => s + pts);
      setCleared((c) => c + 1);
      addScore(pts);
      sfx.correct();
    } else {
      sfx.gameOver();
    }
  }, [isAnswered, status, question, streak, addScore]);

  if (status === "done") {
    const dailyComplete = isDaily && cleared >= DAILY_LEVELS;
    const performance = 0.6 * (cleared / DAILY_LEVELS) + 0.4 * Math.min(1, score / (DAILY_LEVELS * 180));
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-yellow neon-text-yellow">FLAG FRENZY</h1>
        <div className="border border-arcade-neon-yellow p-10 text-center space-y-3">
          <p className="font-pixel text-[9px] text-gray-500">
            {dailyComplete ? "DAILY COMPLETE!" : "GAME OVER"}
          </p>
          <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{score}</p>
          <p className="font-pixel text-[8px] text-gray-500">
            {cleared} {isDaily ? `/ ${DAILY_LEVELS}` : ""} LEVELS CLEARED
          </p>
          <DailyPercentile performance={performance} />
        </div>
        <EndScreenActions
          slug="flag-rush"
          gameTitle="FLAG FRENZY"
          score={score}
          performance={performance}
          squares={"🟩".repeat(Math.min(cleared, 10)) + (dailyComplete ? "" : "🟥")}
          onExit={onExit}
        />
      </div>
    );
  }

  const isLastCorrect = isAnswered && chosen !== -1 && chosen === question.correct.numeric;

  return (
    <div className="min-h-dvh flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <GameBackButton onExit={onExit} />
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
        <div key={`tb-${level}`} className="h-3 bg-arcade-border overflow-hidden">
          <div className="h-full w-full origin-left" style={{ backgroundColor: "#ffe600", animation: `shrinkBar ${QUESTION_TIME}s linear forwards` }} />
        </div>
      )}
      {isAnswered && (
        <div className="h-3" style={{ backgroundColor: isLastCorrect ? "#00ff41" : "#ef4444" }} />
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between w-full">
          <p className="font-pixel text-[8px] text-gray-600">
            LEVEL {level}{isDaily ? ` / ${DAILY_LEVELS}` : ""}
          </p>
          <p className="flex items-center gap-1 font-pixel text-[8px]" style={{ color: TIER_COLOR[question.tier] }}>
            <Shield size={10} /> {TIER_LABEL[question.tier]}
          </p>
        </div>

        <div className={`border-2 transition-colors ${
          !isAnswered ? "border-arcade-neon-yellow shadow-neon-yellow"
          : isLastCorrect ? "border-arcade-neon-green shadow-neon-green"
          : "border-red-500"
        }`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(question.alpha2)}
            alt="Flag"
            width={320}
            height={213}
            className="block w-80 max-w-full"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {question.options.map((country) => {
            const isCorrectOpt = country.numeric === question.correct.numeric;
            const isChosen = chosen === country.numeric;

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
                {country.name}
              </button>
            );
          })}
        </div>

        {isAnswered && !isLastCorrect && (
          <p className="font-pixel text-[9px] text-red-400">
            {chosen === -1 ? "TIME!" : "WRONG!"} → {question.correct.name}
          </p>
        )}
        <p className="font-pixel text-[7px] text-gray-700 tracking-widest">ONE MISTAKE ENDS THE RUN</p>
      </div>
    </div>
  );
}
