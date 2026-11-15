"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export type FocusState = {
  enabled: boolean;
  active: boolean;
  blocked: boolean;
  kind?: "CLASS" | "STUDY";
  title?: string;
  until?: string;
  studyId?: string;
};

type NativeFocusBridge = {
  getFocusSupport?: () => string;
  requestFocusPermission?: () => void;
  setStudyFocus?: (active: boolean, untilMillis: number) => void;
};

function bridge(): NativeFocusBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { EnturmaNative?: NativeFocusBridge }).EnturmaNative;
}

export const focusMode = {
  get: () => api<FocusState>("/planner/focus", { cache: "no-store" }),
  set: (enabled: boolean) =>
    api<FocusState>("/planner/focus", { method: "PUT", body: JSON.stringify({ enabled }) }),
};

/** Whether the Android app can silence other notifications, and if it is allowed to. */
export function nativeFocusSupport(): { supported: boolean; granted: boolean } {
  try {
    const raw = bridge()?.getFocusSupport?.();
    if (!raw) return { supported: false, granted: false };
    const value = JSON.parse(raw) as { supported?: boolean; granted?: boolean };
    return { supported: Boolean(value.supported), granted: Boolean(value.granted) };
  } catch {
    return { supported: false, granted: false };
  }
}

export function requestNativeFocusPermission() {
  bridge()?.requestFocusPermission?.();
}

/** Tells the Android app to turn its "Não perturbe" on or off for the focus period. */
export function syncNativeFocus(state: FocusState | null | undefined) {
  const setFocus = bridge()?.setStudyFocus;
  if (!setFocus) return;
  try {
    const until = state?.blocked && state.until ? Date.parse(state.until) : 0;
    setFocus(Boolean(state?.blocked && until > Date.now()), until);
  } catch {
    // The page keeps working without the native part.
  }
}

/** Focus state for the signed-in student, refreshed every minute and when the app returns. */
export function useFocusMode(active = true) {
  const [state, setState] = useState<FocusState | null>(null);
  const refresh = useCallback(async () => {
    try {
      const next = await focusMode.get();
      setState(next);
      syncNativeFocus(next);
      return next;
    } catch {
      return null;
    }
  }, []);
  useEffect(() => {
    if (!active) return;
    let alive = true;
    const run = () => {
      if (alive) void refresh();
    };
    run();
    const timer = window.setInterval(run, 60000);
    const visible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [active, refresh]);
  // Re-check right when the focus period ends.
  useEffect(() => {
    if (!state?.blocked || !state.until) return;
    const wait = Date.parse(state.until) - Date.now() + 1500;
    if (wait <= 0 || wait > 12 * 3600000) return;
    const timer = window.setTimeout(() => void refresh(), wait);
    return () => window.clearTimeout(timer);
  }, [state?.blocked, state?.until, refresh]);
  return { focus: state, setFocus: setState, refresh };
}
