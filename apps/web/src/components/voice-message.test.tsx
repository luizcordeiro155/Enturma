import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { VoiceRecorder } from "./voice-message";
const recorders: Recorder[] = [];
const stopTrack = vi.fn();
class Recorder {
  static isTypeSupported = () => true;
  state = "inactive";
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: () => void;
  onerror?: () => void;
  constructor() {
    recorders.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob(["recording"], { type: "audio/webm" }),
    });
    this.onstop?.();
  }
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("MediaRecorder", Recorder);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi
        .fn()
        .mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }),
    },
  });
  URL.createObjectURL = vi.fn(() => "blob:voice");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
test("stops the microphone and lets the user review before sending; failed sends retain the preview", async () => {
  const send = vi
    .fn()
    .mockRejectedValueOnce(Error("offline"))
    .mockResolvedValue(undefined);
  const error = vi.fn();
  render(<VoiceRecorder onSend={send} onError={error} />);
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "Gravar mensagem de voz" }),
    ),
  );
  expect(recorders.at(-1)!.state).toBe("recording");
  expect(send).not.toHaveBeenCalled();
  act(() =>
    fireEvent.click(
      screen.getByRole("button", { name: "Parar e ouvir áudio" }),
    ),
  );
  expect(stopTrack).toHaveBeenCalled();
  expect(screen.getByLabelText("Ouvir áudio antes de enviar")).toBeTruthy();
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Enviar áudio" })),
  );
  expect(error).toHaveBeenCalledWith("offline");
  expect(screen.getByLabelText("Ouvir áudio antes de enviar")).toBeTruthy();
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Enviar áudio" })),
  );
  expect(send.mock.calls[1][0].type).toBe("audio/webm");
  expect(screen.queryByLabelText("Ouvir áudio antes de enviar")).toBeNull();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:voice");
});
test("caps recording at two minutes and releases microphone on navigation", async () => {
  const send = vi.fn();
  const { unmount } = render(<VoiceRecorder onSend={send} onError={vi.fn()} />);
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "Gravar mensagem de voz" }),
    ),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(120000);
  });
  expect(recorders.at(-1)!.state).toBe("inactive");
  expect(send).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Descartar áudio" }));
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "Gravar mensagem de voz" }),
    ),
  );
  unmount();
  expect(recorders.at(-1)!.state).toBe("inactive");
  expect(stopTrack).toHaveBeenCalled();
});
