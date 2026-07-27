"use client";

import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GameSlug } from "@/store/gameStore";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";
import { GAME_THEME } from "@/lib/gameTheme";
import { formatNumber } from "@/lib/utils";

interface Props {
  slug: GameSlug;
  title: string;
  description: string;
  Icon: LucideIcon;
  highScore?: number;
  comingSoon?: boolean;
  /** teaser card: gold glow + lock badge, unplayable */
  locked?: boolean;
  onPlay: () => void;
}

export function GameCard({ slug, title, description, Icon, highScore, comingSoon, locked, onPlay }: Props) {
  const a = GAME_THEME[slug];
  const t = useT();

  const handleClick = () => {
    if (comingSoon || locked) return;
    sfx.click();
    onPlay();
  };

  const inert = comingSoon || locked;

  return (
    <button
      type="button"
      disabled={inert}
      aria-label={title}
      className={`relative flex flex-col gap-4 p-5 bg-arcade-surface border text-left transition-all duration-200 group ${
        locked
          ? "border-arcade-neon-yellow cursor-default"
          : comingSoon
          ? "border-arcade-border opacity-60 cursor-default"
          : `${a.border} ${a.hover} ${a.activeBg} cursor-pointer active:scale-95 active:brightness-125`
      }`}
      style={locked ? { boxShadow: "0 0 10px #ffe60066, 0 0 28px #ffe60022, inset 0 0 18px #ffe60011" } : undefined}
      onClick={handleClick}
    >
      {locked && (
        <span className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 bg-arcade-bg border border-arcade-neon-yellow font-pixel text-[7px] text-arcade-neon-yellow neon-text-yellow">
          <Lock size={8} /> {t("locked")}
        </span>
      )}
      <span className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${comingSoon ? "border-arcade-border" : a.border}`} />
      <span className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${comingSoon ? "border-arcade-border" : a.border}`} />
      <span className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${comingSoon ? "border-arcade-border" : a.border}`} />
      <span className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${comingSoon ? "border-arcade-border" : a.border}`} />

      <div className="flex justify-between items-start">
        {/* Icon chip: transparent in dark mode (icon just sits in accent color,
            unchanged from before); in light mode becomes a solid accent block
            with a white icon — "the accent is a block of color, never small
            colored text" (see DESIGN.md's Ink-on-Block Rule). */}
        <div className={`inline-flex items-center justify-center light:p-1.5 ${comingSoon ? "" : a.solidLight}`}>
          <Icon size={28} className={`${comingSoon ? "text-gray-600" : `${a.text} light:text-white`} ${comingSoon ? "" : "group-hover:scale-110"} transition-transform duration-200`} />
        </div>
        {highScore !== undefined && !comingSoon && (
          <div className="text-right">
            <p className="font-pixel text-[7px] text-gray-600">{t("best")}</p>
            <p className={`font-pixel text-[10px] ${a.text}`}>{formatNumber(highScore)}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className={`font-pixel text-xs ${comingSoon ? "text-gray-500" : a.text} mb-2`}>{title}</h3>
        <p className="font-mono text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>

      {locked ? (
        <div className="mt-auto py-2 text-center font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow animate-blink">
          {t("comingSoon")}
        </div>
      ) : comingSoon ? (
        <div className="mt-auto py-2 text-center font-pixel text-[9px] border border-arcade-border text-gray-600 animate-blink">
          {t("comingSoon")}
        </div>
      ) : (
        <div className={`mt-auto py-2 text-center font-pixel text-[9px] border ${a.border} ${a.text} light:text-white ${a.solidLight} group-hover:bg-current transition-all duration-200`}>
          {t("play")}
        </div>
      )}
    </button>
  );
}
