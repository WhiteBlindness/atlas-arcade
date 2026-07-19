"use client";

import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GameSlug } from "@/store/gameStore";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";

type Accent = { border: string; text: string; hover: string };

const ACCENTS: Record<GameSlug, Accent> = {
  "globle":           { border: "border-arcade-neon-cyan",    text: "text-arcade-neon-cyan neon-text-cyan",       hover: "hover:shadow-neon-cyan hover:border-arcade-neon-cyan" },
  "capital-invaders": { border: "border-arcade-neon-magenta", text: "text-arcade-neon-magenta neon-text-magenta", hover: "hover:shadow-neon-magenta hover:border-arcade-neon-magenta" },
  "flag-rush":        { border: "border-arcade-neon-yellow",  text: "text-arcade-neon-yellow neon-text-yellow",   hover: "hover:shadow-neon-yellow hover:border-arcade-neon-yellow" },
  "peaks-valleys":    { border: "border-arcade-neon-green",   text: "text-arcade-neon-green neon-text-green",     hover: "hover:shadow-neon-green hover:border-arcade-neon-green" },
  "tectonic-snap":    { border: "border-arcade-neon-cyan",    text: "text-arcade-neon-cyan neon-text-cyan",       hover: "hover:shadow-neon-cyan hover:border-arcade-neon-cyan" },
  "frontier-faceoff": { border: "border-arcade-neon-magenta", text: "text-arcade-neon-magenta neon-text-magenta", hover: "hover:shadow-neon-magenta hover:border-arcade-neon-magenta" },
  "one-strike":       { border: "border-arcade-neon-yellow",  text: "text-arcade-neon-yellow neon-text-yellow",   hover: "hover:shadow-neon-yellow hover:border-arcade-neon-yellow" },
  "urban-legends":    { border: "border-arcade-neon-green",   text: "text-arcade-neon-green neon-text-green",     hover: "hover:shadow-neon-green hover:border-arcade-neon-green" },
  "skyline-silhouette": { border: "border-arcade-neon-magenta", text: "text-arcade-neon-magenta neon-text-magenta", hover: "hover:shadow-neon-magenta hover:border-arcade-neon-magenta" },
  "border-blitz":     { border: "border-arcade-neon-magenta", text: "text-arcade-neon-magenta neon-text-magenta", hover: "hover:shadow-neon-magenta hover:border-arcade-neon-magenta" },
  "stat-attack":      { border: "border-arcade-neon-cyan",    text: "text-arcade-neon-cyan neon-text-cyan",       hover: "hover:shadow-neon-cyan hover:border-arcade-neon-cyan" },
  "atlas-jackpot":    { border: "border-arcade-neon-yellow",  text: "text-arcade-neon-yellow neon-text-yellow",   hover: "" },
};

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
  const a = ACCENTS[slug];
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
          : `${a.border} ${a.hover} cursor-pointer active:scale-[0.98] active:brightness-125`
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
        <Icon size={28} className={`${comingSoon ? "text-gray-600" : a.text} ${comingSoon ? "" : "group-hover:scale-110"} transition-transform`} />
        {highScore !== undefined && !comingSoon && (
          <div className="text-right">
            <p className="font-pixel text-[7px] text-gray-600">{t("best")}</p>
            <p className={`font-pixel text-[10px] ${a.text}`}>{highScore}</p>
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
        <div className={`mt-auto py-2 text-center font-pixel text-[9px] border ${a.border} ${a.text} group-hover:bg-current transition-all`}>
          {t("play")}
        </div>
      )}
    </button>
  );
}
