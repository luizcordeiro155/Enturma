import { describe, it, expect } from "vitest";
import {
  introQuality,
  introDimensions,
  introNarrationAt,
  INTRO_FEATURES,
} from "./intro-model";
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
  it("keeps narration captions aligned when seeking across scene boundaries", () => {
    expect(introNarrationAt(149)).toBe("Sua próxima conexão começa aqui.");
    expect(introNarrationAt(150)).toBe("Enturma. Aprender nos aproxima.");
    expect(introNarrationAt(1020)).toBe(
      "Estude com materiais e inteligência artificial.",
    );
    expect(introNarrationAt(1800)).toBe("Enturma. Aprenda em boa companhia.");
    expect(introNarrationAt(-1)).toBe(introNarrationAt(0));
  });
});
