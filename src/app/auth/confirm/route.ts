import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/security/trust";

const EMAIL_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/**
 * Email confirmation link target (signup / magic link / recovery / email change).
 *
 * Why this exists instead of relying on Supabase's default `{{ .ConfirmationURL }}`:
 * that URL is a GET to Supabase's own /verify endpoint, and mail clients that
 * prefetch links (Apple Mail's Mail Privacy Protection is the classic case,
 * but Outlook/Teams safe-links do it too) silently consume the one-time token
 * before the user ever clicks it. The second, real click then fails with
 * 403 otp_expired.
 *
 * The fix is PKCE's usual one: point the email at OUR route instead, so the
 * token is verified server-side via verifyOtp() when the user actually opens
 * the app, not whenever some bot fetches the link for a preview. This route
 * must be what the Confirm-signup email template links to — see the template
 * snippet shipped alongside this file.
 *
 * Every failure path redirects instead of throwing, matching /auth/callback.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type = rawType && EMAIL_OTP_TYPES.has(rawType) ? (rawType as EmailOtpType) : null;
  // Land on /confirmed by default (the existing "you're verified" screen);
  // callers may override via ?next=.
  const next = safeInternalPath(searchParams.get("next"), "/confirmed", origin);

  if (token_hash && token_hash.length <= 512 && type) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (!error) {
        return NextResponse.redirect(new URL(next, origin));
      }
    } catch {
      // Covers a missing/expired token, cookie-store failures and network drops.
      console.error("Unexpected error in auth confirm.");
    }
  }

  // No token, no type, or verification failed (already consumed by a prefetch,
  // expired, or tampered with) — bounce home with an error instead of a 500.
  // AuthProvider already surfaces ?error=auth_failed as a toast.
  return NextResponse.redirect(new URL("/?error=auth_failed", origin));
}
