"use client";

// Shared UI for Atlas Jackpot boss-rush rounds. Keeps each game's mashup branch
// tiny: the quiz-style games (OneStrike, FlagRush, Capital Strike, Frontier,
// Urban Legends) all reduce to "show a prompt, pick 1 of N, correct = success".

import { useState, useCallback, type ReactNode } from "react";
import { sfx } from "@/lib/sfx";

export interface QuizOption {
  key: number | string;
  label: string;
}

interface MashupQuizProps {
  prompt: ReactNode;
  options: QuizOption[];
  correctKey: number | string;
  onComplete: (success: boolean) => void;
}

/** One-shot multiple-choice round. Reveals the answer, then reports success/fail. */
export function MashupQuiz({ prompt, options, correctKey, onComplete }: MashupQuizProps) {
  const [chosen, setChosen] = useState<number | string | null>(null);
  const answered = chosen !== null;

  const pick = useCallback(
    (key: number | string) => {
      if (answered) return;
      setChosen(key);
      const success = key === correctKey;
      if (success) sfx.correct(); else sfx.wrong();
      // brief reveal so the player sees the result before the ladder advances
      setTimeout(() => onComplete(success), success ? 600 : 1100);
    },
    [answered, correctKey, onComplete],
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6 max-w-md mx-auto w-full">
      {prompt}
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map((o) => {
          const isCorrect = o.key === correctKey;
          const isChosen = chosen === o.key;
          let cls = "border-arcade-border text-gray-300 enabled:hover:border-arcade-neon-cyan enabled:hover:text-arcade-neon-cyan";
          if (answered) {
            if (isCorrect) cls = "border-arcade-neon-green text-arcade-neon-green bg-arcade-neon-green/10";
            else if (isChosen) cls = "border-red-500 text-red-400 bg-red-500/10";
          }
          return (
            <button
              key={o.key}
              onClick={() => pick(o.key)}
              disabled={answered}
              className={`py-3 px-3 border font-mono text-sm active:scale-95 transition-all disabled:cursor-default ${cls}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
