"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Heart } from "lucide-react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature, neighbors } from "topojson-client";
import { COUNTRIES, COUNTRY_BY_NUMERIC } from "@/data/countries";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { sfx } from "@/lib/sfx";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { gameRng, seededShuffle, seededPick, createSeededRng, type Rng } from "@/lib/daily";
import type { MashupProps } from "./mashup";
import { MashupQuiz } from "./MashupShell";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const W = 480;
const H = 300;
const QUESTION_TIME = 10;
const TOTAL_QUESTIONS = 10;
const START_LIVES = 3;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let worldCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWorld(): Promise<any> {
  if (worldCache) return worldCache;
  const res = await fetch(GEO_URL);
  worldCache = await res.json();
  return worldCache;
}

interface BorderQuestion {
  target: number;          // numeric id of the highlighted country
  answer: number;          // numeric id of the true neighbor
  options: number[];       // 4 shuffled numeric ids
  targetPath: string;
  neighborPaths: string[]; // silhouettes of ALL its neighbors (unlabeled)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQuestions(world: any, rng: Rng, count: number): BorderQuestion[] {
  const geometries = world.objects.countries.geometries;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feats = (feature(world, world.objects.countries) as any).features as any[];
  const adjacency = neighbors(geometries);

  const known = new Set(COUNTRIES.map((c) => c.numeric));
  const idAt = (i: number) => parseInt(feats[i].id, 10);

  // candidates: known countries with at least 1 known neighbor
  const candidates: { idx: number; neighborIdx: number[] }[] = [];
  feats.forEach((f, i) => {
    if (!known.has(idAt(i))) return;
    const ns = adjacency[i].filter((n) => known.has(idAt(n)));
    if (ns.length >= 1) candidates.push({ idx: i, neighborIdx: ns });
  });

  const picked = seededShuffle(candidates, rng).slice(0, Math.min(count, candidates.length));

  return picked.map(({ idx, neighborIdx }) => {
    const targetId = idAt(idx);
    const neighborIds = neighborIdx.map(idAt);
    const answer = seededPick(neighborIds, rng);

    const wrongPool = COUNTRIES
      .map((c) => c.numeric)
      .filter((n) => n !== targetId && !neighborIds.includes(n));
    const distractors = seededShuffle(wrongPool, rng).slice(0, 3);

    // Fit the projection to the TARGET country (not the whole group) so it always
    // fills the display prominently — otherwise a country with far-flung neighbors
    // (Russia, Brazil) shrinks to a dot. Target fills the central ~60%; neighbours
    // spill into the surrounding margin as context.
    const projection = geoNaturalEarth1().fitExtent(
      [[W * 0.2, H * 0.2], [W * 0.8, H * 0.8]],
      feats[idx],
    );
    const pathGen = geoPath(projection);

    return {
      target: targetId,
      answer,
      options: seededShuffle([answer, ...distractors], rng),
      targetPath: pathGen(feats[idx]) ?? "",
      neighborPaths: neighborIdx.map((n) => pathGen(feats[n]) ?? ""),
    };
  });
}

export default function FrontierFaceOff({ onExit, isMashupMode, onMashupComplete, mashupSeed }: { onExit: () => void } & MashupProps) {
  if (isMashupMode && onMashupComplete) {
    return <FrontierFaceOffMashup mashupSeed={mashupSeed} onMashupComplete={onMashupComplete} />;
  }
  return <FrontierFaceOffStandalone onExit={onExit} />;
}

function FrontierFaceOffStandalone({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  // daily: 10 questions, 3 lives. arcade: endless survival, one mistake ends it.
  const isDaily = useGameStore((s) => s.mode) === "daily";
  const [questions, setQuestions] = useState<BorderQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(() => (useGameStore.getState().mode === "daily" ? START_LIVES : 1));
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "done">("loading");

  const livesRef = useRef(useGameStore.getState().mode === "daily" ? START_LIVES : 1);
  const questionStartRef = useRef(Date.now());
  const scoreSavedRef = useRef(false);
  const isAnswered = chosen !== null;
  const current = questions?.[idx];

  useEffect(() => {
    let alive = true;
    fetchWorld().then((world) => {
      if (!alive) return;
      const mode = useGameStore.getState().mode;
      setQuestions(buildQuestions(world, gameRng("frontier-faceoff", mode), mode === "daily" ? TOTAL_QUESTIONS : Number.MAX_SAFE_INTEGER));
      setStatus("playing");
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => { questionStartRef.current = Date.now(); }, [idx]);

  useEffect(() => {
    if (status !== "playing" || isAnswered) return;
    const id = setTimeout(() => {
      livesRef.current -= 1;
      setLives(livesRef.current);
      setChosen(-1);
      sfx.wrong();
    }, QUESTION_TIME * 1000);
    return () => clearTimeout(id);
  }, [idx, status, isAnswered]);

  useEffect(() => {
    if (!isAnswered || !questions) return;
    const id = setTimeout(() => {
      const nextIdx = idx + 1;
      if (nextIdx >= questions.length || livesRef.current <= 0) setStatus("done");
      else { setIdx(nextIdx); setChosen(null); }
    }, 1200);
    return () => clearTimeout(id);
  }, [isAnswered, idx, questions]);

  useEffect(() => {
    if (status === "done" && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      saveHighScore("frontier-faceoff", score);
    }
  }, [status, score]);

  const handleAnswer = useCallback((numeric: number) => {
    if (isAnswered || status !== "playing" || !current) return;
    setChosen(numeric);
    if (numeric === current.answer) {
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const speedBonus = Math.floor(70 * Math.max(0, (QUESTION_TIME - elapsed) / QUESTION_TIME));
      const pts = 100 + speedBonus;
      setScore((s) => s + pts);
      setCorrect((c) => c + 1);
      addScore(pts);
      sfx.correct();
    } else {
      livesRef.current -= 1;
      setLives(livesRef.current);
      sfx.wrong();
    }
  }, [isAnswered, status, current, addScore]);

  if (status === "done") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-start pt-8 md:justify-center md:pt-0 gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-magenta neon-text-magenta">FRONTIER FACE-OFF</h1>
        <div className="border border-arcade-neon-magenta p-10 text-center space-y-3">
          <p className="font-pixel text-[8px] text-gray-500">FINAL SCORE</p>
          <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{score}</p>
          <p className="font-pixel text-[8px] text-gray-500">
            {correct}{isDaily ? ` / ${TOTAL_QUESTIONS}` : ""} BORDERS NAILED
          </p>
          <DailyPercentile performance={0.6 * (correct / TOTAL_QUESTIONS) + 0.4 * Math.min(1, score / (TOTAL_QUESTIONS * 170))} />
        </div>
        <EndScreenActions
          slug="frontier-faceoff"
          gameTitle="FRONTIER FACE-OFF"
          score={score}
          performance={0.6 * (correct / TOTAL_QUESTIONS) + 0.4 * Math.min(1, score / (TOTAL_QUESTIONS * 170))}
          squares={"🟩".repeat(Math.min(correct, 10)) + "🟥"}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <GameBackButton onExit={onExit} />
        <h1 className="font-pixel text-[10px] text-arcade-neon-magenta neon-text-magenta">FRONTIER FACE-OFF</h1>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[9px] text-arcade-neon-yellow">{score}</span>
          {isDaily ? (
            <div className="flex gap-1">
              {Array.from({ length: START_LIVES }).map((_, i) => (
                <Heart key={i} size={10} className={i < lives ? "fill-red-500 text-red-500" : "fill-gray-800 text-gray-800"} />
              ))}
            </div>
          ) : (
            <span className="font-pixel text-[8px] text-arcade-neon-red">{correct}⚡</span>
          )}
        </div>
      </div>

      {status === "loading" || !current ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-pixel text-sm text-arcade-neon-magenta animate-blink">LOADING...</p>
        </div>
      ) : (
        <>
          {!isAnswered && (
            <div key={`tb-${idx}`} className="h-3 bg-arcade-border overflow-hidden">
              <div className="h-full w-full origin-left" style={{ backgroundColor: "#ff00ff", animation: `shrinkBar ${QUESTION_TIME}s linear forwards` }} />
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6 max-w-md mx-auto w-full">
            <p className="font-pixel text-[8px] text-gray-600 self-end">{isDaily ? `${idx + 1} / ${TOTAL_QUESTIONS}` : `Q${idx + 1} · SUDDEN DEATH`}</p>

            <div className="w-full border border-arcade-neon-magenta shadow-neon-magenta">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ background: "#080810" }} aria-label="Border map">
                {current.neighborPaths.map((d, i) => (
                  <path key={i} d={d} fill="#0d1420" stroke="#1a1a2e" strokeWidth={0.8} strokeDasharray="3 3" />
                ))}
                <path d={current.targetPath} fill="#ff00ff" opacity={0.85} stroke="#080810" strokeWidth={1} />
              </svg>
            </div>

            <p className="font-pixel text-[10px] text-center text-white leading-relaxed">
              WHO BORDERS{" "}
              <span className="text-arcade-neon-magenta neon-text-magenta">
                {COUNTRY_BY_NUMERIC[current.target]?.name.toUpperCase()}
              </span>
              ?
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              {current.options.map((numeric) => {
                const isCorrectOpt = numeric === current.answer;
                const isChosen = chosen === numeric;
                let cls = "border-arcade-border text-gray-300 enabled:hover:border-arcade-neon-magenta enabled:hover:text-arcade-neon-magenta";
                if (isAnswered) {
                  if (isCorrectOpt) cls = "border-arcade-neon-green text-arcade-neon-green bg-arcade-neon-green/10";
                  else if (isChosen) cls = "border-red-500 text-red-400 bg-red-500/10";
                }
                return (
                  <button
                    key={numeric}
                    onClick={() => handleAnswer(numeric)}
                    disabled={isAnswered}
                    className={`py-3 px-3 border font-mono text-sm active:scale-95 transition-all disabled:cursor-default ${cls}`}
                  >
                    {COUNTRY_BY_NUMERIC[numeric]?.name}
                  </button>
                );
              })}
            </div>

            {chosen === -1 && (
              <p className="font-pixel text-[9px] text-red-400 animate-blink">
                TIME! → {COUNTRY_BY_NUMERIC[current.answer]?.name}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Atlas Jackpot round: name one border neighbour, correct = success ───────────
function FrontierFaceOffMashup({ mashupSeed, onMashupComplete }: MashupProps) {
  const [q, setQ] = useState<BorderQuestion | null>(null);

  useEffect(() => {
    let alive = true;
    fetchWorld().then((world) => {
      if (!alive) return;
      const [built] = buildQuestions(world, createSeededRng(mashupSeed ?? "frontier-faceoff"), 1);
      setQ(built ?? null);
    });
    return () => { alive = false; };
  }, [mashupSeed]);

  if (!q) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-pixel text-sm text-arcade-neon-magenta animate-blink">LOADING...</p>
      </div>
    );
  }

  const prompt = (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="w-full border border-arcade-neon-magenta shadow-neon-magenta">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ background: "#080810" }} aria-label="Border map">
          {q.neighborPaths.map((d, i) => (
            <path key={i} d={d} fill="#0d1420" stroke="#1a1a2e" strokeWidth={0.8} strokeDasharray="3 3" />
          ))}
          <path d={q.targetPath} fill="#ff00ff" opacity={0.85} stroke="#080810" strokeWidth={1} />
        </svg>
      </div>
      <p className="font-pixel text-[10px] text-center text-white leading-relaxed">
        WHO BORDERS{" "}
        <span className="text-arcade-neon-magenta neon-text-magenta">
          {COUNTRY_BY_NUMERIC[q.target]?.name.toUpperCase()}
        </span>?
      </p>
    </div>
  );

  return (
    <MashupQuiz
      prompt={prompt}
      options={q.options.map((n) => ({ key: n, label: COUNTRY_BY_NUMERIC[n]?.name ?? "?" }))}
      correctKey={q.answer}
      onComplete={onMashupComplete!}
    />
  );
}
