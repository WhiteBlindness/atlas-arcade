"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature, neighbors } from "topojson-client";
import { COUNTRIES, COUNTRY_BY_NUMERIC } from "@/data/countries";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { sfx } from "@/lib/sfx";

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQuestions(world: any): BorderQuestion[] {
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

  const picked = shuffle(candidates).slice(0, TOTAL_QUESTIONS);

  return picked.map(({ idx, neighborIdx }) => {
    const targetId = idAt(idx);
    const neighborIds = neighborIdx.map(idAt);
    const answer = neighborIds[Math.floor(Math.random() * neighborIds.length)];

    const wrongPool = COUNTRIES
      .map((c) => c.numeric)
      .filter((n) => n !== targetId && !neighborIds.includes(n));
    const distractors = shuffle(wrongPool).slice(0, 3);

    // local projection fitted around target + neighbors
    const group = { type: "FeatureCollection" as const, features: [feats[idx], ...neighborIdx.map((n) => feats[n])] };
    const projection = geoNaturalEarth1().fitExtent([[12, 12], [W - 12, H - 12]], group);
    const pathGen = geoPath(projection);

    return {
      target: targetId,
      answer,
      options: shuffle([answer, ...distractors]),
      targetPath: pathGen(feats[idx]) ?? "",
      neighborPaths: neighborIdx.map((n) => pathGen(feats[n]) ?? ""),
    };
  });
}

export default function FrontierFaceOff({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const [questions, setQuestions] = useState<BorderQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "done">("loading");

  const livesRef = useRef(START_LIVES);
  const questionStartRef = useRef(Date.now());
  const scoreSavedRef = useRef(false);
  const isAnswered = chosen !== null;
  const current = questions?.[idx];

  useEffect(() => {
    let alive = true;
    fetchWorld().then((world) => {
      if (!alive) return;
      setQuestions(buildQuestions(world));
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-magenta neon-text-magenta">FRONTIER FACE-OFF</h1>
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
        <h1 className="font-pixel text-[10px] text-arcade-neon-magenta neon-text-magenta">FRONTIER FACE-OFF</h1>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[9px] text-arcade-neon-yellow">{score}</span>
          <div className="flex gap-1">
            {Array.from({ length: START_LIVES }).map((_, i) => (
              <Heart key={i} size={10} className={i < lives ? "fill-red-500 text-red-500" : "fill-gray-800 text-gray-800"} />
            ))}
          </div>
        </div>
      </div>

      {status === "loading" || !current ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-pixel text-sm text-arcade-neon-magenta animate-blink">LOADING...</p>
        </div>
      ) : (
        <>
          {!isAnswered && (
            <div key={`tb-${idx}`} className="h-1 bg-arcade-border overflow-hidden">
              <div className="h-full w-full origin-left" style={{ backgroundColor: "#ff00ff", animation: `shrinkBar ${QUESTION_TIME}s linear forwards` }} />
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6 max-w-md mx-auto w-full">
            <p className="font-pixel text-[8px] text-gray-600 self-end">{idx + 1} / {TOTAL_QUESTIONS}</p>

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
                    className={`py-3 px-3 border font-mono text-sm transition-all disabled:cursor-default ${cls}`}
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
