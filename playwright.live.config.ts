import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/live-smoke.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: "list",
  outputDir: "test-results/live",
  use: {
    baseURL: process.env.PLAYWRIGHT_LIVE_URL ?? "https://atlasarcade.app",
    browserName: "chromium",
    viewport: { width: 1440, height: 900 },
    actionTimeout: 8_000,
    navigationTimeout: 25_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
    reducedMotion: "reduce",
  },
});