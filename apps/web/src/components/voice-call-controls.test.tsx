import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VoiceCallControls } from "./voice-call-controls";
afterEach(cleanup);
const state = {
  deafened: false,
  muted: false,
  camera: true,
  cameraSwitchBusy: false,
  canSwitchCamera: true,
  mobile: false,
  screen: false,
  screenSettingsOpen: false,
  screenSupported: true,
  screenBusy: false,
  onDeafen: vi.fn(),
  onMicrophone: vi.fn(),
  onCamera: vi.fn(),
  onSwitchCamera: vi.fn(),
  onSettings: vi.fn(),
  onShare: vi.fn(),
  onLeave: vi.fn(),
};
it("announces the deafen state and retains keyboard-operable controls", () => {
  const view = render(<VoiceCallControls {...state} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Silenciar som da chamada" }),
  );
  expect(state.onDeafen).toHaveBeenCalledTimes(1);
  view.rerender(<VoiceCallControls {...state} deafened muted />);
  const deafen = screen.getByRole("button", { name: "Ativar som da chamada" });
  expect(deafen.getAttribute("aria-pressed")).toBe("true");
  expect(deafen.textContent).toBe("Som desligado");
  expect(deafen.querySelector("svg")).toBeTruthy();
});
it("mobile keeps call/camera controls but does not offer transmission settings", () => {
  render(<VoiceCallControls {...state} mobile />);
  expect(screen.queryByRole("button", { name: "Qualidade" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Compartilhar" })).toBeNull();
  expect(screen.getByRole("button", { name: "Virar câmera" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Desconectar" }));
  expect(state.onLeave).toHaveBeenCalledTimes(1);
});
