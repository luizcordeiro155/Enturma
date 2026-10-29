import type {
  AudioCaptureOptions,
  RoomOptions,
  ScreenShareCaptureOptions,
  TrackPublishOptions,
  VideoCaptureOptions,
} from "livekit-client";

/**
 * Capture quality is a preference, never a guarantee: hardware and uplink
 * bandwidth determine the actual transmitted resolution and frame rate.
 * LiveKit simulcast/dynacast adapt what each remote participant receives.
 */
export type ScreenResolution = "720p" | "1080p" | "1440p";
export type ScreenFrameRate = 15 | 30 | 60;

export const screenResolutions: ReadonlyArray<{
  value: ScreenResolution;
  label: string;
}> = [
  { value: "720p", label: "HD · 720p" },
  { value: "1080p", label: "Full HD · 1080p" },
  { value: "1440p", label: "QHD · 1440p" },
];

export const screenFrameRates: readonly ScreenFrameRate[] = [15, 30, 60];

const screenDimensions: Record<ScreenResolution, { width: number; height: number; bitrate: number }> = {
  "720p": { width: 1280, height: 720, bitrate: 2_100_000 },
  "1080p": { width: 1920, height: 1080, bitrate: 4_000_000 },
  "1440p": { width: 2560, height: 1440, bitrate: 6_500_000 },
};

export const cameraCapture: VideoCaptureOptions = {
  resolution: { width: 1920, height: 1080, frameRate: 30 },
};

export const cameraCaptureFallback: VideoCaptureOptions = {
  resolution: { width: 1280, height: 720, frameRate: 30 },
};

/** Audio constraints for clear speech with echo cancellation always enabled. */
export function microphoneCapture(noiseSuppression = true): AudioCaptureOptions {
  return {
    noiseSuppression,
    echoCancellation: true,
    autoGainControl: true,
  };
}

export const callRoomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  audioCaptureDefaults: microphoneCapture(true),
  videoCaptureDefaults: cameraCapture,
  publishDefaults: {
    simulcast: true,
    videoEncoding: { maxBitrate: 3_500_000, maxFramerate: 30 },
    videoSimulcastLayers: [
      { resolution: { width: 640, height: 360 }, encoding: { maxBitrate: 450_000, maxFramerate: 30 } },
      { resolution: { width: 1280, height: 720 }, encoding: { maxBitrate: 1_700_000, maxFramerate: 30 } },
    ],
    screenShareEncoding: { maxBitrate: 4_000_000, maxFramerate: 30 },
  },
};

/**
 * Screen-sharing capture and uplink encoding must both use the selected preset.
 * Capture options only constrain the browser source; publish encoding limits
 * the video sent to LiveKit, rather than just enlarging the local preview.
 */
export function screenShareOptions(resolution: ScreenResolution, fps: ScreenFrameRate): {
  capture: ScreenShareCaptureOptions;
  publish: TrackPublishOptions;
} {
  const preset = screenDimensions[resolution];
  const fpsFactor = fps === 60 ? 1.7 : fps === 15 ? 0.65 : 1;
  const bitrate = Math.round(preset.bitrate * fpsFactor);
  return {
    capture: {
      audio: false,
      contentHint: fps === 60 ? "motion" : "detail",
      resolution: { width: preset.width, height: preset.height, frameRate: fps },
    },
    publish: {
      simulcast: true,
      screenShareEncoding: { maxBitrate: bitrate, maxFramerate: fps },
      screenShareSimulcastLayers: resolution === "720p" ? [] : [
        { resolution: { width: 1280, height: 720 }, encoding: { maxBitrate: Math.min(1_800_000, bitrate), maxFramerate: fps } },
      ],
      degradationPreference: fps === 60 ? "balanced" : "maintain-resolution",
    },
  };
}

export function cameraResolutionNotSupported(error: unknown): boolean {
  return error instanceof Error &&
    (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError");
}
