import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { api, base, session } from "./api";

export function useRealtime(
  callback: (event: Record<string, unknown>) => void,
  roomId?: string,
  scope: "activity" | "rides" = "activity",
) {
  const cb = useRef(callback);

  useEffect(() => {
    cb.current = callback;
  }, [callback]);

  useEffect(() => {
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
        // Forces token renewal before opening the socket.
        await api("/users/me");
        const credentials = await session();
        if (!live || !credentials || AppState.currentState !== "active") return;

        const current = new WebSocket(
          base.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "/ws"),
        );
        ws = current;

        current.onopen = () =>
          current.send(
            JSON.stringify({
              token: credentials.accessToken,
              ...(roomId ? { roomId } : { scope }),
            }),
          );

        current.onmessage = (e) => {
          try {
            attempt = 0;
            cb.current(JSON.parse(e.data));
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

    const sub = AppState.addEventListener("change", (state) => {
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
      sub.remove();
      const current = ws;
      ws = undefined;
      current?.close();
    };
  }, [roomId, scope]);
}
