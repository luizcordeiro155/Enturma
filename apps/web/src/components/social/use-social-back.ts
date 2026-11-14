"use client";
import { useEffect, useRef, useState } from "react";
import type { SocialView } from "@/lib/social";

/** How long after the first Back on the Feed a second Back leaves the Social. */
export const SOCIAL_EXIT_WINDOW_MS = 2500;

type Marker = "guard" | "view";

/** The current entry's state with our marker, keeping the router's own keys. */
function stateWith(marker: Marker) {
  const {
    enturmaOverlay: _overlay,
    enturmaSocial: _social,
    ...rest
  } = (history.state ?? {}) as Record<string, unknown>;
  void _overlay;
  void _social;
  return { ...rest, enturmaSocial: marker };
}

/**
 * The Social behaves like its own app for the phone's Back:
 * - from Clips or Criar, Back returns to the Feed;
 * - on the Feed, the first Back only warns and a second Back right away leaves.
 *
 * Two history entries carry it: a "guard" on top of the Social's entry, and a
 * "view" entry while away from the Feed. Dialogs (enturmaOverlay) and linked
 * Clips (?post=) keep their own Back handling.
 */
export function useSocialBack({
  view,
  toFeed,
  exit,
}: {
  view: SocialView;
  toFeed: () => void;
  exit: () => void;
}) {
  const [hint, setHint] = useState(false);
  const latest = useRef({ view, toFeed, exit });
  useEffect(() => {
    latest.current = { view, toFeed, exit };
  });
  const lastBack = useRef(Number.NEGATIVE_INFINITY);
  useEffect(() => {
    if (history.state?.enturmaSocial !== "guard")
      history.pushState(stateWith("guard"), "", location.href);
    let timer: number | undefined;
    const onPop = () => {
      const state = history.state as Record<string, unknown> | null;
      if (state?.enturmaOverlay) return;
      const marker = state?.enturmaSocial;
      if (marker === "view") return;
      if (marker === "guard") {
        // Back from Clips or Criar.
        if (latest.current.view !== "feed") latest.current.toFeed();
        return;
      }
      if (new URLSearchParams(location.search).has("post")) return;
      // Back on the Feed itself.
      const now = Date.now();
      if (now - lastBack.current < SOCIAL_EXIT_WINDOW_MS) {
        window.clearTimeout(timer);
        setHint(false);
        latest.current.exit();
        return;
      }
      lastBack.current = now;
      history.pushState(stateWith("guard"), "", location.href);
      setHint(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHint(false), SOCIAL_EXIT_WINDOW_MS);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.clearTimeout(timer);
    };
  }, []);
  return {
    hint,
    /** Call when the visible place changes, so Back can return to the Feed. */
    entered(next: SocialView) {
      // The Back below lands after this change; it must not be read as leaving Clips.
      latest.current.view = next;
      const marker = history.state?.enturmaSocial;
      if (next !== "feed" && marker === "guard")
        history.pushState(stateWith("view"), "", location.href);
      else if (next === "feed" && marker === "view") history.back();
    },
  };
}
