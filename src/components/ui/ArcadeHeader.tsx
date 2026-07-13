"use client";

import { useAuthStore } from "@/store/authStore";
import { LogOut, User } from "lucide-react";

export function ArcadeHeader() {
  const { user, openModal, signOut } = useAuthStore();

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-arcade-border">
      <div>
        <h1 className="font-pixel text-sm text-arcade-neon-cyan neon-text-cyan tracking-widest">ATLAS</h1>
        <p className="font-pixel text-[8px] text-gray-500 mt-1 tracking-wider">ARCADE</p>
      </div>

      {user ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <User size={12} />
            <span className="font-mono text-xs text-arcade-neon-green neon-text-green">
              {user.user_metadata?.username ?? user.email?.split("@")[0]}
            </span>
          </div>
          <button onClick={signOut} className="flex items-center gap-1 text-gray-500 hover:text-arcade-neon-red transition-colors" title="Sign out">
            <LogOut size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => openModal("signin")}
          className="font-pixel text-[9px] border border-arcade-neon-yellow text-arcade-neon-yellow neon-text-yellow px-3 py-2 hover:bg-arcade-neon-yellow hover:text-black transition-all"
        >
          INSERT COIN
        </button>
      )}
    </header>
  );
}
