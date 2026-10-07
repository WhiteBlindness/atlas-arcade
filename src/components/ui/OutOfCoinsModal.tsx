"use client";

import { useState, useEffect } from "react";
import { X, Gem, Clock } from "lucide-react";
import { useCoinStore } from "@/store/coinStore";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";
import { useDialogFocus } from "@/components/ui/useDialogFocus";

/** Formats ms as "1H 23M" (>1h) or "23M 04S". */
function fmtCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}H ${pad(m)}M` : `${m}M ${pad(s)}S`;
}

/** Live regen countdown — ticks every second. */
function TokenTimer() {
  const msToNext = useCoinStore((s) => s.msToNext);
  const [, force] = useState(0);
  const t = useT();
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = msToNext();
  if (ms === null) {
    return <p className="font-pixel text-[8px] text-gray-500 leading-relaxed">{t("dailyTokenCap")}</p>;
  }
  return (
    <p className="flex items-center justify-center gap-2 font-pixel text-[9px] text-arcade-neon-cyan neon-text-cyan">
      <Clock size={11} /> {t("nextTokenIn").replace("{X}", fmtCountdown(ms))}
    </p>
  );
}

export function OutOfCoinsModal() {
  const { outOfCoinsOpen, closeOutOfCoins, guest } = useCoinStore();
  const t = useT();
  const [premiumNote, setPremiumNote] = useState(false);
  const dialogRef = useDialogFocus<HTMLDivElement>(outOfCoinsOpen, closeOutOfCoins);

  if (!outOfCoinsOpen) return null;

  const premium = () => {
    sfx.click();
    setPremiumNote(true);
  };

  // No backdrop-click-to-close — matches AuthModal. Only the X button closes it.
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="out-of-coins-title"
        tabIndex={-1}
        className="relative w-full max-w-sm max-h-[85dvh] overflow-y-auto border border-arcade-neon-red bg-arcade-bg p-6 space-y-4 text-center modal-enter"
        style={{ boxShadow: "0 0 40px #ff333344" }}
      >
        <button
          onClick={closeOutOfCoins}
          aria-label={t("cancel")}
          className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center text-gray-600 hover:text-white active:scale-90 active:bg-white/10 transition-all duration-200"
        >
          <X size={16} />
        </button>

        <p id="out-of-coins-title" className="font-pixel text-sm text-arcade-neon-red neon-text-red tracking-widest animate-blink">
          {t("outOfCoins")}
        </p>
        <p className="font-pixel text-2xl">🪙</p>
        <p className="font-mono text-sm text-gray-400 leading-relaxed">{t("outOfCoinsDesc")}</p>

        {guest && (
          <p className="font-pixel text-[8px] text-gray-500 tracking-wide">{t("guestTokenRefill")}</p>
        )}
        <div className="border border-arcade-border py-2">
          <TokenTimer />
        </div>

        <button
          onClick={premium}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow hover:bg-arcade-neon-yellow hover:text-black active:scale-95 active:bg-current/30 transition-all duration-200"
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
