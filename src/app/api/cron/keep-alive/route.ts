import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// CRITICAL: this route must NEVER be cached. If Next served a cached response,
// the daily cron would hit the cache and the Supabase free-tier DB would still
// pause after 7 days while the route looked healthy. Force it dynamic so every
// ping executes a real query.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// NOTE (rate limiting): point an external cron (e.g. cron-job.org) here daily.
// If exposed publicly and abused, gate in middleware.ts; the query is trivial.
export async function GET() {
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
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
