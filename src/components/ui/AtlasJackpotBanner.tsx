"use client";

import { Trophy, Gem, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import { useCoinStore } from "@/store/coinStore";
import { ATLAS_JACKPOT_COST } from "@/lib/supabase/coins";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";

// Full-width "Boss Stage" hero. Sits above the game grid. No daily mode —
// costs ATLAS_JACKPOT_COST tokens (daily first, then premium) and is gated
// behind sign-in (premium tokens are accounts-only).
export function AtlasJackpotBanner() {
  const { user, openModal } = useAuthStore();
  const startGame = useGameStore((s) => s.startGame);
  const { spendTokens } = useCoinStore();
  const t = useT();

  const play = async () => {
    sfx.click();
    if (!user) { openModal("signin"); return; }
    const ok = await spendTokens(ATLAS_JACKPOT_COST);
    if (ok) startGame("atlas-jackpot", "arcade");
    // spendTokens opens the OUT OF TOKENS modal itself when short
  };

  return (
    <div className="w-full max-w-6xl">
      <button
        type="button"
        onClick={play}
        aria-label="Atlas Jackpot"
        className="group relative w-full flex flex-col sm:flex-row items-center gap-5 p-6 sm:p-8 bg-arcade-surface border border-arcade-neon-yellow text-left cursor-pointer active:scale-[0.99] transition-all overflow-hidden"
        style={{ boxShadow: "0 0 18px #ffe60055, inset 0 0 32px #ffe6000f" }}
      >
        {/* corner ticks */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-arcade-neon-yellow" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-arcade-neon-yellow" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-arcade-neon-yellow" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-arcade-neon-yellow" />

        <Trophy size={52} className="shrink-0 text-arcade-neon-yellow neon-text-yellow group-hover:scale-110 transition-transform" />

        <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
          <p className="font-pixel text-[8px] text-arcade-neon-red neon-text-red tracking-[0.3em] animate-blink">
            {t("bossStage")}
          </p>
          <h2 className="font-pixel text-sm sm:text-lg text-arcade-neon-yellow neon-text-yellow tracking-widest">
            ATLAS JACKPOT
          </h2>
          <p className="font-mono text-sm text-gray-400 leading-relaxed">{t("descJackpot")}</p>
          <p className="font-pixel text-[7px] text-arcade-neon-green tracking-wider flex items-center gap-1 justify-center sm:justify-start">
            <Gem size={9} /> {t("jackpotReward")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 shrink-0">
          <span className="font-pixel text-[9px] px-3 py-1.5 border border-arcade-neon-yellow text-arcade-neon-yellow flex items-center gap-1.5">
            {!user && <Lock size={10} />}
            {t("jackpotCost").replace("{X}", String(ATLAS_JACKPOT_COST))}
          </span>
          <span className="font-pixel text-[10px] px-4 py-2 border border-arcade-neon-yellow text-arcade-neon-yellow group-hover:bg-arcade-neon-yellow group-hover:text-black transition-all">
            {user ? t("jackpotEnter") : t("jackpotSignIn")}
          </span>
        </div>
      </button>
    </div>
  );
}
