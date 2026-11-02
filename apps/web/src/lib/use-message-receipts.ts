"use client";
import { useEffect, useRef, type RefObject } from "react";
import { post } from "./api";

/** Receipt writes describe client consumption, never connection/presence or notification delivery. */
export function useMessageReceipts(
  endpoint: string | undefined,
  ids: string[],
  viewport: RefObject<HTMLElement | null>,
) {
  const acknowledged = useRef<{
    endpoint?: string;
    delivered: Set<string>;
    read: Set<string>;
  }>({ delivered: new Set(), read: new Set() });
  const key = ids.join(",");
  useEffect(() => {
    if (!endpoint || !viewport.current || !key) return;
    if (acknowledged.current.endpoint !== endpoint)
      acknowledged.current = {
        endpoint,
        delivered: new Set(),
        read: new Set(),
      };
    const state = acknowledged.current;
    const received = key.split(",");
    const visible = new Set<string>();
    let stopped = false;
    let pending = false;
    let retryAfter = 0;
    async function flush() {
      if (stopped || pending || Date.now() < retryAfter) return;
      pending = true;
      try {
        for (const read of [false, true]) {
          const known = read ? state.read : state.delivered;
          const isReading =
            document.visibilityState === "visible" && document.hasFocus();
          const todo = (
            read ? (isReading ? [...visible] : []) : received
          ).filter((id) => !known.has(id));
          for (let i = 0; i < todo.length && !stopped; i += 100) {
            if (
              read &&
              (document.visibilityState !== "visible" || !document.hasFocus())
            )
              break;
            const messageIds = todo
              .slice(i, i + 100)
              .filter((id) => !read || visible.has(id));
            if (!messageIds.length) continue;
            await post(endpoint!, { messageIds, read });
            messageIds.forEach((id) => {
              known.add(id);
              if (read) state.delivered.add(id);
            });
          }
        }
      } catch {
        // Connectivity loss never turns unconfirmed receipt into delivery/read.
        retryAfter = Date.now() + 5000;
      } finally {
        pending = false;
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.receiptId!;
          if (
            entry.isIntersecting &&
            entry.intersectionRect.height >=
              Math.min(64, entry.boundingClientRect.height * 0.5)
          )
            visible.add(id);
          else visible.delete(id);
        }
      },
      { root: viewport.current, threshold: [0, 0.1, 0.5, 1] },
    );
    const allowed = new Set(received);
    viewport.current
      .querySelectorAll<HTMLElement>("[data-receipt-id]")
      .forEach((node) => {
        if (allowed.has(node.dataset.receiptId!)) observer.observe(node);
      });
    // A small batch interval absorbs both scroll and realtime updates; retry is bounded above.
    const timer = window.setInterval(() => void flush(), 600);
    void flush();
    return () => {
      stopped = true;
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [endpoint, key, viewport]);
}
