"use client";
import { useEffect, useLayoutEffect, useRef } from "react";

let pendingBack: Promise<void> | undefined;
const overlays: string[] = [];

/** Focus restoration must follow the asynchronous Back traversal. */
export function waitForOverlayHistory() {
  return pendingBack ?? Promise.resolve();
}

/** Back closes the top overlay before navigating out of the conversation. */
export function useOverlayHistory(onClose: () => void, enabled = true) {
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!enabled) return;
    const id = crypto.randomUUID();
    let disposed = false;
    let installed = false;
    const back = () => {
      // Only the top panel owns Back. A programmatic close/replacement already
      // removed its owner; its history traversal must not dismiss an ancestor.
      if (
        !pendingBack &&
        overlays.at(-1) === id &&
        history.state?.enturmaOverlay !== id
      )
        close.current();
    };
    // Defer installation through React's development effect replay, and wait
    // for the previous overlay's asynchronous history traversal to finish.
    void Promise.resolve().then(async () => {
      if (pendingBack) await pendingBack;
      if (disposed) return;
      history.pushState(
        { ...history.state, enturmaOverlay: id },
        "",
        location.href,
      );
      overlays.push(id);
      installed = true;
      window.addEventListener("popstate", back);
    });
    return () => {
      disposed = true;
      window.removeEventListener("popstate", back);
      const index = overlays.indexOf(id);
      if (index !== -1) overlays.splice(index, 1);
      if (!installed || history.state?.enturmaOverlay !== id) return;
      pendingBack = new Promise<void>((resolve) => {
        const finish = () => {
          clearTimeout(timeout);
          window.removeEventListener("popstate", finish);
          pendingBack = undefined;
          resolve();
        };
        const timeout = window.setTimeout(finish, 500);
        window.addEventListener("popstate", finish, { once: true });
        history.back();
      });
    };
  }, [enabled]);
}
