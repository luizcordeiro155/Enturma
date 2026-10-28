import { describe, expect, it } from "vitest";
import { isRoomKeyboardVisible } from "./use-room-browser-viewport";

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
