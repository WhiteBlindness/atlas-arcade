"use client";
import { useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";

import { COUNTRIES, type Country } from "@/data/countries";
import { COUNTRY_META } from "@/data/countryMeta";
import { COUNTRY_CLUES, formatPopulation } from "@/data/countryClues";
import { useT, type TKey } from "@/lib/i18n";
import { haversine, bearing, distanceToHex, distanceHeat, calculateScore } from "@/lib/geo";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { gameRng, seededWeightedPick, createSeededRng } from "@/lib/daily";
import { sfx } from "@/lib/sfx";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import type { MashupProps } from "./mashup";
import { GuessInput } from "./globle/GuessInput";
import { GuessHistory } from "./globle/GuessHistory";

const WorldMap = dynamic(
  () => import("./globle/WorldMapGlobe").then((m) => ({ default: m.WorldMapGlobe })),
  { ssr: false, loading: () => <div className="w-full h-full bg-arcade-bg" /> }
);

const MAX_GUESSES = 15;

// Difficulty balancer for the mystery TARGET only (the dropdown still offers
// every country). Countries under 1M people are chosen 1/10th as often as
// larger ones (weight 1 vs 10). Any country missing from COUNTRY_CLUES is
// assumed >= 1M — see the invariant note in countryClues.ts.
const targetPopulation = (c: Country) => COUNTRY_CLUES[c.numeric]?.population ?? 1_000_000;
const targetWeight = (c: Country) => (targetPopulation(c) >= 1_000_000 ? 10 : 1);

export interface Guess {
  country: Country;
  distance: number;
  bearing: number;
  color: string;
}

const ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
function bearingArrow(deg: number) {
  return ARROWS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

export default function GlobleGame({ onExit, isMashupMode, onMashupComplete, mashupSeed }: { onExit: () => void } & MashupProps) {
  if (isMashupMode && onMashupComplete) {
    return <GlobleMashup mashupSeed={mashupSeed} onMashupComplete={onMashupComplete} />;
  }
  return <GlobleStandalone onExit={onExit} />;
}

function GlobleStandalone({ onExit }: { onExit: () => void }) {
  const t = useT();
  const { addScore } = useGameStore();
  // daily: unlimited tries, scored by how few guesses were needed
  const isDaily = useGameStore((s) => s.mode) === "daily";
  // daily mode → same mystery country for every player today
  const [mystery] = useState<Country>(() =>
    seededWeightedPick(COUNTRIES, gameRng("globle", useGameStore.getState().mode), targetWeight)
  );
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [zoomTarget, setZoomTarget] = useState<number | undefined>();
  const scoreSavedRef = useRef(false);

  const guessedCodes = useMemo(() => new Set(guesses.map((g) => g.country.numeric)), [guesses]);

  const colorMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const g of guesses) map[g.country.numeric] = g.color;
    return map;
  }, [guesses]);

  const handleGuess = useCallback(
    async (country: Country) => {
      if (status !== "playing") return;
      const km = haversine(mystery.lat, mystery.lng, country.lat, country.lng);
      const bear = bearing(mystery.lat, mystery.lng, country.lat, country.lng);
      const color = distanceToHex(km);
      const next = [...guesses, { country, distance: km, bearing: bear, color }];
      setGuesses(next);

      const won = country.numeric === mystery.numeric;
      if (won) {
        setZoomTarget(country.numeric);
        const pts = calculateScore(next.length);
        addScore(pts);
        setStatus("won");
        if (!scoreSavedRef.current) {
          scoreSavedRef.current = true;
          await saveHighScore("globle", pts);
        }
      } else if (!isDaily && next.length >= MAX_GUESSES) {
        setZoomTarget(mystery.numeric);
        setStatus("lost");
        if (!scoreSavedRef.current) {
          scoreSavedRef.current = true;
          await saveHighScore("globle", 0);
        }
      } else {
        setZoomTarget(country.numeric);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mystery, guesses, status, addScore, isDaily]
  );

  const lastGuess = guesses[guesses.length - 1];
  const finalScore = status === "won" ? calculateScore(guesses.length) : 0;

  return (
    // h-dvh (not min-h) + overflow-hidden so the layout is locked to the viewport;
    // with interactive-widget=resizes-content the keyboard shrinks it and pushes
    // the sticky input up instead of covering it.
    <div className="h-dvh overflow-hidden flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border shrink-0">
        <GameBackButton onExit={onExit} />
        <h1 className="font-pixel text-xs text-arcade-neon-cyan neon-text-cyan tracking-widest">GEORADAR</h1>
        <p className="font-pixel text-[9px] text-gray-500">
          {isDaily ? `${guesses.length}` : `${guesses.length} / ${MAX_GUESSES}`}
        </p>
      </div>

      {/* Mobile (< md): map on top, guess input pinned at the bottom. Desktop: side-by-side. */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Map + overlays — grows to fill the middle, map graphic covers the box */}
        <div className="flex-1 min-h-[40vh] md:min-h-0 relative">
          <WorldMap
            colorMap={colorMap}
            mysteryNumeric={status !== "playing" ? mystery.numeric : undefined}
            zoomTarget={zoomTarget}
          />

          {/* In-game stats HUD */}
          {lastGuess && status === "playing" && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-4 px-4 py-2 bg-black/75 border-t border-arcade-border">
              <span className="font-mono text-[11px] truncate" style={{ color: lastGuess.color }}>
                {lastGuess.country.name}
              </span>
              <span className="font-mono text-[11px] text-white whitespace-nowrap">
                {bearingArrow(lastGuess.bearing)}{" "}
                {lastGuess.distance < 1000
                  ? `${Math.round(lastGuess.distance)} km`
                  : `${(lastGuess.distance / 1000).toFixed(1)}k km`}
              </span>
              <span className="font-pixel text-[8px] tracking-widest whitespace-nowrap" style={{ color: distanceHeat(lastGuess.distance).hex }}>
                {distanceHeat(lastGuess.distance).label}
              </span>
            </div>
          )}

          {/* Win overlay */}
          {status === "won" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <div
                className="border border-arcade-neon-green bg-black/92 p-6 text-center space-y-3 min-w-[220px]"
                style={{ boxShadow: "0 0 40px #00ff4155" }}
              >
                <p className="font-pixel text-[11px] text-arcade-neon-green neon-text-green tracking-widest">
                  {t("correct")}
                </p>
                <p className="font-mono text-lg text-white">{mystery.name}</p>
                <div className="h-px bg-arcade-border" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-left">
                  <span className="font-pixel text-[8px] text-gray-500">{t("igGuessMany")}</span>
                  <span className="font-mono text-[11px] text-white text-right">
                    {guesses.length}{isDaily ? "" : ` / ${MAX_GUESSES}`}
                  </span>
                  <span className="font-pixel text-[8px] text-gray-500">{t("igScore")}</span>
                  <span className="font-pixel text-[9px] text-arcade-neon-cyan neon-text-cyan text-right">{t("igPtsSplash").replace("{X}", String(finalScore))}</span>
                </div>
                <DailyPercentile performance={1 / (1 + (guesses.length - 1) / 3)} />
                <EndScreenActions
                  slug="globle"
                  gameTitle="GEORADAR"
                  score={finalScore}
                  performance={1 / (1 + (guesses.length - 1) / 3)}
                  squares={guesses.map((g, i) => (i === guesses.length - 1 ? "🟩" : distanceHeat(g.distance).square)).slice(-10).join("")}
                  onExit={onExit}
                />
              </div>
            </div>
          )}

          {/* Lost overlay */}
          {status === "lost" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <div
                className="border border-arcade-neon-red bg-black/92 p-6 text-center space-y-3 min-w-[220px]"
                style={{ boxShadow: "0 0 40px #ff004455" }}
              >
                <p className="font-pixel text-[11px] text-arcade-neon-red neon-text-red tracking-widest">
                  {t("gameOver")}
                </p>
                <p className="font-mono text-lg text-white">{mystery.name}</p>
                <div className="h-px bg-arcade-border" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-left">
                  <span className="font-pixel text-[8px] text-gray-500">{t("igGuessMany")}</span>
                  <span className="font-mono text-[11px] text-white text-right">{guesses.length} / {MAX_GUESSES}</span>
                </div>
                <EndScreenActions slug="globle" gameTitle="GEORADAR" score={0} performance={0} onExit={onExit} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — bottom bar on mobile, right column on desktop. Responsive
            order: input is last (bottom) on mobile, first (top) on desktop. */}
        <div className="w-full md:w-72 flex flex-col min-h-0 md:min-h-0 border-t md:border-t-0 md:border-l border-arcade-border">
          {/* Input zone: sticky bottom on mobile so the keyboard pushes it up. */}
          {status === "playing" && (
            <div className="order-2 md:order-1 p-4 flex flex-col gap-3 bg-arcade-bg sticky bottom-0 md:static shrink-0">
              <GuessInput countries={COUNTRIES} guessedCodes={guessedCodes} onGuess={handleGuess} />
              {/* Subtle disclaimer: distances are centroid-based, not border/capital. */}
              <p className="font-mono text-xs text-slate-500/80 text-center tracking-wide uppercase leading-snug">
                {t("igGeoRadarRule")}
              </p>
              <div className="border border-arcade-border p-2 space-y-1 hidden md:block">
                <p className="font-pixel text-[7px] text-gray-600 leading-relaxed">
                  {t("igArrowHint")}
                </p>
                <p className="font-mono text-[11px] leading-relaxed">
                  <span style={{ color: "#ff3333" }}>■&lt;500</span>{" "}
                  <span style={{ color: "#ff8800" }}>■&lt;2000</span>{" "}
                  <span style={{ color: "#ffaa00" }}>■&lt;5000</span>{" "}
                  <span style={{ color: "#3b82f6" }}>■5000+ KM</span>
                </p>
              </div>
            </div>
          )}
          {/* History zone: scrollable, sits above the input on mobile. */}
          <div className="order-1 md:order-2 overflow-y-auto max-h-32 md:max-h-none md:flex-1 px-4 py-2 md:pb-4">
            <GuessHistory guesses={guesses} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Atlas Jackpot round: one guess must land within 2000 km, with the 3D globe ──
// for geographic context. Clues get harder as the ladder climbs:
//   L1-5  → Capital, Hemisphere, Initial   (3 easy clues)
//   L6-10 → Population, Region             (2 harder clues)
//   L11-15 → Fun Fact only                 (1 cryptic clue)
const MASHUP_WIN_KM = 2000;

// Mystery pool is restricted to well-known countries with full clue data so
// every difficulty tier stays fair (no obscure country behind a single fun fact).
const CLUE_POOL = COUNTRIES.filter((c) => COUNTRY_CLUES[c.numeric]);

function cluesForLevel(mystery: Country, level: number, t: (key: TKey) => string): string[] {
  const clue = COUNTRY_CLUES[mystery.numeric];
  if (level >= 11) return [t("igClueFun").replace("{X}", clue.funFact)];
  if (level >= 6) return [
    t("igCluePopulation").replace("{X}", formatPopulation(clue.population)),
    t("igClueRegion").replace("{X}", clue.region),
  ];
  const capital = COUNTRY_META[mystery.numeric]?.capital;
  const ns = mystery.lat >= 0 ? t("igNorthern") : t("igSouthern");
  const ew = mystery.lng >= 0 ? t("igEastern") : t("igWestern");
  const initial = t("igClueStarts").replace("{X}", mystery.name[0]);
  return [
    capital ? t("igClueCapital").replace("{X}", capital) : initial,
    t("igClueHemisphere").replace("{A}", ns).replace("{B}", ew),
    initial,
  ];
}

function GlobleMashup({ mashupSeed, onMashupComplete, mashupLevel }: MashupProps) {
  const t = useT();
  const level = mashupLevel ?? 1;
  const [mystery] = useState<Country>(() => seededWeightedPick(CLUE_POOL, createSeededRng(mashupSeed ?? "globle"), targetWeight));
  const [result, setResult] = useState<{ country: Country; km: number; success: boolean } | null>(null);

  const clues = useMemo(() => cluesForLevel(mystery, level, t), [mystery, level, t]);

  const handleGuess = useCallback((country: Country) => {
    if (result) return;
    const km = haversine(mystery.lat, mystery.lng, country.lat, country.lng);
    const success = km <= MASHUP_WIN_KM;
    setResult({ country, km, success });
    if (success) sfx.correct(); else sfx.wrong();
    setTimeout(() => onMashupComplete!(success), 2200);
  }, [result, mystery, onMashupComplete]);

  const tierLabel = level >= 11 ? t("igHard") : level >= 6 ? t("igMedium") : t("igEasy");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 3D globe — geographic context. Reveals the target + zooms after the guess. */}
      <div className="relative h-[34vh] min-h-[200px] border-b border-arcade-border shrink-0">
        <WorldMap
          colorMap={result ? { [result.country.numeric]: "#00d4ff" } : {}}
          mysteryNumeric={result ? mystery.numeric : undefined}
          zoomTarget={result ? result.country.numeric : undefined}
        />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center gap-4 px-4 py-4 max-w-md mx-auto w-full">
        <p className="font-pixel text-[9px] text-arcade-neon-cyan neon-text-cyan tracking-widest">
          {t("igGuessWithin").replace("{X}", String(MASHUP_WIN_KM))} · <span className="text-gray-500">{tierLabel}</span>
        </p>

        <div className="w-full border border-arcade-neon-cyan shadow-neon-cyan p-4 space-y-2">
          <p className="font-pixel text-[7px] text-gray-500 tracking-widest mb-1">{t("igClues")}</p>
          {clues.map((c, i) => (
            <p key={i} className="font-mono text-sm text-gray-300 leading-relaxed">
              <span className="text-arcade-neon-cyan mr-2">{i + 1}▸</span>{c}
            </p>
          ))}
        </div>

        {!result ? (
          <div className="w-full">
            <GuessInput countries={COUNTRIES} guessedCodes={new Set()} onGuess={handleGuess} />
          </div>
        ) : (
          <div className="w-full text-center space-y-2" style={{ animation: "fadeUp 0.25s ease-out" }}>
            <p className={`font-pixel text-[11px] tracking-widest ${result.success ? "text-arcade-neon-green neon-text-green" : "text-arcade-neon-red neon-text-red"}`}>
              {result.success ? t("igCloseEnough") : t("igTooFar")}
            </p>
            <p className="font-mono text-sm text-white">
              {t("igKmAway").replace("{C}", result.country.name).replace("{K}", Math.round(result.km).toLocaleString())}
            </p>
            <p className="font-mono text-[13px] text-gray-500">{t("igItWasCity").replace("{X}", mystery.name)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
