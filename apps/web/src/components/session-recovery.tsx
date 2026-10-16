"use client";

import { useEffect } from "react";
import { LaunchSplash } from "@/components/app-launch";
import { authDestination } from "@/lib/auth-navigation";
import { APP_LAUNCH_MIN_MS } from "@/lib/launch-performance";

// The recovery splash is the app's opening animation. Do not replay it once
// the verified session returns to a protected page.
export const RECOVERY_LAUNCH_KEY = "enturma:launch-recovery-shown";

function returnToApp() {
  return authDestination(
    new URLSearchParams(window.location.search).get("next"),
  );
}

async function refreshSavedSession(signal: AbortSignal) {
  const request = () =>
    fetch("/api/session", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
  if (navigator.locks?.request)
    return navigator.locks.request(
      "enturma-refresh",
      { signal },
      request,
    );
  return request();
}

/**
 * A single launch scene is shown for the entire recovery process. A transient
 * API outage cannot replace the animation with a retry card or log the user out.
 */
export function SessionRecovery() {
  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    let attempts = 0;
    const startedAt = performance.now();
    let timer: number | undefined;
    let controller: AbortController | undefined;

    const schedule = () => {
      if (disposed) return;
      const delay = Math.min(12000, 1200 * 2 ** Math.min(attempts++, 4));
      timer = window.setTimeout(() => void recover(), delay);
    };

    const recover = async () => {
      if (disposed || inFlight) return;
      inFlight = true;
      controller = new AbortController();

      try {
        // Check whether another tab has already restored the access token
        // before rotating the shared refresh token.
        let verification = await fetch("/api/backend/users/me", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (disposed) return;

        if (verification.status === 401 || verification.status === 403) {
          const restored = await refreshSavedSession(controller.signal);
          if (disposed) return;
          if (restored.status === 401 || restored.status === 403) {
            const next = encodeURIComponent(returnToApp());
            window.location.replace(`/login?next=${next}`);
            return;
          }
          if (!restored.ok) {
            schedule();
            return;
          }

          verification = await fetch("/api/backend/users/me", {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          });
          if (disposed) return;
        }

        if (!verification.ok) {
          schedule();
          return;
        }

        // Mark the recovered opening as already played before the document
        // navigation. AppLaunch consumes this on the first protected route.
        try {
          sessionStorage.setItem(RECOVERY_LAUNCH_KEY, "1");
        } catch {
          // Storage may be unavailable in hardened browsers.
        }
        const remaining = Math.max(0, APP_LAUNCH_MIN_MS - (performance.now() - startedAt));
        timer = window.setTimeout(() => {
          if (!disposed) window.location.replace(returnToApp());
        }, remaining);
      } catch (error) {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError"))
          schedule();
      } finally {
        inFlight = false;
      }
    };

    const retryWhenOnline = () => {
      if (disposed) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => void recover(), 0);
    };
    const retryWhenVisible = () => {
      if (document.visibilityState === "visible") retryWhenOnline();
    };

    // Allow the first frame of the splash to render before network work.
    timer = window.setTimeout(() => void recover(), 0);
    window.addEventListener("online", retryWhenOnline);
    document.addEventListener("visibilitychange", retryWhenVisible);
    return () => {
      disposed = true;
      controller?.abort();
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("online", retryWhenOnline);
      document.removeEventListener("visibilitychange", retryWhenVisible);
    };
  }, []);

  return (
    <main className="auth-session-gate" aria-label="Abertura do Enturma">
      <LaunchSplash>
        <span className="sr-only">Verificando sua sessão e reconectando automaticamente…</span>
      </LaunchSplash>
    </main>
  );
}
