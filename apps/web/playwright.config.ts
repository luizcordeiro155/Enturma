import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.E2E_WEB_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 20000,
    navigationTimeout: 30000,
    serviceWorkers: "block",
    launchOptions: {
      args: [
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-background-networking",
        "--disable-renderer-backgrounding",
        "--disable-features=BackForwardCache",
      ],
    },
  },
  projects: [
    { name: "chromium-social", testMatch: /(?:forum|friends)\.spec\.ts/, use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
      } },
    { name: "chromium-study", testMatch: /(?:catalog-learning|notebooks)\.spec\.ts/, use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
      } },
    { name: "chromium-experience", testMatch: /(?:profile-v3|responsive-shell|study-journey)\.spec\.ts/, use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
      } },
    { name: "chromium-platform", testMatch: /platform\.spec\.ts/, use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
      } },
    { name: "chromium-media", testMatch: /community-v3\.spec\.ts/, use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
      } },
  ],
  reporter: "list",
});
