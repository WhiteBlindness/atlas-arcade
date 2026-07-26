import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth redirect target (Google sign-in).
 *
 * Supabase sends the browser here with a `code` query param; exchanging it sets
 * the auth cookies via the SSR client, so the session is available on the server
 * as well as the client. On any failure we still land the player back on the
 * arcade rather than a dead end.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  // `next` lets us come back to a specific screen later; defaults to the arcade.
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`);
  }

  // Provider returned an error (e.g. the user cancelled the consent screen).
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(providerError)}`);
  }

  return NextResponse.redirect(origin);
}
