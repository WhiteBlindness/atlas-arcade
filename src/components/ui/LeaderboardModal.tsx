"use client";

import { useState, useEffect } from "react";
import { X, Trophy } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useT } from "@/lib/i18n";

interface Row {
  username: string;
  score: number;
}

// Brand game titles (kept identical across languages).
const GAME_TABS: { slug: string; title: string }[] = [
  { slug: "globle", title: "GEORADAR" },
  { slug: "capital-invaders", title: "CAPITAL STRIKE" },
  { slug: "flag-rush", title: "FLAG FRENZY" },
  { slug: "peaks-valleys", title: "PEAKS & VALLEYS" },
  { slug: "tectonic-snap", title: "TECTONIC SNAP" },
  { slug: "frontier-faceoff", title: "FRONTIER FACE-OFF" },
  { slug: "one-strike", title: "ONE STRIKE" },
  { slug: "urban-legends", title: "URBAN LEGENDS" },
  { slug: "skyline-silhouette", title: "SKYLINE SILHOUETTE" },
  { slug: "border-blitz", title: "BORDER BLITZ" },
  { slug: "stat-attack", title: "STAT ATTACK" },
  { slug: "atlas-jackpot", title: "ATLAS JACKPOT" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

export function LeaderboardModal() {
  const { leaderboardOpen, closeLeaderboard } = useAuthStore();
  const t = useT();
  const [slug, setSlug] = useState("globle");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  // Lock background scroll while open.
  useEffect(() => {
    if (!leaderboardOpen) return;
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [leaderboardOpen]);

  // Fetch the edge-cached endpoint whenever the tab changes (while open).
  useEffect(() => {
    if (!leaderboardOpen) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for a fetch, runs once per slug/open change
    setStatus("loading");
    fetch(`/api/leaderboard?game=${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((d) => { if (alive) { setRows(d.leaderboard ?? []); setStatus("ok"); } })
      .catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [slug, leaderboardOpen]);

  if (!leaderboardOpen) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={closeLeaderboard}>
      <div
        className="relative w-full max-w-md max-h-[85dvh] flex flex-col bg-arcade-surface border border-arcade-neon-yellow shadow-neon-yellow p-6 modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="flex items-center gap-2 font-pixel text-xs text-arcade-neon-yellow neon-text-yellow tracking-wider">
            <Trophy size={14} /> {t("lbTitle")}
          </h2>
          <button onClick={closeLeaderboard} aria-label={t("closeLabel")} className="w-11 h-11 -mr-3 flex items-center justify-center text-gray-500 hover:text-white active:scale-90 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Game tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 shrink-0">
          {GAME_TABS.map((g) => (
            <button
              key={g.slug}
              onClick={() => setSlug(g.slug)}
              className={`shrink-0 px-3 py-1.5 font-pixel text-[8px] border transition-colors ${
                slug === g.slug
                  ? "border-arcade-neon-yellow text-arcade-neon-yellow neon-text-yellow"
                  : "border-arcade-border text-gray-500 hover:text-gray-300"
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>

        {/* Column header */}
        <div className="flex items-center justify-between px-3 pb-1 font-pixel text-[7px] text-gray-600 tracking-widest shrink-0">
          <span>{t("lbPlayer")}</span>
          <span>{t("lbPoints")}</span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto border border-arcade-border">
          {status === "loading" && (
            <p className="font-pixel text-[9px] text-arcade-neon-yellow animate-blink text-center py-10">{t("authLoading")}</p>
          )}
          {status === "error" && (
            <p className="font-mono text-sm text-arcade-neon-red text-center py-10 px-4">{t("lbError")}</p>
          )}
          {status === "ok" && rows.length === 0 && (
            <p className="font-mono text-sm text-gray-600 text-center py-10">{t("lbEmpty")}</p>
          )}
          {status === "ok" && rows.map((r, i) => (
            <div key={`${r.username}-${i}`} className="flex items-center justify-between px-3 py-2 border-b border-arcade-border last:border-b-0">
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-pixel text-[9px] text-gray-500 w-6 shrink-0">{MEDAL[i] ?? `${i + 1}.`}</span>
                <span className="font-mono text-sm text-gray-200 truncate">{r.username}</span>
              </span>
              <span className="font-pixel text-[10px] text-arcade-neon-yellow neon-text-yellow shrink-0">{r.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
