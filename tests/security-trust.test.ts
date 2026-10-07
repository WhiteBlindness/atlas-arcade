import assert from "node:assert/strict";
import test from "node:test";
import { AuthSessionMissingError } from "@supabase/supabase-js";

import { classifyAuthLookup, parseTokenState, parseTokenSpendResult } from "../src/lib/security/coin-state";
import {
  accrue,
  freshDay,
  isRegening,
  msToNextToken,
  refundGuestToken,
  REGEN_MS,
  spend,
  type TokenState,
} from "../src/lib/tokens";
import { todayUTC } from "../src/lib/daily";
import { isCronAuthorizationValid, safeInternalPath } from "../src/lib/security/trust";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test("cron access requires the configured bearer secret", () => {
  assert.equal(isCronAuthorizationValid(null, "a-secure-secret"), false);
  assert.equal(isCronAuthorizationValid("Bearer wrong", "a-secure-secret"), false);
  assert.equal(isCronAuthorizationValid("Basic a-secure-secret", "a-secure-secret"), false);
  assert.equal(isCronAuthorizationValid("Bearer a-secure-secret", "a-secure-secret"), true);
  assert.equal(isCronAuthorizationValid("Bearer a-secure-secret", ""), false);
});

test("auth redirects accept same-origin absolute paths and preserve query state", () => {
  assert.equal(safeInternalPath("/confirmed?from=email", "/", "https://arcade.example"), "/confirmed?from=email");
  assert.equal(safeInternalPath("/reset#form", "/", "https://arcade.example"), "/reset#form");
  assert.equal(safeInternalPath(null, "/confirmed", "https://arcade.example"), "/confirmed");
});

test("auth redirects reject external and malformed destinations", () => {
  for (const destination of [
    "https://attacker.example/",
    "//attacker.example/",
    "///attacker.example/",
    "/\\\\attacker.example/",
    "javascript:alert(1)",
    "relative/path",
  ]) {
    assert.equal(safeInternalPath(destination, "/", "https://arcade.example"), "/", destination);
  }
  assert.equal(safeInternalPath("https://attacker.example/", "//attacker.example/", "https://arcade.example"), "/");
});

test("coin RPC parsing accepts only a bounded token state", () => {
  const value = {
    coins: 3,
    granted_today: 7,
    accrual_at: "2026-10-07T10:00:00.000Z",
    last_reset: "2026-10-07",
  };
  assert.deepEqual(parseTokenState(value), {
    coins: 3,
    grantedToday: 7,
    accrualAt: Date.parse(value.accrual_at),
    day: value.last_reset,
  });

  for (const invalid of [
    null,
    [],
    { ...value, coins: -1 },
    { ...value, coins: 6 },
    { ...value, granted_today: 4 },
    { ...value, granted_today: 11 },
    { ...value, coins: Number.NaN },
    { ...value, granted_today: Number.POSITIVE_INFINITY },
    { ...value, accrual_at: "invalid" },
    { ...value, accrual_at: "99999-99-99T99:99:99Z" },
    { ...value, last_reset: "10/07/2026" },
    { ...value, last_reset: "2026-02-30" },
  ]) {
    assert.equal(parseTokenState(invalid), null);
  }
});

test("coin spend results require explicit server decisions and valid balances", () => {
  const result = parseTokenSpendResult({
    ok: true,
    is_admin: false,
    coins: 2,
    granted_today: 5,
    accrual_at: "2026-10-07T10:00:00.000Z",
    last_reset: "2026-10-07",
    premium_tokens: 4,
  });
  assert.deepEqual(result, {
    ok: true,
    isAdmin: false,
    tokens: {
      coins: 2,
      grantedToday: 5,
      accrualAt: Date.parse("2026-10-07T10:00:00.000Z"),
      day: "2026-10-07",
    },
    premiumTokens: 4,
  });

  assert.equal(parseTokenSpendResult({ ok: 1, is_admin: false, premium_tokens: 4 }), null);
  assert.equal(parseTokenSpendResult({ ok: true, is_admin: "true", premium_tokens: 4 }), null);
  assert.equal(parseTokenSpendResult({
    ok: true,
    is_admin: false,
    coins: 2,
    granted_today: 5,
    accrual_at: "2026-10-07T10:00:00.000Z",
    last_reset: "2026-10-07",
    premium_tokens: Number.POSITIVE_INFINITY,
  }), null);
  assert.equal(parseTokenSpendResult({
    ok: true,
    is_admin: false,
    coins: 2,
    granted_today: 5,
    accrual_at: "2026-10-07T10:00:00.000Z",
    last_reset: "2026-10-07",
    premium_tokens: -1,
  }), null);
});

test("guest coin model respects the daily grant cap and never mutates its input", () => {
  const now = Date.now();
  const state: TokenState = {
    coins: 3,
    grantedToday: 9,
    accrualAt: now - REGEN_MS * 3,
    day: todayUTC(),
  };

  const replenished = accrue(state, now);
  assert.equal(replenished.coins, 4);
  assert.equal(replenished.grantedToday, 10);
  assert.equal(state.coins, 3);
  assert.equal(state.grantedToday, 9);

  const spent = spend({ ...state, coins: 0 }, 1, now);
  assert.equal(spent, null);
  const spentFull = spend({ ...state, coins: 5 }, 1, now);
  assert.deepEqual(spentFull, { ...state, coins: 4, accrualAt: now });
});

test("token regeneration handles reset, idle, not-yet-due, refill and countdown boundaries", () => {
  const now = Date.now();
  const fresh = freshDay(now);
  assert.deepEqual(fresh, { coins: 5, grantedToday: 5, accrualAt: now, day: todayUTC() });

  const waiting: TokenState = {
    coins: 3,
    grantedToday: 5,
    accrualAt: now - REGEN_MS + 1_000,
    day: todayUTC(),
  };
  assert.equal(isRegening(waiting), true);
  assert.equal(msToNextToken(waiting, now), 1_000);
  assert.equal(accrue(waiting, now), waiting);
  assert.equal(msToNextToken(waiting, now + REGEN_MS), 0);

  const completedRefill = accrue({ ...waiting, accrualAt: now - REGEN_MS * 3 }, now);
  assert.deepEqual(completedRefill, { ...waiting, coins: 5, grantedToday: 7, accrualAt: now });

  const full: TokenState = { ...fresh, coins: 5 };
  assert.equal(isRegening(full), false);
  assert.equal(msToNextToken(full, now), null);
  assert.equal(accrue(full, now), full);

  const spentDailyBudget: TokenState = { ...waiting, grantedToday: 10 };
  assert.equal(isRegening(spentDailyBudget), false);
  assert.equal(msToNextToken(spentDailyBudget, now), null);

  const priorDay: TokenState = { ...waiting, coins: 0, grantedToday: 10, day: "2000-01-01" };
  assert.deepEqual(accrue(priorDay, now), fresh);
});

test("spending from a partial guest balance preserves the existing regen anchor", () => {
  const now = Date.now();
  const state: TokenState = { coins: 3, grantedToday: 6, accrualAt: now - 30_000, day: todayUTC() };
  assert.deepEqual(spend(state, 1, now), { ...state, coins: 2 });
});

test("coin auth lookup treats only a missing session as guest mode", () => {
  assert.equal(classifyAuthLookup(null, null), "guest");
  assert.equal(classifyAuthLookup(null, new AuthSessionMissingError()), "guest");
  assert.equal(classifyAuthLookup({ id: "user-1" }, null), "account");
  assert.equal(classifyAuthLookup(null, new Error("network unavailable")), "unavailable");
  assert.equal(classifyAuthLookup({ id: "user-1" }, new AuthSessionMissingError()), "unavailable");
});

test("only a guest balance can receive a bounded run refund", () => {
  const state: TokenState = { coins: 4, grantedToday: 5, accrualAt: Date.now(), day: todayUTC() };
  assert.deepEqual(refundGuestToken(state, true), { ...state, coins: 5 });
  assert.equal(refundGuestToken(state, false), null);
  assert.equal(refundGuestToken({ ...state, coins: 5 }, true), null);
  assert.equal(state.coins, 4);
});

test("coin store disables client premium grants and account refunds", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://audit.example.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "audit-anon-key";

  try {
    const { useCoinStore } = await import("../src/store/coinStore");
    const tokens: TokenState = {
      coins: 4,
      grantedToday: 5,
      accrualAt: Date.now(),
      day: todayUTC(),
    };

    useCoinStore.setState({
      tokens,
      coins: tokens.coins,
      premiumTokens: 17,
      guest: false,
      isAdmin: false,
    });
    await useCoinStore.getState().earnPremium(500);
    assert.equal(useCoinStore.getState().premiumTokens, 17);
    assert.equal(await useCoinStore.getState().refund(), false);
    assert.equal(useCoinStore.getState().coins, 4);

    useCoinStore.setState({ tokens, coins: tokens.coins, premiumTokens: null, guest: true });
    await useCoinStore.getState().earnPremium(500);
    assert.equal(useCoinStore.getState().premiumTokens, null);
    assert.equal(await useCoinStore.getState().refund(), true);
    assert.equal(useCoinStore.getState().coins, 5);
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
  }
});

test("reset invalidates a delayed auth lookup so it cannot restore an account balance", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let restoreGetUser: (() => void) | null = null;
  let resetCoinStore: (() => void) | null = null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://audit.example.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "audit-anon-key";

  try {
    const [{ useCoinStore }, { supabase }] = await Promise.all([
      import("../src/store/coinStore"),
      import("../src/lib/supabase/client"),
    ]);
    const originalGetUser = Object.getOwnPropertyDescriptor(supabase.auth, "getUser");
    restoreGetUser = () => {
      if (originalGetUser) Object.defineProperty(supabase.auth, "getUser", originalGetUser);
      else Reflect.deleteProperty(supabase.auth, "getUser");
    };
    resetCoinStore = () => useCoinStore.getState().reset();
    const response = deferred<{ data: { user: { id: string } }; error: null }>();
    Object.defineProperty(supabase.auth, "getUser", {
      configurable: true,
      writable: true,
      value: () => response.promise,
    });

    const pendingLoad = useCoinStore.getState().load();
    assert.equal(useCoinStore.getState().loading, true);
    useCoinStore.getState().reset();
    response.resolve({ data: { user: { id: "stale-account" } }, error: null });

    await pendingLoad;
    assert.equal(useCoinStore.getState().guest, true);
    assert.equal(useCoinStore.getState().loading, false);
    assert.equal(useCoinStore.getState().tokens, null);
    assert.equal(useCoinStore.getState().coins, null);
  } finally {
    restoreGetUser?.();
    resetCoinStore?.();
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
  }
});

test("account token spends reject concurrent calls across both store actions", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let restoreRpc: (() => void) | null = null;
  let resetCoinStore: (() => void) | null = null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://audit.example.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "audit-anon-key";

  try {
    const [{ useCoinStore }, { supabase }] = await Promise.all([
      import("../src/store/coinStore"),
      import("../src/lib/supabase/client"),
    ]);
    const originalRpc = Object.getOwnPropertyDescriptor(supabase, "rpc");
    restoreRpc = () => {
      if (originalRpc) Object.defineProperty(supabase, "rpc", originalRpc);
      else Reflect.deleteProperty(supabase, "rpc");
    };
    resetCoinStore = () => useCoinStore.getState().reset();
    const response = deferred<{ data: unknown; error: null }>();
    let calls = 0;
    Object.defineProperty(supabase, "rpc", {
      configurable: true,
      writable: true,
      value: () => {
        calls += 1;
        return response.promise;
      },
    });

    useCoinStore.setState({
      tokens: { coins: 5, grantedToday: 5, accrualAt: Date.now(), day: todayUTC() },
      coins: 5,
      premiumTokens: 0,
      guest: false,
      isAdmin: false,
      spending: false,
    });

    const firstSpend = useCoinStore.getState().spend();
    assert.equal(useCoinStore.getState().spending, true);
    assert.equal(await useCoinStore.getState().spendTokens(5), false);
    assert.equal(await useCoinStore.getState().spend(), false);
    assert.equal(calls, 1);

    response.resolve({
      data: {
        ok: true,
        is_admin: false,
        coins: 4,
        granted_today: 5,
        accrual_at: new Date().toISOString(),
        last_reset: todayUTC(),
        premium_tokens: 0,
      },
      error: null,
    });
    assert.equal(await firstSpend, true);
    assert.equal(useCoinStore.getState().coins, 4);
    assert.equal(useCoinStore.getState().spending, false);
  } finally {
    restoreRpc?.();
    resetCoinStore?.();
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
  }
});

test("reset invalidates a delayed account spend without restoring stale state", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let restoreRpc: (() => void) | null = null;
  let resetCoinStore: (() => void) | null = null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://audit.example.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "audit-anon-key";

  try {
    const [{ useCoinStore }, { supabase }] = await Promise.all([
      import("../src/store/coinStore"),
      import("../src/lib/supabase/client"),
    ]);
    const originalRpc = Object.getOwnPropertyDescriptor(supabase, "rpc");
    restoreRpc = () => {
      if (originalRpc) Object.defineProperty(supabase, "rpc", originalRpc);
      else Reflect.deleteProperty(supabase, "rpc");
    };
    resetCoinStore = () => useCoinStore.getState().reset();
    const response = deferred<{ data: unknown; error: null }>();
    Object.defineProperty(supabase, "rpc", {
      configurable: true,
      writable: true,
      value: () => response.promise,
    });

    useCoinStore.setState({
      tokens: { coins: 5, grantedToday: 5, accrualAt: Date.now(), day: todayUTC() },
      coins: 5,
      premiumTokens: 0,
      guest: false,
      isAdmin: false,
      spending: false,
    });
    const pendingSpend = useCoinStore.getState().spend();
    assert.equal(useCoinStore.getState().spending, true);

    useCoinStore.getState().reset();
    assert.equal(useCoinStore.getState().spending, false);
    assert.equal(useCoinStore.getState().guest, true);
    response.resolve({
      data: {
        ok: true,
        is_admin: false,
        coins: 4,
        granted_today: 5,
        accrual_at: new Date().toISOString(),
        last_reset: todayUTC(),
        premium_tokens: 0,
      },
      error: null,
    });

    assert.equal(await pendingSpend, false);
    assert.equal(useCoinStore.getState().tokens, null);
    assert.equal(useCoinStore.getState().coins, null);
    assert.equal(useCoinStore.getState().premiumTokens, null);
    assert.equal(useCoinStore.getState().guest, true);
    assert.equal(useCoinStore.getState().spending, false);
  } finally {
    restoreRpc?.();
    resetCoinStore?.();
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
  }
});

test("account token RPC failures clear stale balances and show only a generic retry message", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let restoreRpc: (() => void) | null = null;
  let resetCoinStore: (() => void) | null = null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://audit.example.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "audit-anon-key";

  try {
    const [{ useCoinStore }, { supabase }, { useToastStore }, { useSettingsStore }, { t }] = await Promise.all([
      import("../src/store/coinStore"),
      import("../src/lib/supabase/client"),
      import("../src/store/toastStore"),
      import("../src/store/settingsStore"),
      import("../src/lib/i18n"),
    ]);
    const originalRpc = Object.getOwnPropertyDescriptor(supabase, "rpc");
    restoreRpc = () => {
      if (originalRpc) Object.defineProperty(supabase, "rpc", originalRpc);
      else Reflect.deleteProperty(supabase, "rpc");
    };
    resetCoinStore = () => useCoinStore.getState().reset();
    let shouldReject = true;
    let calls = 0;
    Object.defineProperty(supabase, "rpc", {
      configurable: true,
      writable: true,
      value: () => {
        calls += 1;
        return shouldReject
          ? Promise.reject(new Error("private database detail"))
          : Promise.resolve({ data: null, error: null });
      },
    });

    useSettingsStore.getState().setLang("en");
    useToastStore.setState({ toasts: [] });
    useCoinStore.setState({
      tokens: { coins: 5, grantedToday: 5, accrualAt: Date.now(), day: todayUTC() },
      coins: 5,
      premiumTokens: 0,
      guest: false,
      isAdmin: false,
      spending: false,
    });
    assert.equal(await useCoinStore.getState().spendTokens(5), false);
    assert.equal(useCoinStore.getState().spending, false);
    assert.equal(useCoinStore.getState().guest, false);
    assert.equal(useCoinStore.getState().coins, null);
    assert.equal(useCoinStore.getState().premiumTokens, null);
    assert.equal(useToastStore.getState().toasts.at(-1)?.message, t("en", "errBalanceUnavailable"));
    assert.equal(useToastStore.getState().toasts.at(-1)?.message.includes("private"), false);

    shouldReject = false;
    useCoinStore.setState({
      tokens: { coins: 5, grantedToday: 5, accrualAt: Date.now(), day: todayUTC() },
      coins: 5,
      premiumTokens: 0,
      guest: false,
      spending: false,
    });
    assert.equal(await useCoinStore.getState().spend(), false);
    assert.equal(useCoinStore.getState().spending, false);
    assert.equal(useCoinStore.getState().coins, null);
    assert.equal(useToastStore.getState().toasts.at(-1)?.message, t("en", "errBalanceUnavailable"));
    assert.equal(calls, 2);
  } finally {
    restoreRpc?.();
    resetCoinStore?.();
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
  }
});
