import { afterEach, expect, it, vi } from "vitest";
import { expandCallScreen, startScreenShare } from "./call-screen";
import { screenShareOptions } from "./call-media-quality";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.enturmaMobile;
});

it("opens mobile screen viewing before requesting landscape and tolerates unsupported locking", async () => {
  document.documentElement.dataset.enturmaMobile = "true";
  const order: string[] = [];
  const tile = document.createElement("div");
  tile.requestFullscreen = vi.fn(async () => {
    order.push("fullscreen");
  });
  vi.stubGlobal("screen", {
    orientation: {
      lock: async () => {
        order.push("landscape");
        throw new DOMException("Unsupported");
      },
    },
  });
  await expect(expandCallScreen(tile)).resolves.toBeUndefined();
  expect(order).toEqual(["fullscreen", "landscape"]);
});

it("retries only an audio-source failure without audio, preserving video quality", async () => {
  const setScreenShareEnabled = vi
    .fn()
    .mockRejectedValueOnce(new Error("Could not start audio source"))
    .mockResolvedValue(undefined);
  const options = screenShareOptions("1080p", 30, true);
  expect(
    await startScreenShare(
      { setScreenShareEnabled },
      options.capture,
      options.publish,
    ),
  ).toBe(false);
  expect(setScreenShareEnabled).toHaveBeenLastCalledWith(
    true,
    { ...options.capture, audio: false },
    options.publish,
  );
});
it("does not retry a cancelled picker, denial, or a video-source failure", async () => {
  for (const error of [
    new DOMException("Permission denied", "NotAllowedError"),
    new DOMException("Cancelled", "AbortError"),
    new Error("Could not start video source"),
  ]) {
    const setScreenShareEnabled = vi.fn().mockRejectedValue(error);
    const options = screenShareOptions("720p", 15, true);
    await expect(
      startScreenShare(
        { setScreenShareEnabled },
        options.capture,
        options.publish,
      ),
    ).rejects.toBe(error);
    expect(setScreenShareEnabled).toHaveBeenCalledTimes(1);
  }
});
