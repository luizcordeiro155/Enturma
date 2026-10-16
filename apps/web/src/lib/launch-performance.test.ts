import { describe, expect, it } from "vitest";
import {
  APP_LAUNCH_MIN_MS,
  REDUCED_LAUNCH_MIN_MS,
  RIDE_LAUNCH_MIN_MS,
  launchRemainingMs,
  useLightweightLaunch,
} from "./launch-performance";

describe("consistent Enturma launch", () => {
  it("keeps the opening on screen when the API responds instantly", () => {
    expect(launchRemainingMs(100, 110, "app", false)).toBe(APP_LAUNCH_MIN_MS - 10);
    expect(launchRemainingMs(100, 150, "app", false)).toBeGreaterThan(2000);
  });
  it("does not add unnecessary wait after a slow initialization", () => {
    expect(launchRemainingMs(100, 3000, "app", false)).toBe(0);
  });
  it("preserves the ride duration and reduced-motion preference", () => {
    expect(launchRemainingMs(0, 0, "ride", false)).toBe(RIDE_LAUNCH_MIN_MS);
    expect(launchRemainingMs(0, 0, "app", true)).toBe(REDUCED_LAUNCH_MIN_MS);
    expect(launchRemainingMs(0, 250, "app", true)).toBe(0);
  });
  it("simplifies effects on low-resource PCs without disabling animation", () => {
    expect(useLightweightLaunch(4, 8)).toBe(true);
    expect(useLightweightLaunch(8, 4)).toBe(true);
    expect(useLightweightLaunch(8, 8)).toBe(false);
    expect(useLightweightLaunch(undefined, undefined)).toBe(false);
  });
});
