"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    markEmbedding();
  }, []);
  return null;
}
