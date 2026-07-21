"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { firstAuthError, isValidEmail, isValidUsername, passwordStrength, signupChecks } from "@/lib/validation";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";
import { X } from "lucide-react";

type View = "signin" | "signup" | "reset";

export function AuthModal() {
  const { modalOpen, closeModal } = useAuthStore();
  const t = useT();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  // Server-side errors are routed to a specific field ("form" = general).
  type ErrField = "email" | "username" | "password" | "form";
  const [serverErr, setServerErr] = useState<{ field: ErrField; msg: string } | null>(null);

  // Lock background scroll while the modal is open (mobile especially).
  useEffect(() => {
    if (!modalOpen) return;
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [modalOpen]);

  if (!modalOpen) return null;

  const clearFields = () => { setEmail(""); setPassword(""); setUsername(""); setServerErr(null); };
  // Clearing fields on tab swap avoids leaking a half-typed password between views.
  const switchView = (v: View) => { sfx.click(); setView(v); clearFields(); };

  const strength = passwordStrength(password);
  const strengthLabel = strength.score === 3 ? t("strengthStrong") : strength.score === 2 ? t("strengthMedium") : t("strengthWeak");

  // Per-rule checks block CREATE until the sign-up form is valid.
  const checks = signupChecks(email, password);
  const signupBlocked = view === "signup" && !(checks.email && checks.len && checks.upper && checks.number);

  // Live, per-field validation — shown only once a field has content so the
  // form doesn't scream at an untouched input. Server errors (below) win when
  // the live check passes, so a "duplicate email" survives after typing stops.
  const emailErrLive = email.length > 0 && !isValidEmail(email) ? t("errEmail") : null;
  const usernameErrLive = view === "signup" && username.length > 0 && !isValidUsername(username) ? t("errUsername") : null;
  const passwordErrLive = view === "signup" && password.length > 0 && !passwordStrength(password).valid ? t("errPasswordPolicy") : null;

  const srv = (f: ErrField) => (serverErr?.field === f ? serverErr.msg : null);
  const emailErr = emailErrLive ?? srv("email");
  const usernameErr = usernameErrLive ?? srv("username");
  const passwordErr = passwordErrLive ?? srv("password");
  const formErr = srv("form");

  const humanizeError = (msg: string): string => {
    const m = msg.toLowerCase();
    if (m.includes("already registered") || m.includes("already in use")) return t("errEmailInUse");
    if (m.includes("invalid login") || m.includes("invalid credentials")) return t("errInvalidCreds");
    if (m.includes("rate limit") || m.includes("too many")) return t("errRateLimit");
    if (m.includes("confirm")) return t("errConfirmFirst");
    return msg;
  };

  const fail = (msg: string, field: ErrField = "form") => { setServerErr({ field, msg }); toast.error(msg); sfx.wrong(); };
  // Which field a first-pass validation code belongs under.
  const FIELD_OF = { errEmail: "email", errUsername: "username", errPasswordPolicy: "password", errPasswordEmpty: "password" } as const;
  const isEmailDup = (m: string) => { const s = m.toLowerCase(); return s.includes("already registered") || s.includes("already in use"); };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // anti-spam: ignore double submits
    sfx.click();
    setServerErr(null);

    if (view === "reset") {
      if (!isValidEmail(email)) { fail(t("errEmail"), "email"); return; }
      setLoading(true);
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset` : undefined,
      });
      setLoading(false);
      if (err) fail(humanizeError(err.message));
      else { sfx.correct(); toast.success(t("toastResetSent")); switchView("signin"); }
      return;
    }

    const code = firstAuthError(view, email, password, username);
    if (code) { fail(t(code), FIELD_OF[code]); return; }

    setLoading(true);
    if (view === "signup") {
      // Reject taken usernames up front (SECURITY DEFINER rpc, anon-callable).
      const { data: taken } = await supabase.rpc("is_username_taken", { name: username.trim() });
      if (taken) { setLoading(false); fail(t("errUsernameTaken"), "username"); return; }

      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.trim() },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/confirmed` : undefined,
        },
      });
      setLoading(false);
      if (err) {
        fail(humanizeError(err.message), isEmailDup(err.message) ? "email" : "form");
      } else if (data.user && (data.user.identities?.length ?? 0) === 0) {
        // Supabase does NOT error when the email is already registered (it hides
        // this to prevent enumeration) — it returns a user with no identities.
        // Detect that case explicitly so the form doesn't fail silently.
        fail(t("errEmailInUse"), "email");
      } else {
        sfx.correct(); toast.success(t("toastSignupSuccess")); clearFields(); closeModal();
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) fail(humanizeError(err.message), isEmailDup(err.message) ? "email" : "form");
      else { sfx.correct(); toast.success(t("toastWelcome")); clearFields(); closeModal(); }
    }
  };

  const title = view === "reset" ? t("authTitleReset") : view === "signin" ? t("authTitleSignin") : t("authTitleSignup");
  const submitLabel = view === "reset" ? t("authBtnReset") : view === "signin" ? t("authBtnSignin") : t("authBtnCreate");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={closeModal}>
      <div
        className="relative w-full max-w-sm bg-arcade-surface border border-arcade-neon-cyan shadow-neon-cyan p-6 modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel text-xs text-arcade-neon-cyan neon-text-cyan tracking-wider">{title}</h2>
          <button onClick={closeModal} aria-label={t("cancel")} className="w-11 h-11 -mr-3 flex items-center justify-center text-gray-500 hover:text-white active:scale-90 transition-all">
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
                {v === "signin" ? t("authTabSignin") : t("authTabSignup")}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          {view === "signup" && (
            <ArcadeInput placeholder={t("authPhUsername")} value={username} onChange={(v) => { setUsername(v); setServerErr(null); }} autoComplete="username" disabled={loading} error={usernameErr} />
          )}
          <ArcadeInput placeholder={t("authPhEmail")} type="email" value={email} onChange={(v) => { setEmail(v); setServerErr(null); }} autoComplete="email" disabled={loading} error={emailErr} />

          {view !== "reset" && (
            <ArcadeInput
              placeholder={t("authPhPassword")}
              type="password"
              value={password}
              onChange={(v) => { setPassword(v); setServerErr(null); }}
              autoComplete={view === "signup" ? "new-password" : "current-password"}
              disabled={loading}
              error={passwordErr}
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
              <span className="font-pixel text-[7px]" style={{ color: strength.color }}>{strengthLabel}</span>
            </div>
          )}

          {/* General (non-field) server errors — invalid credentials, rate limit… */}
          {formErr && (
            <p role="alert" className="font-mono text-[13px] text-arcade-neon-red leading-snug">{formErr}</p>
          )}

          <button
            type="submit"
            disabled={loading || signupBlocked}
            className="mt-2 min-h-[44px] py-3 font-pixel text-[10px] bg-transparent border border-arcade-neon-green text-arcade-neon-green shadow-neon-green hover:bg-arcade-neon-green hover:text-black active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="text-arcade-neon-green" style={{ animation: "neonPulse 1s ease-in-out infinite" }}>{t("authLoading")}</span>
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
              {t("authForgot")}
            </button>
          )}
          {view === "reset" && (
            <button
              type="button"
              onClick={() => switchView("signin")}
              className="font-pixel text-[8px] text-gray-500 hover:text-arcade-neon-cyan active:scale-95 transition-all"
            >
              {t("authBack")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ArcadeInput({ placeholder, value, onChange, type = "text", autoComplete, disabled, error }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={!!error}
        className={`w-full bg-arcade-bg border outline-none px-3 py-2 font-mono text-sm text-white placeholder-gray-600 transition-all disabled:opacity-50 ${
          error
            ? "border-arcade-neon-red focus:border-arcade-neon-red focus:shadow-neon-red"
            : "border-arcade-border focus:border-arcade-neon-cyan focus:shadow-neon-cyan"
        }`}
      />
      {error && <p role="alert" className="font-mono text-[12px] text-arcade-neon-red leading-snug">{error}</p>}
    </div>
  );
}
