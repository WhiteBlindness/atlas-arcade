"use client";

import { useState, useEffect } from "react";
import { X, Gem, Trash2, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useGameStore, type GameSlug } from "@/store/gameStore";
import { useCoinStore } from "@/store/coinStore";
import { toast } from "@/store/toastStore";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";

const GAME_TITLES: Record<GameSlug, string> = {
  "globle": "GEORADAR",
  "capital-invaders": "CAPITAL STRIKE",
  "flag-rush": "FLAG FRENZY",
  "peaks-valleys": "PEAKS & VALLEYS",
  "tectonic-snap": "TECTONIC SNAP",
  "frontier-faceoff": "FRONTIER FACE-OFF",
  "one-strike": "ONE STRIKE",
  "urban-legends": "URBAN LEGENDS",
  "atlas-jackpot": "ATLAS JACKPOT",
};

export function ProfileModal() {
  const { user, profileOpen, closeProfile, signOut } = useAuthStore();
  const highScores = useGameStore((s) => s.highScores);
  const coins = useCoinStore((s) => s.coins);
  const premiumTokens = useCoinStore((s) => s.premiumTokens);
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Lock background scroll while open; clear the delete confirm on close (cleanup).
  useEffect(() => {
    if (!profileOpen) return;
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
      setConfirming(false);
    };
  }, [profileOpen]);

  if (!profileOpen || !user) return null;

  const name = (user.user_metadata?.username as string | undefined) ?? user.email?.split("@")[0] ?? "PLAYER";
  const scoreRows = (Object.entries(highScores) as [GameSlug, number][]).filter(([, v]) => v !== undefined);

  const handleDelete = async () => {
    sfx.click();
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    // Self-serve deletion via SECURITY DEFINER rpc; cascades wipe all user data.
    const { error } = await supabase.rpc("delete_own_user");
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    await signOut();
    closeProfile();
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={closeProfile}>
      <div
        className="relative w-full max-w-sm max-h-[85dvh] overflow-y-auto bg-arcade-surface border border-arcade-neon-cyan shadow-neon-cyan p-6 modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="flex items-center gap-2 font-pixel text-xs text-arcade-neon-cyan neon-text-cyan tracking-wider">
            <UserIcon size={14} /> {t("profileTitle")}
          </h2>
          <button onClick={closeProfile} aria-label={t("closeLabel")} className="w-11 h-11 -mr-3 flex items-center justify-center text-gray-500 hover:text-white active:scale-90 transition-all">
            <X size={18} />
          </button>
        </div>

        <p className="font-mono text-lg text-arcade-neon-green neon-text-green mb-5 truncate">{name}</p>

        {/* Token balances */}
        <p className="font-pixel text-[8px] text-gray-500 tracking-widest mb-2">{t("profileTokens")}</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="border border-arcade-neon-yellow/60 p-3 text-center">
            <p className="font-pixel text-[7px] text-gray-500 mb-1">{t("profileDaily")}</p>
            <p className="font-pixel text-lg text-arcade-neon-yellow neon-text-yellow">{coins ?? "—"}</p>
          </div>
          <div className="border border-arcade-neon-green/60 p-3 text-center">
            <p className="flex items-center justify-center gap-1 font-pixel text-[7px] text-gray-500 mb-1"><Gem size={8} /> {t("profilePremium")}</p>
            <p className="font-pixel text-lg text-arcade-neon-green neon-text-green">{premiumTokens ?? "—"}</p>
          </div>
        </div>

        {/* High scores */}
        <p className="font-pixel text-[8px] text-gray-500 tracking-widest mb-2">{t("profileScores")}</p>
        {scoreRows.length === 0 ? (
          <p className="font-mono text-sm text-gray-600 mb-6">{t("profileNoScores")}</p>
        ) : (
          <div className="border border-arcade-border divide-y divide-arcade-border mb-6">
            {scoreRows.map(([slug, score]) => (
              <div key={slug} className="flex items-center justify-between px-3 py-2">
                <span className="font-pixel text-[8px] text-gray-400">{GAME_TITLES[slug] ?? slug}</span>
                <span className="font-pixel text-[10px] text-arcade-neon-cyan">{score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Delete account */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`w-full min-h-[44px] flex items-center justify-center gap-2 py-3 font-pixel text-[9px] border transition-all active:scale-95 disabled:opacity-60 ${
            confirming
              ? "border-arcade-neon-red text-black bg-arcade-neon-red"
              : "border-arcade-neon-red text-arcade-neon-red neon-text-red hover:bg-arcade-neon-red hover:text-black"
          }`}
          style={{ boxShadow: "0 0 12px #ff333366" }}
        >
          <Trash2 size={12} />
          {confirming ? t("deleteYes") : t("deleteAccount")}
        </button>
        {confirming && (
          <p className="mt-2 text-center font-pixel text-[8px] text-arcade-neon-red animate-blink">{t("deleteConfirm")}</p>
        )}
      </div>
    </div>
  );
}
