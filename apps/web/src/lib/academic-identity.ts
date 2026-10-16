"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

export type AcademicIdentity = {
  userId: string;
  status:
    | "LEGACY_APPROVED"
    | "PENDING"
    | "EMAIL_PENDING"
    | "PENDING_REVIEW"
    | "STUDENT_VERIFIED"
    | "REJECTED";
  institutionId: string | null;
  institutionName: string | null;
  campusId: string | null;
  campusName: string | null;
  academicEmail: string | null;
  accessAllowed: boolean;
  method: string | null;
  confidence: string | null;
  reviewReason: string | null;
  tokenExpiresAt: string | null;
  documentExpiresAt: string | null;
  delivery: "QUEUED" | "SENT" | "FAILED" | null;
  revision: number;
};
export type AcademicInstitution = {
  id: string;
  name: string;
  domains: {
    domain: string;
    shared: boolean;
    allowSubdomains: boolean;
    sourceUrl: string;
  }[];
};

export function announceAcademicChange() {
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("enturma-academic")
      : null;
  channel?.postMessage({ type: "revalidate" });
  channel?.close();
  window.dispatchEvent(new Event("enturma-academic-revalidate"));
}

/** Events only request a recheck. Approval always comes from the authenticated API. */
export function useAcademicIdentity() {
  const [identity, setIdentity] = useState<AcademicIdentity | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const alive = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const invalidated = useRef(false);
  const refresh = useCallback(() => {
    invalidated.current = true;
    if (inFlight.current) return inFlight.current;
    const task = (async () => {
      // An event arriving during a read must cause another server read, not be lost.
      do {
        invalidated.current = false;
        try {
          const value = await api<AcademicIdentity>("/auth/academic/status", {
            cache: "no-store",
          });
          if (alive.current) {
            setIdentity(value);
            setError("");
          }
        } catch (e) {
          if (alive.current) setError((e as Error).message);
        }
      } while (alive.current && invalidated.current);
    })().finally(() => {
      inFlight.current = null;
      if (alive.current) setLoading(false);
    });
    inFlight.current = task;
    return task;
  }, []);
  useEffect(() => {
    alive.current = true;
    let socket: WebSocket | null = null;
    let stopped = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let opening = false;
    async function connect() {
      if (
        stopped ||
        opening ||
        document.visibilityState !== "visible" ||
        (socket && socket.readyState < WebSocket.CLOSING)
      )
        return;
      opening = true;
      try {
        await refresh();
        const session = await fetch("/api/session", { cache: "no-store" });
        if (!session.ok) throw Error("Sessão indisponível");
        const { token, url } = await session.json();
        if (stopped || document.visibilityState !== "visible") return;
        const ws = new WebSocket(url);
        socket = ws;
        ws.onopen = () => {
          ws.send(JSON.stringify({ token, scope: "academic" }));
          heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN)
              ws.send(JSON.stringify({ type: "ping" }));
          }, 25000);
        };
        ws.onmessage = (event) => {
          try {
            if (
              ["academic_ready", "academic_identity_changed"].includes(
                JSON.parse(event.data).type,
              )
            )
              void refresh();
          } catch {}
        };
        ws.onerror = () => ws.close();
        ws.onclose = () => {
          clearInterval(heartbeat);
          if (socket === ws) socket = null;
          if (!stopped && document.visibilityState === "visible")
            retry = setTimeout(connect, 5000);
        };
      } catch {
        if (!stopped) retry = setTimeout(connect, 10000);
      } finally {
        opening = false;
      }
    }
    const recheck = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        void connect();
      }
    };
    const visibility = () => {
      if (document.visibilityState === "visible") recheck();
      else {
        clearTimeout(retry);
        clearInterval(heartbeat);
        socket?.close();
      }
    };
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("enturma-academic")
        : null;
    channel?.addEventListener("message", recheck);
    const poll = setInterval(recheck, 12000);
    void connect();
    window.addEventListener("focus", recheck);
    window.addEventListener("online", recheck);
    window.addEventListener("enturma-academic-revalidate", recheck);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      alive.current = false;
      stopped = true;
      clearInterval(poll);
      clearInterval(heartbeat);
      clearTimeout(retry);
      socket?.close();
      channel?.close();
      window.removeEventListener("focus", recheck);
      window.removeEventListener("online", recheck);
      window.removeEventListener("enturma-academic-revalidate", recheck);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [refresh]);
  return { identity, error, loading, refresh };
}
