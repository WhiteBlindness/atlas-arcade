"use client";

import { useState } from "react";
import { X, Clapperboard, Gem } from "lucide-react";
import { useCoinStore } from "@/store/coinStore";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";

export function OutOfCoinsModal() {
  const { outOfCoinsOpen, closeOutOfCoins, earnOne } = useCoinStore();
  const t = useT();
  const [adPlaying, setAdPlaying] = useState(false);
  const [premiumNote, setPremiumNote] = useState(false);

  if (!outOfCoinsOpen) return null;

  const watchAd = () => {
    if (adPlaying) return;
    sfx.click();
    setAdPlaying(true);
    // placeholder "ad" — 2s fake spot, then reward
    setTimeout(async () => {
      await earnOne();
      sfx.correct();
      setAdPlaying(false);
      closeOutOfCoins();
    }, 2000);
  };

  const premium = () => {
    sfx.click();
    setPremiumNote(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4" onClick={closeOutOfCoins}>
      <div
        className="relative w-full max-w-sm border border-arcade-neon-red bg-arcade-bg p-6 space-y-4 text-center modal-enter"
        style={{ boxShadow: "0 0 40px #ff333344" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeOutOfCoins}
          aria-label={t("cancel")}
          className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center text-gray-600 hover:text-white active:scale-90 transition-all"
        >
          <X size={16} />
        </button>

        <p className="font-pixel text-sm text-arcade-neon-red neon-text-red tracking-widest animate-blink">
          {t("outOfCoins")}
        </p>
        <p className="font-pixel text-2xl">🪙</p>
        <p className="font-mono text-sm text-gray-400 leading-relaxed">{t("outOfCoinsDesc")}</p>

        <button
          onClick={watchAd}
          disabled={adPlaying}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 font-pixel text-[9px] border border-arcade-neon-green text-arcade-neon-green hover:bg-arcade-neon-green hover:text-black active:scale-95 transition-all disabled:opacity-60"
        >
          <Clapperboard size={12} />
          {adPlaying ? "AD PLAYING..." : t("watchAd")}
        </button>

        <button
          onClick={premium}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow hover:bg-arcade-neon-yellow hover:text-black active:scale-95 transition-all"
        >
          <Gem size={12} />
          {t("premium")}
        </button>

        {premiumNote && (
          <p className="font-pixel text-[8px] text-arcade-neon-yellow animate-blink">
            ▶ {t("comingSoon2")} ◀
          </p>
        )}
      </div>
    </div>
  );
}
