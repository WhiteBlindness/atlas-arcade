"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { firstAuthError, isValidEmail, passwordStrength } from "@/lib/validation";
import { X } from "lucide-react";

type View = "signin" | "signup" | "reset";

export function AuthModal() {
  const { modalOpen, closeModal } = useAuthStore();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  if (!modalOpen) return null;

  const reset = () => { setEmail(""); setPassword(""); setUsername(""); };
  const switchView = (v: View) => { setView(v); };

  const strength = passwordStrength(password);

  const humanizeError = (msg: string): string => {
    const m = msg.toLowerCase();
    if (m.includes("already registered") || m.includes("already in use")) return "Email already in use.";
    if (m.includes("invalid login") || m.includes("invalid credentials")) return "Invalid credentials.";
    if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts — wait a moment.";
    if (m.includes("confirm")) return "Please confirm your email first.";
    return msg;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // anti-spam: ignore double submits

    if (view === "reset") {
      if (!isValidEmail(email)) { toast.error("Enter a valid email address."); return; }
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset` : undefined,
      });
      setLoading(false);
      if (error) toast.error(humanizeError(error.message));
      else { toast.success("Password reset link sent — check your email."); switchView("signin"); }
      return;
    }

    const validationError = firstAuthError(view, email, password, username);
    if (validationError) { toast.error(validationError); return; }

    setLoading(true);
    if (view === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.trim() },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/confirmed` : undefined,
        },
      });
      setLoading(false);
      if (error) toast.error(humanizeError(error.message));
      else { toast.success("Check your email to confirm your account!"); reset(); closeModal(); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) toast.error(humanizeError(error.message));
      else { toast.success("Welcome back, player!"); reset(); closeModal(); }
    }
  };

  const title = view === "reset" ? "RESET PASSWORD" : view === "signin" ? "INSERT COIN" : "NEW PLAYER";
  const submitLabel = view === "reset" ? "SEND RESET LINK" : view === "signin" ? "INSERT COIN" : "CREATE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={closeModal}>
      <div
        className="relative w-full max-w-sm bg-arcade-surface border border-arcade-neon-cyan shadow-neon-cyan p-6 modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel text-xs text-arcade-neon-cyan neon-text-cyan tracking-wider">{title}</h2>
          <button onClick={closeModal} aria-label="Close" className="w-11 h-11 -mr-3 flex items-center justify-center text-gray-500 hover:text-white active:scale-90 transition-all">
            <X size={18} />
          </button>
        </div>

        {view !== "reset" && (
          <div className="flex gap-0 mb-6 border border-arcade-border">
            {(["signin", "signup"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => switchView(v)}
                className={`flex-1 min-h-[44px] py-2 font-pixel text-[10px] active:brightness-125 transition-all ${
                  view === v ? "bg-arcade-neon-cyan text-black" : "text-gray-500 hover:text-white"
                }`}
              >
                {v === "signin" ? "SIGN IN" : "SIGN UP"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          {view === "signup" && (
            <ArcadeInput placeholder="USERNAME" value={username} onChange={setUsername} autoComplete="username" disabled={loading} />
          )}
          <ArcadeInput placeholder="EMAIL" type="email" value={email} onChange={setEmail} autoComplete="email" disabled={loading} />

          {view !== "reset" && (
            <ArcadeInput
              placeholder="PASSWORD"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={view === "signup" ? "new-password" : "current-password"}
              disabled={loading}
            />
          )}

          {/* Password strength meter (signup only) */}
          {view === "signup" && password.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className="h-1 flex-1 transition-colors"
                    style={{ backgroundColor: strength.score >= n ? strength.color : "#1a1a2e" }}
                  />
                ))}
              </div>
              <span className="font-pixel text-[7px]" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 min-h-[44px] py-3 font-pixel text-[10px] bg-transparent border border-arcade-neon-green text-arcade-neon-green shadow-neon-green hover:bg-arcade-neon-green hover:text-black active:scale-95 transition-all disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="text-arcade-neon-green" style={{ animation: "neonPulse 1s ease-in-out infinite" }}>LOADING...</span>
            ) : submitLabel}
          </button>
        </form>

        {/* Secondary links */}
        <div className="mt-4 text-center">
          {view === "signin" && (
            <button
              type="button"
              onClick={() => switchView("reset")}
              className="font-pixel text-[8px] text-gray-500 hover:text-arcade-neon-cyan active:scale-95 transition-all"
            >
              FORGOT PASSWORD?
            </button>
          )}
          {view === "reset" && (
            <button
              type="button"
              onClick={() => switchView("signin")}
              className="font-pixel text-[8px] text-gray-500 hover:text-arcade-neon-cyan active:scale-95 transition-all"
            >
              ← BACK TO SIGN IN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ArcadeInput({ placeholder, value, onChange, type = "text", autoComplete, disabled }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      disabled={disabled}
      className="w-full bg-arcade-bg border border-arcade-border focus:border-arcade-neon-cyan focus:shadow-neon-cyan outline-none px-3 py-2 font-mono text-sm text-white placeholder-gray-600 transition-all disabled:opacity-50"
    />
  );
}
