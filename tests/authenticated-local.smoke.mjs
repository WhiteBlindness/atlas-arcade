
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
const appURL = process.env.ATLAS_TEST_APP_URL ?? "http://127.0.0.1:4180";
const apiURL = process.env.ATLAS_TEST_API_URL ?? "http://127.0.0.1:55442";
for (const url of [appURL, apiURL]) {
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "http:");
  assert.equal(parsed.hostname, "127.0.0.1", "This smoke test accepts loopback only.");
}
const suffix = randomBytes(6).toString("hex");
const email = "atlas-" + suffix + "@example.com";
const referrerEmail = "referrer-" + suffix + "@example.com";
const password = "Atlas1" + randomBytes(18).toString("hex");
const username = "atlas_" + suffix;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
let publicKey;
let own;
let referrer;
async function poll(fn, label, milliseconds = 15000) {
  for (let i = 0; i < milliseconds / 200; i++) {
    if (await fn()) return;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw Error("Timed out: " + label);
}
async function rpc(client, name, args) {
  const result = await client.rpc(name, args);
  assert.equal(result.error, null, "Local RPC failed: " + name);
  return result.data;
}
page.on("request", request => {
  if (request.url().startsWith(apiURL) && request.headers().apikey) publicKey = request.headers().apikey;
});
try {
  await page.goto(appURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "INSERT COIN", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "SIGN UP", exact: true }).click();
  await page.locator("#auth-username").fill(username);
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("dialog").getByRole("button", { name: "CREATE", exact: true }).click();
  await page.getByRole("button", { name: "Open profile" }).waitFor({ timeout: 20000 });
  assert.ok(publicKey, "Browser supplied its ephemeral public local API key.");
  own = createClient(apiURL, publicKey, { auth: { persistSession: false } });
  referrer = createClient(apiURL, publicKey, { auth: { persistSession: false } });
  const login = await own.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null, "Actual local password login");
  const id = login.data.user.id;
  const profile = await own.from("profiles").select("is_admin,referral_code").single();
  assert.equal(profile.error, null);
  assert.equal(profile.data.is_admin, false);
  assert.match(profile.data.referral_code, /^[0-9a-f]{8}$/);
  const initial = await rpc(own, "get_user_state");
  assert.equal(initial.coins, 5);
  assert.equal(initial.premium_tokens, 0);
  console.log("PASS: browser signup, real password login, profile bootstrap and balance.");
  await page.getByRole("button", { name: "Open profile" }).click();
  await page.getByRole("dialog").getByText("5", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole("dialog").getByRole("button", { name: "CLOSE", exact: true }).click();
  const spendResponse = page.waitForResponse(response => response.url().endsWith("/rpc/arcade_consume_user_tokens"));
  await page.getByRole("button", { name: "ONE STRIKE", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: /ARCADE MODE/ }).click();
  const spend = await spendResponse;
  assert.equal(spend.status(), 200);
  assert.equal((await spend.json()).ok, true);
  const savedResponse = await page.waitForResponse(response => response.url().endsWith("/rpc/arcade_submit_high_score"), { timeout: 20000 });
  assert.equal(savedResponse.status(), 200);
  assert.equal(await savedResponse.json(), 0);
  await page.getByRole("button", { name: "BACK TO ARCADE", exact: true }).click();
  const after = await rpc(own, "get_user_state");
  assert.equal(after.coins, 4);
  assert.ok(after.high_scores.some(score => score.game_slug === "one-strike" && score.score === 0));
  assert.equal((await rpc(own, "arcade_refresh_user_tokens")).coins, 4);
  const board = await rpc(own, "get_leaderboard", { p_game_slug: "one-strike", p_limit: 20 });
  assert.ok(board.some(row => row.username === username && row.score === 0));
  assert.deepEqual(Object.keys(board[0]).sort(), ["score", "username"]);
  const appBoard = await page.request.get(appURL + "/api/leaderboard?game=one-strike&limit=20");
  assert.equal(appBoard.status(), 200);
  console.log("PASS: real game debit, refresh, client score submission and public leaderboard.");
  const signup = await referrer.auth.signUp({ email: referrerEmail, password, options: { data: { username: "ref_" + suffix, is_admin: true } } });
  assert.equal(signup.error, null);
  const otherId = signup.data.user.id;
  const otherProfile = await referrer.from("profiles").select("referral_code,is_admin").single();
  assert.equal(otherProfile.data.is_admin, false);
  assert.deepEqual((await own.from("user_coins").select("*").eq("user_id", otherId)).data, []);
  const stolenDelete = await own.rpc("delete_own_user", { user_id: otherId });
  assert.ok(stolenDelete.error);
  assert.equal((await referrer.auth.getUser()).data.user.id, otherId);
  const mint = await own.from("user_coins").update({ premium_tokens: 9999 }).eq("user_id", id);
  assert.ok(mint.error);
  console.log("PASS: signed JWT/PostgREST requests cannot read B, mint premium tokens or delete B.");
  await page.getByTitle("Sign out", { exact: true }).click();
  await page.getByRole("button", { name: "INSERT COIN", exact: true }).first().waitFor();
  await page.goto(appURL + "/?ref=" + otherProfile.data.referral_code);
  await page.getByRole("button", { name: "INSERT COIN", exact: true }).first().click();
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("dialog").getByRole("button", { name: "INSERT COIN", exact: true }).click();
  await page.getByRole("button", { name: "Open profile" }).waitFor();
  await poll(async () => (await rpc(own, "get_user_state")).premium_tokens === 20, "one referral bonus");
  assert.equal(await rpc(own, "redeem_referral", { p_code: otherProfile.data.referral_code, p_bonus: 999999 }), false);
  await page.reload();
  await page.getByRole("button", { name: "Open profile" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText(username, { exact: true }).waitFor();
  await dialog.getByText("20", { exact: true }).waitFor();
  console.log("PASS: logout/login, client referral redemption once and persisted profile state.");
  await dialog.getByRole("button", { name: "DELETE ACCOUNT", exact: true }).click();
  await dialog.getByRole("button", { name: "YES, DELETE", exact: true }).click();
  await page.getByRole("button", { name: "INSERT COIN", exact: true }).first().waitFor({ timeout: 15000 });
  const stale = await own.rpc("get_user_state");
  assert.equal(stale.error, null);
  assert.equal(stale.data, null);
  const staleScore = await own.rpc("arcade_submit_high_score", { p_game_slug: "globle", p_score: 1 });
  assert.equal(staleScore.data, null);
  const afterDelete = await rpc(referrer, "get_leaderboard", { p_game_slug: "one-strike", p_limit: 100 });
  assert.ok(!afterDelete.some(row => row.username === username));
  const relogin = await own.auth.signInWithPassword({ email, password });
  assert.ok(relogin.error);
  console.log("PASS: browser own-account deletion, public score cleanup, stale JWT blocked and subsequent login denied.");
  console.log("AUTHENTICATED APPLICATION SMOKE: PASS. No production requests or accounts.");
} finally {
  if (referrer) { try { await referrer.rpc("delete_own_user"); } catch {} }
  if (own) { try { await own.rpc("delete_own_user"); } catch {} }
  await browser.close();
}
