"use client";
import { useSyncExternalStore } from "react";

/**
 * The Feed and Clips each keep their own sound setting for the browser session,
 * like Instagram: Reels open with sound, while the Feed stays muted until the
 * person turns sound on there (Enturma's button or the phone's volume key).
 * Within each surface the choice carries over to the next videos.
 */
export type SocialSound = { muted: boolean; volume: number };
export type SocialSoundSurface = "feed" | "clips";

const KEYS: Record<SocialSoundSurface, string> = {
  // A new key: the old shared one could carry sound Clips had turned on.
  feed: "enturma-social-feed-sound",
  clips: "enturma-social-clips-sound",
};
const DEFAULT: SocialSound = { muted: true, volume: 1 };

export function readSavedSocialSound(
  surface: SocialSoundSurface = "feed",
): SocialSound {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEYS[surface]) ?? "null");
    if (
      saved &&
      typeof saved.muted === "boolean" &&
      typeof saved.volume === "number" &&
      saved.volume >= 0 &&
      saved.volume <= 1
    )
      return { muted: saved.muted, volume: saved.volume };
  } catch {
    /* Storage may be unavailable or the value damaged. */
  }
  return DEFAULT;
}

const current: Partial<Record<SocialSoundSurface, SocialSound>> = {};
const listeners = new Set<() => void>();

export function getSocialSound(
  surface: SocialSoundSurface = "feed",
): SocialSound {
  return (current[surface] ??= readSavedSocialSound(surface));
}

export function setSocialSound(
  change: Partial<SocialSound>,
  surface: SocialSoundSurface = "feed",
) {
  const previous = getSocialSound(surface);
  const next = { ...previous, ...change };
  if (next.muted === previous.muted && next.volume === previous.volume) return;
  current[surface] = next;
  try {
    sessionStorage.setItem(KEYS[surface], JSON.stringify(next));
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

/** Re-reads the saved settings (used by tests and after storage changes). */
export function resetSocialSound() {
  delete current.feed;
  delete current.clips;
  listeners.forEach((listener) => listener());
}

export function useSocialSound(surface: SocialSoundSurface = "feed") {
  const sound = useSyncExternalStore(
    subscribeSocialSound,
    () => getSocialSound(surface),
    () => DEFAULT,
  );
  return {
    ...sound,
    setMuted: (muted: boolean) => setSocialSound({ muted }, surface),
    setVolume: (volume: number) => setSocialSound({ volume }, surface),
  };
}

const VOLUME_KEYS = new Set([
  "AudioVolumeUp",
  "AudioVolumeDown",
  "VolumeUp",
  "VolumeDown",
]);

/** The surface whose video is on screen; a dialog over the page comes first. */
function visibleSurface(): SocialSoundSurface | null {
  for (const selector of [".social-dialog video", ".social-page video"]) {
    const video = [...document.querySelectorAll(selector)].find(
      (node) => !node.closest("[hidden]"),
    );
    if (video) return video.closest(".social-clips") ? "clips" : "feed";
  }
  return null;
}

/**
 * Like Instagram: pressing the phone's volume key while a Social video is on screen
 * turns sound on for that surface (Feed or Clips) and its next videos, until the
 * person mutes in Enturma. The Android app forwards the key as
 * `enturma-native-volume-key`; some browsers report it as a keydown.
 */
export function unmuteOnVolumeKeys() {
  const unmute = () => {
    const surface = visibleSurface();
    if (!surface) return;
    const sound = getSocialSound(surface);
    if (sound.muted || sound.volume === 0)
      setSocialSound({ muted: false, volume: sound.volume || 1 }, surface);
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
