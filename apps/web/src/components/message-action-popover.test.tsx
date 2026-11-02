import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MessageActionPopover, messageActionAnchor, type MessageActionAnchor } from "./message-action-popover";

vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));
vi.mock("@/lib/use-overlay-history", () => ({ useOverlayHistory: vi.fn(), waitForOverlayHistory: () => Promise.resolve() }));

function Picker({ composer = true }: { composer?: boolean }) {
  const [anchor, setAnchor] = useState<MessageActionAnchor>();
  return <form className="enturma-message-composer">
    <textarea aria-label="Mensagem" />
    <button type="button" onPointerDown={e => e.preventDefault()} onClick={e => setAnchor(messageActionAnchor(e.currentTarget))}>Emojis</button>
    {anchor && <MessageActionPopover anchor={anchor} composer={composer} onDismiss={() => setAnchor(undefined)}>
      <input aria-label="Pesquisar" />
      <button type="button">Sorriso</button>
      <button type="button" onClick={() => setAnchor(undefined)}>Fechar</button>
    </MessageActionPopover>}
  </form>;
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.style.removeProperty("--native-safe-top");
});

it("keeps the text input focused when opening and pressing emoji controls", () => {
  render(<Picker />);
  const input = screen.getByLabelText("Mensagem");
  input.focus();
  fireEvent.click(screen.getByText("Emojis"));
  expect(input).toHaveFocus();
  expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal", "true");
  expect(fireEvent.pointerDown(screen.getByText("Sorriso"))).toBe(false);
  expect(fireEvent.pointerDown(screen.getByRole("dialog"))).toBe(false);
  expect(fireEvent.pointerDown(screen.getByLabelText("Pesquisar"))).toBe(true);
  fireEvent.keyDown(input, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(input).toHaveFocus();
});

it("returns search focus to the composer synchronously before closing", () => {
  render(<Picker />);
  const input = screen.getByLabelText("Mensagem");
  input.focus();
  fireEvent.click(screen.getByText("Emojis"));
  screen.getByLabelText("Pesquisar").focus();
  fireEvent.click(screen.getByText("Fechar"));
  expect(input).toHaveFocus();
});

it("retains modal focus and Escape dismissal for message actions", () => {
  render(<Picker composer={false} />);
  screen.getByLabelText("Mensagem").focus();
  fireEvent.click(screen.getByText("Emojis"));
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveFocus();
  expect(dialog).toHaveAttribute("aria-modal", "true");
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("follows the live composer on viewport resize and scroll without covering it or the status bar", async () => {
  const viewport = Object.assign(new EventTarget(), { height: 500, width: 360, offsetTop: 0, offsetLeft: 0 });
  vi.stubGlobal("visualViewport", viewport);
  document.documentElement.style.setProperty("--native-safe-top", "24px");
  let composerTop = 430;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return { top: composerTop, bottom: composerTop + 44, left: 280, right: 324, width: 44, height: 44, x: 280, y: composerTop, toJSON() {} };
  });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
    return Math.min(400, parseFloat(this.style.maxHeight) || 400);
  });
  render(<Picker />);
  screen.getByLabelText("Mensagem").focus();
  fireEvent.click(screen.getByText("Emojis"));
  const dialog = screen.getByRole("dialog");
  const assertFits = () => {
    expect(parseFloat(dialog.style.top)).toBeGreaterThanOrEqual(Math.max(36, viewport.offsetTop + 12));
    expect(parseFloat(dialog.style.top) + dialog.offsetHeight).toBeLessThanOrEqual(composerTop - 8);
  };
  assertFits();
  composerTop = 320;
  viewport.height = 380;
  viewport.dispatchEvent(new Event("resize"));
  await waitFor(() => expect(parseFloat(dialog.style.maxHeight)).toBeLessThan(300));
  assertFits();
  composerTop = 360;
  viewport.offsetTop = 50;
  viewport.dispatchEvent(new Event("scroll"));
  await waitFor(() => expect(parseFloat(dialog.style.top)).toBeGreaterThanOrEqual(62));
  assertFits();
  expect(screen.getByLabelText("Mensagem")).toHaveFocus();
});

it("does not revive the mobile keyboard after it was dismissed while the picker was open", () => {
  document.documentElement.dataset.enturmaMobile = "true";
  document.documentElement.dataset.enturmaIme = "true";
  render(<Picker />);
  const input = screen.getByLabelText("Mensagem");
  input.focus();
  fireEvent.click(screen.getByText("Emojis"));
  screen.getByLabelText("Pesquisar").focus();
  document.documentElement.dataset.enturmaIme = "false";
  const focus = vi.spyOn(input, "focus");
  fireEvent.click(screen.getByText("Fechar"));
  expect(focus).not.toHaveBeenCalled();
  delete document.documentElement.dataset.enturmaMobile;
  delete document.documentElement.dataset.enturmaIme;
});
