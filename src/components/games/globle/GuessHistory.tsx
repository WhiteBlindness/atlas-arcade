import { formatDistance } from "@/lib/geo";
import { countryName } from "@/data/countries";
import { useSettingsStore } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";
import { BearingArrow } from "./BearingArrow";
import type { Guess } from "../GlobleGame";

export function GuessHistory({ guesses, onSelect }: { guesses: Guess[]; onSelect?: (g: Guess) => void }) {
  const lang = useSettingsStore((s) => s.lang);
  const t = useT();
  if (!guesses.length) return null;

  return (
    <div className="flex flex-col gap-1 mt-2">
      <p className="font-pixel text-[8px] text-gray-600 mb-1">{t("igGuessMany")}</p>
      {[...guesses].reverse().map((g, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect?.(g)}
          title={countryName(g.country, lang)}
          className="w-full flex items-center justify-between px-3 py-2 border text-left transition-all cursor-pointer hover:bg-arcade-border/40 active:scale-95"
          style={{ borderColor: g.color }}
        >
          <span className="font-mono text-sm text-white truncate max-w-[130px]">{countryName(g.country, lang)}</span>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="font-pixel text-[8px]" style={{ color: g.color }}>{formatDistance(g.distance)}</span>
            <span className="font-mono text-base text-gray-300"><BearingArrow deg={g.bearing} /></span>
          </div>
        </button>
      ))}
    </div>
  );
}
