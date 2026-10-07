import type { Page } from "@playwright/test";

interface FixtureUser {
  id: string;
  aud: string;
  email: string;
  app_metadata: { provider: string; providers: string[] };
  user_metadata: { username: string };
  created_at: string;
}

interface FixtureOptions {
  failTokenSpend?: boolean;
  outOfTokens?: boolean;
}

export async function installSignedInSupabaseFixture(
  page: Page,
  highScores: Array<{ game_slug: string; score: number }>,
  options: FixtureOptions = {},
) {
  const user: FixtureUser = {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    email: "arcade-player@example.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { username: "Arcade player" },
    created_at: "2026-10-07T00:00:00.000Z",
  };
  const requests: string[] = [];
  const pendingSpendResolvers: Array<() => void> = [];
  let pauseSpends = false;
  const today = new Date().toISOString().slice(0, 10);
  const tokenState = {
    coins: 5,
    granted_today: 5,
    accrual_at: new Date().toISOString(),
    last_reset: today,
  };

  await page.route((url) => url.hostname === "127.0.0.1" && url.port === "54321", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push(request.method() + " " + url.pathname);
    const corsHeaders = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    };
    const reply = (body: unknown, status = 200) => route.fulfill({
      status,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify(body),
    });

    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: corsHeaders });
    if (url.pathname.endsWith("/auth/v1/user")) return reply(user);
    if (url.pathname.endsWith("/rest/v1/rpc/arcade_refresh_user_tokens")) return reply(tokenState);
    if (url.pathname.endsWith("/rest/v1/rpc/get_user_state")) {
      return reply({ premium_tokens: 0, high_scores: highScores });
    }
    if (url.pathname.endsWith("/rest/v1/profiles")) {
      return reply({ is_admin: false, referral_code: "FIXTURE" });
    }
    if (url.pathname.endsWith("/rest/v1/rpc/arcade_consume_user_tokens")) {
      if (pauseSpends) await new Promise<void>((resolve) => pendingSpendResolvers.push(resolve));
      if (options.failTokenSpend) return reply({ message: "Fixture RPC unavailable" }, 500);
      if (options.outOfTokens) return reply({ ...tokenState, coins: 0, ok: false, is_admin: false, premium_tokens: 0 });
      return reply({ ...tokenState, coins: 4, ok: true, is_admin: false, premium_tokens: 0 });
    }
    if (url.pathname.endsWith("/rest/v1/rpc/arcade_submit_high_score")) return reply({ score: 0 });
    return reply({ message: "No response fixture for " + url.pathname }, 404);
  });

  await page.addInitScript((fixtureUser) => {
    const encodeObject = (value: unknown) => {
      const bytes = new TextEncoder().encode(JSON.stringify(value));
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    };
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = encodeObject({ alg: "HS256", typ: "JWT" })
      + "." + encodeObject({ sub: fixtureUser.id, aud: "authenticated", role: "authenticated", exp: expiresAt })
      + ".fixture-signature";
    const session = {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: expiresAt,
      refresh_token: "fixture-refresh-token",
      user: fixtureUser,
    };
    document.cookie = "sb-127-auth-token=base64-" + encodeObject(session) + "; path=/; max-age=3600; SameSite=Lax";
  }, user);

  return {
    requests,
    pauseTokenSpends() { pauseSpends = true; },
    resumeTokenSpends() {
      pauseSpends = false;
      for (const resolve of pendingSpendResolvers.splice(0)) resolve();
    },
  };
}
