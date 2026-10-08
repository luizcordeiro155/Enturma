import { describe, expect, it } from "vitest";
import { faceAt, performanceAt, PERFORMANCES } from "./presenter-performance";
import { CAPTION_PHRASES } from "./animated-captions";
import words from "./narration-words.json";
import storyboard from "../intro-storyboard.json";
import { armAt } from "./presenter-rig";

describe("character animation and a single caption track", () => {
  it("keeps wrists attached to forearms and limits bends through every frame", () => {
    PERFORMANCES.forEach((_, scene) => {
      const duration =
        storyboard.sceneFrames[scene + 1] - storyboard.sceneFrames[scene];
      for (let frame = 0; frame < duration; frame++) {
        const p = performanceAt(scene, frame);
        const arms = [
          armAt(0, p.leftShoulder, p.leftElbow, p.leftWrist),
          armAt(1, p.rightShoulder, p.rightElbow, p.rightWrist),
        ];
        arms.forEach((arm) => {
          expect(
            Math.abs(arm.handAngle - arm.a - arm.b - 180),
          ).toBeLessThanOrEqual(12.0001);
          expect(Math.abs(arm.b)).toBeLessThanOrEqual(148);
          expect(Math.hypot(arm.wx - arm.ex, arm.wy - arm.ey)).toBeCloseTo(
            Math.hypot(arm.side ? 15 : 12, 98),
            8,
          );
          expect(arm.wx).toBeGreaterThan(8);
          expect(arm.wx).toBeLessThan(485);
        });
      }
    });
  });
  it("articulates every consecutive frame at 24 fps in all 16 scenes", () => {
    const acting = new Set<string>();
    PERFORMANCES.forEach((performance, scene) => {
      const frames = Array.from({ length: 24 }, (_, frame) =>
        performanceAt(scene, frame + 12),
      );
      expect(
        new Set(
          frames.map((p) =>
            JSON.stringify([
              p.leftShoulder,
              p.leftElbow,
              p.rightShoulder,
              p.rightElbow,
            ]),
          ),
        ).size,
      ).toBe(24);
      expect(frames.every((p) => Object.values(p).every(Number.isFinite))).toBe(
        true,
      );
      acting.add(JSON.stringify(performance.poses));
    });
    expect(acting.size).toBe(16);
  });

  it("keeps accessibility stills fixed even as playback advances", () => {
    PERFORMANCES.forEach((_, scene) => {
      expect(performanceAt(scene, 2, true)).toEqual(
        performanceAt(scene, 100, true),
      );
      expect(faceAt(scene, 2, true)).toEqual(faceAt(scene, 100, true));
    });
  });

  it("does not loop a sideways glance and closes the mouth in pauses", () => {
    PERFORMANCES.forEach((_, scene) => {
      const duration =
        storyboard.sceneFrames[scene + 1] - storyboard.sceneFrames[scene];
      for (let frame = 0; frame < duration; frame++)
        expect([0, 4, 7]).toContain(faceAt(scene, frame).eyes);
    });
    expect(faceAt(0, 0).mouth).toBe(0);
    expect(faceAt(15, 2159 - storyboard.sceneFrames[15]).mouth).toBe(0);
  });

  it("shows every spoken word once in short, ordered caption groups", () => {
    expect(CAPTION_PHRASES.flatMap((group) => group.words)).toEqual(words);
    CAPTION_PHRASES.forEach((group, i) => {
      expect(group.words.length).toBeLessThanOrEqual(4);
      expect(group.end).toBeGreaterThan(group.start);
      if (i > 0)
        expect(group.start).toBeGreaterThanOrEqual(CAPTION_PHRASES[i - 1].end);
    });
    expect(storyboard.cues.map((c) => c.text).join(" ")).not.toMatch(
      /em breve|frequência|presenças|pomodoro|vem mais por aí/i,
    );
  });
});
