import { describe, it, expect } from "vitest";
import {
  introQuality,
  introDimensions,
  introNarrationAt,
  INTRO_FEATURES,
  INTRO_CUES,
  INTRO_FRAMES,
  INTRO_SCENE_FRAMES,
  INTRO_DURATION_LABEL,
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
    INTRO_CUES.slice(1).forEach((cue, index) => {
      expect(introNarrationAt(cue.fromFrame - 1)).toBe(INTRO_CUES[index].text);
      expect(introNarrationAt(cue.fromFrame)).toBe(cue.text);
    });
    expect(introNarrationAt(INTRO_FRAMES)).toBe(
      "Se enturme com o Enturma! Fique por dentro da sua faculdade conosco.",
    );
    expect(introNarrationAt(-1)).toBe(introNarrationAt(0));
  });
  it("keeps complete phrases within their visual cues without padded pauses", () => {
    INTRO_CUES.forEach((cue, index) => {
      const next = INTRO_CUES[index + 1]?.fromFrame ?? INTRO_FRAMES;
      expect(cue.voiceStartFrame + cue.voiceDuration * 60).toBeLessThan(next);
      const nextVoice = INTRO_CUES[index + 1]?.voiceStartFrame;
      if (nextVoice !== undefined) {
        const breath =
          nextVoice / 60 - cue.voiceStartFrame / 60 - cue.voiceDuration;
        expect(breath).toBeGreaterThanOrEqual(0);
        expect(breath).toBeLessThan(0.4);
      }
      expect(cue.fromFrame).toBeGreaterThanOrEqual(
        INTRO_SCENE_FRAMES[cue.scene],
      );
      expect(cue.fromFrame).toBeLessThan(INTRO_SCENE_FRAMES[cue.scene + 1]);
    });
    expect(introTime(INTRO_FRAMES)).toBe("0:50");
    expect(INTRO_DURATION_LABEL).toBe("50 s");
  });
});
