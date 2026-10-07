import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/*
 * Execute uma vez por fase. Em PowerShell:
 *   $env:ATLAS_ROLLOUT_STAGE = 'previous'
 *   node tests/rollout-compatibility.smoke.mjs
 * Repita com 'expand' e 'lockdown'. Por omissão, cada fase testa master e PR.
 * ATLAS_ROLLOUT_CLIENT=master ou pr permite executar um cliente de cada vez.
 */
const stage = process.env.ATLAS_ROLLOUT_STAGE;
assert.ok(["previous", "expand", "lockdown"].includes(stage),
  "Defina ATLAS_ROLLOUT_STAGE como previous, expand ou lockdown.");

const clientSelection = process.env.ATLAS_ROLLOUT_CLIENT ?? "both";
assert.ok(["master", "pr", "both"].includes(clientSelection),
  "ATLAS_ROLLOUT_CLIENT aceita master, pr ou both.");

const apiURL = process.env.ATLAS_TEST_API_URL ?? "http://127.0.0.1:55442";
const appURLs = {
  master: process.env.ATLAS_TEST_MASTER_APP_URL ?? "http://127.0.0.1:4181",
  pr: process.env.ATLAS_TEST_PR_APP_URL ?? "http://127.0.0.1:4180",
};
const referralCode = (process.env.ATLAS_TEST_REFERRAL_CODE ?? "DEADBEEF").trim().toUpperCase();
const loopbackOrigin = new URL(apiURL).origin;

assert.match(referralCode, /^[A-F0-9]{8}$/,
  "O convite sintético deve ter oito caracteres hexadecimais.");

for (const url of [apiURL, ...Object.values(appURLs)]) {
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "http:", "O smoke só aceita HTTP local.");
  assert.equal(parsed.hostname, "127.0.0.1", "O smoke só aceita endereços de loopback.");
}

const plan = {
  previous: [
    { client: "master", behavior: "legacy" },
    { client: "pr", behavior: "missing-rpc" },
  ],
  expand: [
    { client: "master", behavior: "legacy" },
    { client: "pr", behavior: "rpc" },
  ],
  lockdown: [
    { client: "master", behavior: "denied" },
    { client: "pr", behavior: "rpc" },
  ],
};
const targets = plan[stage].filter(({ client }) => clientSelection === "both" || clientSelection === client);

function suffix() {
  return randomBytes(6).toString("hex");
}

function apiPath(response) {
  return new URL(response.url()).pathname;
}

function isRpc(response, name) {
  return apiPath(response).endsWith("/rpc/" + name);
}

function isDirectTableMutation(event, table) {
  const tablePath = "/rest/v1/" + table;
  return (event.path === tablePath || event.path.startsWith(tablePath + "/")) &&
    ["POST", "PATCH", "PUT", "DELETE"].includes(event.method);
}

function isSuccessful(event) {
  return event.status >= 200 && event.status < 300;
}

function directMutations(events) {
  return events.filter((event) =>
    ["user_coins", "high_scores", "profiles"].some((table) => isDirectTableMutation(event, table))
  );
}

function tokenSnapshot(state) {
  return {
    coins: state.coins,
    grantedToday: state.grantedToday,
    premiumTokens: state.premiumTokens,
  };
}

function networkEvidence(events) {
  const arcadeRpcs = events.filter((event) =>
    event.path.includes("/rpc/arcade_") || event.path.endsWith("/rpc/redeem_referral")
  );
  return {
    arcadeRpcs: arcadeRpcs.map(({ method, path, status }) => ({ method, path, status })),
    directWrites: directMutations(events).map(({ method, path, status }) => ({ method, path, status })),
  };
}

async function jsonResponse(response, message) {
  try {
    return await response.json();
  } catch {
    assert.fail(message);
  }
}

async function rpc(client, name, args) {
  const result = await client.rpc(name, args);
  assert.equal(result.error, null, "A RPC local falhou: " + name + ".");
  return result.data;
}

async function poll(predicate, label, milliseconds = 15000) {
  for (let attempt = 0; attempt < milliseconds / 200; attempt += 1) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.fail("Tempo esgotado: " + label + ".");
}

function newSupabaseClient(publicKey) {
  return createClient(apiURL, publicKey, { auth: { persistSession: false } });
}

function authPanel(page, target) {
  if (target.client === "pr") return page.getByRole("dialog");
  return page.locator("div.fixed.inset-0").filter({ has: page.locator("form") }).last();
}

function profilePanel(page, target) {
  if (target.client === "pr") return page.getByRole("dialog");
  return page.locator("div.fixed.inset-0").last();
}

async function assertProfileBalances(panel, coins, premiumTokens) {
  const cards = panel.locator("div.grid.grid-cols-2 > div");
  assert.equal(await cards.count(), 2, "O perfil deve apresentar os cartões de saldo diário e premium.");
  await cards.nth(0).getByText(String(coins), { exact: true }).waitFor({ timeout: 15000 });
  await cards.nth(1).getByText(String(premiumTokens), { exact: true }).waitFor({ timeout: 15000 });
}

function authInput(page, target, id, placeholder) {
  const panel = authPanel(page, target);
  return target.client === "pr"
    ? panel.locator("#" + id)
    : panel.getByPlaceholder(placeholder, { exact: true });
}

async function createSyntheticAuthAccount(publicKey, prefix) {
  const id = suffix();
  const email = prefix + "-" + id + "@example.com";
  const password = "Atlas1" + randomBytes(18).toString("hex");
  const username = prefix + "_" + id;
  const client = newSupabaseClient(publicKey);
  let accountCreated = false;
  try {
    const created = await client.auth.signUp({ email, password, options: { data: { username } } });
    assert.equal(created.error, null, "Não foi possível criar a conta sintética auxiliar.");
    assert.ok(created.data.user, "A autenticação local não devolveu a conta sintética.");
    accountCreated = true;

    if (!created.data.session) {
      const login = await client.auth.signInWithPassword({ email, password });
      assert.equal(login.error, null, "Não foi possível iniciar a sessão auxiliar.");
    }

    const profile = await client.from("profiles").select("referral_code").single();
    assert.equal(profile.error, null, "Não foi possível ler o código auxiliar.");
    assert.match(profile.data.referral_code, /^[0-9a-f]{8}$/);
    return { client, referralCode: profile.data.referral_code };
  } catch (error) {
    if (accountCreated) await deleteSyntheticAccount(client);
    throw error;
  }
}

async function deleteSyntheticAccount(client) {
  try {
    await client.rpc("delete_own_user");
  } catch {
    // A limpeza é repetida no final do teste principal se a conta continuar ativa.
  }
}

async function verifyLegacyLowercaseReferral(publicKey) {
  const createdAccounts = [];
  try {
    let lowerCode = null;
    for (let attempt = 0; attempt < 4 && !lowerCode; attempt += 1) {
      const candidate = await createSyntheticAuthAccount(publicKey, "lower_referrer");
      if (/[a-f]/.test(candidate.referralCode)) {
        lowerCode = candidate.referralCode;
        createdAccounts.push(candidate);
      } else {
        await deleteSyntheticAccount(candidate.client);
      }
    }
    assert.ok(lowerCode, "Não foi possível gerar um convite minúsculo para a prova legado.");

    const recipient = await createSyntheticAuthAccount(publicKey, "lower_recipient");
    createdAccounts.push(recipient);
    const result = await recipient.client.rpc("redeem_referral", { p_code: lowerCode.toUpperCase() });
    assert.equal(result.error, null, "A RPC legado de referral devolveu erro de transporte.");
    assert.equal(result.data, false,
      "Em previous, o código minúsculo deve expor a incompatibilidade com a normalização para maiúsculas.");
    console.log("LIMITAÇÃO LEGADA ESPERADA: a RPC não encontra o código minúsculo depois de a app o converter para maiúsculas.");
  } finally {
    for (const account of createdAccounts.reverse()) await deleteSyntheticAccount(account.client);
  }
}

async function verifyNormalizedReferral(publicKey) {
  const createdAccounts = [];
  try {
    let referrer = null;
    for (let attempt = 0; attempt < 4 && !referrer; attempt += 1) {
      const candidate = await createSyntheticAuthAccount(publicKey, "case_referrer");
      if (/[a-f]/.test(candidate.referralCode)) {
        referrer = candidate;
        createdAccounts.push(candidate);
      } else {
        await deleteSyntheticAccount(candidate.client);
      }
    }
    assert.ok(referrer, "Não foi possível gerar um convite minúsculo para a prova de normalização.");

    const recipient = await createSyntheticAuthAccount(publicKey, "case_recipient");
    createdAccounts.push(recipient);
    const result = await recipient.client.rpc("redeem_referral", {
      p_code: referrer.referralCode.toUpperCase(),
    });
    assert.equal(result.error, null, "A RPC real de referral devolveu erro de transporte.");
    assert.equal(result.data, true,
      "Em expand/lockdown, a RPC deve aceitar código minúsculo armazenado com entrada em maiúsculas.");
    const state = await recipient.client.rpc("get_user_state");
    assert.equal(state.error, null, "Não foi possível confirmar o prémio de referral normalizado.");
    assert.equal(state.data?.premium_tokens, 20, "A RPC normalizada deve conceder o prémio premium normal.");
    console.log("PASS: RPC PostgREST redeem_referral aceita código armazenado em minúsculas com entrada em maiúsculas.");
  } finally {
    for (const account of createdAccounts.reverse()) await deleteSyntheticAccount(account.client);
  }
}

async function readServerState(target, client) {
  const state = await rpc(client, "get_user_state");
  assert.ok(state && typeof state === "object", "O estado da conta não está disponível.");

  if (target.client === "master") {
    return {
      coins: state.coins,
      grantedToday: state.granted_today,
      premiumTokens: state.premium_tokens,
      highScores: state.high_scores ?? [],
    };
  }

  const tokens = await rpc(client, "arcade_refresh_user_tokens");
  return {
    coins: tokens.coins,
    grantedToday: tokens.granted_today,
    premiumTokens: state.premium_tokens,
    highScores: state.high_scores ?? [],
  };
}

async function startOneStrike(page, target) {
  const debitPath = target.client === "pr"
    ? (response) => isRpc(response, "arcade_consume_user_tokens")
    : (response) => isDirectTableMutation({
      path: apiPath(response), method: response.request().method(),
    }, "user_coins");
  const scorePath = target.client === "pr"
    ? (response) => isRpc(response, "arcade_submit_high_score")
    : (response) => isDirectTableMutation({
      path: apiPath(response), method: response.request().method(),
    }, "high_scores");
  const debitResponse = page.waitForResponse(debitPath, { timeout: 25000 });
  const scoreResponse = page.waitForResponse(scorePath, { timeout: 25000 });

  await page.getByRole("button", { name: "ONE STRIKE", exact: true }).click();
  await page.getByRole("button", { name: /ARCADE MODE/ }).click();

  const debit = await debitResponse;
  const score = await scoreResponse;
  const expectedAllowed = target.behavior !== "denied";

  if (target.client === "pr") {
    assert.equal(debit.status(), 200, "O RPC de consumo devia aceitar o gasto.");
    const data = await jsonResponse(debit, "O RPC de consumo não devolveu JSON.");
    assert.equal(data.ok, true);
    assert.equal(data.coins, 4);
    assert.equal(data.premium_tokens, 20);
    assert.equal(score.status(), 200, "O RPC de pontuação devia aceitar a pontuação.");
    assert.equal(await jsonResponse(score, "O RPC de pontuação não devolveu JSON."), 0);
  } else if (expectedAllowed) {
    assert.ok(debit.status() < 300, "O gasto direto do master devia ser aceite nesta fase.");
    assert.ok(score.status() < 300, "A escrita direta da pontuação devia ser aceite nesta fase.");
  } else {
    assert.ok(debit.status() >= 400, "A base de dados devia recusar o gasto direto do master.");
    assert.ok(score.status() >= 400, "A base de dados devia recusar a pontuação direta do master.");
  }

  await page.getByRole("button", { name: "BACK TO ARCADE", exact: true }).click();
  return { debit, score };
}

async function startJackpot(page, target, events) {
  const before = events.filter((event) => isDirectTableMutation(event, "user_coins")).length;
  const spendResponse = target.client === "pr"
    ? page.waitForResponse((response) => isRpc(response, "arcade_consume_user_tokens"), { timeout: 25000 })
    : null;

  await page.getByRole("button", { name: "Atlas Jackpot", exact: true }).click();
  await page.getByRole("heading", { name: "ATLAS JACKPOT", exact: true }).waitFor({ timeout: 20000 });

  if (target.client === "pr") {
    const response = await spendResponse;
    assert.equal(response.status(), 200, "O RPC do Jackpot devia aceitar a entrada.");
    const data = await jsonResponse(response, "O RPC do Jackpot não devolveu JSON.");
    assert.equal(data.ok, true);
    assert.equal(data.coins, 0);
    assert.equal(data.premium_tokens, 19, "A entrada deve consumir um token premium depois do saldo diário.");
  } else {
    await poll(() =>
      events.filter((event) => isDirectTableMutation(event, "user_coins")).length >= before + 2,
    "os dois pedidos diretos do master para a entrada no Jackpot");
    const mutations = events.filter((event) => isDirectTableMutation(event, "user_coins")).slice(before);
    if (target.behavior === "denied") {
      assert.ok(mutations.every((event) => event.status >= 400),
        "As escritas de saldo diário e premium do master deviam ser recusadas.");
    } else {
      assert.ok(mutations.every(isSuccessful), "As escritas do master deviam ser aceites nesta fase.");
    }
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open profile" }).waitFor({ timeout: 20000 });
}

async function signOutAndBackIn(page, email, password, target) {
  await page.getByTitle("Sign out", { exact: true }).click();
  await page.getByRole("button", { name: "INSERT COIN", exact: true }).first().waitFor();
  await page.getByRole("button", { name: "INSERT COIN", exact: true }).first().click();
  await authInput(page, target, "auth-email", "EMAIL").fill(email);
  await authInput(page, target, "auth-password", "PASSWORD").fill(password);

  const refreshResponse = target.client === "pr"
    ? page.waitForResponse((response) => isRpc(response, "arcade_refresh_user_tokens"), { timeout: 25000 })
    : null;
  await authPanel(page, target).getByRole("button", { name: "INSERT COIN", exact: true }).click();
  await page.getByRole("button", { name: "Open profile" }).waitFor({ timeout: 20000 });
  if (refreshResponse) {
    assert.equal((await refreshResponse).status(), 200, "O refresh devia funcionar depois do novo início de sessão.");
  }
}

async function deleteMainAccount(page, own, email, password, target) {
  const deleteResponse = page.waitForResponse((response) => isRpc(response, "delete_own_user"), { timeout: 25000 });
  await page.getByRole("button", { name: "Open profile" }).click();
  const panel = profilePanel(page, target);
  await panel.getByRole("button", { name: "DELETE ACCOUNT", exact: true }).click();
  await panel.getByRole("button", { name: "YES, DELETE", exact: true }).click();
  assert.ok((await deleteResponse).status() < 300, "A RPC de eliminação devia aceitar a própria conta.");
  await page.getByRole("button", { name: "INSERT COIN", exact: true }).first().waitFor({ timeout: 15000 });

  const stale = await own.rpc("get_user_state");
  if (stage === "previous" && target.client === "master") {
    assert.ok(
      (!stale.error && stale.data === null) || (stale.error?.code === "23503" && stale.data === null),
      "Em previous, a sessão antiga deve ler null ou expor a FK 23503 do RPC legado após a eliminação.",
    );
    if (stale.error?.code === "23503") {
      console.log("LIMITAÇÃO LEGADA ESPERADA: a leitura com JWT antigo devolve FK 23503 depois da eliminação.");
    }
  } else {
    assert.equal(stale.error, null, "Depois da eliminação, o RPC não deve recriar estado nem falhar.");
    assert.equal(stale.data, null, "Depois da eliminação, o RPC não deve recriar estado para a sessão antiga.");
  }
  const relogin = await own.auth.signInWithPassword({ email, password });
  assert.ok(relogin.error, "A conta eliminada não deve aceitar uma nova autenticação.");
}

async function runClient(target, browser) {
  const appURL = appURLs[target.client];
  const accountSuffix = suffix();
  const email = "atlas-rollout-" + accountSuffix + "@example.com";
  const password = "Atlas1" + randomBytes(18).toString("hex");
  const username = "atlas_rollout_" + accountSuffix;
  const events = [];
  let publicKey;
  let own;
  let deleted = false;
  let context;

  console.log("A testar " + target.client + " na fase " + stage + ".");
  try {
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    if (target.client === "master" && target.behavior !== "denied") {
      const now = new Date();
      const noonUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
      await page.clock.install({ time: noonUTC });
    }

    page.on("request", (request) => {
      if (new URL(request.url()).origin !== loopbackOrigin) return;
      const key = request.headers().apikey;
      if (key) publicKey = key;
    });
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin !== loopbackOrigin) return;
      events.push({ method: response.request().method(), path: url.pathname, status: response.status() });
    });

    await page.goto(appURL + "/?ref=" + encodeURIComponent(referralCode), { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "INSERT COIN", exact: true }).first().click();
    await authPanel(page, target).getByRole("button", { name: "SIGN UP", exact: true }).click();
    await authInput(page, target, "auth-username", "USERNAME").fill(username);
    await authInput(page, target, "auth-email", "EMAIL").fill(email);
    await authInput(page, target, "auth-password", "PASSWORD").fill(password);

    const referralResponse = page.waitForResponse((response) => isRpc(response, "redeem_referral"), { timeout: 30000 });
    const missingRefresh = target.behavior === "missing-rpc"
      ? page.waitForResponse((response) => isRpc(response, "arcade_refresh_user_tokens"), { timeout: 30000 })
      : null;
    await authPanel(page, target).getByRole("button", { name: "CREATE", exact: true }).click();
    await page.getByRole("button", { name: "Open profile" }).waitFor({ timeout: 20000 });

    const referral = await referralResponse;
    assert.equal(referral.status(), 200, "A RPC de referral devia responder localmente.");
    assert.equal(await jsonResponse(referral, "A RPC de referral não devolveu JSON."), true,
      "O convite uppercase sintético devia conceder o prémio regular.");
    assert.ok(publicKey, "O navegador não forneceu a chave pública local efémera.");
    own = newSupabaseClient(publicKey);
    const login = await own.auth.signInWithPassword({ email, password });
    assert.equal(login.error, null, "O início de sessão local por palavra-passe falhou.");
    const profile = await own.from("profiles").select("is_admin,referral_code").single();
    assert.equal(profile.error, null);
    assert.equal(profile.data.is_admin, false);
    assert.match(profile.data.referral_code, /^[0-9a-f]{8}$/);

    await poll(async () => {
      const result = await own.rpc("get_user_state");
      return !result.error && result.data?.premium_tokens === 20;
    }, "o prémio normal de referral");

    if (target.behavior === "missing-rpc") {
      const failedRefresh = await missingRefresh;
      assert.ok(failedRefresh.status() >= 400, "O RPC novo devia falhar na fase previous.");
      const body = await jsonResponse(failedRefresh, "A falha do RPC novo não devolveu JSON.");
      assert.equal(body.code, "PGRST202", "A falha devia identificar um RPC ausente na cache de esquema.");
      assert.equal(directMutations(events).length, 0,
        "A app do PR não pode tentar escritas diretas quando o RPC ainda não existe.");
    console.log("ESPERADO: PR/previous falha em arcade_refresh_user_tokens (PGRST202), sem mutações diretas.");
      return;
    }

    if (stage === "previous" && target.client === "master") {
      await verifyLegacyLowercaseReferral(publicKey);
    } else if (stage !== "previous") {
      await verifyNormalizedReferral(publicKey);
    }

    const initial = await readServerState(target, own);
    assert.equal(initial.premiumTokens, 20, "O saldo premium deve vir do referral sintético.");
    if (target.behavior !== "denied") assert.equal(initial.coins, 5);

    await page.getByRole("button", { name: "Open profile" }).click();
    const initialProfile = profilePanel(page, target);
    await assertProfileBalances(initialProfile, initial.coins, initial.premiumTokens);
    await initialProfile.getByRole("button", { name: "CLOSE", exact: true }).click();

    if (target.client === "pr") {
      assert.ok(events.some((event) => event.path.endsWith("/rpc/arcade_refresh_user_tokens") && event.status === 200),
        "A app devia atualizar o saldo através do RPC arcade_refresh_user_tokens.");
    }

    const game = await startOneStrike(page, target);
    const afterGame = await readServerState(target, own);
    if (target.behavior === "denied") {
      assert.equal(afterGame.coins, 5, "O estado do servidor deve manter as moedas após a recusa do PATCH.");
      assert.equal(afterGame.premiumTokens, 20);
      assert.equal(afterGame.highScores.some((score) => score.game_slug === "one-strike"), false,
        "O estado do servidor não deve conter a pontuação recusada.");
      assert.ok(game.debit.status() >= 400 && game.score.status() >= 400,
        "O sucesso visual não conta como sucesso do servidor.");
    } else {
      assert.equal(afterGame.coins, 4);
      assert.equal(afterGame.premiumTokens, 20);
      assert.ok(afterGame.highScores.some((score) => score.game_slug === "one-strike" && score.score === 0));
    }

    await startJackpot(page, target, events);
    let afterJackpot = await readServerState(target, own);
    const afterJackpotSpend = tokenSnapshot(afterJackpot);
    let afterRegeneration = null;
    if (target.behavior === "denied") {
      assert.equal(afterJackpot.coins, 5, "O saldo diário no servidor deve manter-se depois das recusas.");
      assert.equal(afterJackpot.premiumTokens, 20, "O saldo premium no servidor deve manter-se depois das recusas.");
      assert.equal(afterJackpot.highScores.some((score) => score.game_slug === "one-strike"), false);
    } else {
      assert.equal(afterJackpot.coins, 0);
      assert.equal(afterJackpot.premiumTokens, 19, "O Jackpot deve consumir um token premium depois das moedas diárias.");
    }

    if (target.client === "master" && target.behavior === "legacy") {
      const regenWrite = page.waitForResponse((response) => isDirectTableMutation({
        path: apiPath(response), method: response.request().method(),
      }, "user_coins"), { timeout: 25000 });
      await page.clock.fastForward(2 * 60 * 60 * 1000);
      const regen = await regenWrite;
      assert.ok(regen.status() < 300, "A regeneração legado devia persistir nesta fase.");
      await poll(async () => {
        afterJackpot = await readServerState(target, own);
        return afterJackpot.coins === 1 && afterJackpot.grantedToday === 6;
      }, "a regeneração legado de um token");
      afterRegeneration = tokenSnapshot(afterJackpot);
    }

    if (target.behavior === "denied") {
      const rejected = directMutations(events);
      assert.ok(rejected.some((event) => isDirectTableMutation(event, "user_coins") && event.status >= 400),
        "A base de dados deve recusar as mutações diretas a user_coins.");
      assert.ok(rejected.some((event) => isDirectTableMutation(event, "high_scores") && event.status >= 400),
        "A base de dados deve recusar a mutação direta a high_scores.");
      assert.ok(rejected.every((event) => event.status >= 400),
        "Nenhuma mutação direta do master pode ter sido aceite em lockdown.");
    }

    if (target.client === "pr") {
      const appMutations = directMutations(events);
      assert.equal(appMutations.length, 0,
        "A app do PR deve usar RPCs arcade_* e não pode alterar diretamente user_coins, high_scores ou profiles.");
      assert.ok(events.filter((event) => event.path.endsWith("/rpc/arcade_consume_user_tokens") && event.status === 200).length >= 2,
        "A app devia usar o RPC arcade_consume_user_tokens no jogo e no Jackpot.");
      assert.ok(events.some((event) => event.path.endsWith("/rpc/arcade_submit_high_score") && event.status === 200),
        "A app devia gravar a pontuação através do RPC arcade_submit_high_score.");
      assert.ok(events.some((event) => event.path.endsWith("/rpc/redeem_referral") && event.status === 200),
        "A app devia resgatar o convite através do RPC redeem_referral.");
    }

    if (target.behavior !== "denied") {
      const leaderboard = await rpc(own, "get_leaderboard", { p_game_slug: "one-strike", p_limit: 20 });
      assert.ok(leaderboard.some((row) => row.username === username && row.score === 0),
        "A pontuação do jogo devia surgir na tabela pública.");
      const appLeaderboard = await page.request.get(appURL + "/api/leaderboard?game=one-strike&limit=20");
      assert.equal(appLeaderboard.status(), 200, "A rota pública da tabela devia responder.");
    }

    await signOutAndBackIn(page, email, password, target);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Open profile" }).waitFor({ timeout: 20000 });
    const persisted = await readServerState(target, own);
    if (target.behavior === "denied") {
      assert.equal(persisted.coins, 5);
      assert.equal(persisted.premiumTokens, 20);
      assert.equal(persisted.highScores.some((score) => score.game_slug === "one-strike"), false);
    } else if (target.client === "master") {
      assert.equal(persisted.coins, 1);
      assert.equal(persisted.grantedToday, 6);
      assert.equal(persisted.premiumTokens, 19);
    } else {
      assert.equal(persisted.coins, 0);
      assert.equal(persisted.premiumTokens, 19);
      assert.ok(persisted.highScores.some((score) => score.game_slug === "one-strike" && score.score === 0));
    }

    await page.getByRole("button", { name: "Open profile" }).click();
    const finalProfile = profilePanel(page, target);
    await finalProfile.getByText(username, { exact: true }).waitFor();
    await assertProfileBalances(finalProfile, persisted.coins, persisted.premiumTokens);
    await finalProfile.getByRole("button", { name: "CLOSE", exact: true }).click();

    await deleteMainAccount(page, own, email, password, target);
    deleted = true;
    console.log("EVIDÊNCIA: " + JSON.stringify({
      client: target.client,
      stage,
      balances: {
        initial: tokenSnapshot(initial),
        afterOneStrike: tokenSnapshot(afterGame),
        afterJackpotSpend,
        afterRegeneration,
      },
      measuredSpend: {
        oneStrike: {
          dailyCoins: initial.coins - afterGame.coins,
          premiumTokens: initial.premiumTokens - afterGame.premiumTokens,
        },
        jackpot: {
          dailyCoins: afterGame.coins - afterJackpotSpend.coins,
          premiumTokens: afterGame.premiumTokens - afterJackpotSpend.premiumTokens,
        },
      },
      network: networkEvidence(events),
    }));
    console.log("PASS: " + target.client + "/" + stage + ", saldo do servidor, gasto, Jackpot, pontuação, tabela, referral, recarregamento, sessão e eliminação.");
  } finally {
    if (!own && publicKey) {
      own = newSupabaseClient(publicKey);
      try {
        const login = await own.auth.signInWithPassword({ email, password });
        if (login.error) own = null;
      } catch {
        own = null;
      }
    }
    if (own && !deleted) await deleteSyntheticAccount(own);
    if (context) await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const target of targets) await runClient(target, browser);
} finally {
  await browser.close();
}

console.log("TESTE DE COMPATIBILIDADE DE PUBLICAÇÃO: PASS. Fase " + stage + ", cliente(s) " + clientSelection + ".");
