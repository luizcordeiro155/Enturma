"use client";
import { useEffect } from "react";
import { api } from "./api";

export function useStudyActivity(
  kind: "GAME" | "PRACTICE" | "NOTEBOOK" | "ROOM",
  active = true,
) {
  useEffect(() => {
    if (!active) return;
    let mounted = true;
    const stop = () =>
      void api(`/users/me/activity?kind=${kind}`, {
        method: "DELETE",
        keepalive: true,
      }).catch(() => {});
    const ping = () => {
      if (!mounted) return;
      if (document.hidden) {
        stop();
        return;
      }
      void api("/users/me/activity", {
        method: "POST",
        body: JSON.stringify({ kind }),
      }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 30000);
    document.addEventListener("visibilitychange", ping);
    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
      stop();
    };
  }, [kind, active]);
}
