"use client";
import { useEffect } from "react";
import { api, post } from "./api";

type PendingDelivery = { id: string; contextKey: string };
type ReceivedEnvelope = {
  id: string;
  deletedAt?: string;
  hiddenAt?: string;
  ciphertext?: string;
  iv?: string;
};
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

/** Fetching a notice or seeing a peer online is NOT message delivery. Fetch the actual envelope. */
export async function receivePendingMessages(
  active: () => boolean,
  signal: AbortSignal,
) {
  const pending = await api<PendingDelivery[]>("/messages/pending-delivery", {
    cache: "no-store",
    signal,
  });
  const groups = new Map<string, string[]>();
  for (const item of pending.slice(0, 20)) {
    if (!active()) return;
    const [kind, conversation] = item.contextKey.split(":");
    if (
      !uuid.test(item.id) ||
      !uuid.test(conversation ?? "") ||
      !["friend", "room"].includes(kind)
    )
      continue;
    const endpoint = `/${kind === "friend" ? "friends" : "study-rooms"}/${conversation}/messages`;
    try {
      const rows = await api<ReceivedEnvelope[]>(
        `${endpoint}/target/${item.id}`,
        { cache: "no-store", signal },
      );
      const message = rows.find(
        (row) => row.id === item.id && !row.deletedAt && !row.hiddenAt,
      );
      // Keep private contents encrypted. This receiver neither renders nor declares them read.
      if (
        !message ||
        (kind === "friend" && (!message.ciphertext || !message.iv))
      )
        continue;
      groups.set(endpoint, [...(groups.get(endpoint) ?? []), item.id]);
    } catch {
      /* Membership may have changed, or the connection failed. No acknowledgement. */
    }
  }
  for (const [endpoint, messageIds] of groups) {
    if (!active()) return;
    await post(`${endpoint}/receipts`, { messageIds, read: false });
  }
}

export function useBackgroundMessageDelivery(sessionEpoch: number) {
  useEffect(() => {
    let active = true,
      running = false;
    let lastRun = 0;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const receive = async () => {
      if (!active || running) return;
      running = true;
      lastRun = Date.now();
      try {
        await receivePendingMessages(() => active, controller.signal);
      } catch {
        /* Auth/network failures retain receipts pending on the server. */
      } finally {
        running = false;
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      // Keep background receipts from competing with chat writes or retrying in a tight loop.
      timer = setTimeout(
        () => void receive(),
        Math.max(200, 1000 - (Date.now() - lastRun)),
      );
    };
    const events = [
      "enturma-notifications_changed",
      "enturma-friends_changed",
      "enturma-live-resync",
      "focus",
    ];
    events.forEach((event) => window.addEventListener(event, schedule));
    document.addEventListener("visibilitychange", schedule);
    const fallback = window.setInterval(() => {
      if (!document.hidden || window.enturmaDesktop) schedule();
    }, 30000);
    schedule();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
      clearInterval(fallback);
      events.forEach((event) => window.removeEventListener(event, schedule));
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [sessionEpoch]);
}
