"use client";

import { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";
import type { GameSlug } from "@/store/gameStore";

/** Three tutorial steps per game, as i18n keys. */
const STEPS: Record<GameSlug, [TKey, TKey, TKey]> = {
  "globle":             ["htpGloble1", "htpGloble2", "htpGloble3"],
  "capital-invaders":   ["htpCapital1", "htpCapital2", "htpCapital3"],
  "flag-rush":          ["htpFlag1", "htpFlag2", "htpFlag3"],
  "peaks-valleys":      ["htpPeaks1", "htpPeaks2", "htpPeaks3"],
  "tectonic-snap":      ["htpTectonic1", "htpTectonic2", "htpTectonic3"],
  "frontier-faceoff":   ["htpFrontier1", "htpFrontier2", "htpFrontier3"],
  "one-strike":         ["htpOneStrike1", "htpOneStrike2", "htpOneStrike3"],
  "urban-legends":      ["htpUrban1", "htpUrban2", "htpUrban3"],
  "skyline-silhouette": ["htpSkyline1", "htpSkyline2", "htpSkyline3"],
  "border-blitz":       ["htpBorder1", "htpBorder2", "htpBorder3"],
  "stat-attack":        ["htpStat1", "htpStat2", "htpStat3"],
  "atlas-jackpot":      ["htpJackpot1", "htpJackpot2", "htpJackpot3"],
};

interface HowToPlayButtonProps {
  slug: GameSlug;
  accent?: string;
  /** "icon": compact [?] glyph for game headers (default). "block": full-width labeled button for the pre-game modal. */
  variant?: "icon" | "block";
}

/** Retro "[ ? ]" button + the tutorial modal it opens. Drop into a game header. */
export function HowToPlayButton({ slug, accent = "text-arcade-neon-cyan", variant = "icon" }: HowToPlayButtonProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = STEPS[slug];

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  const close = () => { sfx.click(); setOpen(false); setStep(0); };
  const go = (d: number) => { sfx.click(); setStep((s) => Math.min(steps.length - 1, Math.max(0, s + d))); };

  return (
    <>
      {variant === "block" ? (
        <button
          type="button"
          onClick={() => { sfx.click(); setOpen(true); }}
          className={`w-full min-h-[44px] flex items-center justify-center gap-2 py-2 font-pixel text-[9px] border border-arcade-border ${accent} hover:border-current active:scale-95 transition-all`}
        >
          <HelpCircle size={13} /> {t("htpTitle")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => { sfx.click(); setOpen(true); }}
          aria-label={t("htpTitle")}
          title={t("htpTitle")}
          className={`shrink-0 flex items-center justify-center w-10 h-10 font-pixel text-[9px] ${accent} hover:brightness-150 active:scale-90 transition-all`}
        >
          <HelpCircle size={16} />
        </button>
      )}

      {/* No backdrop-click-to-close — matches AuthModal. Only [ CLOSE ] closes it. */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-sm bg-arcade-surface border border-arcade-neon-cyan shadow-neon-cyan p-6 modal-enter">
            <h2 className="font-pixel text-xs text-arcade-neon-cyan neon-text-cyan tracking-widest text-center mb-1">
              {t("htpTitle")}
            </h2>
            <p className="font-pixel text-[7px] text-gray-600 tracking-[0.3em] text-center mb-5">
              {t("htpStep").replace("{X}", String(step + 1)).replace("{Y}", String(steps.length))}
            </p>

            {/* Step body — fixed height so the modal doesn't jump between steps */}
            <div className="min-h-[92px] flex items-center justify-center border border-arcade-border bg-arcade-bg px-4 py-5 mb-5">
              <p className="font-mono text-base text-white text-center leading-relaxed">
                {t(steps[step])}
              </p>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 border transition-colors ${
                    i === step ? "bg-arcade-neon-cyan border-arcade-neon-cyan" : "border-arcade-border"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={step === 0}
                className="min-h-[44px] px-3 font-pixel text-[9px] border border-arcade-border text-gray-400 hover:text-arcade-neon-cyan hover:border-arcade-neon-cyan active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                [ &lt;- ]
              </button>
              <button
                type="button"
                onClick={close}
                className="flex-1 min-h-[44px] px-3 font-pixel text-[9px] border border-arcade-neon-cyan text-arcade-neon-cyan neon-text-cyan hover:bg-arcade-neon-cyan hover:text-black active:scale-95 transition-all"
              >
                [ {t("htpClose")} ]
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={step === steps.length - 1}
                className="min-h-[44px] px-3 font-pixel text-[9px] border border-arcade-border text-gray-400 hover:text-arcade-neon-cyan hover:border-arcade-neon-cyan active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                [ -&gt; ]
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
