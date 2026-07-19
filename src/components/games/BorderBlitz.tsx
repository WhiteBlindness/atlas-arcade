"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { feature, neighbors } from "topojson-client";
import { COUNTRIES } from "@/data/countries";
import { WorldMapGlobe } from "./globle/WorldMapGlobe";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { sfx } from "@/lib/sfx";
import { useT } from "@/lib/i18n";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const CONQUER_COLOR = "#ccff00";   // retro lime for conquered territory
const BATCH = 20;                  // trivia fetched per request (avoids the 5s rate limit)

// Decode HTML entities safely — textarea.value never executes markup.
function decodeEntities(s: string): string {
  if (typeof document === "undefined") return s;
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Question { q: string; correct: string; options: string[]; }

interface World {
  neighborMap: Map<number, number[]>; // numeric id → adjacent known numeric ids
  validIds: number[];
}

let worldCache: World | null = null;
async function loadWorld(): Promise<World> {
  if (worldCache) return worldCache;
  const raw = await fetch(GEO_URL).then((r) => r.json());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feats = (feature(raw, raw.objects.countries) as any).features as any[];
  const adjacency = neighbors(raw.objects.countries.geometries); // index-based adjacency
  const idAt = (i: number) => parseInt(feats[i].id, 10);
  const known = new Set(COUNTRIES.map((c) => c.numeric));

  const neighborMap = new Map<number, number[]>();
  const validIds: number[] = [];
  feats.forEach((f, i) => {
    const id = idAt(i);
    if (!known.has(id)) return;
    validIds.push(id);
    neighborMap.set(id, adjacency[i].map(idAt).filter((n: number) => known.has(n)));
  });
  worldCache = { neighborMap, validIds };
  return worldCache;
}

async function requestToken(): Promise<string | null> {
  try {
    const d = await fetch("https://opentdb.com/api_token.php?command=request").then((r) => r.json());
    return d.token ?? null;
  } catch { return null; }
}

// Geography (category 22), multiple choice. response_code 4 = token exhausted.
async function fetchQuestions(token: string | null): Promise<{ questions: Question[]; exhausted: boolean }> {
  const url = `https://opentdb.com/api.php?amount=${BATCH}&category=22&type=multiple${token ? `&token=${token}` : ""}`;
  try {
    const d = await fetch(url).then((r) => r.json());
    if (d.response_code === 4) return { questions: [], exhausted: true };
    if (d.response_code !== 0 || !Array.isArray(d.results)) return { questions: [], exhausted: false };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questions: Question[] = d.results.map((r: any) => ({
      q: decodeEntities(r.question),
      correct: decodeEntities(r.correct_answer),
      options: shuffle([r.correct_answer, ...r.incorrect_answers].map(decodeEntities)),
    }));
    return { questions, exhausted: false };
  } catch { return { questions: [], exhausted: false }; }
}

export default function BorderBlitz({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const t = useT();

  const worldRef = useRef<World | null>(null);
  const queueRef = useRef<Question[]>([]);
  const tokenRef = useRef<string | null>(null);
  const savedRef = useRef(false);

  const [conquered, setConquered] = useState<Set<number>>(new Set());
  const [zoomTarget, setZoomTarget] = useState<number | undefined>();
  const [current, setCurrent] = useState<Question | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "done" | "error">("loading");

  const colorMap = useMemo(() => {
    const m: Record<number, string> = {};
    conquered.forEach((id) => { m[id] = CONQUER_COLOR; });
    return m;
  }, [conquered]);

  // Init: world adjacency + OpenTDB token + first batch + spawn country.
  useEffect(() => {
    let alive = true;
    (async () => {
      const world = await loadWorld();
      if (!alive) return;
      worldRef.current = world;
      tokenRef.current = await requestToken();
      const { questions } = await fetchQuestions(tokenRef.current);
      if (!alive) return;
      if (questions.length === 0) { setStatus("error"); return; }
      queueRef.current = questions;
      const start = world.validIds[Math.floor(Math.random() * world.validIds.length)];
      setConquered(new Set([start]));
      setZoomTarget(start);
      setCurrent(queueRef.current.shift() ?? null);
      setStatus("playing");
    })();
    return () => { alive = false; };
  }, []);

  // Refill the queue before it empties; reset the token if OpenTDB exhausted it.
  const ensureQuestions = useCallback(async () => {
    if (queueRef.current.length >= 3) return;
    let res = await fetchQuestions(tokenRef.current);
    if (res.exhausted && tokenRef.current) {
      await fetch(`https://opentdb.com/api_token.php?command=reset&token=${tokenRef.current}`).catch(() => {});
      res = await fetchQuestions(tokenRef.current);
    }
    queueRef.current.push(...res.questions);
  }, []);

  // Conquer one adjacent unconquered country (or a random new front if surrounded).
  const expand = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    setConquered((prev) => {
      const cands = new Set<number>();
      prev.forEach((id) => (world.neighborMap.get(id) ?? []).forEach((n) => { if (!prev.has(n)) cands.add(n); }));
      let pick: number | undefined;
      if (cands.size > 0) {
        const arr = [...cands];
        pick = arr[Math.floor(Math.random() * arr.length)];
      } else {
        const un = world.validIds.filter((id) => !prev.has(id));
        pick = un[Math.floor(Math.random() * un.length)];
      }
      if (pick === undefined) return prev;
      setZoomTarget(pick);
      return new Set(prev).add(pick);
    });
  }, []);

  const answer = useCallback((opt: string) => {
    if (chosen || !current) return;
    setChosen(opt);
    if (opt === current.correct) {
      sfx.correct();
      addScore(100);
      expand();
      setTimeout(() => {
        setChosen(null);
        setCurrent(queueRef.current.shift() ?? null);
        ensureQuestions();
      }, 700);
    } else {
      sfx.wrong();
      setTimeout(() => {
        setStatus("done");
        if (!savedRef.current) { savedRef.current = true; saveHighScore("border-blitz", conquered.size); }
      }, 1100);
    }
  }, [chosen, current, expand, ensureQuestions, conquered.size, addScore]);

  const territories = conquered.size;

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border shrink-0">
        <GameBackButton onExit={onExit} />
        <h1 className="font-pixel text-xs text-arcade-neon-lime neon-text-lime tracking-widest">BORDER BLITZ</h1>
        <span className="font-pixel text-[9px] text-arcade-neon-lime">{t("bbTerritories").replace("{X}", String(territories))}</span>
      </div>

      {status === "error" ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="font-mono text-sm text-arcade-neon-red text-center">{t("bbQuestionErr")}</p>
          <EndScreenActions slug="border-blitz" gameTitle="BORDER BLITZ" score={0} performance={0} onExit={onExit} />
        </div>
      ) : status === "loading" ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-pixel text-sm text-arcade-neon-lime animate-blink">{t("authLoading")}</p>
        </div>
      ) : (
        <>
          {/* Conquest globe */}
          <div className="relative flex-1 min-h-0">
            <WorldMapGlobe colorMap={colorMap} zoomTarget={zoomTarget} />

            {status === "done" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-4">
                <div className="border border-arcade-neon-lime bg-black/92 p-6 text-center space-y-3 min-w-[240px]" style={{ boxShadow: "0 0 40px #ccff0055" }}>
                  <p className="font-pixel text-[11px] text-arcade-neon-red neon-text-red tracking-widest">{t("gameOver")}</p>
                  <p className="font-pixel text-3xl text-arcade-neon-lime neon-text-lime">{territories}</p>
                  <p className="font-pixel text-[8px] text-gray-500">{t("bbTerritories").replace("{X}", String(territories))}</p>
                  <DailyPercentile performance={Math.min(1, territories / 20)} />
                  <EndScreenActions
                    slug="border-blitz"
                    gameTitle="BORDER BLITZ"
                    score={territories}
                    performance={Math.min(1, territories / 20)}
                    squares={"🟪".repeat(Math.min(territories, 10))}
                    onExit={onExit}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Question panel */}
          {status === "playing" && (
            <div className="shrink-0 border-t border-arcade-border p-4 bg-arcade-bg max-h-[46vh] overflow-y-auto">
              <p className="font-pixel text-[8px] text-arcade-neon-lime neon-text-lime tracking-[0.2em] mb-2 text-center">{t("bbConquer")}</p>
              {current ? (
                <>
                  <p className="font-mono text-base text-white leading-snug text-center mb-3">{current.q}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {current.options.map((opt) => {
                      const isCorrect = opt === current.correct;
                      const isChosen = chosen === opt;
                      let cls = "border-arcade-border text-gray-300 enabled:hover:border-arcade-neon-lime enabled:hover:text-arcade-neon-lime";
                      if (chosen) {
                        if (isCorrect) cls = "border-arcade-neon-green text-arcade-neon-green bg-arcade-neon-green/10";
                        else if (isChosen) cls = "border-red-500 text-red-400 bg-red-500/10";
                      }
                      return (
                        <button
                          key={opt}
                          onClick={() => { sfx.snap(); answer(opt); }}
                          disabled={!!chosen}
                          className={`py-3 px-3 border font-mono text-sm active:scale-95 transition-all disabled:cursor-default ${cls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="font-pixel text-[9px] text-arcade-neon-lime animate-blink text-center py-6">{t("authLoading")}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
