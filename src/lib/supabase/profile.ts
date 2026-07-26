import { supabase } from "./client";

// public.profiles — one row per auth user (see supabase/migrations).
//   is_admin       boolean — bypasses the coin economy ("DEV" mode)
//   referral_code  text    — this user's own invite code
//   referred_by    uuid    — who invited them (set once, on first redemption)

/** Where a pending ?ref= code is parked until the player signs up. */
const REF_KEY = "atlas-arcade-ref";

export interface Profile {
  isAdmin: boolean;
  referralCode: string | null;
}

/** Own profile row (RLS: own row only). Null when signed out or unavailable. */
export async function fetchProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin, referral_code")
    .eq("id", user.id)
    .maybeSingle();
  // Migration not applied yet → treat as a normal (non-admin) player.
  if (error || !data) return null;
  return { isAdmin: !!data.is_admin, referralCode: data.referral_code ?? null };
}

/** Remember a ?ref= code until the player finishes signing up. */
export function storeReferralCode(code: string): void {
  try { localStorage.setItem(REF_KEY, code.trim().toUpperCase()); } catch { /* storage off */ }
}

export function readReferralCode(): string | null {
  try { return localStorage.getItem(REF_KEY); } catch { return null; }
}

export function clearReferralCode(): void {
  try { localStorage.removeItem(REF_KEY); } catch { /* storage off */ }
}

/**
 * Redeem any pending referral code for the signed-in user.
 *
 * Runs after sign-in rather than inside the OAuth callback, because the code
 * lives in localStorage and the callback executes on the server. This covers
 * email sign-up and Google OAuth with one path. The RPC is idempotent (one
 * redemption per account), so re-running on later sign-ins is harmless.
 */
export async function redeemPendingReferral(): Promise<boolean> {
  const code = readReferralCode();
  if (!code) return false;
  const { data, error } = await supabase.rpc("redeem_referral", { p_code: code });
  // Clear on success, and also on a definitive "no" — a bad or already-used code
  // should not keep retrying on every sign-in.
  if (!error) clearReferralCode();
  return data === true;
}

/** Invite URL for this player's code. */
export function referralLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/?ref=${code}`;
}
