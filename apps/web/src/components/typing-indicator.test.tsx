import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TypingIndicator } from "./typing-indicator";

beforeEach(() => {
  // Skip Web Animations in JSDOM; accessibility and text still render.
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("shared chat typing indicator", () => {
  it("does not reserve space while nobody is typing", () => {
    const view = render(<TypingIndicator names={[]} />);
    expect(screen.queryByRole("status")).toBeNull();
    view.rerender(<TypingIndicator names={["Colega"]} />);
    expect(screen.getByRole("status").textContent).toContain("Colega está digitando");
    view.rerender(<TypingIndicator names={[]} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("announces groups and truncates names in a single flex row", () => {
    const { rerender } = render(<TypingIndicator names={["Ana", "Bruno"]} />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain("Ana e Bruno estão digitando");
    expect(status.querySelectorAll(".conversation-typing-dots i").length).toBe(3);
    rerender(<TypingIndicator names={["Ana", "Bruno", "Carlos"]} />);
    expect(screen.getByRole("status").textContent).toContain(
      "Ana e Bruno e outras pessoas estão digitando",
    );
  });
});
