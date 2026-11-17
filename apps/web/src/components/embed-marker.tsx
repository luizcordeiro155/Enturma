"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** True inside the Mostra+ frame. Page loads there arrive without cookies; fetches carry them. */
export function isEmbedded(win: Window = window) {
  if (win.document.documentElement.dataset.embedded === "true") return true;
  try {
    return win.self !== win.top;
  } catch {
    return true;
  }
}

/**
 * Inside a frame (only Mostra+ is allowed by frame-ancestors) the session cookies must be
 * partitioned to work. This partitioned marker tells the server to issue them that way.
 */
export function markEmbedding(win: Window = window) {
  let framed: boolean;
  try {
    framed = win.self !== win.top;
  } catch {
    framed = true;
  }
  const attributes = "Path=/; Secure; SameSite=None; Partitioned";
  if (framed) {
    win.document.cookie = `enturma_embed=1; Max-Age=86400; ${attributes}`;
    win.document.documentElement.dataset.embedded = "true";
  } else if (win.document.cookie.includes("enturma_embed=")) {
    win.document.cookie = `enturma_embed=; Max-Age=0; ${attributes}`;
  }
  return framed;
}

export function EmbedMarker() {
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (!markEmbedding() || (path !== "/" && path !== "/start")) return;
    // The frame opens on the public start page because its page load carries no cookies.
    // A saved session is checked with a fetch and resumed with a client navigation.
    const controller = new AbortController();
    fetch("/api/backend/users/me", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => {
        if (response.ok) router.replace("/home");
      })
      .catch(() => {});
    return () => controller.abort();
  }, [path, router]);
  return null;
}
