import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ScreenShareDialog } from "./screen-share-dialog";
vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));
afterEach(cleanup);
test("quality and audio are explicit choices and sharing preserves the user gesture", () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  const onResolution = vi.fn(),
    onFps = vi.fn(),
    onAudio = vi.fn(),
    onShare = vi.fn();
  const props = {
    resolution: "1080p" as const,
    fps: 30 as const,
    audio: false,
    noiseSuppression: true,
    sharing: false,
    busy: false,
    error: "",
    onResolution,
    onFps,
    onAudio,
    onNoiseSuppression: vi.fn(),
    onShare,
    onClose: vi.fn(),
  };
  const { rerender } = render(<ScreenShareDialog {...props} />);
  fireEvent.click(screen.getByRole("radio", { name: "QHD · 1440p" }));
  expect(onResolution).toHaveBeenCalledWith("1440p");
  fireEvent.click(screen.getByRole("radio", { name: "60 FPS" }));
  expect(onFps).toHaveBeenCalledWith(60);
  fireEvent.click(screen.getByRole("checkbox", { name: /Incluir áudio/ }));
  expect(onAudio).toHaveBeenCalledWith(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Escolher e transmitir" }),
  );
  expect(onShare).toHaveBeenCalledOnce();
  rerender(<ScreenShareDialog {...props} busy />);
  expect(
    screen
      .getByRole("button", { name: "Abrindo compartilhamento…" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
