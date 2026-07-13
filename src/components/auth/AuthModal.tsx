"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { X } from "lucide-react";

export function AuthModal() {
  const { modalOpen, closeModal } = useAuthStore();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!modalOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (tab === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) setError(error.message);
      else closeModal();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else closeModal();
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-sm mx-4 bg-arcade-surface border border-arcade-neon-cyan shadow-neon-cyan p-6 modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel text-xs text-arcade-neon-cyan neon-text-cyan tracking-wider">
            {tab === "signin" ? "INSERT COIN" : "NEW PLAYER"}
          </h2>
          <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-0 mb-6 border border-arcade-border">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2 font-pixel text-[10px] transition-all ${
                tab === t ? "bg-arcade-neon-cyan text-black" : "text-gray-500 hover:text-white"
              }`}
            >
              {t === "signin" ? "SIGN IN" : "SIGN UP"}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          {tab === "signup" && (
            <ArcadeInput placeholder="USERNAME" value={username} onChange={setUsername} autoComplete="username" />
          )}
          <ArcadeInput placeholder="EMAIL" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <ArcadeInput placeholder="PASSWORD" type="password" value={password} onChange={setPassword} autoComplete={tab === "signup" ? "new-password" : "current-password"} />

          {error && (
            <p className="font-pixel text-[9px] text-arcade-neon-red neon-text-red leading-relaxed">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 font-pixel text-[10px] bg-transparent border border-arcade-neon-green text-arcade-neon-green shadow-neon-green hover:bg-arcade-neon-green hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <span className="animate-blink">PROCESSING...</span> : tab === "signin" ? "PLAY" : "CREATE"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ArcadeInput({ placeholder, value, onChange, type = "text", autoComplete }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      required
      className="w-full bg-arcade-bg border border-arcade-border focus:border-arcade-neon-cyan focus:shadow-neon-cyan outline-none px-3 py-2 font-mono text-sm text-white placeholder-gray-600 transition-all"
    />
  );
}
