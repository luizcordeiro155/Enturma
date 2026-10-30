import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  localStorage.clear();
});
test("does not create or resume audio for unsolicited notifications", async () => {
  const Audio = vi.fn();
  vi.stubGlobal("AudioContext", Audio);
  const sound = await import("./notification-sound");
  sound.setNotificationSoundEnabled(true);
  expect(sound.playNotificationSound()).toBe(false);
  expect(Audio).not.toHaveBeenCalled();
});
test("requires an unlocked context and enabled preference; throttles repeated events", async () => {
  const oscillator = () => ({
    type: "",
    frequency: { value: 0 },
    connect: () => ({ connect: vi.fn() }),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
    onended: null,
  });
  const createOscillator = vi.fn(oscillator);
  vi.stubGlobal(
    "AudioContext",
    class {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator = createOscillator;
      createGain = () => ({
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        disconnect: vi.fn(),
      });
    },
  );
  const sound = await import("./notification-sound");
  await sound.unlockNotificationSound();
  expect(sound.playNotificationSound()).toBe(false);
  sound.setNotificationSoundEnabled(true);
  expect(sound.playNotificationSound()).toBe(true);
  expect(sound.playNotificationSound()).toBe(false);
  expect(createOscillator).toHaveBeenCalledTimes(2);
  sound.setNotificationSoundEnabled(false);
  expect(sound.playNotificationSound()).toBe(false);
});
test("deduplicates service-worker and inbox delivery even after the throttle expires", async () => {
  vi.useFakeTimers();
  const start = vi.fn();
  vi.stubGlobal(
    "AudioContext",
    class {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator = () => ({
        type: "",
        frequency: { value: 0 },
        connect: () => ({ connect: vi.fn() }),
        start,
        stop: vi.fn(),
        disconnect: vi.fn(),
      });
      createGain = () => ({
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        disconnect: vi.fn(),
      });
    },
  );
  try {
    const sound = await import("./notification-sound");
    sound.setNotificationSoundEnabled(true);
    await sound.unlockNotificationSound();
    expect(sound.playNotificationSound(false, "notice-1")).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(sound.playNotificationSound(false, "notice-1")).toBe(false);
    expect(sound.playNotificationSound(false, "notice-2")).toBe(true);
    expect(start).toHaveBeenCalledTimes(4);
  } finally {
    vi.useRealTimers();
  }
});
