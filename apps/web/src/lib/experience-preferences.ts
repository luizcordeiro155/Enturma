"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ExperiencePreference } from "@enturma/contracts";
import { api } from "./api";

export const themeOrder = ["LIGHT", "DARK", "ENTURMA", "SYSTEM"] as const;
export const experienceDefaults: ExperiencePreference = {
  theme: "SYSTEM",
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  enhancedFocus: true,
};
const key = "enturma-experience";
const pendingKey = `${key}-pending`;
let current = experienceDefaults;
let hydrated = false;
let revision = 0;
let session = 0;
let synchronized = false;
let syncing: Promise<void> | undefined;
let saving: Promise<void> | undefined;
const listeners = new Set<() => void>();

function normalize(value: Partial<ExperiencePreference>): ExperiencePreference {
  return {
    theme: themeOrder.includes(value.theme!) ? value.theme! : "SYSTEM",
    fontScale: Math.max(0.85, Math.min(1.35, Number(value.fontScale) || 1)),
    highContrast: value.highContrast === true,
    reducedMotion: value.reducedMotion === true,
    enhancedFocus: value.enhancedFocus !== false,
  };
}
function read(name: string) {
  try {
    const raw = localStorage.getItem(name);
    return raw ? normalize(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}
function publish(value: ExperiencePreference) {
  current = normalize(value);
  revision++;
  try {
    localStorage.setItem(key, JSON.stringify(current));
  } catch {}
  listeners.forEach((listener) => listener());
}
export function hydrateExperience() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  publish(read(key) ?? experienceDefaults);
  window.addEventListener("storage", (event) => {
    if (event.key === key) publish(read(key) ?? experienceDefaults);
  });
  window.addEventListener("enturma-session-changed", () => {
    session++;
    synchronized = false;
    syncing = undefined;
    saving = undefined;
  });
}
export function getExperience() {
  return current;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useExperience() {
  const value = useSyncExternalStore(
    subscribe,
    getExperience,
    () => experienceDefaults,
  );
  useEffect(hydrateExperience, []);
  return value;
}

/** One writer per document: route unmounts cannot cancel a pending choice. */
async function flush() {
  if (saving) return saving;
  const generation = session;
  const task = (async () => {
    let pending = read(pendingKey);
    while (pending && generation === session) {
      const serialized = JSON.stringify(pending);
      await api("/users/me/experience", {
        method: "PUT",
        body: serialized,
        keepalive: true,
      });
      if (generation !== session) return;
      try {
        if (JSON.stringify(read(pendingKey)) === serialized)
          localStorage.removeItem(pendingKey);
      } catch {}
      pending = read(pendingKey);
    }
  })();
  saving = task;
  try {
    await task;
  } finally {
    if (saving === task) saving = undefined;
  }
}
export async function saveExperience(
  value: ExperiencePreference,
  localOnly = false,
) {
  hydrateExperience();
  publish(value);
  try {
    localStorage.setItem(pendingKey, JSON.stringify(current));
  } catch {}
  if (!localOnly) await flush();
}

/** Remote defaults are loaded once, and never supersede a newer local choice. */
export function syncExperience() {
  hydrateExperience();
  if (synchronized) return Promise.resolve();
  if (syncing) return syncing;
  const generation = session;
  const before = revision;
  const task = (async () => {
    if (read(pendingKey)) await flush();
    else {
      const remote = await api<ExperiencePreference>("/users/me/experience", {
        cache: "no-store",
      });
      if (generation === session && before === revision && !read(pendingKey))
        publish(remote);
    }
    if (generation === session) synchronized = true;
  })();
  syncing = task;
  return task.finally(() => {
    if (syncing === task) syncing = undefined;
  });
}
