"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { countryName, type Country } from "@/data/countries";
import { COUNTRY_ALIASES } from "@/data/countryAliases";
import { useSettingsStore } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

interface Props {
  countries: Country[];
  guessedCodes: Set<number>;
  onGuess: (country: Country) => void;
}

// strip accents + lowercase for forgiving matches
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Best match rank of a single name against the query (lower = better), or -1.
const rankName = (nameNorm: string, q: string): number => {
  if (nameNorm === q) return 1;
  if (nameNorm.startsWith(q)) return 2;
  if (nameNorm.includes(q)) return 3;
  return -1;
};

export function GuessInput({ countries, guessedCodes, onGuess }: Props) {
  const t = useT();
  const lang = useSettingsStore((s) => s.lang);
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
      const en = norm(c.name);
      // Match against all three localized names so a PT/ES player finds their country.
      const names = [en, norm(c.pt), norm(c.es)];
      let rank = -1;
      // Alias always resolves to the canonical English name.
      if (aliasTarget && norm(aliasTarget) === en) rank = 0;
      else {
        for (const n of names) {
          const r = rankName(n, q);
          if (r >= 0 && (rank < 0 || r < rank)) rank = r;
        }
        if (rank < 0) {
          // partial alias: query is a prefix of an alias that maps to this country
          for (const [ak, av] of aliasIndex) {
            if (ak.startsWith(q) && norm(av) === en) { rank = 4; break; }
          }
        }
      }
      if (rank >= 0) scored.push({ c, rank });
    }

    return scored.sort((a, b) => a.rank - b.rank || countryName(a.c, lang).localeCompare(countryName(b.c, lang)))
      .slice(0, 8)
      .map((s) => s.c);
  }, [query, countries, guessedCodes, aliasIndex, lang]);

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
        placeholder={t("typeCountry")}
        autoComplete="off"
        autoFocus
        className="w-full bg-arcade-bg border border-arcade-neon-cyan shadow-neon-cyan outline-none px-3 py-2 font-mono text-base text-white placeholder-gray-600"
      />
      {/* Dropdown opens upward on mobile (bottom-full) so the keyboard never
          covers it; downward on desktop (md:top-full). */}
      {filtered.length > 0 && (
        <ul className="absolute left-0 right-0 z-50 bottom-full mb-1 md:bottom-auto md:mb-0 md:top-full bg-arcade-surface border border-arcade-neon-cyan max-h-52 overflow-y-auto shadow-lg shadow-black/60">
          {filtered.map((c, i) => (
            <li
              key={c.numeric}
              className={`px-3 py-2 font-mono text-sm cursor-pointer transition-colors ${
                i === idx ? "bg-arcade-neon-cyan text-black" : "text-white hover:bg-arcade-border"
              }`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => select(c)}
            >
              {countryName(c, lang)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
