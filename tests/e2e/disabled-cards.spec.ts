import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { measureContrast } from "./helpers/contrast";

// Render the real component outside Playwright's JSX serialization transform.
const fixtures = JSON.parse(execFileSync(process.execPath, [
  "--import", "tsx", "tests/fixtures/unavailable-cards.ts",
], { encoding: "utf8" })) as Array<{ slug: string; status: "locked" | "comingSoon"; markup: string }>;

for (const theme of ["dark", "light"] as const) {
  test(theme + " unavailable cards retain computed contrast for every game accent", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/");
    if (theme === "light") await page.getByRole("button", { name: "Switch to light mode" }).click();
    const ratios: number[] = [];
    for (const { slug, status, markup } of fixtures) {
      await page.evaluate((html) => {
        document.getElementById("unavailable-fixture")?.remove();
        const fixture = document.createElement("div");
        fixture.id = "unavailable-fixture";
        fixture.className = "fixed inset-0 z-50 flex items-center justify-center bg-arcade-bg";
        fixture.innerHTML = html;
        document.body.append(fixture);
      }, markup);
      const card = page.locator("#unavailable-fixture button");
      await expect(card).toBeDisabled();
      for (const hovered of [false, true]) {
        await page.mouse.move(0, 0);
        if (hovered) await card.hover({ force: true });
        await card.evaluate(async (element) => {
          await Promise.all(element.getAnimations({ subtree: true })
            .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => undefined)));
        });
        const targets = [card.locator("h3"), card.locator("p.font-mono"), card.locator('[id$="-status"]')];
        if (status === "locked") targets.push(card.locator('[id$="-locked"]'), card.locator("div.text-right p").nth(1));
        for (const target of targets) {
          const result = await measureContrast(target);
          ratios.push(result.ratio);
          expect(result.ratio, theme + "/" + slug + "/" + status + "/" + result.foreground).toBeGreaterThanOrEqual(4.5);
        }
        expect((await measureContrast(card.locator("svg").last())).ratio).toBeGreaterThanOrEqual(3);
      }
      if (status === "locked") await expect(card).toContainText("12 345");
      else await expect(card).not.toContainText("12 345");
    }
    console.info(JSON.stringify({ theme, unavailableTextSamples: ratios.length, minimum: Math.min(...ratios) }));
  });
}
