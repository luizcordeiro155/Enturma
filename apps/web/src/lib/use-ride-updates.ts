"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "./api";
export function useRideUpdates(refresh: () => Promise<void>) {
  const latest = useRef(refresh);
  const [live, setLive] = useState(false);
  useEffect(() => {
    latest.current = refresh;
  }, [refresh]);
  useEffect(() => {
    let active = true,
      connected = false,
      attempts = 0,
      running = false,
      queued = false;
    let socket: WebSocket | undefined,
      retry: ReturnType<typeof setTimeout> | undefined;
    async function update() {
      if (!active) return;
      if (running) {
        queued = true;
        return;
      }
      running = true;
      try {
        await latest.current();
      } catch {
        /* The page displays fetch failures. */
      } finally {
        running = false;
        if (queued && active) {
          queued = false;
          void update();
        }
      }
    }
    async function connect() {
      try {
        await api("/users/me");
        const response = await fetch("/api/session");
        if (!response.ok) throw Error("Sessão indisponível");
        const { token, url } = await response.json();
        if (!active) return;
        socket = new WebSocket(url);
        socket.onopen = () =>
          socket?.send(JSON.stringify({ token, scope: "rides" }));
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "rides_ready") {
              connected = true;
              setLive(true);
              attempts = 0;
              void update();
            } else if (data.type === "rides_changed") void update();
          } catch {}
        };
        socket.onclose = () => {
          connected = false;
          if (active) {
            setLive(false);
            retry = setTimeout(
              connect,
              Math.min(15000, 1000 * 2 ** attempts++),
            );
          }
        };
        socket.onerror = () => socket?.close();
      } catch {
        if (active)
          retry = setTimeout(connect, Math.min(15000, 1000 * 2 ** attempts++));
      }
    }
    void connect();
    const fallback = setInterval(() => {
      if (!connected && !document.hidden) void update();
    }, 5000);
    const visible = () => {
      if (!document.hidden) void update();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      clearTimeout(retry);
      clearInterval(fallback);
      document.removeEventListener("visibilitychange", visible);
      socket?.close();
    };
  }, []);
  return live;
}
