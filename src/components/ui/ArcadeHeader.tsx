"use client";

import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useCoinStore } from "@/store/coinStore";
import { useT, LANGS } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";
import { LogOut, User, Volume2, VolumeX } from "lucide-react";

export function ArcadeHeader() {
  const { user, openModal, signOut } = useAuthStore();
  const { lang, sound, setLang, toggleSound } = useSettingsStore();
  const coins = useCoinStore((s) => s.coins);
  const t = useT();

  return (
    <header className="flex justify-between items-center gap-3 px-4 sm:px-6 py-4 border-b border-arcade-border">
      <div className="shrink-0">
        <h1 className="font-pixel text-sm text-arcade-neon-cyan neon-text-cyan tracking-widest">ATLAS</h1>
        <p className="font-pixel text-[8px] text-gray-500 mt-1 tracking-wider">ARCADE</p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Language switcher */}
        <div className="flex items-center" role="group" aria-label="Language">
          {LANGS.map((l, i) => (
            <span key={l} className="flex items-center">
              {i > 0 && <span className="font-pixel text-[8px] text-gray-700 px-1">|</span>}
              <button
                onClick={() => { setLang(l); sfx.click(); }}
                aria-pressed={lang === l}
                className={`font-pixel text-[9px] px-0.5 py-1 transition-colors ${
                  lang === l
                    ? "text-arcade-neon-green neon-text-green"
                    : "text-gray-600 hover:text-gray-300"
                }`}
              >
                {l.toUpperCase()}
              </button>
            </span>
          ))}
        </div>

        {/* Coin counter */}
        {coins !== null && (
          <div
            className="flex items-center gap-1.5 px-2 py-1.5 border border-arcade-neon-yellow/60"
            title="Arcade coins — 1 per Arcade Mode run, refills daily"
          >
            <span
              className="inline-block w-3 h-3 rounded-full border border-yellow-700"
              style={{ background: "radial-gradient(circle at 35% 35%, #ffe600, #b8860b)" }}
            />
            <span className="font-pixel text-[10px] text-arcade-neon-yellow neon-text-yellow">{coins}</span>
          </div>
        )}

        {/* Audio toggle */}
        <button
          onClick={() => { toggleSound(); if (!sound) sfx.click(); }}
          title={sound ? "Sound on" : "Sound off"}
          aria-label={sound ? "Mute sound" : "Unmute sound"}
          className={`transition-colors ${sound ? "text-arcade-neon-cyan" : "text-gray-700 hover:text-gray-400"}`}
        >
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-400 min-w-0">
              <User size={12} className="shrink-0" />
              <span className="font-mono text-xs text-arcade-neon-green neon-text-green truncate">
                {user.user_metadata?.username ?? user.email?.split("@")[0]}
              </span>
            </div>
            <button onClick={signOut} className="flex items-center gap-1 text-gray-500 hover:text-arcade-neon-red transition-colors" title="Sign out">
              <LogOut size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { openModal("signin"); sfx.click(); }}
            className="font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow neon-text-yellow px-3 py-2 hover:bg-arcade-neon-yellow hover:text-black transition-all whitespace-nowrap"
          >
            {t("insertCoin")}
          </button>
        )}
      </div>
    </header>
  );
}
