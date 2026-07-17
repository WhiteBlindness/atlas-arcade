"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PEAKS_ENTRIES, type PeaksEntry, type PeaksCategory } from "@/data/peaksValleys";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { gameRng, seededShuffle, createSeededRng } from "@/lib/daily";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import type { MashupProps } from "./mashup";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pointsFor(streak: number) {
  return 100 + streak * 50;
}

const CAT_COLOR: Record<PeaksCategory, string> = {
  mountain: "#00d4ff",
  river:    "#00ff41",
  country:  "#ffe600",
  city:     "#ff00ff",
  ocean:    "#0099ff",
  lake:     "#44aaff",
  desert:   "#ff8800",
  wonder:   "#bb44ff",
  nature:   "#00ff99",
};

// ── Entry card ────────────────────────────────────────────────────────────────

type Phase = "input" | "correct" | "wrong";

interface CardProps {
  entry: PeaksEntry;
  revealed: boolean;
  phase: Phase;
  isRight?: boolean;
  onHigher?: () => void;
  onLower?: () => void;
}

function EntryCard({ entry, revealed, phase, isRight, onHigher, onLower }: CardProps) {
  const accent = CAT_COLOR[entry.category];
  const resultColor = phase === "correct" ? "#00ff41" : "#ff3333";
  const valueBorderColor = isRight && revealed ? resultColor : isRight ? "#1a1a2e" : accent;
  const valueGlow =
    isRight && revealed
      ? `0 0 18px ${resultColor}55`
      : isRight
      ? "none"
      : `0 0 6px ${accent}33`;

  return (
    <div
      className={`relative flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8 lg:px-10 overflow-hidden${
        isRight ? " animate-[slideFromRight_0.38s_ease-out]" : ""
      }`}
    >
      {/* Background photo with dark overlay to keep arcade contrast */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.imageUrl}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover opacity-25 select-none pointer-events-none"
        style={{ filter: "grayscale(0.6) contrast(1.1)" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, #080810cc 0%, #08081088 45%, #080810e6 100%)" }} />

      <span className="relative text-5xl select-none" role="img" aria-label={entry.category}>
        {entry.emoji}
      </span>

      <div className="relative text-center space-y-1 max-w-xs">
        <p
          className="font-pixel text-[8px] lg:text-[9px] leading-relaxed"
          style={{ color: accent }}
        >
          {entry.label.toUpperCase()}
        </p>
        <p className="font-mono text-sm text-gray-500">{entry.sublabel}</p>
      </div>

      {/* Value box */}
      <div
        className="relative w-full max-w-[260px] border p-5 text-center transition-colors duration-300 bg-black/40"
        style={{ borderColor: valueBorderColor, boxShadow: valueGlow }}
      >
        {revealed ? (
          <div className="animate-[fadeUp_0.22s_ease-out] space-y-1">
            <p className="font-pixel text-base lg:text-lg" style={{ color: accent }}>
              {entry.displayValue}
            </p>
            <p className="font-mono text-xs text-gray-500 mt-1">{entry.unit}</p>
          </div>
        ) : (
          <p className="font-pixel text-4xl text-gray-700 animate-blink select-none">?</p>
        )}
      </div>

      {/* Buttons — right card, pre-reveal */}
      {isRight && !revealed && (
        <div className="relative flex flex-col gap-3 w-full max-w-[260px]">
          <button
            onClick={onHigher}
            className="flex items-center justify-center gap-2 py-3 font-pixel text-[8px] border border-arcade-neon-green text-arcade-neon-green neon-text-green hover:bg-arcade-neon-green hover:text-black active:scale-95 transition-all tracking-widest"
          >
            <TrendingUp size={12} /> HIGHER
          </button>
          <button
            onClick={onLower}
            className="flex items-center justify-center gap-2 py-3 font-pixel text-[8px] border border-arcade-neon-red text-arcade-neon-red neon-text-red hover:bg-arcade-neon-red hover:text-black active:scale-95 transition-all tracking-widest"
          >
            <TrendingDown size={12} /> LOWER
          </button>
        </div>
      )}

      {/* Result label — right card, post-reveal */}
      {isRight && revealed && (
        <p
          className="relative font-pixel text-[9px] tracking-widest animate-[fadeUp_0.2s_ease-out]"
          style={{
            color: resultColor,
            textShadow: `0 0 8px ${resultColor}, 0 0 20px ${resultColor}55`,
          }}
        >
          {phase === "correct" ? "CORRECT!" : "WRONG!"}
        </p>
      )}
    </div>
  );
}

// ── Game ──────────────────────────────────────────────────────────────────────

export default function PeaksValleys({ onExit, isMashupMode, onMashupComplete, mashupSeed }: { onExit: () => void } & MashupProps) {
  if (isMashupMode && onMashupComplete) {
    return <PeaksValleysMashup mashupSeed={mashupSeed} onMashupComplete={onMashupComplete} />;
  }
  return <PeaksValleysStandalone onExit={onExit} />;
}

function PeaksValleysStandalone({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const [deck] = useState<PeaksEntry[]>(() =>
    seededShuffle(PEAKS_ENTRIES, gameRng("peaks-valleys", useGameStore.getState().mode))
  );
  const [ptr, setPtr] = useState(0);
  const [phase, setPhase] = useState<Phase>("input");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savedRef = useRef(false);

  const isExhausted = ptr + 1 >= deck.length;
  const cardA = deck[ptr];
  const cardB = deck[isExhausted ? 0 : ptr + 1];

  const handleGuess = useCallback(
    (guessHigher: boolean) => {
      if (phase !== "input" || isExhausted) return;
      const a = cardA.value;
      const b = cardB.value;
      const isCorrect = a === b ? true : guessHigher ? b > a : b < a;

      if (isCorrect) {
        const pts = pointsFor(streak);
        addScore(pts);
        setScore((s) => s + pts);
        setStreak((s) => s + 1);
        setPhase("correct");
        timerRef.current = setTimeout(() => {
          setPhase("input");
          setPtr((p) => p + 1);
        }, 1200);
      } else {
        setPhase("wrong");
        if (!savedRef.current) {
          savedRef.current = true;
          saveHighScore("peaks-valleys", score);
        }
      }
    },
    [phase, isExhausted, cardA, cardB, streak, score, addScore],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="min-h-dvh flex flex-col bg-arcade-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <GameBackButton onExit={onExit} />
        <h1 className="font-pixel text-[9px] text-arcade-neon-green neon-text-green tracking-widest">
          PEAKS &amp; VALLEYS
        </h1>
        <div className="text-right">
          <p className="font-pixel text-[7px] text-gray-600">SCORE</p>
          <p className="font-pixel text-[10px] text-arcade-neon-green neon-text-green">{score}</p>
        </div>
      </div>

      {/* Streak bar */}
      {streak > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-arcade-border bg-arcade-surface">
          <span className="font-pixel text-[7px] text-gray-600 shrink-0">STREAK</span>
          <div className="flex gap-1 flex-wrap flex-1">
            {Array.from({ length: Math.min(streak, 10) }).map((_, i) => (
              <span key={i} className="text-arcade-neon-green text-xs leading-none">●</span>
            ))}
            {streak > 10 && (
              <span className="font-pixel text-[7px] text-arcade-neon-yellow">+{streak - 10}</span>
            )}
          </div>
          <span className="font-pixel text-[7px] text-arcade-neon-yellow shrink-0">
            NEXT +{pointsFor(streak)} PTS
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Left card — revealed */}
        <EntryCard entry={cardA} revealed phase={phase} />

        {/* Divider: horizontal on mobile */}
        <div className="relative flex items-center justify-center py-2 lg:hidden">
          <div className="absolute inset-x-0 top-1/2 border-t border-arcade-border" />
          <span className="relative font-pixel text-[8px] text-gray-700 bg-arcade-bg px-3">VS</span>
        </div>
        {/* Divider: vertical on desktop */}
        <div className="hidden lg:flex flex-col items-center justify-center w-10 shrink-0">
          <div className="flex-1 border-l border-arcade-border" />
          <span className="font-pixel text-[8px] text-gray-700 py-3">VS</span>
          <div className="flex-1 border-l border-arcade-border" />
        </div>

        {/* Right card — hidden until guess; key triggers slide animation on advance */}
        <EntryCard
          key={ptr}
          entry={cardB}
          revealed={phase !== "input"}
          phase={phase}
          isRight
          onHigher={() => handleGuess(true)}
          onLower={() => handleGuess(false)}
        />

        {/* Game over overlay */}
        {phase === "wrong" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div
              className="border border-arcade-neon-red bg-black/95 p-8 text-center space-y-4 min-w-[260px]"
              style={{ boxShadow: "0 0 40px #ff333355" }}
            >
              <p className="font-pixel text-sm text-arcade-neon-red neon-text-red tracking-widest">
                GAME OVER
              </p>
              <div className="h-px bg-arcade-border" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left">
                <span className="font-pixel text-[8px] text-gray-500">SCORE</span>
                <span className="font-pixel text-[9px] text-arcade-neon-yellow neon-text-yellow text-right">
                  {score} PTS
                </span>
                <span className="font-pixel text-[8px] text-gray-500">CORRECT</span>
                <span className="font-mono text-sm text-white text-right">{ptr}</span>
              </div>
              <DailyPercentile performance={Math.min(1, score / 1500)} />
              <EndScreenActions
                slug="peaks-valleys"
                gameTitle="PEAKS & VALLEYS"
                score={score}
                performance={Math.min(1, score / 1500)}
                squares={"🟩".repeat(Math.min(ptr, 10)) + "🟥"}
                onExit={onExit}
              />
            </div>
          </div>
        )}

        {/* Perfect run overlay */}
        {isExhausted && phase !== "wrong" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div
              className="border border-arcade-neon-green bg-black/95 p-8 text-center space-y-4 min-w-[260px]"
              style={{ boxShadow: "0 0 40px #00ff4155" }}
            >
              <p className="font-pixel text-sm text-arcade-neon-green neon-text-green tracking-widest">
                PERFECT!
              </p>
              <p className="font-mono text-sm text-gray-500">All {deck.length - 1} rounds cleared.</p>
              <div className="h-px bg-arcade-border" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left">
                <span className="font-pixel text-[8px] text-gray-500">SCORE</span>
                <span className="font-pixel text-[9px] text-arcade-neon-yellow neon-text-yellow text-right">
                  {score} PTS
                </span>
              </div>
              <DailyPercentile performance={1} />
              <EndScreenActions
                slug="peaks-valleys"
                gameTitle="PEAKS & VALLEYS"
                score={score}
                performance={1}
                squares={"🟩".repeat(10)}
                onExit={onExit}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-arcade-border">
        <span className="font-pixel text-[7px] text-gray-700">
          ROUND {ptr + 1} / {deck.length - 1}
        </span>
        <span className="font-pixel text-[7px] text-gray-700">
          {streak > 1 ? `×${streak} STREAK` : ""}
        </span>
      </div>
    </div>
  );
}

// ── Atlas Jackpot round: one higher/lower call, correct = success ───────────────
function PeaksValleysMashup({ mashupSeed, onMashupComplete }: MashupProps) {
  const [deck] = useState(() => seededShuffle(PEAKS_ENTRIES, createSeededRng(mashupSeed ?? "peaks-valleys")));
  const [phase, setPhase] = useState<Phase>("input");
  const cardA = deck[0];
  const cardB = deck[1];

  const guess = useCallback((guessHigher: boolean) => {
    if (phase !== "input") return;
    const correct = cardA.value === cardB.value ? true : guessHigher ? cardB.value > cardA.value : cardB.value < cardA.value;
    setPhase(correct ? "correct" : "wrong");
    setTimeout(() => onMashupComplete!(correct), 1200);
  }, [phase, cardA, cardB, onMashupComplete]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row relative">
      <EntryCard entry={cardA} revealed phase={phase} />
      <div className="relative flex items-center justify-center py-2 lg:hidden">
        <div className="absolute inset-x-0 top-1/2 border-t border-arcade-border" />
        <span className="relative font-pixel text-[8px] text-gray-700 bg-arcade-bg px-3">VS</span>
      </div>
      <div className="hidden lg:flex flex-col items-center justify-center w-10 shrink-0">
        <div className="flex-1 border-l border-arcade-border" />
        <span className="font-pixel text-[8px] text-gray-700 py-3">VS</span>
        <div className="flex-1 border-l border-arcade-border" />
      </div>
      <EntryCard
        entry={cardB}
        revealed={phase !== "input"}
        phase={phase}
        isRight
        onHigher={() => guess(true)}
        onLower={() => guess(false)}
      />
    </div>
  );
}
