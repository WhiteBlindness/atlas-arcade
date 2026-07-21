import { bearingToArrow } from "@/lib/geo";
import { countryName } from "@/data/countries";
import { useSettingsStore } from "@/store/settingsStore";
import type { Guess } from "../GlobleGame";

function fmt(km: number) {
  if (km < 500) return `${Math.round(km)} km`;
  return `${(km / 1000).toFixed(1)}k km`;
}

export function GuessHistory({ guesses, onSelect }: { guesses: Guess[]; onSelect?: (g: Guess) => void }) {
  const lang = useSettingsStore((s) => s.lang);
  if (!guesses.length) return null;

  return (
    <div className="flex flex-col gap-1 mt-2">
      <p className="font-pixel text-[8px] text-gray-600 mb-1">GUESSES</p>
      {[...guesses].reverse().map((g, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect?.(g)}
          title={countryName(g.country, lang)}
          className="w-full flex items-center justify-between px-3 py-2 border text-left transition-all cursor-pointer hover:bg-arcade-border/40 active:scale-[0.98]"
          style={{ borderColor: g.color }}
        >
          <span className="font-mono text-sm text-white truncate max-w-[130px]">{countryName(g.country, lang)}</span>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="font-pixel text-[8px]" style={{ color: g.color }}>{fmt(g.distance)}</span>
            <span className="font-mono text-base text-gray-300">{bearingToArrow(g.bearing)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
