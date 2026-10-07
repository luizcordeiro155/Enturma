import { describe, it, expect } from "vitest";
import {
  introQuality,
  introDimensions,
  introNarrationAt,
  INTRO_FEATURES,
  INTRO_CUES,
  INTRO_FRAMES,
  INTRO_SCENE_FRAMES,
  introTime,
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
    expect(introNarrationAt(269)).toBe(
      "Ei! Que tal viver a faculdade mais conectado?",
    );
    expect(introNarrationAt(270)).toBe(
      "Esse é o Enturma! Seu ponto de encontro na faculdade.",
    );
    expect(introNarrationAt(1620)).toBe(
      "Entre nas salas! Reúna seus materiais e estude com inteligência artificial.",
    );
    expect(introNarrationAt(INTRO_FRAMES)).toBe(
      "Se enturme com o Enturma! Fique por dentro da sua faculdade conosco.",
    );
    expect(introNarrationAt(-1)).toBe(introNarrationAt(0));
  });
  it("lets every voice take finish before its next visual cue", () => {
    INTRO_CUES.forEach((cue, index) => {
      const next = INTRO_CUES[index + 1]?.fromFrame ?? INTRO_FRAMES;
      expect(cue.voiceStartFrame + cue.voiceDuration * 60).toBeLessThan(next);
      expect(cue.fromFrame).toBeGreaterThanOrEqual(
        INTRO_SCENE_FRAMES[cue.scene],
      );
      expect(cue.fromFrame).toBeLessThan(INTRO_SCENE_FRAMES[cue.scene + 1]);
    });
    expect(introTime(INTRO_FRAMES)).toBe("1:06");
  });
});
