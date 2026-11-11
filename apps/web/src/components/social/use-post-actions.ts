"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { socialWrite, type SocialPost as Post } from "@/lib/social";

/** Reactions and owner/viewer actions shared by the feed card and the Clip overlay. */
export function usePostActions(item: Post, changed: (p: Post) => void) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const liking = useRef(false);
  async function react(kind: "LIKE" | "SAVE" | "REPOST" | "HIDE") {
    if (busy) return;
    setBusy(true);
    try {
      changed(
        await socialWrite<Post>(`/posts/${item.id}/reactions/${kind}`, {
          active: !item.mine.includes(kind),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  /** Double tap: only ever adds the like, so a second double tap cannot remove it. */
  async function like() {
    if (item.mine.includes("LIKE") || liking.current) return;
    liking.current = true;
    try {
      changed(
        await socialWrite<Post>(`/posts/${item.id}/reactions/LIKE`, {
          active: true,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      liking.current = false;
    }
  }
  /** Resolves to true when the write succeeded, so the caller can close its dialog. */
  async function act(path: string, body?: unknown, method = "PUT") {
    setBusy(true);
    try {
      await socialWrite(path, body, method);
      if (method === "DELETE" || path.endsWith("/mute"))
        changed({ ...item, mine: [...item.mine, "HIDE"] });
      else
        changed(
          await api<Post>(`/social/posts/${item.id}`, { cache: "no-store" }),
        );
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, setError, react, like, act };
}
