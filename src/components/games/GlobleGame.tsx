"use client";
import { useState, useCallback, useMemo, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { COUNTRIES, type Country } from "@/data/countries";
import { haversine, bearing, distanceToHex, calculateScore } from "@/lib/geo";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { gameRng, seededPick } from "@/lib/daily";
import { WorldMap } from "./globle/WorldMap";
import { GuessInput } from "./globle/GuessInput";
import { GuessHistory } from "./globle/GuessHistory";

const MAX_GUESSES = 6;

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

function heatLabel(km: number): { text: string; color: string } {
  if (km < 500)  return { text: "BURNING", color: "#ff4444" };
  if (km < 1500) return { text: "HOT",     color: "#ff8800" };
  if (km < 3000) return { text: "WARM",    color: "#ffcc00" };
  if (km < 5000) return { text: "COOL",    color: "#44aaff" };
  return           { text: "COLD",         color: "#6688cc" };
}

export default function GlobleGame({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  // daily mode → same mystery country for every player today
  const [mystery] = useState<Country>(() =>
    seededPick(COUNTRIES, gameRng("globle", useGameStore.getState().mode))
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
      } else if (next.length >= MAX_GUESSES) {
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
    [mystery, guesses, status, addScore]
  );

  const lastGuess = guesses[guesses.length - 1];
  const finalScore = status === "won" ? calculateScore(guesses.length) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <button onClick={onExit} className="flex items-center gap-2 font-pixel text-[9px] text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={12} /> ARCADE
        </button>
        <h1 className="font-pixel text-xs text-arcade-neon-cyan neon-text-cyan tracking-widest">GEORADAR</h1>
        <p className="font-pixel text-[9px] text-gray-500">{guesses.length}/{MAX_GUESSES}</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map + overlays */}
        <div className="flex-1 min-h-[48vh] lg:min-h-0 relative">
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
              <span className="font-pixel text-[8px] tracking-widest whitespace-nowrap" style={{ color: heatLabel(lastGuess.distance).color }}>
                {heatLabel(lastGuess.distance).text}
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
                  CORRECT!
                </p>
                <p className="font-mono text-lg text-white">{mystery.name}</p>
                <div className="h-px bg-arcade-border" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-left">
                  <span className="font-pixel text-[8px] text-gray-500">GUESSES</span>
                  <span className="font-mono text-[11px] text-white text-right">{guesses.length} / {MAX_GUESSES}</span>
                  <span className="font-pixel text-[8px] text-gray-500">SCORE</span>
                  <span className="font-pixel text-[9px] text-arcade-neon-yellow neon-text-yellow text-right">+{finalScore} PTS</span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full mt-1 py-2 font-pixel text-[8px] border border-arcade-neon-cyan text-arcade-neon-cyan hover:bg-arcade-neon-cyan hover:text-black transition-all"
                >
                  PLAY AGAIN
                </button>
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
                  GAME OVER
                </p>
                <p className="font-mono text-lg text-white">{mystery.name}</p>
                <div className="h-px bg-arcade-border" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-left">
                  <span className="font-pixel text-[8px] text-gray-500">GUESSES</span>
                  <span className="font-mono text-[11px] text-white text-right">{guesses.length} / {MAX_GUESSES}</span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full mt-1 py-2 font-pixel text-[8px] border border-arcade-neon-cyan text-arcade-neon-cyan hover:bg-arcade-neon-cyan hover:text-black transition-all"
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-3 p-4 border-t lg:border-t-0 lg:border-l border-arcade-border overflow-y-auto">
          {status === "playing" && (
            <GuessInput countries={COUNTRIES} guessedCodes={guessedCodes} onGuess={handleGuess} />
          )}
          {status !== "playing" && (
            <button
              onClick={() => window.location.reload()}
              className="py-2 font-pixel text-[9px] border border-arcade-neon-cyan text-arcade-neon-cyan hover:bg-arcade-neon-cyan hover:text-black transition-all"
            >
              PLAY AGAIN
            </button>
          )}
          <GuessHistory guesses={guesses} />
        </div>
      </div>
    </div>
  );
}
