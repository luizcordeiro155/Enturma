import { describe, expect, it } from "vitest";
import {
  bestAspect,
  captionRange,
  cropAfterDrag,
  frameTimes,
  outputSize,
  trimSegment,
  timelinePosition,
} from "./social-editing";
import { defaultRecipe, exportDuration, sourceTime } from "./social";

describe("visual media editing", () => {
  it("offers portrait, square and landscape publication sizes", () => {
    expect(outputSize("9:16")).toEqual({ width: 720, height: 1280 });
    expect(outputSize("4:5")).toEqual({ width: 720, height: 900 });
    expect(outputSize("3:4")).toEqual({ width: 720, height: 960 });
    expect(outputSize("1:1")).toEqual({ width: 720, height: 720 });
    expect(outputSize("1.91:1")).toEqual({ width: 720, height: 376 });
  });
  it("turns a drag into the exact time in the visible timeline window", () => {
    expect(timelinePosition(150, { left: 50, width: 200 }, 20, 40)).toBe(30);
    expect(timelinePosition(-10, { left: 50, width: 200 }, 20, 40)).toBe(20);
    expect(timelinePosition(400, { left: 50, width: 200 }, 20, 40)).toBe(40);
  });
  it("limits thumbnails and never seeks past the end", () => {
    const frames = frameTimes(120, 12);
    expect(frames).toHaveLength(12);
    expect(frames[0]).toBe(0);
    expect(frames.at(-1)).toBeLessThan(120);
    expect(frameTimes(Infinity, 12)).toEqual([]);
    expect(frameTimes(0, 12)).toEqual([]);
  });
  it("trims long originals by dragging either edge without crossing handles", () => {
    const recipe = defaultRecipe(400);
    const next = trimSegment(recipe, 0, "end", 300, 400);
    // The selection never grows past the 3-minute limit.
    expect(exportDuration(next)).toBe(180);
    expect(
      trimSegment(recipe, 0, "start", 250, 400).segments[0].start,
    ).toBeCloseTo(179.9);
    const shifted = trimSegment(recipe, 0, "move", 120, 400);
    expect(shifted.segments[0]).toEqual({ start: 120, end: 300 });
    expect(sourceTime(shifted, 10)).toBe(130);
  });
  it("moves media using actual crop overflow and clamps its bounds", () => {
    const recipe = defaultRecipe(3);
    const next = cropAfterDrag(
      recipe,
      { width: 1920, height: 1080 },
      { width: 360, height: 640 },
      500,
      0,
    );
    expect(next.x).toBe(0);
    expect(next.y).toBe(0.5);
    expect(
      cropAfterDrag(
        { ...recipe, zoom: 2 },
        { width: 1080, height: 1920 },
        { width: 360, height: 640 },
        0,
        -900,
      ).y,
    ).toBe(1);
  });
  it("keeps text inside the edited duration after dragging its range", () => {
    expect(
      captionRange({ text: "Oi", start: 1, end: 3, y: 0.5 }, "move", 10, 8),
    ).toMatchObject({ start: 6, end: 8 });
    expect(
      captionRange({ text: "Oi", start: 1, end: 3, y: 0.5 }, "start", 5, 8)
        .start,
    ).toBeCloseTo(2.9);
  });
});

describe("automatic framing", () => {
  it("follows the photo or video itself, wherever it is shown", () => {
    expect(bestAspect(1080, 1920)).toBe("9:16"); // phone video
    expect(bestAspect(1080, 1440)).toBe("3:4");
    expect(bestAspect(1080, 1350)).toBe("4:5");
    expect(bestAspect(1200, 1180)).toBe("1:1");
    expect(bestAspect(1920, 1080)).toBe("1.91:1"); // landscape
    expect(bestAspect(4000, 3000)).toBe("1:1");
  });
  it("falls back to the feed default when the size is unknown", () => {
    expect(bestAspect(0, 0)).toBe("4:5");
    expect(bestAspect(Number.NaN, 100)).toBe("4:5");
  });
});
