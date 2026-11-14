import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  getSocialSound,
  readSavedSocialSound,
  resetSocialSound,
  setSocialSound,
  subscribeSocialSound,
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
