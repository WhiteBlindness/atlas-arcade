"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/store/toastStore";
import { passwordStrength } from "@/lib/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!strength.valid) { toast.error("Password needs 8+ characters, an uppercase letter and a number."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message.toLowerCase().includes("same") ? "Choose a different password." : error.message);
    } else {
      toast.success("Password updated — you're signed in.");
      router.push("/");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-arcade-bg px-4">
      <h1 className="font-pixel text-sm text-arcade-neon-cyan neon-text-cyan tracking-widest">SET NEW PASSWORD</h1>
      <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="NEW PASSWORD"
          autoComplete="new-password"
          disabled={loading}
          className="w-full bg-arcade-bg border border-arcade-border focus:border-arcade-neon-cyan focus:shadow-neon-cyan outline-none px-3 py-3 font-mono text-sm text-white placeholder-gray-600 transition-all disabled:opacity-50"
        />
        {password.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-1">
              {[1, 2, 3].map((n) => (
                <span key={n} className="h-1 flex-1" style={{ backgroundColor: strength.score >= n ? strength.color : "#1a1a2e" }} />
              ))}
            </div>
            <span className="font-pixel text-[7px]" style={{ color: strength.color }}>{strength.label}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 min-h-[44px] py-3 font-pixel text-[10px] border border-arcade-neon-green text-arcade-neon-green shadow-neon-green hover:bg-arcade-neon-green hover:text-black active:scale-95 transition-all disabled:cursor-not-allowed"
        >
          {loading ? <span style={{ animation: "neonPulse 1s ease-in-out infinite" }}>LOADING...</span> : "UPDATE PASSWORD"}
        </button>
      </form>
      <Link href="/" className="font-pixel text-[8px] text-gray-500 hover:text-arcade-neon-cyan active:scale-95 transition-all">
        ← BACK TO ARCADE
      </Link>
    </div>
  );
}
