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
    let live = true,
      ws: WebSocket | undefined,
      timer: ReturnType<typeof setTimeout>,
      attempt = 0;
    async function connect() {
      if (!live || AppState.currentState !== "active") return;
      try {
        await api("/users/me");
        const credentials = await session();
        if (!live || !credentials) return;
        ws = new WebSocket(
          base.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "/ws"),
        );
        ws.onopen = () =>
          ws?.send(
            JSON.stringify({
              token: credentials.accessToken,
              ...(roomId ? { roomId } : { scope }),
            }),
          );
        ws.onmessage = (e) => {
          try {
            attempt = 0;
            cb.current(JSON.parse(e.data));
          } catch {}
        };
        ws.onclose = () => {
          if (live)
            timer = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt++));
        };
      } catch {
        if (live) timer = setTimeout(connect, 10000);
      }
    }
    void connect();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && (!ws || ws.readyState === 3)) void connect();
    });
    return () => {
      live = false;
      clearTimeout(timer);
      sub.remove();
      ws?.close();
    };
  }, [roomId, scope]);
}
