"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type { Country } from "@/data/countries";
import { COUNTRY_ALIASES } from "@/data/countryAliases";

interface Props {
  countries: Country[];
  guessedCodes: Set<number>;
  onGuess: (country: Country) => void;
}

// strip accents + lowercase for forgiving matches
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function GuessInput({ countries, guessedCodes, onGuess }: Props) {
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const aliasIndex = useMemo(() => {
    const m = new Map<string, string>();
    for (const [k, v] of Object.entries(COUNTRY_ALIASES)) m.set(norm(k), v);
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = norm(query);
    if (q.length < 2) return [];

    const available = countries.filter((c) => !guessedCodes.has(c.numeric));
    const scored: { c: Country; rank: number }[] = [];

    // exact alias hit (e.g. "usa" -> United States) ranks first
    const aliasTarget = aliasIndex.get(q);

    for (const c of available) {
      const name = norm(c.name);
      let rank = -1;
      if (aliasTarget && norm(aliasTarget) === name) rank = 0;
      else if (name === q) rank = 1;
      else if (name.startsWith(q)) rank = 2;
      else if (name.includes(q)) rank = 3;
      else {
        // partial alias: query is a prefix of an alias that maps to this country
        for (const [ak, av] of aliasIndex) {
          if (ak.startsWith(q) && norm(av) === name) { rank = 4; break; }
        }
      }
      if (rank >= 0) scored.push({ c, rank });
    }

    return scored.sort((a, b) => a.rank - b.rank || a.c.name.localeCompare(b.c.name))
      .slice(0, 8)
      .map((s) => s.c);
  }, [query, countries, guessedCodes, aliasIndex]);

  const select = useCallback(
    (country: Country) => {
      onGuess(country);
      setQuery("");
      setIdx(0);
      inputRef.current?.focus();
    },
    [onGuess]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filtered.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => (i + 1) % filtered.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => (i - 1 + filtered.length) % filtered.length); }
    else if (e.key === "Enter" && filtered[idx]) select(filtered[idx]);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIdx(0); }}
        onKeyDown={handleKeyDown}
        placeholder="TYPE COUNTRY NAME..."
        autoComplete="off"
        autoFocus
        className="w-full bg-arcade-bg border border-arcade-neon-cyan shadow-neon-cyan outline-none px-3 py-2 font-mono text-sm text-white placeholder-gray-600"
      />
      {filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-arcade-surface border border-arcade-neon-cyan border-t-0 max-h-52 overflow-y-auto shadow-lg shadow-black/60">
          {filtered.map((c, i) => (
            <li
              key={c.numeric}
              className={`px-3 py-2 font-mono text-sm cursor-pointer transition-colors ${
                i === idx ? "bg-arcade-neon-cyan text-black" : "text-white hover:bg-arcade-border"
              }`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => select(c)}
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
