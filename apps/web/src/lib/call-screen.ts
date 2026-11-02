import type {
  LocalParticipant,
  ScreenShareCaptureOptions,
  TrackPublishOptions,
} from "livekit-client";

/** A missing loopback device must not prevent sharing video. Never retry denials. */
export async function startScreenShare(
  participant: Pick<LocalParticipant, "setScreenShareEnabled">,
  capture: ScreenShareCaptureOptions,
  publish: TrackPublishOptions,
): Promise<boolean> {
  try {
    await participant.setScreenShareEnabled(true, capture, publish);
    return Boolean(capture.audio);
  } catch (error) {
    if (
      !capture.audio ||
      !(error instanceof Error) ||
      !/could not start audio source|failed to start audio source/i.test(
        error.message,
      )
    )
      throw error;
    await participant.setScreenShareEnabled(
      true,
      { ...capture, audio: false },
      publish,
    );
    return false;
  }
}

export function isMobileCallClient() {
  return (
    !window.enturmaDesktop &&
    (document.documentElement.dataset.enturmaMobile === "true" ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent)))
  );
}

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};
export async function expandCallScreen(tile: HTMLElement) {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await tile.requestFullscreen();
  if (isMobileCallClient()) {
    try {
      await (screen.orientation as LockableOrientation)?.lock?.("landscape");
    } catch {
      // Some browsers do not expose orientation locking. Fullscreen still works.
    }
  }
}
