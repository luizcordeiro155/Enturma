"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

export function usePrivateTyping(friendship?: string) {
  const [users, setUsers] = useState<{ name: string; userId: string }[]>([]);
  const lastSent = useRef(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stop = useCallback(() => {
    clearTimeout(stopTimer.current);
    if (!friendship || !lastSent.current) return;
    lastSent.current = 0;
    void api(`/friends/${friendship}/typing`, {
      method: "POST",
      body: JSON.stringify({ typing: false }),
      keepalive: true,
    }).catch(() => {});
  }, [friendship]);
  const type = useCallback(
    (value: string) => {
      if (!value.trim() || document.hidden) {
        stop();
        return;
      }
      clearTimeout(stopTimer.current);
      if (friendship && Date.now() - lastSent.current >= 2000) {
        lastSent.current = Date.now();
        void api(`/friends/${friendship}/typing`, {
          method: "POST",
          body: JSON.stringify({ typing: true }),
        }).catch(() => {});
      }
      stopTimer.current = setTimeout(stop, 1800);
    },
    [friendship, stop],
  );
  useEffect(() => {
    if (!friendship) return;
    let active = true,
      loading = false,
      queued = false;
    let expiry: ReturnType<typeof setTimeout>;
    const load = async () => {
      if (!active || document.hidden) return;
      if (loading) {
        queued = true;
        return;
      }
      loading = true;
      try {
        const list = await api<
          { userId: string; name: string; remainingMs: number }[]
        >(`/friends/${friendship}/typing`, { cache: "no-store" });
        if (active) {
          setUsers(list);
          clearTimeout(expiry);
          expiry = setTimeout(
            () => setUsers([]),
            Math.max(
              0,
              ...list.map((user) => Math.min(6000, user.remainingMs)),
            ),
          );
        }
      } catch {
        if (active) setUsers([]);
      } finally {
        loading = false;
        if (queued && active) {
          queued = false;
          void load();
        }
      }
    };
    const changed = () => void load();
    const visible = () => {
      if (document.hidden) {
        stop();
        setUsers([]);
      } else void load();
    };
    queueMicrotask(() => {
      setUsers([]);
      void load();
    });
    const fallback = setInterval(changed, 3000);
    window.addEventListener("enturma-private_typing_changed", changed);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      stop();
      clearInterval(fallback);
      clearTimeout(expiry);
      window.removeEventListener("enturma-private_typing_changed", changed);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [friendship, stop]);
  return { users: friendship ? users : [], type, stop };
}
