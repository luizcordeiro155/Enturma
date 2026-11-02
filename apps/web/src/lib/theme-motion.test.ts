import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyEnturmaTheme } from "./theme-motion";

const callbacks: (() => void)[] = [];
const transitions: { skipTransition: ReturnType<typeof vi.fn> }[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  callbacks.length = 0;
  transitions.length = 0;
  document.documentElement.dataset.theme = "light";
  document.documentElement.dataset.palette = "default";
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: vi.fn((callback: () => void) => {
      callbacks.push(callback);
      const transition = {
        skipTransition: vi.fn(),
        ready: new Promise(() => {}),
        finished: new Promise(() => {}),
      };
      transitions.push(transition);
      return transition;
    }),
  });
});
afterEach(() => {
  applyEnturmaTheme("light", false);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("theme transition ownership", () => {
  it("switches the branded palette independently of the dark color scheme", () => {
    applyEnturmaTheme("enturma", false);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.palette).toBe("enturma");
    applyEnturmaTheme("dark", false);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.palette).toBe("default");
  });
  it.each([10, 20, 30, 50])(
    "keeps the latest of %i rapid choices despite late callbacks",
    (count) => {
      for (let i = 0; i < count; i++)
        applyEnturmaTheme(i % 2 ? "light" : "dark");
      callbacks.reverse().forEach((callback) => callback());
      vi.runAllTimers();
      expect(document.documentElement.dataset.theme).toBe("light");
      expect(
        document.documentElement.classList.contains("enturma-theme-transition"),
      ).toBe(false);
      expect(
        transitions.every(
          (transition) => transition.skipTransition.mock.calls.length > 0,
        ),
      ).toBe(true);
    },
  );
  it("releases a stuck snapshot and applies the requested palette", () => {
    applyEnturmaTheme("dark");
    vi.advanceTimersByTime(1500);
    expect(transitions[0].skipTransition).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(
      document.documentElement.classList.contains("enturma-theme-transition"),
    ).toBe(false);
  });
  it("survives unavailable native transitions", () => {
    vi.mocked(document.startViewTransition).mockImplementation(() => {
      throw new Error("renderer unavailable");
    });
    expect(() => applyEnturmaTheme("dark")).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(
      document.documentElement.classList.contains("enturma-theme-transition"),
    ).toBe(false);
  });
  it("changes immediately with reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    applyEnturmaTheme("dark");
    expect(document.startViewTransition).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
