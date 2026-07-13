"use client";

import { useState, useRef, useCallback } from "react";
import type { Country } from "@/data/countries";

interface Props {
  countries: Country[];
  guessedCodes: Set<number>;
  onGuess: (country: Country) => void;
}

export function GuessInput({ countries, guessedCodes, onGuess }: Props) {
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered =
    query.length >= 2
      ? countries
          .filter(
            (c) =>
              !guessedCodes.has(c.numeric) &&
              c.name.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 8)
      : [];

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
        <ul className="absolute z-20 w-full bg-arcade-surface border border-arcade-neon-cyan border-t-0 max-h-52 overflow-y-auto">
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
