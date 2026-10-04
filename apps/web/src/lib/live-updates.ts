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
  | "friends_changed"
  | "profile_changed"
  | "profile_changed";

let liveConnected = false;
let liveStarted = false;

function markDisconnected() {
  liveConnected = false;
  if (typeof document !== "undefined")
    document.documentElement.dataset.realtime = "disconnected";
}

export function useAppConnection() {
  useEffect(() => {
    let active = true;
    let attempt = 0;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;

    async function connect() {
      try {
        await api("/users/me", { cache: "no-store" });
        const response = await fetch("/api/session", { cache: "no-store" });
        if (!response.ok) throw Error("Sessão realtime indisponível.");
        const { token, url } = await response.json();
        if (!active) return;

        const ws = new WebSocket(url);
        socket = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ token, scope: "activity" }));
        };

        ws.onmessage = (event) => {
          try {
            const { type } = JSON.parse(event.data);
            if (type === "app_ready") {
              const reconnecting = liveStarted && !liveConnected;
              liveConnected = true;
              liveStarted = true;
              attempt = 0;
              document.documentElement.dataset.realtime = "connected";
              window.dispatchEvent(new Event("enturma-live-ready"));

              // A primeira conexão não deve fazer a tela "piscar" nem
              // refazer todas as consultas. Só resincronizamos após uma queda.
              if (reconnecting)
                window.dispatchEvent(new Event("enturma-live-resync"));
              return;
            }

            if (
              [
                "forum_changed",
                "notifications_changed",
                "achievement_unlocked",
                "moderation_action",
                "room_member_joined",
                "room_member_left",
                "room_expiring",
                "rooms_changed",
                "friends_changed",
                "profile_changed",
              ].includes(type)
            ) {
              window.dispatchEvent(new Event(`enturma-${type}`));
            }
          } catch {
            // Mensagens inválidas do socket não alteram a interface.
          }
        };

        ws.onerror = () => ws.close();
        ws.onclose = () => {
          markDisconnected();
          if (active)
            retry = setTimeout(
              connect,
              Math.min(15000, 1000 * 2 ** attempt++),
            );
        };
      } catch {
        markDisconnected();
        if (active)
          retry = setTimeout(
            connect,
            Math.min(15000, 1000 * 2 ** attempt++),
          );
      }
    }

    void connect();
    return () => {
      active = false;
      markDisconnected();
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
    let active = true;
    let running = false;
    let queued = false;
    let lastRunAt = 0;
    let delay: ReturnType<typeof setTimeout>;

    const prefixes: Partial<Record<AppEventType, string>> = {
      forum_changed: "/forum",
      notifications_changed: "/notifications",
      rooms_changed: "/study-rooms",
      friends_changed: "/friends",
      profile_changed: "/users",
    };

    async function run() {
      if (!active || document.hidden) return;
      if (running) {
        queued = true;
        return;
      }

      running = true;
      lastRunAt = Date.now();
      try {
        await latest.current();
      } catch {
        // Sincronização silenciosa: nunca desmonta nem recarrega a página.
      } finally {
        running = false;
        if (queued && active) {
          queued = false;
          void run();
        }
      }
    }

    const refresh = () => {
      const prefix = prefixes[type];
      if (prefix) invalidateApiCache(prefix);
      clearTimeout(delay);
      delay = setTimeout(() => void run(), 120);
    };

    const resync = () => refresh();

    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        !liveConnected &&
        Date.now() - lastRunAt >= Math.max(interval, 60000)
      ) {
        refresh();
      }
    };

    // WebSocket é a fonte normal. Polling só entra como rede de segurança
    // quando o realtime realmente caiu, e nunca recarrega a rota/documento.
    const fallbackEvery = Math.max(interval, 60000);
    const timer = window.setInterval(() => {
      if (!liveConnected && !document.hidden) refresh();
    }, fallbackEvery);

    window.addEventListener(`enturma-${type}`, refresh);
    window.addEventListener("enturma-live-resync", resync);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearTimeout(delay);
      window.clearInterval(timer);
      window.removeEventListener(`enturma-${type}`, refresh);
      window.removeEventListener("enturma-live-resync", resync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [type, interval]);
}
