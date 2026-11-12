import { expect, it } from "vitest";
import { socialKeyboardGeometry } from "./social-viewport";
it("places a sheet immediately above a visual viewport keyboard", () => {
  expect(
    socialKeyboardGeometry({
      height: 844,
      visibleHeight: 500,
      top: 0,
      scale: 1,
      native: 0,
      overlay: 0,
    }),
  ).toEqual({ bottom: 344, height: 500, top: 0 });
});
it("handles Android overlays without subtracting the keyboard twice", () => {
  expect(
    socialKeyboardGeometry({
      height: 844,
      visibleHeight: 544,
      top: 0,
      scale: 1,
      native: 300,
      overlay: 0,
    }),
  ).toEqual({ bottom: 300, height: 544, top: 0 });
  expect(
    socialKeyboardGeometry({
      height: 544,
      visibleHeight: 544,
      top: 0,
      scale: 1,
      native: 0,
      overlay: 0,
    }),
  ).toEqual({ bottom: 0, height: 544, top: 0 });
});
it("does not mistake pinch zoom for an IME", () => {
  expect(
    socialKeyboardGeometry({
      height: 844,
      visibleHeight: 422,
      top: 0,
      scale: 2,
      native: 0,
      overlay: 0,
    }),
  ).toEqual({ bottom: 0, height: 844, top: 0 });
});
