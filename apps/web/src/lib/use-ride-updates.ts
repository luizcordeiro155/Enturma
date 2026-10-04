"use client";
import { useEffect, useRef, useState } from "react";
import { api, invalidateApiCache } from "./api";

type Refresh = () => Promise<void>;
type StatusListener = (live: boolean) => void;

const refreshers = new Set<Refresh>();
const statusListeners = new Set<StatusListener>();

let consumers = 0;
let connected = false;
let attempts = 0;
let socket: WebSocket | undefined;
let retry: ReturnType<typeof setTimeout> | undefined;
let fallback: ReturnType<typeof setInterval> | undefined;
let refreshing = false;
let queued = false;

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  for (const listener of statusListeners) listener(value);
}

async function refreshAll() {
  if (refreshing) {
    queued = true;
    return;
  }
  refreshing = true;
  invalidateApiCache("/rides");
  invalidateApiCache("/matches");
  try {
    await Promise.allSettled([...refreshers].map((refresh) => refresh()));
  } finally {
    refreshing = false;
    if (queued && consumers > 0) {
      queued = false;
      void refreshAll();
    }
  }
}

function scheduleReconnect() {
  if (consumers <= 0) return;
  if (retry) clearTimeout(retry);
  retry = setTimeout(
    () => void connect(),
    Math.min(15000, 1000 * 2 ** attempts++),
  );
}

async function connect() {
  if (consumers <= 0) return;
  if (
    socket &&
    (socket.readyState === WebSocket.CONNECTING ||
      socket.readyState === WebSocket.OPEN)
  )
    return;

  try {
    // Never trust the cached profile when opening a realtime channel. A cached
    // /users/me could keep an expired access token alive for tens of seconds.
    await api("/users/me", { cache: "no-store" });
    const response = await fetch("/api/session", { cache: "no-store" });
    if (!response.ok) throw Error("Sessão indisponível");
    const { token, url } = await response.json();
    if (consumers <= 0) return;

    const ws = new WebSocket(url);
    socket = ws;
    ws.onopen = () =>
      ws.send(JSON.stringify({ token, scope: "rides" }));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "rides_ready") {
          attempts = 0;
          setConnected(true);
          void refreshAll();
        } else if (data.type === "rides_changed") {
          void refreshAll();
        }
      } catch {}
    };
    ws.onerror = () => ws.close();
    ws.onclose = () => {
      if (socket === ws) socket = undefined;
      setConnected(false);
      scheduleReconnect();
    };
  } catch {
    setConnected(false);
    scheduleReconnect();
  }
}

function startTransport() {
  consumers += 1;
  if (consumers > 1) return;

  void connect();

  fallback = setInterval(() => {
    if (
      document.hidden ||
      (connected && socket?.readyState === WebSocket.OPEN)
    )
      return;

    // WebSocket is the normal transport. Poll only while realtime is unavailable,
    // so a healthy connection never causes periodic duplicate API refreshes.
    void refreshAll();
    void connect();
  }, 60000);

  const visible = () => {
    if (document.hidden) return;
    void refreshAll();
    void connect();
  };
  const online = () => {
    void refreshAll();
    void connect();
  };

  document.addEventListener("visibilitychange", visible);
  window.addEventListener("online", online);

  transportCleanup = () => {
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("online", online);
  };
}

let transportCleanup: (() => void) | undefined;

function stopTransport() {
  consumers = Math.max(0, consumers - 1);
  if (consumers > 0) return;

  if (retry) clearTimeout(retry);
  if (fallback) clearInterval(fallback);
  retry = undefined;
  fallback = undefined;
  transportCleanup?.();
  transportCleanup = undefined;

  const current = socket;
  socket = undefined;
  if (current && current.readyState < WebSocket.CLOSING) current.close();
  setConnected(false);
  attempts = 0;
}

export function useRideUpdates(refresh: () => Promise<void>) {
  const latest = useRef(refresh);
  const [live, setLive] = useState(connected);

  useEffect(() => {
    latest.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const run = () => latest.current();
    const onStatus = (value: boolean) => setLive(value);

    refreshers.add(run);
    statusListeners.add(onStatus);
    const initialStatusTimer = window.setTimeout(() => setLive(connected), 0);
    startTransport();

    return () => {
      window.clearTimeout(initialStatusTimer);
      refreshers.delete(run);
      statusListeners.delete(onStatus);
      stopTransport();
    };
  }, []);

  return live;
}
