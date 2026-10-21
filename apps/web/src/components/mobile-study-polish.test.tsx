import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  fireEvent,
  cleanup,
  screen,
  act,
} from "@testing-library/react";
import { ThemePicker } from "./theme-picker";
import { StarRating } from "./star-rating";
import { roomInviteCode } from "@/lib/room-invite";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  Element.prototype.animate = vi.fn(
    () => ({ cancel: vi.fn() }) as unknown as Animation,
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("theme gestures", () => {
  it("short tap toggles immediately; holding opens choices without toggling", () => {
    const change = vi.fn();
    render(<ThemePicker value="DARK" onChange={change} />);
    const toggle = screen.getByRole("button", { name: /Alternar tema/ });
    fireEvent.click(toggle);
    expect(change).toHaveBeenLastCalledWith("LIGHT");
    change.mockClear();
    fireEvent.pointerDown(toggle, {
      button: 0,
      pointerType: "touch",
      clientX: 10,
      clientY: 10,
    });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(toggle);
    fireEvent.click(toggle);
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole("menu", { name: "Escolher tema" })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Sistema" }));
    expect(change).toHaveBeenCalledWith("SYSTEM");
  });
  it("keyboard opens selector and Escape returns focus", () => {
    render(<ThemePicker value="SYSTEM" onChange={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: /Alternar tema/ });
    fireEvent.keyDown(toggle, { key: "ArrowDown" });
    act(() => vi.runOnlyPendingTimers());
    expect(screen.getByRole("menuitemradio", { name: "Sistema" })).toBe(
      document.activeElement,
    );
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });
});
it("stars can be selected independently or with the keyboard", () => {
  const change = vi.fn();
  render(<StarRating value={0} onChange={change} />);
  fireEvent.click(screen.getByRole("radio", { name: "3 estrelas" }));
  expect(change).toHaveBeenCalledWith(3);
  fireEvent.keyDown(screen.getByRole("radio", { name: "3 estrelas" }), {
    key: "End",
  });
  expect(change).toHaveBeenLastCalledWith(5);
});
it("room scans only accept installation invitations or plain room codes", () => {
  expect(roomInviteCode("mdut2sgt", "https://enturma.test")).toBe("MDUT2SGT");
  expect(
    roomInviteCode(
      "https://enturma.test/join/MDUT2SGT",
      "https://enturma.test",
    ),
  ).toBe("MDUT2SGT");
  for (const invalid of [
    "https://evil.test/join/MDUT2SGT",
    "javascript:alert(1)",
    "https://enturma.test.evil.test/join/MDUT2SGT",
    "https://user:pass@enturma.test/join/MDUT2SGT",
    "https://enturma.test/settings",
    "00000000",
  ])
    expect(roomInviteCode(invalid, "https://enturma.test")).toBeNull();
});
