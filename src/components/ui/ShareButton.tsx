"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { buildShareText, copyShareText } from "@/lib/share";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";

interface Props {
  gameTitle: string;
  score: number;
  performance: number;
  squares?: string;
}

export function ShareButton({ gameTitle, score, performance, squares }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    sfx.click();
    const ok = await copyShareText(buildShareText({ gameTitle, score, performance, squares }));
    if (ok) {
      sfx.correct();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={share}
      className={`flex items-center justify-center gap-2 min-h-[44px] py-2 px-4 font-pixel text-[9px] border active:scale-95 transition-all ${
        copied
          ? "border-arcade-neon-green text-arcade-neon-green"
          : "border-arcade-neon-cyan text-arcade-neon-cyan hover:bg-arcade-neon-cyan hover:text-black"
      }`}
      style={{ boxShadow: copied ? "0 0 14px #00ff4155" : "0 0 14px #00d4ff44" }}
    >
      {copied ? <Check size={12} /> : <Share2 size={12} />}
      {copied ? t("copied") : t("shareResult")}
    </button>
  );
}
