import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { RotatingLine } from "./rotating-line";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const status = { id: "status", text: "Apple Style" };
const seen = { id: "presence", text: "visto por último hoje às 22:03" };
const shown = (root: HTMLElement) =>
  [...root.querySelectorAll("[data-line]")].map(
    (node) => `${node.getAttribute("data-line")}:${node.textContent}`,
  );

it("shows the status first and turns to last seen after a few seconds", () => {
  const { container } = render(<RotatingLine lines={[status, seen]} />);
  expect(shown(container)).toEqual(["in:Apple Style"]);
  act(() => void vi.advanceTimersByTime(4600));
  // the old line leaves while the new one comes in
  expect(shown(container)).toEqual([
    "out:Apple Style",
    "in:visto por último hoje às 22:03",
  ]);
  act(() => void vi.advanceTimersByTime(700));
  expect(shown(container)).toEqual(["in:visto por último hoje às 22:03"]);
  act(() => void vi.advanceTimersByTime(4600));
  expect(shown(container).at(-1)).toBe("in:Apple Style");
});

it("lets a screen reader have both lines at once instead of a text that keeps changing", () => {
  const { container } = render(<RotatingLine lines={[status, seen]} />);
  expect(container.querySelector(".sr-only")!.textContent).toBe(
    "Apple Style · visto por último hoje às 22:03",
  );
  expect(
    container.querySelector("[data-line]")!.getAttribute("aria-hidden"),
  ).toBe("true");
});

it("stays still with a single line", () => {
  const { container } = render(<RotatingLine lines={[seen]} />);
  act(() => void vi.advanceTimersByTime(20000));
  expect(shown(container)).toEqual(["in:visto por último hoje às 22:03"]);
});

it("updates a line in place when only its words change", () => {
  const { container, rerender } = render(
    <RotatingLine lines={[seen, status]} />,
  );
  rerender(
    <RotatingLine
      lines={[{ id: "presence", text: "online", tone: "online" }, status]}
    />,
  );
  // same line, new words: no one leaves and nothing slides
  expect(shown(container)).toEqual(["in:online"]);
  expect(
    container.querySelector("[data-line]")!.getAttribute("data-tone"),
  ).toBe("online");
});

it("goes back to the line that is left when the other one goes away", () => {
  const { container, rerender } = render(
    <RotatingLine lines={[status, seen]} />,
  );
  act(() => void vi.advanceTimersByTime(4600));
  rerender(<RotatingLine lines={[status]} />);
  expect(shown(container).at(-1)).toBe("in:Apple Style");
});
