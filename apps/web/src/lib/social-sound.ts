"use client";
import { useSyncExternalStore } from "react";

/**
 * One sound setting for every Social video (Feed and Clips), kept for the browser
 * session: turning sound on or off applies to the next videos too, like Instagram.
 */
export type SocialSound = { muted: boolean; volume: number };

const KEY = "enturma-social-sound";
/** Clips saved their own choice before this shared setting existed. */
const LEGACY_CLIPS_KEY = "enturma-social-clips-muted";
const DEFAULT: SocialSound = { muted: true, volume: 1 };

export function readSavedSocialSound(): SocialSound {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (
      saved &&
      typeof saved.muted === "boolean" &&
      typeof saved.volume === "number" &&
      saved.volume >= 0 &&
      saved.volume <= 1
    )
      return { muted: saved.muted, volume: saved.volume };
    if (sessionStorage.getItem(LEGACY_CLIPS_KEY) === "0")
      return { ...DEFAULT, muted: false };
  } catch {
    /* Storage may be unavailable or the value damaged. */
  }
  return DEFAULT;
}

let current: SocialSound | null = null;
const listeners = new Set<() => void>();

export function getSocialSound(): SocialSound {
  current ??= readSavedSocialSound();
  return current;
}

export function setSocialSound(change: Partial<SocialSound>) {
  const next = { ...getSocialSound(), ...change };
  if (next.muted === current?.muted && next.volume === current?.volume) return;
  current = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Storage may be unavailable; the choice still applies on this page. */
  }
  listeners.forEach((listener) => listener());
}

export function subscribeSocialSound(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Re-reads the saved setting (used by tests and after storage changes). */
export function resetSocialSound() {
  current = null;
  listeners.forEach((listener) => listener());
}

export function useSocialSound() {
  const sound = useSyncExternalStore(
    subscribeSocialSound,
    getSocialSound,
    () => DEFAULT,
  );
  return {
    ...sound,
    setMuted: (muted: boolean) => setSocialSound({ muted }),
    setVolume: (volume: number) => setSocialSound({ volume }),
  };
}

const VOLUME_KEYS = new Set(["AudioVolumeUp", "AudioVolumeDown", "VolumeUp", "VolumeDown"]);

/**
 * Like Instagram: pressing the phone's volume key while a Social video is on screen
 * turns sound on for it and for the next videos, until the person mutes in Enturma.
 * The Android app forwards the key as `enturma-native-volume-key`; some browsers
 * report it as a keydown.
 */
export function unmuteOnVolumeKeys() {
  const unmute = () => {
    if (!document.querySelector(".social-page video, .social-dialog video")) return;
    const sound = getSocialSound();
    if (sound.muted || sound.volume === 0)
      setSocialSound({ muted: false, volume: sound.volume || 1 });
  };
  const key = (event: KeyboardEvent) => {
    if (VOLUME_KEYS.has(event.key)) unmute();
  };
  window.addEventListener("enturma-native-volume-key", unmute);
  window.addEventListener("keydown", key);
  return () => {
    window.removeEventListener("enturma-native-volume-key", unmute);
    window.removeEventListener("keydown", key);
  };
}
