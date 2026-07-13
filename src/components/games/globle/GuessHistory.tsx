import { bearingToArrow } from "@/lib/geo";
import type { Guess } from "../GlobleGame";

function fmt(km: number) {
  if (km < 500) return `${Math.round(km)} km`;
  return `${(km / 1000).toFixed(1)}k km`;
}

export function GuessHistory({ guesses }: { guesses: Guess[] }) {
  if (!guesses.length) return null;

  return (
    <div className="flex flex-col gap-1 mt-2">
      <p className="font-pixel text-[8px] text-gray-600 mb-1">GUESSES</p>
      {[...guesses].reverse().map((g, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2 border transition-colors"
          style={{ borderColor: g.color }}
        >
          <span className="font-mono text-sm text-white truncate max-w-[130px]">{g.country.name}</span>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="font-pixel text-[8px]" style={{ color: g.color }}>{fmt(g.distance)}</span>
            <span className="font-mono text-base text-gray-300">{bearingToArrow(g.bearing)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
