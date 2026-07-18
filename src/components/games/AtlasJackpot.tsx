"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Trophy, Skull, Gem } from "lucide-react";
import type { GameSlug } from "@/store/gameStore";
import { useCoinStore } from "@/store/coinStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { seededShuffle } from "@/lib/daily";
import { sfx } from "@/lib/sfx";
import { useT } from "@/lib/i18n";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import {
  GlobleGame, CapitalInvaders, FlagRush, PeaksValleys,
  TectonicSnap, FrontierFaceOff, OneStrike, UrbanLegends,
} from "@/components/games";
import type { MashupProps } from "./mashup";

const LADDER = 15;

// Safe-step milestones. Highest tier reached pays out (not cumulative):
//   beat L15 → 10, reach L10 → 3, reach L5 → 1.
const MILESTONES = [
  { min: 10, reward: 3 },
  { min: 5, reward: 1 },
] as const;
const JACKPOT_REWARD = 10;

/** Premium tokens earned. `reachedLevel` = rung the player was on; `won` = beat L15. */
function payoutFor(reachedLevel: number, won: boolean): number {
  if (won) return JACKPOT_REWARD;
  for (const m of MILESTONES) if (reachedLevel >= m.min) return m.reward;
  return 0;
}

// The 8 mini-games the boss rush draws from.
const POOL: GameSlug[] = [
  "globle", "capital-invaders", "flag-rush", "peaks-valleys",
  "tectonic-snap", "frontier-faceoff", "one-strike", "urban-legends",
];

type GameComponent = React.ComponentType<{ onExit: () => void } & MashupProps>;

const COMPONENTS: Record<string, GameComponent> = {
  "globle": GlobleGame,
  "capital-invaders": CapitalInvaders,
  "flag-rush": FlagRush,
  "peaks-valleys": PeaksValleys,
  "tectonic-snap": TectonicSnap,
  "frontier-faceoff": FrontierFaceOff,
  "one-strike": OneStrike,
  "urban-legends": UrbanLegends,
};

const TITLES: Record<string, string> = {
  "globle": "GEORADAR",
  "capital-invaders": "CAPITAL STRIKE",
  "flag-rush": "FLAG FRENZY",
  "peaks-valleys": "PEAKS & VALLEYS",
  "tectonic-snap": "TECTONIC SNAP",
  "frontier-faceoff": "FRONTIER FACE-OFF",
  "one-strike": "ONE STRIKE",
  "urban-legends": "URBAN LEGENDS",
};

export default function AtlasJackpot({ onExit }: { onExit: () => void }) {
  const t = useT();
  // No daily mode — always a fresh random 15-game sequence. A per-run salt keeps
  // each rung's question distinct even when a game repeats within the ladder.
  const [runSalt] = useState(() => Math.random().toString(36).slice(2, 8));
  const sequence = useMemo<GameSlug[]>(() => {
    const seq: GameSlug[] = [];
    // reshuffle the pool repeatedly so no game repeats back-to-back within a batch
    while (seq.length < LADDER) {
      for (const g of seededShuffle(POOL, Math.random)) {
        if (seq.length < LADDER) seq.push(g);
      }
    }
    return seq;
  }, []);

  const [level, setLevel] = useState(1); // 1-based current rung
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [reward, setReward] = useState(0);
  const savedRef = useRef(false);

  // Persist score + award the premium-token payout, exactly once, at game end.
  const finish = useCallback((reachedLevel: number, won: boolean) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const cleared = won ? LADDER : reachedLevel - 1;
    saveHighScore("atlas-jackpot", cleared);
    const payout = payoutFor(reachedLevel, won);
    setReward(payout);
    if (payout > 0) useCoinStore.getState().earnPremium(payout);
  }, []);

  const handleResult = useCallback((success: boolean) => {
    if (status !== "playing") return;
    if (!success) {
      sfx.gameOver();
      finish(level, false); // reached this rung, then failed
      setStatus("lost");
      return;
    }
    if (level >= LADDER) {
      sfx.correct();
      finish(LADDER, true);
      setStatus("won");
      return;
    }
    sfx.correct();
    setLevel((l) => l + 1);
  }, [status, level, finish]);

  const slug = sequence[level - 1];
  const GameComp = COMPONENTS[slug];
  const cleared = status === "won" ? LADDER : level - 1;

  return (
    <div className="min-h-dvh flex flex-col bg-arcade-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <GameBackButton onExit={onExit} />
        <h1 className="font-pixel text-xs text-arcade-neon-yellow neon-text-yellow tracking-widest flex items-center gap-2">
          <Trophy size={12} /> ATLAS JACKPOT
        </h1>
        <p className="font-pixel text-[9px] text-gray-500">{level}/{LADDER}</p>
      </div>

      {/* 15-step retro ladder */}
      <Ladder level={level} status={status} />

      {/* Current game title */}
      {status === "playing" && (
        <p className="text-center font-pixel text-[8px] text-gray-500 py-2 tracking-widest">
          {t("igStage")} {level} · <span className="text-arcade-neon-cyan">{TITLES[slug]}</span>
        </p>
      )}

      {/* Play area — the mini-game renders one boss-rush round here */}
      <div className="flex-1 flex flex-col relative">
        {status === "playing" && GameComp && (
          <GameComp
            key={`${level}-${slug}`}
            onExit={onExit}
            isMashupMode
            onMashupComplete={handleResult}
            mashupSeed={`atlas-jackpot:${level}:${slug}:${runSalt}`}
            mashupLevel={level}
          />
        )}

        {/* Win */}
        {status === "won" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <Trophy size={48} className="text-arcade-neon-yellow neon-text-yellow" />
            <div className="border border-arcade-neon-yellow p-8 text-center space-y-3" style={{ boxShadow: "0 0 40px #ffe60055" }}>
              <p className="font-pixel text-sm text-arcade-neon-yellow neon-text-yellow tracking-widest">{t("igJackpot")}</p>
              <p className="font-mono text-lg text-white">{t("igAllStages").replace("{X}", String(LADDER))}</p>
              <RewardBadge reward={reward} />
              <DailyPercentile performance={1} />
            </div>
            <EndScreenActions slug="atlas-jackpot" gameTitle="ATLAS JACKPOT" score={LADDER} performance={1} squares={"🟩".repeat(10)} onExit={onExit} />
          </div>
        )}

        {/* Loss */}
        {status === "lost" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <Skull size={40} className="text-arcade-neon-red" />
            <div className="border border-arcade-neon-red p-8 text-center space-y-3" style={{ boxShadow: "0 0 40px #ff333355" }}>
              <p className="font-pixel text-sm text-arcade-neon-red neon-text-red tracking-widest">{t("gameOver")}</p>
              <p className="font-mono text-lg text-white">{t("igFellAt").replace("{X}", String(level))}</p>
              <div className="h-px bg-arcade-border" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-left">
                <span className="font-pixel text-[8px] text-gray-500">{t("igCleared")}</span>
                <span className="font-mono text-sm text-white text-right">{cleared} / {LADDER}</span>
              </div>
              <RewardBadge reward={reward} />
              <DailyPercentile performance={cleared / LADDER} />
            </div>
            <EndScreenActions
              slug="atlas-jackpot"
              gameTitle="ATLAS JACKPOT"
              score={cleared}
              performance={cleared / LADDER}
              squares={"🟩".repeat(Math.min(cleared, 10)) + "🟥"}
              onExit={onExit}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function RewardBadge({ reward }: { reward: number }) {
  const t = useT();
  if (reward <= 0) {
    return <p className="font-pixel text-[7px] text-gray-600 tracking-widest">{t("igNoPremium")}</p>;
  }
  return (
    <p className="flex items-center justify-center gap-2 font-pixel text-[10px] text-arcade-neon-green neon-text-green tracking-widest">
      <Gem size={12} /> {(reward === 1 ? t("igPremiumToken") : t("igPremiumTokens")).replace("{X}", String(reward))}
    </p>
  );
}

function Ladder({ level, status }: { level: number; status: "playing" | "won" | "lost" }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3 border-b border-arcade-border overflow-x-auto">
      {Array.from({ length: LADDER }).map((_, i) => {
        const rung = i + 1;
        const isCleared = status === "won" || rung < level;
        const isCurrent = status === "playing" && rung === level;
        const bg = isCleared ? "#00ff41" : isCurrent ? "#ffe600" : "#1a1a2e";
        return (
          <div
            key={rung}
            className="flex-1 min-w-[10px] h-3 rounded-sm transition-colors"
            style={{
              backgroundColor: bg,
              boxShadow: isCurrent ? "0 0 8px #ffe600" : isCleared ? "0 0 6px #00ff4188" : "none",
              animation: isCurrent ? "neonPulse 1.2s ease-in-out infinite" : undefined,
            }}
            aria-label={`Stage ${rung}${isCleared ? " cleared" : isCurrent ? " current" : ""}`}
          />
        );
      })}
    </div>
  );
}
