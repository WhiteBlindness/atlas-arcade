"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { COUNTRIES } from "@/data/countries";
import { CONTINENT_ROUNDS } from "@/data/continents";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { sfx } from "@/lib/sfx";
import { gameRng, seededShuffle, createSeededRng, type Rng } from "@/lib/daily";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { useT } from "@/lib/i18n";
import type { MashupProps } from "./mashup";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const W = 800;
const H = 520;
const PIECES_PER_ROUND = 6;
const POINTS_SNAP = 150;
const POINTS_MISS = 25;
const ROUND_BONUS = 200;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let worldCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWorld(): Promise<any> {
  if (worldCache) return worldCache;
  const res = await fetch(GEO_URL);
  worldCache = await res.json();
  return worldCache;
}

interface Piece {
  id: number;
  name: string;
  d: string;
  cx: number;
  cy: number;
  // bbox in map coordinates, for the tray thumbnail viewBox + snap tolerance
  bx: number;
  by: number;
  bw: number;
  bh: number;
}

interface RoundData {
  label: string;
  fixed: { id: number; d: string }[];
  pieces: Piece[];
}

const NAME_TO_NUMERIC = new Map(COUNTRIES.map((c) => [c.name, c.numeric]));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRound(world: any, roundIdx: number, rng: Rng): RoundData {
  const round = CONTINENT_ROUNDS[roundIdx];
  const memberIds = new Set(
    round.countries
      .map((n) => NAME_TO_NUMERIC.get(n))
      .filter((n): n is number => n !== undefined)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = (feature(world, world.objects.countries) as any).features as any[];
  const members = all.filter((f) => memberIds.has(parseInt(f.id, 10)));
  const fc = { type: "FeatureCollection" as const, features: members };

  const projection = geoNaturalEarth1().fitExtent([[16, 16], [W - 16, H - 16]], fc);
  const pathGen = geoPath(projection);

  const entries = members
    .map((f) => {
      const id = parseInt(f.id, 10);
      const d = pathGen(f) ?? "";
      const [cx, cy] = pathGen.centroid(f);
      const [[x0, y0], [x1, y1]] = pathGen.bounds(f);
      const name = COUNTRIES.find((c) => c.numeric === id)?.name ?? "";
      return { id, name, d, cx, cy, bx: x0, by: y0, bw: x1 - x0, bh: y1 - y0 };
    })
    .filter((e) => e.d && !isNaN(e.cx));

  const missing = seededShuffle(entries, rng).slice(0, Math.min(PIECES_PER_ROUND, entries.length));
  const missingIds = new Set(missing.map((m) => m.id));
  const fixed = entries.filter((e) => !missingIds.has(e.id)).map(({ id, d }) => ({ id, d }));

  return { label: round.label, fixed, pieces: seededShuffle(missing, rng) };
}

const DAILY_PIECES = 4;

// Daily micro-puzzle: place a handful of mystery countries on a blank world map.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDailyRound(world: any, rng: Rng): RoundData {
  const known = new Set(COUNTRIES.map((c) => c.numeric));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = (feature(world, world.objects.countries) as any).features as any[];
  const members = all.filter((f) => known.has(parseInt(f.id, 10)));
  const fc = { type: "FeatureCollection" as const, features: members };

  const projection = geoNaturalEarth1().fitExtent([[16, 16], [W - 16, H - 16]], fc);
  const pathGen = geoPath(projection);

  const entries = members
    .map((f) => {
      const id = parseInt(f.id, 10);
      const d = pathGen(f) ?? "";
      const [cx, cy] = pathGen.centroid(f);
      const [[x0, y0], [x1, y1]] = pathGen.bounds(f);
      const name = COUNTRIES.find((c) => c.numeric === id)?.name ?? "";
      return { id, name, d, cx, cy, bx: x0, by: y0, bw: x1 - x0, bh: y1 - y0 };
    })
    .filter((e) => e.d && !isNaN(e.cx));

  // only reasonably-sized countries stay draggable at world scale
  const candidates = entries.filter((e) => e.bw >= 20 || e.bh >= 20);
  const missing = seededShuffle(candidates, rng).slice(0, DAILY_PIECES);
  const missingIds = new Set(missing.map((m) => m.id));
  const fixed = entries.filter((e) => !missingIds.has(e.id)).map(({ id, d }) => ({ id, d }));

  return { label: "MYSTERY COUNTRIES", fixed, pieces: seededShuffle(missing, rng) };
}

export default function TectonicSnap({ onExit, isMashupMode, onMashupComplete, mashupSeed }: { onExit: () => void } & MashupProps) {
  if (isMashupMode && onMashupComplete) {
    return <TectonicSnapMashup mashupSeed={mashupSeed} onMashupComplete={onMashupComplete} />;
  }
  return <TectonicSnapStandalone onExit={onExit} />;
}

function TectonicSnapStandalone({ onExit }: { onExit: () => void }) {
  const t = useT();
  const { addScore } = useGameStore();
  const [phase, setPhase] = useState<"loading" | "play" | "round-done" | "done">("loading");
  const [roundIdx, setRoundIdx] = useState(0);
  const [round, setRound] = useState<RoundData | null>(null);
  const [placed, setPlaced] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const savedRef = useRef(false);
  const isDaily = useGameStore((s) => s.mode) === "daily";
  const totalRounds = isDaily ? 1 : CONTINENT_ROUNDS.length;
  // one rng for the whole session so daily rounds stay deterministic in order
  const rngRef = useRef<Rng>(gameRng("tectonic-snap", useGameStore.getState().mode));

  useEffect(() => {
    let alive = true;
    setPhase("loading");
    fetchWorld().then((world) => {
      if (!alive) return;
      setRound(
        useGameStore.getState().mode === "daily"
          ? buildDailyRound(world, rngRef.current)
          : buildRound(world, roundIdx, rngRef.current)
      );
      setPlaced(new Set());
      setPhase("play");
    });
    return () => { alive = false; };
  }, [roundIdx]);

  useEffect(() => {
    if (phase === "done" && !savedRef.current) {
      savedRef.current = true;
      saveHighScore("tectonic-snap", score);
    }
  }, [phase, score]);

  const dragPiece = round?.pieces.find((p) => p.id === dragId);

  const handleDrop = useCallback(
    (clientX: number, clientY: number) => {
      if (dragId === null || !round || !svgRef.current) { setDragId(null); return; }
      const piece = round.pieces.find((p) => p.id === dragId);
      setDragId(null);
      if (!piece) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      const y = ((clientY - rect.top) / rect.height) * H;

      const tolerance = Math.max(24, Math.max(piece.bw, piece.bh) / 2 + 12);
      const dist = Math.hypot(x - piece.cx, y - piece.cy);

      if (dist <= tolerance) {
        const next = new Set(placed).add(piece.id);
        setPlaced(next);
        setScore((s) => s + POINTS_SNAP);
        addScore(POINTS_SNAP);
        setFlash("ok");
        sfx.snap();
        if (next.size === round.pieces.length) {
          setScore((s) => s + ROUND_BONUS);
          addScore(ROUND_BONUS);
          setTimeout(() => {
            if (roundIdx + 1 >= totalRounds) setPhase("done");
            else setPhase("round-done");
          }, 600);
        }
      } else {
        setMisses((m) => m + 1);
        setScore((s) => Math.max(0, s - POINTS_MISS));
        setFlash("bad");
        sfx.wrong();
      }
      setTimeout(() => setFlash(null), 350);
    },
    [dragId, round, placed, roundIdx, totalRounds, addScore]
  );

  useEffect(() => {
    if (dragId === null) return;
    const move = (e: PointerEvent) => setDragPos({ x: e.clientX, y: e.clientY });
    const up = (e: PointerEvent) => handleDrop(e.clientX, e.clientY);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragId, handleDrop]);

  const trayPieces = round?.pieces.filter((p) => !placed.has(p.id)) ?? [];

  if (phase === "done") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-start pt-8 md:justify-center md:pt-0 gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-cyan neon-text-cyan">TECTONIC SNAP</h1>
        <div className="border border-arcade-neon-cyan p-10 text-center space-y-3">
          <p className="font-pixel text-[8px] text-gray-500">{t("finalScore")}</p>
          <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{score}</p>
          <p className="font-pixel text-[8px] text-gray-500">{misses} MISSED DROPS</p>
          <DailyPercentile performance={(isDaily ? DAILY_PIECES : 18) / ((isDaily ? DAILY_PIECES : 18) + misses)} />
        </div>
        <EndScreenActions
          slug="tectonic-snap"
          gameTitle="TECTONIC SNAP"
          score={score}
          performance={(isDaily ? DAILY_PIECES : 18) / ((isDaily ? DAILY_PIECES : 18) + misses)}
          squares={"🟩".repeat(Math.min(isDaily ? DAILY_PIECES : 18, 10)) + "🟥".repeat(Math.min(misses, 5))}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <GameBackButton onExit={onExit} />
        <h1 className="font-pixel text-[10px] text-arcade-neon-cyan neon-text-cyan">TECTONIC SNAP</h1>
        <span className="font-pixel text-[9px] text-arcade-neon-yellow">{score}</span>
      </div>

      {phase === "loading" || !round ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-pixel text-sm text-arcade-neon-cyan animate-blink">LOADING...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-3 py-3 gap-3 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <p className="font-pixel text-[9px] text-arcade-neon-green neon-text-green tracking-widest">
              {round.label}
            </p>
            <p className="font-pixel text-[8px] text-gray-500">
              ROUND {roundIdx + 1}/{totalRounds} · {placed.size}/{round.pieces.length} PLACED
            </p>
          </div>

          {/* Map */}
          <div
            className={`relative border transition-colors ${
              flash === "ok" ? "border-arcade-neon-green" : flash === "bad" ? "border-arcade-neon-red" : "border-arcade-border"
            }`}
            style={flash === "ok" ? { boxShadow: "0 0 24px #00ff4177" } : flash === "bad" ? { boxShadow: "0 0 24px #ff333377" } : undefined}
          >
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" style={{ background: "#080810" }} aria-label="Continent map">
              {round.fixed.map(({ id, d }) => (
                <path key={id} d={d} fill="#13233d" stroke="#0f2a44" strokeWidth={0.8} />
              ))}
              {round.pieces.map((p) =>
                placed.has(p.id) ? (
                  <path key={p.id} d={p.d} fill="#00d4ff" stroke="#080810" strokeWidth={0.8} opacity={0.9} />
                ) : (
                  <path key={p.id} d={p.d} fill="#0d1420" stroke="#1a1a2e" strokeWidth={0.8} strokeDasharray="3 3" />
                )
              )}
            </svg>

            {phase === "round-done" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="border border-arcade-neon-green bg-black/92 p-6 text-center space-y-3" style={{ boxShadow: "0 0 40px #00ff4155" }}>
                  <p className="font-pixel text-[11px] text-arcade-neon-green neon-text-green">CONTINENT RESTORED!</p>
                  <p className="font-pixel text-[9px] text-arcade-neon-yellow">+{ROUND_BONUS} BONUS</p>
                  <button
                    onClick={() => { sfx.click(); setRoundIdx((r) => r + 1); }}
                    className="w-full py-2 font-pixel text-[8px] border border-arcade-neon-cyan text-arcade-neon-cyan hover:bg-arcade-neon-cyan hover:text-black transition-all"
                  >
                    NEXT CONTINENT →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pieces tray */}
          <div className="border border-arcade-border p-2">
            <p className="font-pixel text-[7px] text-gray-600 mb-2 tracking-widest">DRAG PIECES ONTO THE MAP</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {trayPieces.length === 0 && phase === "play" && (
                <p className="font-mono text-sm text-gray-600 px-2 py-4">All pieces placed!</p>
              )}
              {trayPieces.map((p) => {
                const pad = Math.max(p.bw, p.bh) * 0.08 + 2;
                return (
                  <button
                    key={p.id}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setDragId(p.id);
                      setDragPos({ x: e.clientX, y: e.clientY });
                    }}
                    className={`shrink-0 w-20 h-20 border bg-arcade-surface touch-none cursor-grab transition-colors ${
                      dragId === p.id ? "border-arcade-neon-cyan opacity-40" : "border-arcade-border hover:border-arcade-neon-cyan"
                    }`}
                    title={p.name}
                  >
                    <svg viewBox={`${p.bx - pad} ${p.by - pad} ${p.bw + pad * 2} ${p.bh + pad * 2}`} className="w-full h-full pointer-events-none">
                      <path d={p.d} fill="#00d4ff" opacity={0.85} />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Drag ghost */}
      {dragPiece && dragId !== null && (
        <div
          className="fixed z-50 pointer-events-none w-24 h-24"
          style={{ left: dragPos.x, top: dragPos.y, transform: "translate(-50%, -50%)" }}
        >
          <svg
            viewBox={`${dragPiece.bx - 4} ${dragPiece.by - 4} ${dragPiece.bw + 8} ${dragPiece.bh + 8}`}
            className="w-full h-full"
            style={{ filter: "drop-shadow(0 0 8px #00d4ff)" }}
          >
            <path d={dragPiece.d} fill="#00d4ff" opacity={0.9} />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Atlas Jackpot round: place the daily mystery countries; one miss = fail ─────
function TectonicSnapMashup({ mashupSeed, onMashupComplete }: MashupProps) {
  const [round, setRound] = useState<RoundData | null>(null);
  const [placed, setPlaced] = useState<Set<number>>(new Set());
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let alive = true;
    fetchWorld().then((world) => {
      if (!alive) return;
      setRound(buildDailyRound(world, createSeededRng(mashupSeed ?? "tectonic-snap")));
    });
    return () => { alive = false; };
  }, [mashupSeed]);

  const finish = useCallback((success: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onMashupComplete!(success), 500);
  }, [onMashupComplete]);

  const handleDrop = useCallback((clientX: number, clientY: number) => {
    if (dragId === null || !round || !svgRef.current) { setDragId(null); return; }
    const piece = round.pieces.find((p) => p.id === dragId);
    setDragId(null);
    if (!piece) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const tolerance = Math.max(24, Math.max(piece.bw, piece.bh) / 2 + 12);
    const dist = Math.hypot(x - piece.cx, y - piece.cy);
    if (dist <= tolerance) {
      const next = new Set(placed).add(piece.id);
      setPlaced(next);
      setFlash("ok");
      sfx.snap();
      if (next.size === round.pieces.length) finish(true);
    } else {
      setFlash("bad");
      sfx.wrong();
      finish(false); // a single mistake ends the boss-rush round
    }
    setTimeout(() => setFlash(null), 350);
  }, [dragId, round, placed, finish]);

  useEffect(() => {
    if (dragId === null) return;
    const move = (e: PointerEvent) => setDragPos({ x: e.clientX, y: e.clientY });
    const up = (e: PointerEvent) => handleDrop(e.clientX, e.clientY);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragId, handleDrop]);

  if (!round) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-pixel text-sm text-arcade-neon-cyan animate-blink">LOADING...</p>
      </div>
    );
  }

  const dragPiece = round.pieces.find((p) => p.id === dragId);
  const trayPieces = round.pieces.filter((p) => !placed.has(p.id));

  return (
    <div className="flex-1 flex flex-col px-3 py-3 gap-3 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <p className="font-pixel text-[9px] text-arcade-neon-green neon-text-green tracking-widest">{round.label}</p>
        <p className="font-pixel text-[8px] text-gray-500">{placed.size}/{round.pieces.length} PLACED · NO MISSES</p>
      </div>

      <div
        className={`relative border transition-colors ${flash === "ok" ? "border-arcade-neon-green" : flash === "bad" ? "border-arcade-neon-red" : "border-arcade-border"}`}
        style={flash === "ok" ? { boxShadow: "0 0 24px #00ff4177" } : flash === "bad" ? { boxShadow: "0 0 24px #ff333377" } : undefined}
      >
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" style={{ background: "#080810" }} aria-label="World map">
          {round.fixed.map(({ id, d }) => (
            <path key={id} d={d} fill="#13233d" stroke="#0f2a44" strokeWidth={0.8} />
          ))}
          {round.pieces.map((p) =>
            placed.has(p.id) ? (
              <path key={p.id} d={p.d} fill="#00d4ff" stroke="#080810" strokeWidth={0.8} opacity={0.9} />
            ) : (
              <path key={p.id} d={p.d} fill="#0d1420" stroke="#1a1a2e" strokeWidth={0.8} strokeDasharray="3 3" />
            )
          )}
        </svg>
      </div>

      <div className="border border-arcade-border p-2">
        <p className="font-pixel text-[7px] text-gray-600 mb-2 tracking-widest">DRAG PIECES ONTO THE MAP</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {trayPieces.map((p) => {
            const pad = Math.max(p.bw, p.bh) * 0.08 + 2;
            return (
              <button
                key={p.id}
                onPointerDown={(e) => { e.preventDefault(); setDragId(p.id); setDragPos({ x: e.clientX, y: e.clientY }); }}
                className={`shrink-0 w-20 h-20 border bg-arcade-surface touch-none cursor-grab transition-colors ${dragId === p.id ? "border-arcade-neon-cyan opacity-40" : "border-arcade-border hover:border-arcade-neon-cyan"}`}
                title={p.name}
              >
                <svg viewBox={`${p.bx - pad} ${p.by - pad} ${p.bw + pad * 2} ${p.bh + pad * 2}`} className="w-full h-full pointer-events-none">
                  <path d={p.d} fill="#00d4ff" opacity={0.85} />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {dragPiece && dragId !== null && (
        <div className="fixed z-50 pointer-events-none w-24 h-24" style={{ left: dragPos.x, top: dragPos.y, transform: "translate(-50%, -50%)" }}>
          <svg viewBox={`${dragPiece.bx - 4} ${dragPiece.by - 4} ${dragPiece.bw + 8} ${dragPiece.bh + 8}`} className="w-full h-full" style={{ filter: "drop-shadow(0 0 8px #00d4ff)" }}>
            <path d={dragPiece.d} fill="#00d4ff" opacity={0.9} />
          </svg>
        </div>
      )}
    </div>
  );
}
