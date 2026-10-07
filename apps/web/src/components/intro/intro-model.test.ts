import { describe, it, expect } from "vitest";
import { introQuality, introDimensions, INTRO_FEATURES } from "./intro-model";
describe("intro adaptation", () => {
  it("prioritizes accessibility over hardware capability", () =>
    expect(introQuality(true, 16, 16, 1920)).toBe("low"));
  it("reduces work for mobile and low-memory devices", () => {
    expect(introQuality(false, 2, 8, 1920)).toBe("low");
    expect(introQuality(false, 8, 8, 390)).toBe("optimized");
    expect(introQuality(false, 8, 8, 1920)).toBe("high");
  });
  it("uses portrait, landscape, desktop and ultrawide compositions", () => {
    expect(
      [390, 680, 1000, 1500].map((width) => introDimensions(width).layout),
    ).toEqual(["portrait", "landscape", "desktop", "ultrawide"]);
  });
  it("keeps product features navigable and unique", () => {
    expect(new Set(INTRO_FEATURES.map((feature) => feature.id)).size).toBe(
      INTRO_FEATURES.length,
    );
    expect(
      INTRO_FEATURES.every((feature) => feature.href.startsWith("/")),
    ).toBe(true);
  });
});
