"use client";

import { useState, useCallback, useRef } from "react";
import { COUNTRY_STATS, type CountryStat, type StatKey } from "@/data/countryStats";
import { formatPopulation } from "@/data/countryClues";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { seededShuffle, gameRng } from "@/lib/daily";
import { sfx } from "@/lib/sfx";
import { useT, type TKey } from "@/lib/i18n";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";

const flagUrl = (a: string) => `https://flagcdn.com/w160/${a}.webp`;

const STATS: StatKey[] = ["population", "area", "borders"];
const SCENARIO_KEY: Record<StatKey, TKey> = {
  population: "saScenarioPop",
  area: "saScenarioArea",
  borders: "saScenarioBorders",
};
const STAT_LABEL_KEY: Record<StatKey, TKey> = {
  population: "saPop",
  area: "saArea",
  borders: "saBorders",
};

function fmtStat(stat: StatKey, v: number): string {
  if (stat === "population") return formatPopulation(v);
  if (stat === "area") return `${v.toLocaleString()} km²`;
  return String(v);
}

interface Round {
  hand: CountryStat[];    // 3 player cards
  opponent: CountryStat;  // hidden until pick
  stat: StatKey;
}

function deal(): Round {
  const picked = seededShuffle(COUNTRY_STATS, Math.random).slice(0, 4);
  const stat = STATS[Math.floor(Math.random() * STATS.length)];
  return { hand: picked.slice(0, 3), opponent: picked[3], stat };
}

export default function StatAttack({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const t = useT();
  // seed only used to vary the opening deal; rounds re-deal with Math.random
  const [round, setRound] = useState<Round>(() => {
    const rng = gameRng("stat-attack", useGameStore.getState().mode);
    const picked = seededShuffle(COUNTRY_STATS, rng).slice(0, 4);
    return { hand: picked.slice(0, 3), opponent: picked[3], stat: STATS[Math.floor(rng() * STATS.length)] };
  });
  const [picked, setPicked] = useState<CountryStat | null>(null);
  const [status, setStatus] = useState<"playing" | "done">("playing");
  const [score, setScore] = useState(0);
  const savedRef = useRef(false);

  const pick = useCallback((card: CountryStat) => {
    if (picked) return;
    sfx.snap();
    setPicked(card);
    const won = card[round.stat] >= round.opponent[round.stat];
    if (won) sfx.correct(); else sfx.wrong();
    setTimeout(() => {
      if (won) {
        addScore(100);
        setScore((s) => s + 1);
        setRound(deal());
        setPicked(null);
      } else {
        setStatus("done");
        if (!savedRef.current) { savedRef.current = true; saveHighScore("stat-attack", score); }
      }
    }, 1400);
  }, [picked, round, addScore, score]);

  const revealed = picked !== null;
  const won = revealed && picked![round.stat] >= round.opponent[round.stat];

  if (status === "done") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-start pt-8 md:justify-center md:pt-0 gap-6 bg-arcade-bg px-4">
        <h1 className="font-pixel text-xs text-arcade-neon-cyan neon-text-cyan">STAT ATTACK</h1>
        <div className="border border-arcade-neon-cyan p-10 text-center space-y-3">
          <p className="font-pixel text-[9px] text-arcade-neon-red neon-text-red">{t("gameOver")}</p>
          <p className="font-pixel text-4xl text-arcade-neon-yellow neon-text-yellow">{score}</p>
          <p className="font-pixel text-[8px] text-gray-500">{t("saRounds").replace("{X}", String(score))}</p>
          <DailyPercentile performance={Math.min(1, score / 15)} />
        </div>
        <EndScreenActions
          slug="stat-attack"
          gameTitle="STAT ATTACK"
          score={score}
          performance={Math.min(1, score / 15)}
          squares={"🟦".repeat(Math.min(score, 10)) + "🟥"}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <GameBackButton onExit={onExit} />
        <h1 className="font-pixel text-[10px] text-arcade-neon-cyan neon-text-cyan tracking-widest">STAT ATTACK</h1>
        <span className="font-pixel text-[9px] text-arcade-neon-yellow">{score}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Scenario */}
        <div className="w-full border border-arcade-neon-cyan shadow-neon-cyan p-4 text-center">
          <p className="font-pixel text-[7px] text-gray-500 tracking-[0.3em] mb-2">{t("saBrief")}</p>
          <p className="font-mono text-base text-white leading-snug">{t(SCENARIO_KEY[round.stat])}</p>
          <p className="font-pixel text-[8px] text-arcade-neon-cyan neon-text-cyan mt-2">▸ {t(STAT_LABEL_KEY[round.stat])}</p>
        </div>

        {/* Opponent */}
        <div className="w-full flex items-center justify-center gap-3">
          <span className="font-pixel text-[8px] text-arcade-neon-red">{t("saOpponent")}</span>
          <div className={`w-28 h-16 border flex flex-col items-center justify-center ${revealed ? "border-arcade-neon-red" : "border-arcade-border"}`}>
            {revealed ? (
              <>
                <span className="font-mono text-[11px] text-gray-300 truncate max-w-[100px] px-1">{round.opponent.name}</span>
                <span className="font-pixel text-[9px] text-arcade-neon-red">{fmtStat(round.stat, round.opponent[round.stat])}</span>
              </>
            ) : (
              <span className="font-pixel text-lg text-gray-700">?</span>
            )}
          </div>
        </div>

        {revealed && (
          <p className={`font-pixel text-[11px] tracking-widest ${won ? "text-arcade-neon-green neon-text-green" : "text-arcade-neon-red neon-text-red"}`}>
            {won ? t("saWin") : t("saLose")}
          </p>
        )}

        {/* Player hand */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {round.hand.map((c) => {
            const isPicked = picked?.name === c.name;
            const beats = revealed && c[round.stat] >= round.opponent[round.stat];
            let border = "border-arcade-border hover:border-arcade-neon-cyan";
            if (revealed) border = isPicked ? (won ? "border-arcade-neon-green" : "border-arcade-neon-red") : beats ? "border-arcade-neon-green/40" : "border-arcade-border opacity-60";
            return (
              <button
                key={c.name}
                onClick={() => pick(c)}
                disabled={revealed}
                className={`flex flex-col items-center gap-2 p-3 border bg-arcade-surface active:scale-95 transition-all disabled:cursor-default ${border}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flagUrl(c.alpha2)} alt={c.name} width={64} height={42} className="w-full max-w-[64px] border border-black/40" loading="eager" />
                <span className="font-mono text-[13px] text-gray-200 text-center leading-tight">{c.name}</span>
                {revealed && (
                  <span className="font-pixel text-[8px] text-arcade-neon-cyan">{fmtStat(round.stat, c[round.stat])}</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="font-pixel text-[7px] text-gray-700 tracking-widest">{t("saPickBest")}</p>
      </div>
    </div>
  );
}
