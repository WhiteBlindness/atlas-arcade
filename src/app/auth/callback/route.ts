import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth / PKCE callback.
 *
 * Every failure path redirects instead of throwing, so a bad or replayed code —
 * or a missing PKCE verifier cookie, which surfaces as AuthSessionMissingError —
 * lands the player back on the arcade rather than a 500 page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("Auth callback error:", error.message);
    } catch (err) {
      // Covers AuthSessionMissingError, cookie-store failures and network drops.
      console.error("Unexpected error in auth callback:", err);
    }
  }

  // If we get here, either no code was provided or the exchange failed.
  // Graceful degradation: redirect home with an error parameter instead of
  // throwing a 500.
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}

// Supabase can be configured to POST to the callback (and some providers do);
// without this the route would 405/500 instead of degrading gracefully.
export async function POST(request: Request) {
  return GET(request);
}
