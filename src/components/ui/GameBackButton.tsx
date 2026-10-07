"use client";

import { ArrowLeft } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useT } from "@/lib/i18n";

/** Top-left back button: "← HOME" in a daily, "← ARCADE" in paid arcade mode. */
export function GameBackButton({ onExit }: { onExit: () => void }) {
  const mode = useGameStore((s) => s.mode);
  const t = useT();
  return (
    <button
      onClick={onExit}
      className="flex items-center gap-2 min-h-[44px] pr-3 -ml-1 pl-1 font-pixel text-[9px] text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-900 active:scale-95 transition-all"
    >
      <ArrowLeft size={14} /> {mode === "daily" ? t("home") : t("arcadeWord")}
    </button>
  );
}
