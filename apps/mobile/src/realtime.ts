import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { api, base, session } from "./api";

type RealtimeEvent = Record<string, unknown>;
type Subscriber = (event: RealtimeEvent) => void;

const activitySubscribers = new Set<Subscriber>();
let activitySocket: WebSocket | undefined;
let activityTimer: ReturnType<typeof setTimeout> | undefined;
let activityAttempt = 0;
let activityConnecting = false;
let appStateSubscribed = false;

function socketUrl() {
  return base.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "/ws");
}

function closeActivitySocket() {
  if (activityTimer) clearTimeout(activityTimer);
  activityTimer = undefined;
  const current = activitySocket;
  activitySocket = undefined;
  current?.close();
}

function scheduleActivityReconnect(delay?: number) {
  if (
    activitySubscribers.size === 0 ||
    AppState.currentState !== "active" ||
    activityTimer
  )
    return;
  activityTimer = setTimeout(() => {
    activityTimer = undefined;
    void ensureActivitySocket();
  }, delay ?? Math.min(15000, 1000 * 2 ** activityAttempt++));
}

async function ensureActivitySocket() {
  if (
    activitySubscribers.size === 0 ||
    AppState.currentState !== "active" ||
    activityConnecting ||
    (activitySocket &&
      (activitySocket.readyState === WebSocket.CONNECTING ||
        activitySocket.readyState === WebSocket.OPEN))
  )
    return;

  activityConnecting = true;
  try {
    // Renew the access token before opening the single shared activity channel.
    await api("/users/me");
    const credentials = await session();
    if (
      !credentials ||
      activitySubscribers.size === 0 ||
      AppState.currentState !== "active"
    )
      return;

    const current = new WebSocket(socketUrl());
    activitySocket = current;

    current.onopen = () => {
      if (activitySocket !== current) return;
      activityAttempt = 0;
      current.send(
        JSON.stringify({
          token: credentials.accessToken,
          scope: "activity",
        }),
      );
    };

    current.onmessage = (message) => {
      try {
        activityAttempt = 0;
        const event = JSON.parse(message.data) as RealtimeEvent;
        for (const subscriber of [...activitySubscribers]) subscriber(event);
      } catch {}
    };

    current.onerror = () => current.close();
    current.onclose = () => {
      if (activitySocket === current) activitySocket = undefined;
      scheduleActivityReconnect();
    };
  } catch {
    scheduleActivityReconnect(3000);
  } finally {
    activityConnecting = false;
  }
}

function ensureAppStateSubscription() {
  if (appStateSubscribed) return;
  appStateSubscribed = true;
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      activityAttempt = 0;
      void ensureActivitySocket();
      return;
    }
    closeActivitySocket();
  });
}

function subscribeActivity(subscriber: Subscriber) {
  ensureAppStateSubscription();
  activitySubscribers.add(subscriber);
  void ensureActivitySocket();
  return () => {
    activitySubscribers.delete(subscriber);
    if (activitySubscribers.size === 0) closeActivitySocket();
  };
}

export function useRealtime(
  callback: (event: RealtimeEvent) => void,
  roomId?: string,
  scope: "activity" | "rides" = "activity",
) {
  const cb = useRef(callback);

  useEffect(() => {
    cb.current = callback;
  }, [callback]);

  useEffect(() => {
    const subscriber: Subscriber = (event) => cb.current(event);

    // Every mounted mobile screen shares exactly one activity WebSocket.
    if (!roomId && scope === "activity") return subscribeActivity(subscriber);

    // Room/ride channels remain isolated and only exist while that screen needs them.
    let live = true;
    let ws: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const schedule = (delay?: number) => {
      if (!live || AppState.currentState !== "active") return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(
        () => void connect(),
        delay ?? Math.min(15000, 1000 * 2 ** attempt++),
      );
    };

    async function connect() {
      if (!live || AppState.currentState !== "active") return;
      if (
        ws &&
        (ws.readyState === WebSocket.CONNECTING ||
          ws.readyState === WebSocket.OPEN)
      )
        return;

      try {
        await api("/users/me");
        const credentials = await session();
        if (!live || !credentials || AppState.currentState !== "active") return;

        const current = new WebSocket(socketUrl());
        ws = current;
        current.onopen = () =>
          current.send(
            JSON.stringify({
              token: credentials.accessToken,
              ...(roomId ? { roomId } : { scope }),
            }),
          );
        current.onmessage = (message) => {
          try {
            attempt = 0;
            subscriber(JSON.parse(message.data));
          } catch {}
        };
        current.onerror = () => current.close();
        current.onclose = () => {
          if (ws === current) ws = undefined;
          schedule();
        };
      } catch {
        schedule(3000);
      }
    }

    void connect();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        attempt = 0;
        void connect();
      } else {
        if (timer) clearTimeout(timer);
        timer = undefined;
        const current = ws;
        ws = undefined;
        current?.close();
      }
    });

    return () => {
      live = false;
      if (timer) clearTimeout(timer);
      appState.remove();
      const current = ws;
      ws = undefined;
      current?.close();
    };
  }, [roomId, scope]);
}
