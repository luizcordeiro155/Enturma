import { describe, expect, it } from "vitest";
import { focusOf, nextSnap, overlayInset } from "./ride-map-focus";

const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
});

describe("the part of the map a person can see", () => {
  const phone = rect(0, 0, 375, 738);

  it("ends where the request sheet begins on a phone", () => {
    const sheet = rect(8, 309, 359, 421);
    const topBar = rect(10, 10, 355, 54);
    expect(overlayInset(phone, [topBar, sheet])).toEqual({
      top: 64,
      right: 0,
      bottom: 429,
      left: 0,
    });
  });

  it("ends at the side panel on a computer", () => {
    const desktop = rect(240, 0, 1200, 900);
    const panel = rect(959, 16, 465, 868);
    expect(overlayInset(desktop, [panel])).toEqual({
      top: 0,
      right: 481,
      bottom: 0,
      left: 0,
    });
  });

  it("ignores small floating buttons and things outside the map", () => {
    expect(
      overlayInset(phone, [rect(320, 68, 44, 90), rect(0, 800, 375, 74)]),
    ).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("always keeps a strip of map in view under a full-height sheet", () => {
    const inset = overlayInset(phone, [
      rect(0, 64, 375, 674),
      rect(0, 0, 375, 64),
    ]);
    expect(phone.height - inset.top - inset.bottom).toBeGreaterThanOrEqual(96);
    expect(inset.top).toBe(64);
  });
});

describe("where the camera points", () => {
  it("is the middle of the visible part, not of the whole map", () => {
    expect(
      focusOf(
        { width: 375, height: 738 },
        { top: 64, right: 0, bottom: 429, left: 0 },
      ),
    ).toEqual({ x: 187.5, y: 186.5 });
  });

  it("is the middle of the map when nothing covers it", () => {
    expect(focusOf({ width: 900, height: 620 })).toEqual({ x: 450, y: 310 });
  });
});

describe("the sheet's resting positions", () => {
  it("grows one step when pulled up and shrinks one step when pulled down", () => {
    expect(nextSnap("peek", "up")).toBe("half");
    expect(nextSnap("half", "up")).toBe("full");
    expect(nextSnap("full", "up")).toBe("full");
    expect(nextSnap("full", "down")).toBe("half");
    expect(nextSnap("half", "down")).toBe("peek");
    expect(nextSnap("peek", "down")).toBe("peek");
  });

  it("opens on a tap, and gives the map back when already fully open", () => {
    expect(nextSnap("peek", "tap")).toBe("half");
    expect(nextSnap("half", "tap")).toBe("full");
    expect(nextSnap("full", "tap")).toBe("half");
  });
});
