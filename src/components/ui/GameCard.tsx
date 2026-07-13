"use client";

import type { LucideIcon } from "lucide-react";
import type { GameSlug } from "@/store/gameStore";

type Accent = { border: string; text: string; hover: string };

const ACCENTS: Record<GameSlug, Accent> = {
  "globle":           { border: "border-arcade-neon-cyan",    text: "text-arcade-neon-cyan neon-text-cyan",       hover: "hover:shadow-neon-cyan hover:border-arcade-neon-cyan" },
  "capital-invaders": { border: "border-arcade-neon-magenta", text: "text-arcade-neon-magenta neon-text-magenta", hover: "hover:shadow-neon-magenta hover:border-arcade-neon-magenta" },
  "flag-rush":        { border: "border-arcade-neon-yellow",  text: "text-arcade-neon-yellow neon-text-yellow",   hover: "hover:shadow-neon-yellow hover:border-arcade-neon-yellow" },
  "peaks-valleys":    { border: "border-arcade-neon-green",   text: "text-arcade-neon-green neon-text-green",     hover: "hover:shadow-neon-green hover:border-arcade-neon-green" },
};

interface Props {
  slug: GameSlug;
  title: string;
  description: string;
  Icon: LucideIcon;
  highScore?: number;
  onPlay: () => void;
}

export function GameCard({ slug, title, description, Icon, highScore, onPlay }: Props) {
  const a = ACCENTS[slug];

  return (
    <div
      className={`relative flex flex-col gap-4 p-5 bg-arcade-surface border ${a.border} ${a.hover} transition-all duration-200 cursor-pointer group`}
      onClick={onPlay}
    >
      <span className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${a.border}`} />
      <span className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${a.border}`} />
      <span className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${a.border}`} />
      <span className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${a.border}`} />

      <div className="flex justify-between items-start">
        <Icon size={28} className={`${a.text} group-hover:scale-110 transition-transform`} />
        {highScore !== undefined && (
          <div className="text-right">
            <p className="font-pixel text-[7px] text-gray-600">BEST</p>
            <p className={`font-pixel text-[10px] ${a.text}`}>{highScore}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className={`font-pixel text-xs ${a.text} mb-2`}>{title}</h3>
        <p className="font-mono text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>

      <div className={`mt-auto py-2 text-center font-pixel text-[9px] border ${a.border} ${a.text} group-hover:bg-current transition-all`}>
        PLAY →
      </div>
    </div>
  );
}
