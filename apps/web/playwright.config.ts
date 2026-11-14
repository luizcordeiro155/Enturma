import { defineConfig, devices } from "@playwright/test";
// The isolated LiveKit fixture advertises loopback. Without this test-only
// switch, receive-only Chromium peers offer mDNS candidates that the fixture
// filters out, then attempt an unreachable public STUN address instead.
const isolatedRtcArgs =
  process.env.E2E_LIVEKIT === "true"
    ? ["--disable-features=WebRtcHideLocalIpsWithMdns"]
    : [];
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
    {
      name: "chromium-academic",
      testMatch: /academic-identity\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1376, height: 900 },
      },
    },
    {
      name: "chromium-ux",
      testMatch: /ux-refinement\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1376, height: 768 },
        launchOptions: {
          args: [
            "--use-fake-ui-for-media-stream",
            "--use-fake-device-for-media-stream",
            ...isolatedRtcArgs,
          ],
        },
      },
    },
    {
      name: "chromium-social",
      testMatch:
        /(?:forum|friends|enturma-social|social-core-screens|social-studio-release|social-gallery-mobile|social-opening|social-mobile-interactions|social-reference-matrix)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
        launchOptions: {
          args: [
            "--use-fake-ui-for-media-stream",
            "--use-fake-device-for-media-stream",
            ...isolatedRtcArgs,
          ],
        },
      },
    },
    {
      name: "chromium-study",
      testMatch: /(?:catalog-learning|notebooks)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
      },
    },
    {
      name: "chromium-experience",
      testMatch:
        /(?:theme-invites-calls|chat-theme|visitor-community|mobile-corrections|release-experience|isolated-load|public-start|notebook-profile-ui|mobile-study-polish|connected-experience|profile-v3|responsive-shell|study-journey|mobile-safe-area)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
      },
    },
    {
      name: "chromium-platform",
      testMatch: /platform\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
      },
    },
    {
      name: "chromium-media",
      testMatch: /community-v3\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1487, height: 1058 },
      },
    },
  ],
  reporter: "list",
});
