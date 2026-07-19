"use client";

import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useCoinStore } from "@/store/coinStore";
import { useDailyStore } from "@/store/dailyStore";
import { useT, LANGS } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";
import { LogOut, LogIn, User, Volume2, VolumeX, Flame, Globe, Gem, Sun, Moon, Trophy } from "lucide-react";

export function ArcadeHeader() {
  const { user, openModal, openProfile, openLeaderboard, signOut } = useAuthStore();
  const { lang, sound, theme, setLang, toggleSound, toggleTheme } = useSettingsStore();
  const coins = useCoinStore((s) => s.coins);
  const premiumTokens = useCoinStore((s) => s.premiumTokens);
  const streak = useDailyStore((s) => s.streak);
  const t = useT();

  const cycleLang = () => {
    const i = LANGS.indexOf(lang);
    setLang(LANGS[(i + 1) % LANGS.length]);
    sfx.click();
  };

  return (
    <header className="flex flex-nowrap justify-between items-center gap-x-2 sm:gap-x-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-arcade-border w-full max-w-full overflow-hidden">
      <div className="shrink-0">
        <h1 className="font-pixel text-xs sm:text-sm text-arcade-neon-cyan neon-text-cyan tracking-widest">ATLAS</h1>
        <p className="font-pixel text-[7px] sm:text-[8px] text-gray-500 mt-1 tracking-wider">ARCADE</p>
      </div>

      <div className="flex items-center flex-nowrap justify-end gap-1.5 sm:gap-4 min-w-0 overflow-x-auto scrollbar-hide">
        {/* Language switcher — compact globe on mobile, full EN|PT|ES on desktop */}
        <button
          onClick={cycleLang}
          aria-label="Change language"
          className="sm:hidden shrink-0 flex items-center gap-1 min-h-[40px] px-1 text-gray-400 hover:text-arcade-neon-green active:scale-90 transition-all"
        >
          <Globe size={15} />
          <span className="font-pixel text-[9px]">{lang.toUpperCase()}</span>
        </button>
        <div className="hidden sm:flex shrink-0 items-center" role="group" aria-label="Language">
          {LANGS.map((l, i) => (
            <span key={l} className="flex items-center">
              {i > 0 && <span className="font-pixel text-[8px] text-gray-700 px-1">|</span>}
              <button
                onClick={() => { setLang(l); sfx.click(); }}
                aria-pressed={lang === l}
                className={`font-pixel text-[9px] px-0.5 py-1 transition-colors ${
                  lang === l ? "text-arcade-neon-green neon-text-green" : "text-gray-600 hover:text-gray-300"
                }`}
              >
                {l.toUpperCase()}
              </button>
            </span>
          ))}
        </div>

        {/* Daily streak */}
        {streak > 0 && (
          <div className="flex shrink-0 items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 border border-arcade-neon-red/60" title="Daily challenge streak">
            <Flame size={12} className="text-arcade-neon-red fill-arcade-neon-red/40" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-arcade-neon-red neon-text-red">{streak}</span>
          </div>
        )}

        {/* Coin counter */}
        {coins !== null && (
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 border border-arcade-neon-yellow/60" title="Arcade coins — 1 per Arcade Mode run, refills daily">
            <span
              className="inline-block w-3 h-3 rounded-full border border-yellow-700"
              style={{ background: "radial-gradient(circle at 35% 35%, #ffe600, #b8860b)" }}
            />
            <span className="font-pixel text-[9px] sm:text-[10px] text-arcade-neon-yellow neon-text-yellow">{coins}</span>
          </div>
        )}

        {/* Premium token counter — accounts only */}
        {premiumTokens !== null && (
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 border border-arcade-neon-green/60" title={t("premiumTokensTip")}>
            <Gem size={12} className="text-arcade-neon-green" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-arcade-neon-green neon-text-green">{premiumTokens}</span>
          </div>
        )}

        {/* Leaderboard */}
        <button
          onClick={() => { openLeaderboard(); sfx.click(); }}
          title="Leaderboard"
          aria-label="Leaderboard"
          className="shrink-0 w-10 h-10 flex items-center justify-center text-arcade-neon-yellow hover:text-arcade-neon-cyan active:scale-90 transition-all"
        >
          <Trophy size={17} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => { toggleTheme(); sfx.click(); }}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="shrink-0 w-10 h-10 flex items-center justify-center text-arcade-neon-yellow hover:text-arcade-neon-cyan active:scale-90 transition-all"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Audio toggle */}
        <button
          onClick={() => { toggleSound(); if (!sound) sfx.click(); }}
          title={sound ? "Sound on" : "Sound off"}
          aria-label={sound ? "Mute sound" : "Unmute sound"}
          className={`shrink-0 w-10 h-10 flex items-center justify-center active:scale-90 transition-all ${sound ? "text-arcade-neon-cyan" : "text-gray-700 hover:text-gray-400"}`}
        >
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {user ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Name (desktop) / user icon (mobile) opens the profile modal */}
            <button
              onClick={() => { openProfile(); sfx.click(); }}
              aria-label="Open profile"
              className="flex items-center gap-2 text-gray-400 min-w-0 hover:text-arcade-neon-green active:scale-95 transition-all"
            >
              <User size={13} className="shrink-0" />
              <span className="hidden sm:inline font-mono text-xs text-arcade-neon-green neon-text-green truncate max-w-[120px]">
                {user.user_metadata?.username ?? user.email?.split("@")[0]}
              </span>
            </button>
            <button onClick={() => { sfx.click(); signOut(); }} className="flex items-center gap-1 text-gray-500 hover:text-arcade-neon-red transition-colors" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <>
            {/* Mobile: compact login icon */}
            <button
              onClick={() => { openModal("signin"); sfx.click(); }}
              aria-label={t("insertCoin")}
              className="sm:hidden shrink-0 flex items-center justify-center w-10 h-10 border border-arcade-neon-yellow text-arcade-neon-yellow neon-text-yellow hover:bg-arcade-neon-yellow hover:text-black active:scale-90 transition-all"
            >
              <LogIn size={16} />
            </button>
            {/* Desktop: full label */}
            <button
              onClick={() => { openModal("signin"); sfx.click(); }}
              className="hidden sm:block font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow neon-text-yellow px-3 py-2 hover:bg-arcade-neon-yellow hover:text-black transition-all whitespace-nowrap"
            >
              {t("insertCoin")}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
