import { expect, test } from "@playwright/test";
import { measureContrast } from "./helpers/contrast";

const TRACKING_HOSTS = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "segment.io",
  "segment.com",
  "mixpanel.com",
  "hotjar.com",
  "posthog.com",
  "plausible.io",
  "amplitude.com",
  "clarity.ms",
  "facebook.net",
];

test("public site smoke inventories external storage and sends no account writes", async ({ browser }, testInfo) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ storageState: undefined });
  const beforeCookies = await context.cookies();
  const page = await context.newPage();
  const hosts = new Set<string>();
  const requests: Array<{ method: string; host: string; path: string }> = [];
  const assetResponses: Array<{ type: string; host: string; path: string; status: number }> = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const mutatingRequests: string[] = [];
  const scriptSnapshots: Array<{
    stage: string;
    addedBundles: Array<{ path: string; decodedBytes: number; transferBytes: number }>;
    addedDecodedBytes: number;
  }> = [];
  const seenScriptPaths = new Set<string>();
  const urbanCtaBaseline: Array<{ theme: string; foreground: string; background: string; ratio: number }> = [];

  const captureScriptDelta = async (stage: string) => {
    const scripts = await page.evaluate(() => performance.getEntriesByType("resource")
      .filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming)
      .filter((entry) => new URL(entry.name).pathname.includes("/_next/static/chunks/")
        && new URL(entry.name).pathname.endsWith(".js"))
      .map((entry) => ({
        path: new URL(entry.name).pathname,
        decodedBytes: entry.decodedBodySize,
        transferBytes: entry.transferSize,
      })));
    const addedBundles = scripts.filter((script) => !seenScriptPaths.has(script.path));
    addedBundles.forEach((script) => seenScriptPaths.add(script.path));
    scriptSnapshots.push({
      stage,
      addedBundles,
      addedDecodedBytes: addedBundles.reduce((sum, script) => sum + script.decodedBytes, 0),
    });
  };

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol === "http:" || url.protocol === "https:") hosts.add(url.hostname.toLowerCase());
    requests.push({ method: request.method(), host: url.hostname.toLowerCase(), path: url.pathname });
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      mutatingRequests.push(request.method() + " " + url.origin + url.pathname);
    }
  });
  page.on("response", (response) => {
    const request = response.request();
    const url = new URL(response.url());
    if (request.resourceType() === "image" || url.pathname.endsWith(".json")) {
      assetResponses.push({
        type: request.resourceType(),
        host: url.hostname.toLowerCase(),
        path: url.pathname,
        status: response.status(),
      });
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "GEORADAR", exact: true })).toBeVisible();
  await page.waitForLoadState("networkidle");

  // Toggling the theme proves the client has hydrated before storage is sampled.
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  // Measure the currently deployed hover action before comparing it with the local fix.
  // The production URL is read-only and this only hovers a card.
  const urbanCard = page.getByRole("button", { name: "URBAN LEGENDS", exact: true });
  for (const theme of ["dark", "light"]) {
    if (theme === "light") {
      await page.getByRole("button", { name: "Switch to light mode" }).click();
      await expect(page.locator("html")).toHaveClass(/light/);
    }
    await urbanCard.hover();
    const action = urbanCard.locator(":scope > div").last();
    await action.evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)));
    });
    const measurement = await measureContrast(action);
    urbanCtaBaseline.push({
      theme,
      foreground: measurement.foreground,
      background: measurement.background,
      ratio: measurement.ratio,
    });
  }
  await page.mouse.move(1, 1);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await captureScriptDelta("initial page");

  // Exercise the public, read-only leaderboard and its game selector.
  await page.getByRole("button", { name: "Leaderboard" }).click();
  await expect(page.getByRole("heading", { name: "LEADERBOARD" })).toBeVisible();
  await page.getByRole("button", { name: "FLAG FRENZY", exact: true }).last().click();
  await page.getByRole("button", { name: "Close" }).click();

  // Load a map game without answering, spending tokens, or sending a score.
  await page.getByRole("button", { name: "TECTONIC SNAP", exact: true }).click();
  await page.getByRole("button", { name: /DAILY CHALLENGE/i }).click();
  const map = page.locator('svg[aria-label="Continent map"]');
  await expect(map).toBeVisible({ timeout: 30_000 });
  expect(await map.locator("path").count()).toBeGreaterThan(0);
  await captureScriptDelta("Tectonic game");
  await page.getByRole("button", { name: "HOME", exact: true }).click();

  // Load the interactive globe without placing a pin or revealing a result.
  await page.getByRole("button", { name: "SKYLINE SILHOUETTE", exact: true }).click();
  await page.getByRole("button", { name: /DAILY CHALLENGE/i }).click();
  await expect(page.getByRole("heading", { name: "SKYLINE SILHOUETTE", level: 1 })).toBeVisible();
  const globeCanvas = page.locator("canvas").first();
  await expect(globeCanvas).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => globeCanvas.evaluate((canvas) => {
    const rendered = canvas as HTMLCanvasElement;
    return rendered.width > 0 && rendered.height > 0;
  })).toBe(true);
  await captureScriptDelta("Skyline globe");
  await page.getByRole("button", { name: "HOME", exact: true }).click();

  // Load one city image in the guest flow, then leave before scoring the round.
  await page.getByRole("button", { name: "URBAN LEGENDS", exact: true }).click();
  await page.getByRole("button", { name: /DAILY CHALLENGE/i }).click();
  await page.getByRole("button", { name: /TOURIST/i }).click();
  const cityImage = page.getByRole("img", { name: "Mystery city" });
  await expect(cityImage).toBeVisible();
  await expect.poll(
    () => cityImage.evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0),
    { timeout: 30_000 },
  ).toBe(true);
  await page.getByRole("button", { name: "HOME", exact: true }).click();

  const afterCookies = await context.cookies();
  const storageKeys = await page.evaluate(() => ({
    localStorage: Object.keys(localStorage).sort(),
    sessionStorage: Object.keys(sessionStorage).sort(),
  }));
  const trackingHosts = [...hosts].filter((host) =>
    TRACKING_HOSTS.some((tracker) => host === tracker || host.endsWith("." + tracker)),
  ).sort();
  const report = {
    url: page.url(),
    requestHosts: [...hosts].sort(),
    beforeCookieNames: beforeCookies.map((cookie) => cookie.name),
    afterCookies: afterCookies.map((cookie) => ({
      name: cookie.name,
      domain: cookie.domain,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    })),
    storageKeys,
    requests,
    assetResponses,
    scriptSnapshots,
    productionUrbanCtaHover: urbanCtaBaseline,
    trackingHosts,
    mutatingRequests,
    consoleErrors,
    pageErrors,
  };

  await testInfo.attach("live-smoke.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  console.info(JSON.stringify(report));

  expect(beforeCookies).toEqual([]);
  expect(trackingHosts).toEqual([]);
  expect(mutatingRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  await context.close();
});
