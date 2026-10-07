"use client";

import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
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
  const [accentText, accentGlow] = a.text.split(" ");
  const t = useT();

  const handleClick = () => {
    if (comingSoon || locked) return;
    sfx.click();
    onPlay();
  };

  const inert = comingSoon || locked;
  const descriptionId = `game-${slug}-description`;
  const statusId = `game-${slug}-status`;
  const lockedId = `game-${slug}-locked`;
  const describedBy = [descriptionId, inert ? statusId : "", locked ? lockedId : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      disabled={inert}
      aria-label={title}
      aria-describedby={describedBy}
      className={`relative flex flex-col gap-4 p-5 bg-arcade-surface border text-left transition-all duration-200 group game-action-card ${
        locked
          ? "border-arcade-neon-yellow cursor-default"
          : comingSoon
          ? "border-arcade-border cursor-default"
          : `${a.border} ${a.hover} active:bg-arcade-surface cursor-pointer active:scale-95`
      }`}
      style={locked ? { boxShadow: "0 0 10px #ffe60066, 0 0 28px #ffe60022, inset 0 0 18px #ffe60011" } : undefined}
      onClick={handleClick}
    >
      {locked && (
        <span id={lockedId} className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 bg-arcade-bg border border-arcade-neon-yellow font-pixel text-[7px] text-arcade-neon-yellow neon-text-yellow">
          <Lock size={8} /> {t("locked")}
        </span>
      )}
      <span className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${comingSoon ? "border-arcade-border" : a.border}`} />
      <span className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${comingSoon ? "border-arcade-border" : a.border}`} />
      <span className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${comingSoon ? "border-arcade-border" : a.border}`} />
      <span className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${comingSoon ? "border-arcade-border" : a.border}`} />

      <div className="flex justify-between items-start">
        {/* Keep the icon on a solid accent background in light mode. */}
        <div className={`inline-flex items-center justify-center light:p-1.5 ${comingSoon ? "" : a.solidLight}`}>
          <Icon size={28} className={`${comingSoon ? "text-gray-300 light:text-gray-700" : `${accentText} ${accentGlow} light:text-white`} ${comingSoon ? "" : "group-hover:scale-110"} transition-transform duration-200`} />
        </div>
        {highScore !== undefined && !comingSoon && (
          <div className="text-right">
            <p className="font-pixel text-[7px] text-gray-300 light:text-gray-700">{t("best")}</p>
            <p className={`font-pixel text-[10px] ${accentText}`}>{formatNumber(highScore)}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className={`font-pixel text-xs ${comingSoon ? "text-gray-300 light:text-gray-700" : accentText} mb-2`}>{title}</h3>
        <p id={descriptionId} className="font-mono text-sm text-gray-300 light:text-gray-700 leading-relaxed">{description}</p>
      </div>

      {locked ? (
        <div id={statusId} className="mt-auto min-h-[44px] flex items-center justify-center text-center font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow">
          {t("comingSoon")}
        </div>
      ) : comingSoon ? (
        <div id={statusId} className="mt-auto min-h-[44px] flex items-center justify-center text-center font-pixel text-[9px] border border-arcade-border text-gray-300 light:text-gray-700">
          {t("comingSoon")}
        </div>
      ) : (
        <div className={`mt-auto min-h-[44px] flex items-center justify-center text-center font-pixel text-[9px] border ${a.border} ${accentText} light:text-white ${a.solidLight} game-action-fill transition-all duration-200`} style={{ "--game-action-color": a.actionColor } as CSSProperties}>
          {t("play")}
        </div>
      )}
    </button>
  );
}
