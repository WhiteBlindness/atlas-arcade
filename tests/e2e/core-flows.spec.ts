import { expect, test, type Page } from "@playwright/test";
import { installSignedInSupabaseFixture } from "./helpers/supabase-fixture";

const WORLD_TOPOLOGY_FIXTURE = {
  type: "Topology",
  objects: {
    countries: {
      type: "GeometryCollection",
      geometries: ["840", "76", "250", "356"].map((id) => ({ type: "Polygon", id, arcs: [[0]] })),
    },
  },
  arcs: [[[-20, -20], [20, -20], [20, 20], [-20, 20], [-20, -20]]],
};

async function installWorldTopologyFixture(page: Page) {
  await page.route("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(WORLD_TOPOLOGY_FIXTURE),
    }),
  );
}
const LEGAL_DOCUMENTS = [
  { path: "/privacy", label: "Privacy" },
  { path: "/terms", label: "Terms" },
  { path: "/cookies", label: "Cookies and storage" },
  { path: "/credits", label: "Credits" },
];

test("keyboard users can open the mode picker and launch a daily round", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("button", { name: "CAPITAL STRIKE", exact: true });
  await card.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByText("SELECT MODE", { exact: true })).toBeVisible();
  const daily = page.getByRole("button", { name: /DAILY CHALLENGE/i });
  await expect(daily).toBeVisible();
  await daily.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("button", { name: "HOME", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "CAPITAL STRIKE", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
});

test("leaderboard opens, changes game, and closes without a write request", async ({ page }) => {
  const methods: string[] = [];
  await page.route("**/api/leaderboard**", async (route) => {
    methods.push(route.request().method());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ leaderboard: [] }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Leaderboard" }).click();
  await expect(page.getByRole("heading", { name: "LEADERBOARD" })).toBeVisible();
  await page.getByRole("button", { name: "FLAG FRENZY", exact: true }).last().click();
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  expect(methods.length).toBeGreaterThan(0);
  expect(methods.every((method) => method === "GET")).toBe(true);
});

test("service documents are linked from home and resolve directly", async ({ page }) => {
  await page.goto("/");
  const homeNav = page.getByRole("navigation", { name: "Service documents" });
  await expect(homeNav).toBeVisible();

  for (const document of LEGAL_DOCUMENTS) {
    const link = homeNav.getByRole("link", { name: document.label, exact: true });
    await expect(link).toHaveAttribute("href", document.path);

    const response = await page.goto(document.path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const documentNav = page.getByRole("navigation", { name: "Service documents" });
    await expect(documentNav.getByRole("link", { name: document.label, exact: true })).toBeVisible();
  }
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
  { name: "small mobile", width: 320, height: 700 },
  { name: "short screen", width: 700, height: 480 },
]) {
  test("layout fits the " + viewport.name + " viewport", async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "GEORADAR", exact: true })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(viewport.width);
    expect(dimensions.bodyWidth).toBeLessThanOrEqual(viewport.width);
  });
}

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("animated labels and transitions become effectively immediate", async ({ page }) => {
    await page.goto("/");
    const durations = await page.locator(".animate-blink").first().evaluate((element) => {
      const style = getComputedStyle(element);
      const seconds = (duration: string) => {
        const value = Number.parseFloat(duration);
        return duration.trim().endsWith("ms") ? value / 1000 : value;
      };
      return {
        animationSeconds: Math.max(...style.animationDuration.split(",").map(seconds)),
        transitionSeconds: Math.max(...style.transitionDuration.split(",").map(seconds)),
      };
    });
    expect(durations.animationSeconds).toBeLessThanOrEqual(0.01);
    expect(durations.transitionSeconds).toBeLessThanOrEqual(0.01);
  });
});


test("a signed-out guest can start Arcade Mode and spends one local coin", async ({ page }) => {
  await page.goto("/");
  const guestCoins = () => page.evaluate(() => {
    const raw = localStorage.getItem("atlas-arcade-guest-tokens");
    return raw ? (JSON.parse(raw) as { coins: number }).coins : null;
  });
  await expect.poll(guestCoins).toBe(5);
  await expect(page.locator("header [title^=\"Arcade coins\"]")).toContainText("5");

  await page.getByRole("button", { name: "URBAN LEGENDS", exact: true }).click();
  await page.getByRole("button", { name: /ARCADE MODE/i }).click();
  await expect(page.getByRole("heading", { name: "URBAN LEGENDS", level: 1 })).toBeVisible();
  await expect(page.getByText(/SELECT DIFFICULTY/i)).toBeVisible();
  await expect.poll(guestCoins).toBe(4);

  await page.getByRole("button", { name: /TOURIST/i }).click();
  await expect(page.getByRole("img", { name: "Mystery city" })).toBeVisible();
  await page.getByRole("button", { name: "ARCADE", exact: true }).click();
  await expect(page.getByRole("button", { name: "URBAN LEGENDS", exact: true })).toBeVisible();
});

test("Urban Legends accepts answers, shows a final result, and exits to the game grid", async ({ page }) => {
  await page.route("https://upload.wikimedia.org/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    headers: { "access-control-allow-origin": "*" },
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#222"/></svg>',
  }));
  await page.goto("/");
  await page.getByRole("button", { name: "URBAN LEGENDS", exact: true }).click();
  await page.getByRole("button", { name: /DAILY CHALLENGE/i }).click();
  await page.getByRole("button", { name: /TOURIST/i }).click();

  const options = page.locator(".grid.grid-cols-2").getByRole("button");
  for (let round = 0; round < 6; round += 1) {
    await expect(options).toHaveCount(4);
    await options.first().click();
    await expect(page.getByText(/CORRECT!|IT WAS/i).first()).toBeVisible();
    const advance = round === 5
      ? page.getByRole("button", { name: "FINISH", exact: true })
      : page.getByRole("button", { name: /NEXT CITY/i });
    await advance.click();
  }

  await expect(page.getByText("FINAL SCORE", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "BACK TO GAMES", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "BACK TO GAMES", exact: true }).click();
  await expect(page.getByRole("button", { name: "URBAN LEGENDS", exact: true })).toBeVisible();
});

test("account high-score fixture appears on the matching game card", async ({ page }) => {
  const fixture = await installSignedInSupabaseFixture(page, [
    { game_slug: "globle", score: 12_345 },
  ]);
  await page.goto("/");

  const card = page.getByRole("button", { name: "GEORADAR", exact: true });
  await expect(card).toContainText("BEST");
  await expect(card).toContainText("12 345");
  await expect.poll(() => fixture.requests.some((request) => request.endsWith("/rest/v1/rpc/get_user_state"))).toBe(true);
});


test("a pending Arcade spend cannot race with Escape, cancel, or daily selection", async ({ page }) => {
  const fixture = await installSignedInSupabaseFixture(page, []);
  fixture.pauseTokenSpends();
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "URBAN LEGENDS", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const arcade = dialog.getByRole("button", { name: /ARCADE MODE/i });
    await arcade.click();
    const spendCount = () => fixture.requests.filter((request) => request.endsWith("/rest/v1/rpc/arcade_consume_user_tokens")).length;
    await expect.poll(spendCount).toBe(1);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    const daily = dialog.getByRole("button", { name: /DAILY CHALLENGE/i });
    await expect(daily).toBeDisabled();
    const cancelButtons = dialog.getByRole("button", { name: /cancel/i });
    await expect(cancelButtons).toHaveCount(2);
    for (const cancel of await cancelButtons.all()) await expect(cancel).toBeDisabled();
    await expect.poll(spendCount).toBe(1);

    fixture.resumeTokenSpends();
    await expect(page.getByRole("heading", { name: "URBAN LEGENDS", level: 1 })).toBeVisible();
    await expect(dialog).toHaveCount(0);
  } finally {
    fixture.resumeTokenSpends();
  }
});

test("rapid Arcade Mode activation sends one spend request", async ({ page }) => {
  const fixture = await installSignedInSupabaseFixture(page, []);
  fixture.pauseTokenSpends();
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "URBAN LEGENDS", exact: true }).click();
    const arcade = page.getByRole("button", { name: /ARCADE MODE/i });
    await arcade.click();
    const spendCount = () => fixture.requests.filter((request) => request.endsWith("/rest/v1/rpc/arcade_consume_user_tokens")).length;
    await expect.poll(spendCount).toBe(1);

    if (await arcade.isEnabled()) await arcade.click();
    await expect.poll(spendCount).toBe(1);
    fixture.resumeTokenSpends();
    await expect(page.getByRole("heading", { name: "URBAN LEGENDS", level: 1 })).toBeVisible();
  } finally {
    fixture.resumeTokenSpends();
  }
});

test("rapid Atlas Jackpot activation sends one token spend request", async ({ page }) => {
  const fixture = await installSignedInSupabaseFixture(page, []);
  fixture.pauseTokenSpends();
  try {
    await page.goto("/");
    await expect.poll(() => fixture.requests.some((request) => request.endsWith("/rest/v1/rpc/arcade_refresh_user_tokens"))).toBe(true);
    await expect.poll(() => fixture.requests.some((request) => request.endsWith("/rest/v1/rpc/get_user_state"))).toBe(true);
    await expect(page.locator('header [title^="Arcade coins"]')).toContainText("5");
    const jackpot = page.getByRole("button", { name: "Atlas Jackpot", exact: true });
    await jackpot.click();
    const spendCount = () => fixture.requests.filter((request) => request.endsWith("/rest/v1/rpc/arcade_consume_user_tokens")).length;
    await expect.poll(spendCount).toBe(1);

    if (await jackpot.isEnabled()) await jackpot.click();
    await expect.poll(spendCount).toBe(1);
    fixture.resumeTokenSpends();
    await expect(page.getByRole("heading", { name: "ATLAS JACKPOT", level: 1 })).toBeVisible();
  } finally {
    fixture.resumeTokenSpends();
  }
});

test("rapid Play Again activation sends one spend request", async ({ page }) => {
  const fixture = await installSignedInSupabaseFixture(page, []);
  await page.route("https://upload.wikimedia.org/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    headers: { "access-control-allow-origin": "*" },
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#222"/></svg>',
  }));
  await page.goto("/");
  await page.getByRole("button", { name: "URBAN LEGENDS", exact: true }).click();
  await page.getByRole("button", { name: /ARCADE MODE/i }).click();
  await page.getByRole("button", { name: /TOURIST/i }).click();

  const options = page.locator(".grid.grid-cols-2").getByRole("button");
  for (let round = 0; round < 6; round += 1) {
    await options.first().click();
    await expect(page.getByText(/CORRECT!|IT WAS/i).first()).toBeVisible();
    const advance = round === 5
      ? page.getByRole("button", { name: /FINISH/i })
      : page.getByRole("button", { name: /NEXT CITY/i });
    await advance.click();
  }

  const playAgain = page.getByRole("button", { name: /PLAY AGAIN/i });
  await expect(playAgain).toBeVisible();
  fixture.pauseTokenSpends();
  try {
    const spendCount = () => fixture.requests.filter((request) => request.endsWith("/rest/v1/rpc/arcade_consume_user_tokens")).length;
    const before = await spendCount();
    await playAgain.click();
    await expect.poll(spendCount).toBe(before + 1);

    if (await playAgain.isEnabled()) await playAgain.click();
    await expect.poll(spendCount).toBe(before + 1);
    fixture.resumeTokenSpends();
    await expect(page.getByRole("heading", { name: "URBAN LEGENDS", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /TOURIST/i })).toBeVisible();
  } finally {
    fixture.resumeTokenSpends();
  }
});

test("a failed Arcade spend releases the mode picker for another attempt", async ({ page }) => {
  await installSignedInSupabaseFixture(page, [], { failTokenSpend: true });
  await page.goto("/");
  await page.getByRole("button", { name: "URBAN LEGENDS", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const arcade = dialog.getByRole("button", { name: /ARCADE MODE/i });
  await arcade.click();
  await expect(dialog).toBeVisible();
  await expect(arcade).toBeEnabled();
  await expect(page.getByRole("heading", { name: "URBAN LEGENDS", level: 1 })).toHaveCount(0);
});

test("a failed Atlas Jackpot spend releases the entry button", async ({ page }) => {
  await installSignedInSupabaseFixture(page, [], { failTokenSpend: true });
  await page.goto("/");
  const jackpot = page.getByRole("button", { name: "Atlas Jackpot", exact: true });
  await jackpot.click();
  await expect(jackpot).toBeEnabled();
  await expect(page.getByRole("heading", { name: "ATLAS JACKPOT", level: 1 })).toHaveCount(0);
});

test("language selection updates the document language for assistive technology", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PT", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await page.getByRole("button", { name: "ES", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test("a saved Portuguese preference sets the document language on startup", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("atlas-arcade-settings", JSON.stringify({
      state: { lang: "pt", sound: false, theme: "dark" },
      version: 0,
    }));
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
});

test("out-of-coins dialog traps focus and Escape returns to the mode picker", async ({ page }) => {
  await installSignedInSupabaseFixture(page, [], { outOfTokens: true });
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "FLAG FRENZY", exact: true });
  await launcher.click();
  const parent = page.getByRole("dialog");
  const arcade = parent.getByRole("button", { name: /ARCADE MODE/i });
  await arcade.click();

  const dialogs = page.getByRole("dialog");
  await expect(dialogs).toHaveCount(2);
  const child = dialogs.last();
  await expect(child).toHaveAttribute("aria-modal", "true");
  await expect(page.getByText("OUT OF COINS", { exact: true })).toBeVisible();
  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press("Tab");
    expect(await child.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialogs).toHaveCount(1);
  expect(await parent.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(parent).toHaveCount(0);
  await expect(launcher).toBeFocused();
});
test("Tectonic Snap supports bounded keyboard movement and Enter placement", async ({ page }) => {
  await installWorldTopologyFixture(page);
  await page.goto("/");
  await page.getByRole("button", { name: "TECTONIC SNAP", exact: true }).click();
  await page.getByRole("button", { name: /DAILY CHALLENGE/i }).click();
  await expect(page.getByRole("heading", { name: "TECTONIC SNAP", level: 1 })).toBeVisible();

  const pieces = page.locator('button[aria-describedby="tectonic-keyboard-help"]');
  await expect(pieces).toHaveCount(4);
  const piece = pieces.first();
  const map = page.getByRole("img", { name: "Continent map" });
  const missingShapes = map.locator('path[stroke-dasharray="3 3"]');
  await expect(missingShapes).toHaveCount(4);

  await piece.focus();
  await page.keyboard.press("Enter");
  await expect(piece).toHaveAttribute("aria-pressed", "true");
  for (let index = 0; index < 8; index += 1) await page.keyboard.press("Shift+ArrowRight");
  for (let index = 0; index < 8; index += 1) await page.keyboard.press("Shift+ArrowDown");
  await expect(page.locator('p.sr-only[aria-live="polite"]')).toHaveText("Map position 800, 520");

  await page.keyboard.press("Escape");
  await expect(piece).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(missingShapes).toHaveCount(3);
  await expect(page.getByText(/1\/4 PLACED/i)).toBeVisible();
});

test("Skyline coordinate form places a pin and reaches the normal confirmation result", async ({ page }) => {
  await installWorldTopologyFixture(page);
  await page.route("https://upload.wikimedia.org/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    headers: { "access-control-allow-origin": "*" },
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#222"/></svg>',
  }));
  await page.goto("/");
  await page.getByRole("button", { name: "SKYLINE SILHOUETTE", exact: true }).click();
  await page.getByRole("button", { name: /DAILY CHALLENGE/i }).click();
  await expect(page.getByRole("heading", { name: "SKYLINE SILHOUETTE", level: 1 })).toBeVisible();

  await page.getByText("ENTER COORDINATES", { exact: true }).click();
  await page.getByRole("spinbutton").nth(0).fill("0");
  await page.getByRole("spinbutton").nth(1).fill("0");
  await page.getByRole("button", { name: "PLACE PIN", exact: true }).click();
  const confirm = page.getByRole("button", { name: /CONFIRM GUESS/i });
  await expect(confirm).toBeVisible();
  await confirm.click();
  await expect(page.getByText(/km from/i).first()).toBeVisible();
});

test("external game images neither send nor store provider cookies", async ({ page, context }) => {
  await context.addCookies([{
    name: "atlas-image-existing",
    value: "test-fixture",
    domain: "upload.wikimedia.org",
    path: "/",
    secure: true,
    sameSite: "None",
  }]);
  const imageRequestsWithCookies: boolean[] = [];
  await page.route("https://upload.wikimedia.org/**", async (route) => {
    const headers = await route.request().allHeaders();
    imageRequestsWithCookies.push(Boolean(headers.cookie));
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      headers: {
        "access-control-allow-origin": "*",
        "set-cookie": "atlas-image-set=test-fixture; Secure; SameSite=None; Path=/",
      },
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#222"/></svg>',
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "URBAN LEGENDS", exact: true }).click();
  await page.getByRole("button", { name: /DAILY CHALLENGE/i }).click();
  await page.getByRole("button", { name: /TOURIST/i }).click();
  const image = page.getByRole("img", { name: "Mystery city" });
  await expect.poll(() => image.evaluate((element) => {
    const loaded = element as HTMLImageElement;
    return loaded.complete && loaded.naturalWidth > 0;
  })).toBe(true);
  expect(imageRequestsWithCookies.length).toBeGreaterThan(0);
  expect(imageRequestsWithCookies.every((sent) => !sent)).toBe(true);
  expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("atlas-image-set");
});
