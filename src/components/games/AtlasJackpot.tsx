"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Trophy, Skull } from "lucide-react";
import type { GameSlug } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { seededShuffle } from "@/lib/daily";
import { sfx } from "@/lib/sfx";
import { useT } from "@/lib/i18n";
import { GAME_REGISTRY, MASHUP_POOL } from "@/lib/games";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { HowToPlayButton } from "@/components/ui/HowToPlay";

const LADDER = 15;

// The mini-games the boss rush draws from — every game in GAME_REGISTRY that
// implements the MashupProps contract (src/lib/games.ts is the single source
// of truth; add a game there and it's automatically eligible here, no second
// hardcoded list to forget).
const POOL: GameSlug[] = MASHUP_POOL;

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
  const savedRef = useRef(false);

  // Persist the reported score exactly once at game end. The browser cannot
  // verify a run, so it must not authorize a persistent premium-token grant.
  const finish = useCallback((reachedLevel: number, won: boolean) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const cleared = won ? LADDER : reachedLevel - 1;
    saveHighScore("atlas-jackpot", cleared);
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
  const GameComp = GAME_REGISTRY[slug].Component;
  const cleared = status === "won" ? LADDER : level - 1;

  return (
    <div className="min-h-dvh flex flex-col bg-arcade-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border">
        <div className="flex items-center gap-1">
          <GameBackButton onExit={onExit} />
          <HowToPlayButton slug="atlas-jackpot" accent="text-arcade-neon-yellow" />
        </div>
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
          {t("igStage")} {level} · <span className="text-arcade-neon-cyan">{GAME_REGISTRY[slug].title}</span>
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

function Ladder({ level, status }: { level: number; status: "playing" | "won" | "lost" }) {
  const t = useT();
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
            aria-label={(isCleared ? t("ajStageCleared") : isCurrent ? t("ajStageCurrent") : t("ajStageLabel")).replace("{X}", String(rung))}
          />
        );
      })}
    </div>
  );
}
