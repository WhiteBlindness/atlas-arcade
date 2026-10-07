import { mkdir, writeFile } from "node:fs/promises";
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { measureContrast, measureFocusContrast } from "./helpers/contrast";

const GAME_TITLES = [
  "GEORADAR",
  "CAPITAL STRIKE",
  "FLAG FRENZY",
  "PEAKS & VALLEYS",
  "TECTONIC SNAP",
  "FRONTIER FACE-OFF",
  "ONE STRIKE",
  "URBAN LEGENDS",
  "SKYLINE SILHOUETTE",
  "BORDER BLITZ",
  "STAT ATTACK",
];

type VisualState = "rest" | "hover" | "focus" | "hover+focus" | "active";
type ContrastTarget = { name: string; locator: Locator; kind: "text" | "icon" };

async function setTheme(page: Page, theme: "dark" | "light") {
  const html = page.locator("html");
  const alreadyLight = await html.evaluate((element) => element.classList.contains("light"));
  if ((theme === "light") !== alreadyLight) {
    const label = theme === "light" ? "Switch to light mode" : "Switch to dark mode";
    await page.getByRole("button", { name: label }).click();
  }
  await expect(html).toHaveClass(new RegExp(theme));
  await settleTransitions(html);
}

async function settleTransitions(container: Locator) {
  await container.evaluate(async (element) => {
    const transitions = element.getAnimations({ subtree: true }).filter((animation) => {
      return animation.playState === "running"
        && animation.effect instanceof KeyframeEffect
        && animation.effect.getComputedTiming().iterations !== Infinity;
    });
    await Promise.all(transitions.map((animation) => animation.finished.catch(() => undefined)));
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}

async function setState(page: Page, target: Locator, state: VisualState) {
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await settleTransitions(target);

  if (state === "hover" || state === "hover+focus" || state === "active") {
    await target.hover();
  }
  if (state === "focus" || state === "hover+focus") {
    await page.keyboard.press("Tab");
    await target.focus();
    await expect(target).toBeFocused();
    expect(await target.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  }
  if (state === "active") await page.mouse.down();
  await settleTransitions(target);
}

function cardTargets(card: Locator): ContrastTarget[] {
  return [
    { name: "title", locator: card.locator("h3"), kind: "text" },
    { name: "description", locator: card.locator("p.font-mono"), kind: "text" },
    { name: "score", locator: card.locator("div.text-right p").nth(1), kind: "text" },
    { name: "CTA", locator: card.locator(":scope > div").last(), kind: "text" },
    { name: "icon", locator: card.locator("svg").first(), kind: "icon" },
  ];
}

function bossTargets(boss: Locator): ContrastTarget[] {
  const details = boss.locator(":scope > div").nth(1);
  const actions = boss.locator(":scope > div").last();
  return [
    { name: "boss title", locator: details.locator("h2"), kind: "text" },
    { name: "description", locator: details.locator("p.font-mono"), kind: "text" },
    { name: "reward", locator: details.locator("p.font-pixel").last(), kind: "text" },
    { name: "cost", locator: actions.locator("span").first(), kind: "text" },
    { name: "CTA", locator: actions.locator("span").last(), kind: "text" },
    { name: "icon", locator: boss.locator("svg").first(), kind: "icon" },
  ];
}

async function captureTargets(
  theme: "dark" | "light",
  title: string,
  state: VisualState,
  button: Locator,
  targets: ContrastTarget[],
  report: Array<Record<string, unknown>>,
  failures: string[],
) {
  for (const target of targets) {
    if (await target.locator.count() === 0 || !(await target.locator.isVisible())) continue;
    const measurement = await measureContrast(target.locator.first());
    const minimum = target.kind === "icon" ? 3 : 4.5;
    report.push({ theme, title, state, target: target.name, ...measurement, minimum });
    if (measurement.ratio < minimum) {
      failures.push(
        theme + " / " + title + " / " + state + " / " + target.name + ": "
        + measurement.foreground + " on " + measurement.background + " = "
        + measurement.ratio + ":1 (minimum " + minimum + ":1)",
      );
    }
  }

  if (state === "focus" || state === "hover+focus") {
    const focus = await measureFocusContrast(button);
    report.push({ theme, title, state, target: "focus indicator", ...focus, minimum: 3 });
    if (focus.outlineStyle === "none" || focus.outlineWidth < 1 || focus.ratio < 3) {
      failures.push(
        theme + " / " + title + " / " + state + " / focus indicator: "
        + focus.outlineColor + " at " + focus.outlineWidth + "px, " + focus.outlineStyle
        + ", " + focus.ratio + ":1 (minimum 3:1)",
      );
    }
  }
}

async function closeInteractionModal(page: Page) {
  await page.mouse.up();
  const cancel = page.getByRole("button", { name: /cancel/i }).first();
  if (await cancel.count()) await cancel.click();
}

test("all 11 game cards and the Atlas Jackpot banner have stable accessible names", async ({ page }) => {
  await page.goto("/");
  for (const title of GAME_TITLES) {
    await expect(page.getByRole("button", { name: title, exact: true })).toHaveCount(1);
  }
  await expect(page.getByRole("button", { name: "Atlas Jackpot", exact: true })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "ATLAS JACKPOT", exact: true })).toBeVisible();
});

for (const theme of ["dark", "light"] as const) {
  test(theme + " theme: card and boss text contrast across pointer and keyboard states", async ({ page }) => {
    await page.goto("/");
    await setTheme(page, theme);

    const report: Array<Record<string, unknown>> = [];
    const failures: string[] = [];

    for (const title of GAME_TITLES) {
      const card = page.getByRole("button", { name: title, exact: true });
      await card.scrollIntoViewIfNeeded();
      for (const state of ["rest", "hover", "focus", "hover+focus", "active"] as const) {
        await setState(page, card, state);
        await captureTargets(theme, title, state, card, cardTargets(card), report, failures);
        if (state === "active") await closeInteractionModal(page);
      }
    }

    const boss = page.getByRole("button", { name: "Atlas Jackpot", exact: true });
    await boss.scrollIntoViewIfNeeded();
    for (const state of ["rest", "hover", "focus", "hover+focus", "active"] as const) {
      await setState(page, boss, state);
      await captureTargets(theme, "ATLAS JACKPOT", state, boss, bossTargets(boss), report, failures);
      if (state === "active") await closeInteractionModal(page);
    }

    const disabledLabels = await page.locator("main button:disabled").evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "unnamed"),
    );
    await mkdir("test-results", { recursive: true });
    await writeFile(
      "test-results/contrast-" + theme + ".json",
      JSON.stringify({ theme, samples: report, disabledLabels }, null, 2),
      "utf8",
    );

    console.info(JSON.stringify({
      theme,
      checkedElements: report.length,
      failures: failures.length,
      minimumRatios: report
        .filter((item) => typeof item.ratio === "number")
        .reduce((minimum, item) => Math.min(minimum, item.ratio as number), Infinity),
      disabledLabels,
    }));
    expect(failures, failures.join("\n")).toEqual([]);
  });
}

test("home, service documents, and dialogs have no axe WCAG 2.2 A/AA violations", async ({ page }) => {
  test.setTimeout(120_000);
  await page.route("**/api/leaderboard**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ leaderboard: [] }),
  }));

  const audit = async (label: string) => {
    await settleTransitions(page.locator("body"));
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const violations = result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      nodes: violation.nodes.map((node) => ({ target: node.target, html: node.html, checks: node.any.map((check) => check.data), summary: node.failureSummary })),
    }));
    expect.soft(violations, label + " axe violations: " + JSON.stringify(violations)).toEqual([]);
  };

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (const theme of ["dark", "light"] as const) {
    await setTheme(page, theme);
    await audit("home " + theme);
  }

  await page.getByRole("button", { name: "INSERT COIN" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await audit("authentication dialog");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "CAPITAL STRIKE", exact: true }).click();
  const modeDialog = page.getByRole("dialog");
  await modeDialog.getByRole("button", { name: "HOW TO PLAY", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(2);
  await audit("nested tutorial dialog");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Leaderboard" }).click();
  await expect(page.getByRole("heading", { name: "LEADERBOARD" })).toBeVisible();
  await audit("leaderboard dialog");
  await page.keyboard.press("Escape");

  for (const path of ["/privacy", "/terms", "/cookies", "/credits"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await audit(path);
  }
});
test("auth dialog exposes its title and sends initial focus inside the dialog", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "INSERT COIN" });
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCount(1);
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  const heading = dialog.locator("h2");
  await expect(heading).toBeVisible();
  await expect(dialog).toHaveAccessibleName((await heading.textContent())?.trim() ?? "");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
});

test("auth dialog keeps Tab and Shift+Tab inside its controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "INSERT COIN" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
});

test("Escape closes the auth dialog and restores focus to its launcher", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "INSERT COIN" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("auth loading text retains contrast while hovered in both themes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const corsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "apikey, authorization, content-type, x-client-info",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  };
  const releases: Array<() => void> = [];
  await page.route((url) => url.hostname === "127.0.0.1"
    && url.port === "54321"
    && url.pathname === "/auth/v1/token", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    await new Promise<void>((resolve) => releases.push(resolve));
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({ message: "Invalid login credentials", code: "invalid_credentials" }),
    });
  });

  await page.goto("/");
  for (const theme of ["dark", "light"] as const) {
    await setTheme(page, theme);
    await page.getByRole("button", { name: "INSERT COIN" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.locator("#auth-email").fill("player@example.test");
    await page.locator("#auth-password").fill("Valid-password-9");
    const form = dialog.locator("form");
    const tokenRequest = page.waitForRequest((request) => request.method() === "POST"
      && new URL(request.url()).pathname === "/auth/v1/token");
    const submit = form.locator("button[type=submit]");
    await submit.click();
    await tokenRequest;
    await expect(form).toHaveAttribute("aria-busy", "true");
    const loading = submit.getByRole("status");
    await expect(loading).toBeVisible();
    await submit.hover();
    await submit.evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)));
    });
    const measurement = await measureContrast(loading);
    console.info("Auth pending contrast " + JSON.stringify({ theme, ...measurement }));
    expect(measurement.ratio, theme + " auth loading label contrast").toBeGreaterThanOrEqual(4.5);

    const release = releases.shift();
    expect(release).toBeDefined();
    release?.();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(form).not.toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});

test("header controls have names, keyboard focus, visible indicators, and usable targets", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.getByRole("banner");
  const language = header.getByRole("group", { name: "Language" });
  const controls = [
    language.getByRole("button", { name: "EN", exact: true }),
    language.getByRole("button", { name: "PT", exact: true }),
    language.getByRole("button", { name: "ES", exact: true }),
    header.getByRole("button", { name: "Leaderboard" }),
    header.getByRole("button", { name: "Switch to light mode" }),
    header.getByRole("button", { name: "Mute sound" }),
    header.getByRole("button", { name: "INSERT COIN" }),
  ];
  const focusSamples: Array<{ label: string; outlineColor: string; ratio: number }> = [];

  for (const control of controls) {
    await expect(control).toBeVisible();
    await page.keyboard.press("Tab");
    await control.focus();
    await expect(control).toBeFocused();
    expect(await control.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
    const label = (await control.getAttribute("aria-label")) ?? (await control.innerText()).trim();
    const focus = await measureFocusContrast(control);
    focusSamples.push({ label, outlineColor: focus.outlineColor, ratio: focus.ratio });
    expect(focus.outlineStyle).not.toBe("none");
    expect(focus.outlineWidth).toBeGreaterThanOrEqual(1);
    expect(focus.ratio, "Focus indicator contrast for " + label + ": " + focus.outlineColor).toBeGreaterThanOrEqual(3);
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }
  console.info("Header focus contrast " + JSON.stringify(focusSamples));
});

test("nested tutorial dialog keeps focus and Escape returns to each parent", async ({ page }) => {
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "CAPITAL STRIKE", exact: true });
  await launcher.click();
  const parent = page.getByRole("dialog");
  await expect(parent).toBeVisible();
  const tutorialTrigger = parent.getByRole("button", { name: "HOW TO PLAY", exact: true });
  await tutorialTrigger.click();

  const dialogs = page.getByRole("dialog");
  await expect(dialogs).toHaveCount(2);
  const child = dialogs.last();
  await expect(child).toHaveAttribute("aria-modal", "true");
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    expect(await child.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialogs).toHaveCount(1);
  await expect(tutorialTrigger).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(parent).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("authentication fields and submit controls remain reachable on a short mobile screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/");
  await page.getByRole("button", { name: "INSERT COIN" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const scrollState = await dialog.evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
  }));
  expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
  expect(["auto", "scroll"]).toContain(scrollState.overflowY);

  const signInFields = [dialog.getByLabel("EMAIL"), dialog.getByLabel("PASSWORD")];
  for (const field of signInFields) {
    await field.scrollIntoViewIfNeeded();
    await expect(field).toBeVisible();
    await expect(field).toBeInViewport();
  }
  const signInSubmit = dialog.getByRole("button", { name: "SIGN IN", exact: true }).last();
  await signInSubmit.scrollIntoViewIfNeeded();
  await expect(signInSubmit).toBeInViewport();

  await dialog.getByRole("button", { name: "SIGN UP", exact: true }).click();
  const username = dialog.getByLabel("USERNAME");
  const email = dialog.getByLabel("EMAIL");
  const password = dialog.getByLabel("PASSWORD");
  await username.fill("Arcade player");
  await email.fill("arcade-player@example.test");
  await password.fill("StrongPass123");
  for (const field of [username, email, password]) {
    await field.scrollIntoViewIfNeeded();
    await expect(field).toBeVisible();
    await expect(field).toBeInViewport();
  }
  const signUpSubmit = dialog.getByRole("button", { name: "CREATE", exact: true });
  await signUpSubmit.scrollIntoViewIfNeeded();
  await expect(signUpSubmit).toBeEnabled();
  await expect(signUpSubmit).toBeInViewport();
});

test("release screenshots capture desktop themes, Urban Legends hover, and mobile", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "GEORADAR", exact: true })).toBeVisible();
  await setTheme(page, "dark");
  await page.screenshot({ path: testInfo.outputPath("home-dark-1440.png"), fullPage: true });
  await setTheme(page, "light");
  await page.screenshot({ path: testInfo.outputPath("home-light-1440.png"), fullPage: true });
  await setTheme(page, "dark");
  const urbanCard = page.getByRole("button", { name: "URBAN LEGENDS", exact: true });
  await urbanCard.scrollIntoViewIfNeeded();
  await urbanCard.hover();
  await settleTransitions(urbanCard);
  await page.screenshot({ path: testInfo.outputPath("urban-legends-hover-1440.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("home-dark-mobile-390.png"), fullPage: true });
});


test("Google sign-in uses the bundled brand font and measured button layout", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/");
  await page.getByRole("button", { name: "INSERT COIN" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await settleTransitions(dialog);
  const google = dialog.getByRole("button", { name: /google/i });
  const typography = await google.evaluate(async (button) => {
    const font = '500 14px "Google Sans"';
    await document.fonts.load(font, button.textContent ?? "");
    const style = getComputedStyle(button);
    return {
      loaded: document.fonts.check(font, button.textContent ?? ""),
      family: style.fontFamily,
      size: style.fontSize,
      weight: style.fontWeight,
      lineHeight: style.lineHeight,
      gap: style.gap,
      height: button.getBoundingClientRect().height,
    };
  });
  expect(typography.loaded).toBe(true);
  expect(typography.family).toContain("Google Sans");
  expect(typography.size).toBe("14px");
  expect(typography.weight).toBe("500");
  expect(typography.lineHeight).toBe("20px");
  expect(typography.gap).toBe("10px");
  expect(typography.height).toBeGreaterThanOrEqual(44);
});

test.describe("reduced motion gameplay", () => {
  test.use({ reducedMotion: "reduce" });

  test("stops decorative motion but preserves the question countdown", async ({ page }) => {
    await page.goto("/");
    const decorative = await page.evaluate(() => ({
      blink: getComputedStyle(document.querySelector(".animate-blink") as Element).animationName,
      scanline: getComputedStyle(document.body, "::before").animationName,
      motionVariants: (() => {
        const probe = document.createElement("div");
        probe.className = "animate-[slideFromRight_0.38s_ease-out] animate-[fadeUp_0.22s_ease-out]";
        document.body.append(probe);
        const styles = getComputedStyle(probe);
        const result = { name: styles.animationName, duration: styles.animationDuration };
        probe.remove();
        return result;
      })(),
    }));
    expect(decorative.blink).toBe("none");
    expect(decorative.scanline).toBe("none");
    expect(decorative.motionVariants.name).toBe("none");

    await page.getByRole("button", { name: "CAPITAL STRIKE", exact: true }).click();
    const modeDialog = page.getByRole("dialog");
    await expect(modeDialog).toBeVisible();
    await settleTransitions(modeDialog);
    expect(await modeDialog.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");

    await modeDialog.getByRole("button", { name: /DAILY CHALLENGE/i }).click();
    const timer = page.locator('[style*="shrinkBar"]').first();
    await expect(timer).toBeVisible();
    const countdown = await timer.evaluate((element) => {
      const style = getComputedStyle(element);
      return { name: style.animationName, duration: style.animationDuration };
    });
    expect(countdown.name).toBe("shrinkBar");
    expect(countdown.duration).toBe("7s");
  });
});
