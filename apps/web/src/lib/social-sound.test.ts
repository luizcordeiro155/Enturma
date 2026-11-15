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
afterEach(() => {
  sessionStorage.clear();
  document.body.innerHTML = "";
});

it("starts muted at full volume", () => {
  expect(getSocialSound()).toEqual({ muted: true, volume: 1 });
  expect(getSocialSound("clips")).toEqual({ muted: true, volume: 1 });
});

it("turning Feed sound on reaches every listening Feed video and lasts for the session", () => {
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

it("sound turned on in Clips never turns the Feed sound on", () => {
  setSocialSound({ muted: false, volume: 0.7 }, "clips");
  expect(getSocialSound("clips")).toEqual({ muted: false, volume: 0.7 });
  expect(getSocialSound("feed")).toEqual({ muted: true, volume: 1 });
  resetSocialSound();
  expect(readSavedSocialSound("feed")).toEqual({ muted: true, volume: 1 });
  expect(readSavedSocialSound("clips")).toEqual({ muted: false, volume: 0.7 });
});

it("ignores the old shared setting, which Clips could have turned on", () => {
  sessionStorage.setItem("enturma-social-sound", '{"muted":false,"volume":1}');
  expect(readSavedSocialSound("feed")).toEqual({ muted: true, volume: 1 });
});

it("ignores a damaged saved value", () => {
  sessionStorage.setItem(
    "enturma-social-feed-sound",
    '{"muted":"x","volume":7}',
  );
  expect(readSavedSocialSound()).toEqual({ muted: true, volume: 1 });
});

it("the phone's volume key turns Feed sound on while a Feed video is on screen", () => {
  const stop = unmuteOnVolumeKeys();
  window.dispatchEvent(
    new CustomEvent("enturma-native-volume-key", {
      detail: { direction: "up" },
    }),
  );
  expect(getSocialSound().muted).toBe(true);

  document.body.innerHTML = '<div class="social-page"><video></video></div>';
  setSocialSound({ volume: 0 });
  window.dispatchEvent(
    new CustomEvent("enturma-native-volume-key", {
      detail: { direction: "down" },
    }),
  );
  expect(getSocialSound()).toEqual({ muted: false, volume: 1 });
  expect(getSocialSound("clips").muted).toBe(true);

  setSocialSound({ muted: true });
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "AudioVolumeUp" }));
  expect(getSocialSound().muted).toBe(false);

  stop();
  setSocialSound({ muted: true });
  window.dispatchEvent(
    new CustomEvent("enturma-native-volume-key", {
      detail: { direction: "up" },
    }),
  );
  expect(getSocialSound().muted).toBe(true);
});

it("the volume key on Clips turns Clips sound on, not the hidden Feed's", () => {
  const stop = unmuteOnVolumeKeys();
  document.body.innerHTML =
    '<div class="social-page"><div hidden><video></video></div>' +
    '<div class="social-clips"><video></video></div></div>';
  window.dispatchEvent(
    new CustomEvent("enturma-native-volume-key", {
      detail: { direction: "up" },
    }),
  );
  expect(getSocialSound("clips").muted).toBe(false);
  expect(getSocialSound("feed").muted).toBe(true);
  stop();
});
