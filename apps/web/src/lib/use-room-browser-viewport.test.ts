import { describe, expect, it } from "vitest";
import { isRoomKeyboardVisible, mobileWebKeyboardInset, mobileWebComposerCorrection, mobileWebMessageHeight } from "./use-room-browser-viewport";

describe("mobile study-room keyboard detection", () => {
  it("does not confuse browser chrome or small viewport changes with the keyboard", () => {
    expect(isRoomKeyboardVisible(760, 730, true)).toBe(false);
    expect(isRoomKeyboardVisible(760, 650, true)).toBe(false);
  });

  it("detects a software keyboard after the composer receives focus", () => {
    expect(isRoomKeyboardVisible(760, 430, true)).toBe(true);
    expect(isRoomKeyboardVisible(760, 430, false)).toBe(false);
  });

  it("avoids negative heights and rejects invalid geometry", () => {
    expect(isRoomKeyboardVisible(0, 400, true)).toBe(false);
    expect(isRoomKeyboardVisible(760, 0, true)).toBe(false);
    expect(isRoomKeyboardVisible(760, 790, true)).toBe(false);
  });
});

describe("shared mobile browser keyboard geometry", () => {
  it("anchors directly above the IME when Chrome keeps the layout viewport", () => {
    expect(mobileWebKeyboardInset(760, 400, 0)).toBe(360);
    expect(mobileWebComposerCorrection(400, 320)).toBe(75);
  });
  it("does not double-count keyboard height when Chrome resizes the layout viewport", () => {
    expect(mobileWebKeyboardInset(400, 400, 0)).toBe(0);
  });
  it("handles viewport top offsets and provides scrollable message space", () => {
    expect(mobileWebKeyboardInset(760, 410, 30)).toBe(320);
    expect(mobileWebMessageHeight(30, 440, 160, 68, 18)).toBe(184);
  });
});
