"use client";
import { useEffect, useRef } from "react";
import { api, invalidateApiCache } from "./api";

export type AppEventType =
  | "forum_changed"
  | "notifications_changed"
  | "achievement_unlocked"
  | "moderation_action"
  | "room_member_joined"
  | "room_member_left"
  | "room_expiring"
  | "rooms_changed"
  | "campus_changed"
  | "teaching_changed"
  | "friends_changed"
  | "profile_changed"
  | "groups_changed";
export function useAppConnection() {
  useEffect(() => {
    let active = true,
      attempt = 0;
    let socket: WebSocket | undefined, retry: ReturnType<typeof setTimeout>;
    async function connect() {
      try {
        await api("/users/me", { cache: "no-store" });
        const response = await fetch("/api/session");
        if (!response.ok) throw Error();
        const { token, url } = await response.json();
        if (!active) return;
        const ws = new WebSocket(url);
        socket = ws;
        ws.onopen = () => ws.send(JSON.stringify({ token, scope: "activity" }));
        ws.onmessage = (e) => {
          try {
            const { type } = JSON.parse(e.data);
            if (type === "app_ready") {
              attempt = 0;
              window.dispatchEvent(new Event("enturma-live-ready"));
            } else if (
              [
                "forum_changed",
                "notifications_changed",
                "achievement_unlocked",
                "moderation_action",
                "room_member_joined",
                "room_member_left",
                "room_expiring",
                "rooms_changed",
                "campus_changed",
                "teaching_changed",
                "friends_changed",
                "profile_changed",
                "groups_changed",
              ].includes(type)
            )
              window.dispatchEvent(new Event(`enturma-${type}`));
          } catch {}
        };
        ws.onerror = () => ws.close();
        ws.onclose = () => {
          if (active)
            retry = setTimeout(connect, Math.min(15000, 1000 * 2 ** attempt++));
        };
      } catch {
        if (active)
          retry = setTimeout(connect, Math.min(15000, 1000 * 2 ** attempt++));
      }
    }
    void connect();
    return () => {
      active = false;
      clearTimeout(retry);
      socket?.close();
    };
  }, []);
}
export function useLiveRefresh(
  type: AppEventType,
  callback: () => Promise<unknown>,
  interval = 10000,
) {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  }, [callback]);
  useEffect(() => {
    let active = true,
      running = false,
      queued = false;
    let delay: ReturnType<typeof setTimeout>;
    async function run() {
      if (!active || document.hidden) return;
      if (running) {
        queued = true;
        return;
      }
      running = true;
      try {
        await latest.current();
      } catch {
      } finally {
        running = false;
        if (queued && active) {
          queued = false;
          void run();
        }
      }
    }
    const refresh = () => {
      const prefixes: Partial<Record<AppEventType, string>> = {
        forum_changed: "/forum",
        notifications_changed: "/notifications",
        rooms_changed: "/study-rooms",
        campus_changed: "/campus",
        teaching_changed: "/teaching",
        friends_changed: "/friends",
        profile_changed: "/users",
        groups_changed: "/campus/groups",
      };
      const prefix = prefixes[type];
      if (prefix) invalidateApiCache(prefix);
      clearTimeout(delay);
      delay = setTimeout(() => void run(), 75);
    };
    const timer = setInterval(refresh, interval);
    window.addEventListener(`enturma-${type}`, refresh);
    window.addEventListener("enturma-live-ready", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      clearTimeout(delay);
      clearInterval(timer);
      window.removeEventListener(`enturma-${type}`, refresh);
      window.removeEventListener("enturma-live-ready", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [type, interval]);
}
