import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  getSocialSound,
  readSavedSocialSound,
  resetSocialSound,
  setSocialSound,
  subscribeSocialSound,
  unmuteOnVolumeKeys,
} from "./social-sound";

beforeEach(() => {
  sessionStorage.clear();
  resetSocialSound();
});
afterEach(() => sessionStorage.clear());

it("starts muted at full volume", () => {
  expect(getSocialSound()).toEqual({ muted: true, volume: 1 });
});

it("turning sound on reaches every listening video and lasts for the session", () => {
  const listener = vi.fn();
  const stop = subscribeSocialSound(listener);
  setSocialSound({ muted: false });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(getSocialSound()).toEqual({ muted: false, volume: 1 });
  setSocialSound({ volume: 0.4 });
  expect(readSavedSocialSound()).toEqual({ muted: false, volume: 0.4 });
  stop();
  setSocialSound({ muted: true });
  expect(listener).toHaveBeenCalledTimes(2);
});

it("keeps the Clips choice saved before the shared setting existed", () => {
  sessionStorage.setItem("enturma-social-clips-muted", "0");
  expect(readSavedSocialSound()).toEqual({ muted: false, volume: 1 });
});

it("ignores a damaged saved value", () => {
  sessionStorage.setItem("enturma-social-sound", '{"muted":"x","volume":7}');
  expect(readSavedSocialSound()).toEqual({ muted: true, volume: 1 });
});

it("the phone's volume key turns Social sound on while a Social video is on screen", () => {
  const stop = unmuteOnVolumeKeys();
  window.dispatchEvent(new CustomEvent("enturma-native-volume-key", { detail: { direction: "up" } }));
  expect(getSocialSound().muted).toBe(true);

  document.body.innerHTML = '<div class="social-page"><video></video></div>';
  setSocialSound({ volume: 0 });
  window.dispatchEvent(new CustomEvent("enturma-native-volume-key", { detail: { direction: "down" } }));
  expect(getSocialSound()).toEqual({ muted: false, volume: 1 });

  setSocialSound({ muted: true });
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "AudioVolumeUp" }));
  expect(getSocialSound().muted).toBe(false);

  stop();
  setSocialSound({ muted: true });
  window.dispatchEvent(new CustomEvent("enturma-native-volume-key", { detail: { direction: "up" } }));
  expect(getSocialSound().muted).toBe(true);
  document.body.innerHTML = "";
});
