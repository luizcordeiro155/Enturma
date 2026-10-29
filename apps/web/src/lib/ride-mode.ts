"use client";

import { useEffect, useState } from "react";

export type RideMode = "PASSENGER" | "DRIVER";
const key = "enturma-ride-mode";
const changeEvent = "enturma-ride-mode-change";

export function readRideMode(): RideMode {
  if (typeof window === "undefined") return "PASSENGER";
  try {
    return window.localStorage.getItem(key) === "DRIVER" ? "DRIVER" : "PASSENGER";
  } catch {
    return "PASSENGER";
  }
}

export function saveRideMode(mode: RideMode) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, mode); } catch { /* storage may be blocked */ }
  window.dispatchEvent(new CustomEvent<RideMode>(changeEvent, { detail: mode }));
}

export function useRideMode(): RideMode {
  const [mode, setMode] = useState<RideMode>("PASSENGER");
  useEffect(() => {
    const sync = () => setMode(readRideMode());
    const changed = (event: Event) => {
      const next = (event as CustomEvent<RideMode>).detail;
      setMode(next === "DRIVER" || next === "PASSENGER" ? next : readRideMode());
    };
    const storage = (event: StorageEvent) => {
      if (event.key === key) sync();
    };
    sync();
    window.addEventListener(changeEvent, changed);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(changeEvent, changed);
      window.removeEventListener("storage", storage);
    };
  }, []);
  return mode;
}
