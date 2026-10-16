/** Presentation time begins when the Remotion player renders, not when an API returns. */
export const APP_LAUNCH_MIN_MS = 2250;
export const RIDE_LAUNCH_MIN_MS = 1900;
export const REDUCED_LAUNCH_MIN_MS = 160;
export const LAUNCH_FALLBACK_MS = 6500;

export function launchRemainingMs(
  visibleSince: number,
  now: number,
  scene: "app" | "ride",
  reducedMotion: boolean,
) {
  const minimum = reducedMotion
    ? REDUCED_LAUNCH_MIN_MS
    : scene === "ride"
      ? RIDE_LAUNCH_MIN_MS
      : APP_LAUNCH_MIN_MS;
  return Math.max(0, minimum - Math.max(0, now - visibleSince));
}

/** Keep the animated book but simplify decorative layers on modest hardware. */
export function useLightweightLaunch(
  memoryGb?: number,
  logicalProcessors?: number,
) {
  return (
    (Number.isFinite(memoryGb) && memoryGb! <= 4) ||
    (Number.isFinite(logicalProcessors) && logicalProcessors! <= 4)
  );
}
