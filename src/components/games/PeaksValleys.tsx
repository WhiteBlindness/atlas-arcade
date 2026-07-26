"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PEAKS_ENTRIES, localizedText, type PeaksEntry, type PeaksCategory, type PeaksTier } from "@/data/peaksValleys";
import { useSettingsStore } from "@/store/settingsStore";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { gameRng, seededShuffle, createSeededRng } from "@/lib/daily";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { useT, type TKey } from "@/lib/i18n";
import type { MashupProps } from "./mashup";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pointsFor(streak: number) {
  return 100 + streak * 50;
}

// ── Progressive difficulty ────────────────────────────────────────────────────
// Rounds 0-3 serve easy pairs, 4-8 medium, 9+ hard.
function tierForRound(round: number): PeaksTier {
  if (round < 4) return "easy";
  if (round < 9) return "medium";
  return "hard";
}

/** Difficulty of a pair: the wider the relative gap, the easier the call. */
function gapTier(a: number, b: number): PeaksTier {
  const hi = Math.max(Math.abs(a), Math.abs(b)) || 1;
  const gap = Math.abs(b - a) / hi;
  if (gap >= 0.5) return "easy";
  if (gap >= 0.2) return "medium";
  return "hard";
}

/** Explicit dataset tier wins; otherwise derive it from the pair's value gap. */
function entryTier(candidate: PeaksEntry, current: PeaksEntry): PeaksTier {
  return candidate.tier ?? gapTier(current.value, candidate.value);
}

/**
 * Draw without replacement: take the first remaining entry matching the wanted
 * tier (the pool is pre-shuffled, so "first match" is still random but stays
 * deterministic for the daily seed). Falls back to any remaining entry, and
 * returns null only when the deck is truly exhausted.
 */
function drawNext(
  remaining: PeaksEntry[],
  current: PeaksEntry,
  want: PeaksTier,
): { drawn: PeaksEntry | null; rest: PeaksEntry[] } {
  if (remaining.length === 0) return { drawn: null, rest: remaining };
  let idx = remaining.findIndex((e) => entryTier(e, current) === want);
  if (idx === -1) idx = 0; // no card in that band left — keep the run going
  const drawn = remaining[idx];
  return { drawn, rest: [...remaining.slice(0, idx), ...remaining.slice(idx + 1)] };
}

interface DeckState {
  current: PeaksEntry;
  next: PeaksEntry | null; // null => deck exhausted
  remaining: PeaksEntry[];
  round: number;
}

const CAT_KEY: Record<PeaksCategory, TKey> = {
  mountain: "pvCatMountain",
  river:    "pvCatRiver",
  country:  "pvCatCountry",
  city:     "pvCatCity",
  ocean:    "pvCatOcean",
  lake:     "pvCatLake",
  desert:   "pvCatDesert",
  wonder:   "pvCatWonder",
  nature:   "pvCatNature",
};

const CAT_COLOR: Record<PeaksCategory, string> = {
  mountain: "#00d4ff",
  river:    "#00ff41",
  country:  "#00ffff",
  city:     "#ff00aa",
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
  const t = useT();
  const lang = useSettingsStore((s) => s.lang);
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
        <p className="font-pixel text-[7px] text-gray-600 tracking-[0.25em]">
          {t(CAT_KEY[entry.category])}
        </p>
        <p
          className="font-pixel text-[8px] lg:text-[9px] leading-relaxed"
          style={{ color: accent }}
        >
          {localizedText(entry.label, lang).toUpperCase()}
        </p>
        <p className="font-mono text-sm text-gray-500">{localizedText(entry.sublabel, lang)}</p>
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
            <p className="font-mono text-xs text-gray-500 mt-1">{localizedText(entry.unit, lang)}</p>
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
            <TrendingUp size={12} /> {t("igHigher")}
          </button>
          <button
            onClick={onLower}
            className="flex items-center justify-center gap-2 py-3 font-pixel text-[8px] border border-arcade-neon-red text-arcade-neon-red neon-text-red hover:bg-arcade-neon-red hover:text-black active:scale-95 transition-all tracking-widest"
          >
            <TrendingDown size={12} /> {t("igLower")}
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
          {phase === "correct" ? t("correct") : t("igWrong")}
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
  const t = useT();
  const { addScore } = useGameStore();
  // Draw-without-replacement queue: every entry is consumed at most once per run.
  const [deckState, setDeckState] = useState<DeckState>(() => {
    const shuffled = seededShuffle(PEAKS_ENTRIES, gameRng("peaks-valleys", useGameStore.getState().mode));
    const [first, ...rest] = shuffled;
    const { drawn, rest: remaining } = drawNext(rest, first, tierForRound(0));
    return { current: first, next: drawn, remaining, round: 0 };
  });
  const [phase, setPhase] = useState<Phase>("input");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savedRef = useRef(false);

  const { current: cardA, next: cardB, round } = deckState;
  const isExhausted = cardB === null;

  const handleGuess = useCallback(
    (guessHigher: boolean) => {
      if (phase !== "input" || !cardB) return;
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
          // Promote the revealed card and draw a fresh one for the next round's
          // difficulty band. Drawn cards never return to the pool this run.
          setDeckState((s) => {
            if (!s.next) return s;
            const nextRound = s.round + 1;
            const { drawn, rest } = drawNext(s.remaining, s.next, tierForRound(nextRound));
            return { current: s.next, next: drawn, remaining: rest, round: nextRound };
          });
        }, 1200);
      } else {
        setPhase("wrong");
        if (!savedRef.current) {
          savedRef.current = true;
          saveHighScore("peaks-valleys", score);
        }
      }
    },
    [phase, cardA, cardB, streak, score, addScore],
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
          <p className="font-pixel text-[7px] text-gray-600">{t("igScore")}</p>
          <p className="font-pixel text-[10px] text-arcade-neon-green neon-text-green">{score}</p>
        </div>
      </div>

      {/* Streak bar */}
      {streak > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-arcade-border bg-arcade-surface">
          <span className="font-pixel text-[7px] text-gray-600 shrink-0">{t("igStreak")}</span>
          <div className="flex gap-1 flex-wrap flex-1">
            {Array.from({ length: Math.min(streak, 10) }).map((_, i) => (
              <span key={i} className="text-arcade-neon-green text-xs leading-none">●</span>
            ))}
            {streak > 10 && (
              <span className="font-pixel text-[7px] text-arcade-neon-green">+{streak - 10}</span>
            )}
          </div>
          <span className="font-pixel text-[7px] text-arcade-neon-green shrink-0">
            {t("igNextPts").replace("{X}", String(pointsFor(streak)))}
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
          key={round}
          entry={cardB ?? cardA}
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
                {t("gameOver")}
              </p>
              <div className="h-px bg-arcade-border" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left">
                <span className="font-pixel text-[8px] text-gray-500">{t("igScore")}</span>
                <span className="font-pixel text-[9px] text-arcade-neon-green neon-text-green text-right">
                  {score} PTS
                </span>
                <span className="font-pixel text-[8px] text-gray-500">{t("igCorrectCount")}</span>
                <span className="font-mono text-sm text-white text-right">{round}</span>
              </div>
              <DailyPercentile performance={Math.min(1, score / 1500)} />
              <EndScreenActions
                slug="peaks-valleys"
                gameTitle="PEAKS & VALLEYS"
                score={score}
                performance={Math.min(1, score / 1500)}
                squares={"🟩".repeat(Math.min(round, 10)) + "🟥"}
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
                {t("igPerfect")}
              </p>
              <p className="font-mono text-sm text-gray-500">{t("igAllCleared").replace("{X}", String(round))}</p>
              <div className="h-px bg-arcade-border" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left">
                <span className="font-pixel text-[8px] text-gray-500">{t("igScore")}</span>
                <span className="font-pixel text-[9px] text-arcade-neon-green neon-text-green text-right">
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
          {t("igRound")} {round + 1} / {PEAKS_ENTRIES.length - 1}
        </span>
        <span className="font-pixel text-[7px] text-gray-700">
          {streak > 1 ? `×${streak} ${t("igStreak")}` : ""}
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
