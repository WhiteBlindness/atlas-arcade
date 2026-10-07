import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isCronAuthorizationValid } from "@/lib/security/trust";

// CRITICAL: this route must NEVER be cached. If Next served a cached response,
// the daily cron would hit the cache and the Supabase free-tier DB would still
// pause after 7 days while the route looked healthy. Force it dynamic so every
// ping executes a real query.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// NOTE (rate limiting): point an external cron (e.g. cron-job.org) here daily.
// If exposed publicly and abused, gate in middleware.ts; the query is trivial.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "cron endpoint is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!isCronAuthorizationValid(request.headers.get("authorization"), secret)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Lightweight HEAD count against an existing table. RLS returns no rows to anon,
  // but the query still executes server-side — that counts as DB activity and
  // resets the 7-day inactivity pause. No new SQL needed.
  const { error } = await supabase
    .from("user_coins")
    .select("user_id", { head: true, count: "exact" })
    .limit(1);

  // Let failures surface as non-200 so the cron monitor catches a genuine outage.
  if (error) {
    return NextResponse.json(
      { ok: false, error: "database unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { ok: true, at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
