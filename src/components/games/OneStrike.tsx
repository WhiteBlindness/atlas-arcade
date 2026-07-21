"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Skull } from "lucide-react";
import { COUNTRIES, type Country } from "@/data/countries";
import { COUNTRY_META } from "@/data/countryMeta";
import { POP_TRIVIA } from "@/data/popTrivia";
import { useT } from "@/lib/i18n";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { sfx } from "@/lib/sfx";
import { gameRng, seededShuffle, seededPick, createSeededRng, type Rng } from "@/lib/daily";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import type { MashupProps } from "./mashup";
import { MashupQuiz } from "./MashupShell";

// Sudden death: the timer shrinks as the streak grows. One wrong answer ends the run.
const BASE_TIME = 6;
const MIN_TIME = 2.5;
const TIME_STEP = 0.35; // seconds removed every 5 questions

type QuestionKind = "capital" | "flag" | "reverse-capital" | "trivia";

interface Question {
  kind: QuestionKind;
  prompt: string;       // capital name, or empty for flag questions
  alpha2?: string;      // for flag questions
  correct: Country;
  options: Country[];
  optionLabels?: string[]; // for reverse-capital: capital names aligned with options
  source?: string;         // for trivia: the show name
}

const flagUrl = (alpha2: string) => `https://flagcdn.com/w160/${alpha2}.webp`;

// Pop-culture trivia reuses the country-answer machinery via lightweight
// "fake" Country options (numeric = option index), so nothing else changes.
function makeTrivia(rng: Rng): Question {
  const q = seededPick(POP_TRIVIA, rng);
  const options: Country[] = seededShuffle(q.options, rng).map((label, i) => ({ name: label, pt: label, es: label, numeric: i, lat: 0, lng: 0, population: 0, code: "" }));
  const correct = options.find((o) => o.name === q.answer) ?? options[0];
  return { kind: "trivia", prompt: q.prompt, correct, options, source: q.source };
}

function makeQuestion(pool: Country[], rng: Rng): Question {
  // ~1 in 4 questions is a pop-culture geography curveball.
  if (rng() < 0.25) return makeTrivia(rng);

  const kind = seededPick(["capital", "flag", "reverse-capital"] as const, rng);
  const correct = seededPick(pool, rng);
  const distractors = seededShuffle(pool.filter((c) => c.numeric !== correct.numeric), rng).slice(0, 3);
  const options = seededShuffle([correct, ...distractors], rng);

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

export default function OneStrike({ onExit, isMashupMode, onMashupComplete, mashupSeed }: { onExit: () => void } & MashupProps) {
  if (isMashupMode && onMashupComplete) {
    return <OneStrikeMashup mashupSeed={mashupSeed} onMashupComplete={onMashupComplete} />;
  }
  return <OneStrikeStandalone onExit={onExit} />;
}

function OneStrikeStandalone({ onExit }: { onExit: () => void }) {
  const t = useT();
  const { addScore } = useGameStore();
  const pool = useMemo(() => COUNTRIES.filter((c) => COUNTRY_META[c.numeric]), []);
  // persistent rng: in daily mode the whole question sequence is shared globally
  const rngRef = useRef<Rng>(gameRng("one-strike", useGameStore.getState().mode));
  const [question, setQuestion] = useState<Question>(() => makeQuestion(pool, rngRef.current));
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
        setQuestion(makeQuestion(pool, rngRef.current));
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
      <div className="min-h-dvh flex flex-col items-center justify-start pt-8 md:justify-center md:pt-0 gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-red neon-text-red">ONE STRIKE</h1>
        <div className="border border-arcade-neon-red p-10 text-center space-y-3">
          <Skull size={28} className="mx-auto text-arcade-neon-red" />
          <p className="font-pixel text-[8px] text-gray-500">{t("igSurvived").replace("{X}", String(streak))}</p>
          <p className="font-pixel text-4xl text-arcade-neon-red neon-text-red">{score}</p>
          <DailyPercentile performance={Math.min(1, streak / 15)} />
        </div>
        <EndScreenActions
          slug="one-strike"
          gameTitle="ONE STRIKE"
          score={score}
          performance={Math.min(1, streak / 15)}
          squares={"🟩".repeat(Math.min(streak, 10)) + "🟥"}
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
        <h1 className="font-pixel text-[10px] text-arcade-neon-red neon-text-red">ONE STRIKE</h1>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[9px] text-arcade-neon-red">{score}</span>
          <div className="flex items-center gap-1 text-arcade-neon-red">
            <Skull size={10} />
            <span className="font-pixel text-[9px]">{streak}</span>
          </div>
        </div>
      </div>

      {!isAnswered && (
        <div key={`tb-${streak}`} className="h-3 bg-arcade-border overflow-hidden">
          <div className="h-full w-full origin-left" style={{ backgroundColor: "#ff3333", animation: `shrinkBar ${timePerQuestion}s linear forwards` }} />
        </div>
      )}
      {isAnswered && (
        <div className="h-3" style={{ backgroundColor: isLastCorrect ? "#00ff41" : "#ef4444" }} />
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6 max-w-md mx-auto w-full">
        <p className="font-pixel text-[8px] text-gray-600 self-end">{t("igNoMistakes")}</p>

        {question.kind === "flag" ? (
          <div className={`border-2 transition-colors ${
            !isAnswered ? "border-arcade-neon-red shadow-neon-red"
            : isLastCorrect ? "border-arcade-neon-green shadow-neon-green"
            : "border-red-500"
          }`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flagUrl(question.alpha2!)} alt="Flag" width={320} height={213} className="block w-80 max-w-full" loading="eager" decoding="async" />
          </div>
        ) : question.kind === "trivia" ? (
          <div className="text-center space-y-3 w-full border border-arcade-neon-magenta shadow-neon-magenta p-6">
            <p className="font-pixel text-[8px] text-arcade-neon-magenta neon-text-magenta tracking-[0.3em]">
              {t("igCatPopCulture")} · {question.source}
            </p>
            <h2 className="font-mono text-xl text-white leading-snug">
              {question.prompt}
            </h2>
          </div>
        ) : (
          <div className="text-center space-y-3 w-full border border-arcade-neon-red shadow-neon-red p-6">
            <p className="font-pixel text-[8px] text-gray-500 tracking-[0.3em]">
              {question.kind === "capital" ? t("igCapitalOf") : t("igCapitalIs")}
            </p>
            <h2 className="font-pixel text-lg text-arcade-neon-red neon-text-red leading-tight">
              {question.prompt}
            </h2>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 w-full">
          {question.options.map((country, i) => {
            const isCorrectOpt = country.numeric === question.correct.numeric;
            const isChosen = chosen === country.numeric;
            const label = question.optionLabels ? question.optionLabels[i] : country.name;

            let cls = "border-arcade-border text-gray-300 enabled:hover:border-arcade-neon-red enabled:hover:text-arcade-neon-red";
            if (isAnswered) {
              if (isCorrectOpt) cls = "border-arcade-neon-green text-arcade-neon-green bg-arcade-neon-green/10";
              else if (isChosen) cls = "border-red-500 text-red-400 bg-red-500/10";
            }

            return (
              <button
                key={country.numeric}
                onClick={() => handleAnswer(country.numeric)}
                disabled={isAnswered}
                className={`py-3 px-3 border font-mono text-sm active:scale-95 transition-all disabled:cursor-default ${cls}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {isAnswered && !isLastCorrect && (
          <p className="font-pixel text-[10px] text-red-400">
            {chosen === -1 ? t("igTime") : t("igWrong")} → {question.kind === "reverse-capital" ? COUNTRY_META[question.correct.numeric].capital : question.correct.name}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Atlas Jackpot round: one question, correct = success ────────────────────────
function OneStrikeMashup({ mashupSeed, onMashupComplete }: MashupProps) {
  const t = useT();
  const pool = useMemo(() => COUNTRIES.filter((c) => COUNTRY_META[c.numeric]), []);
  const [q] = useState(() => makeQuestion(pool, createSeededRng(mashupSeed ?? "one-strike")));

  const prompt = q.kind === "flag" ? (
    <div className="border-2 border-arcade-neon-red shadow-neon-red">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={flagUrl(q.alpha2!)} alt="Flag" width={320} height={213} className="block w-72 max-w-full" loading="eager" />
    </div>
  ) : q.kind === "trivia" ? (
    <div className="text-center space-y-3 w-full border border-arcade-neon-magenta shadow-neon-magenta p-6">
      <p className="font-pixel text-[8px] text-arcade-neon-magenta neon-text-magenta tracking-[0.3em]">{t("igCatPopCulture")} · {q.source}</p>
      <h2 className="font-mono text-xl text-white leading-snug">{q.prompt}</h2>
    </div>
  ) : (
    <div className="text-center space-y-3 w-full border border-arcade-neon-red shadow-neon-red p-6">
      <p className="font-pixel text-[8px] text-gray-500 tracking-[0.3em]">
        {q.kind === "capital" ? t("igCapitalOf") : t("igCapitalIs")}
      </p>
      <h2 className="font-pixel text-lg text-arcade-neon-red neon-text-red leading-tight">{q.prompt}</h2>
    </div>
  );

  return (
    <MashupQuiz
      prompt={prompt}
      options={q.options.map((c, i) => ({ key: c.numeric, label: q.optionLabels ? q.optionLabels[i] : c.name }))}
      correctKey={q.correct.numeric}
      onComplete={onMashupComplete!}
    />
  );
}
