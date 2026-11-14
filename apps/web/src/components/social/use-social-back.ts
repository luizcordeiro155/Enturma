"use client";
import { useEffect, useRef } from "react";
import type { SocialView } from "@/lib/social";

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
 * - from Clips, Criar or a profile, Back returns to the Feed;
 * - only from the Feed does Back leave, straight to the Enturma home.
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
  const latest = useRef({ view, toFeed, exit });
  useEffect(() => {
    latest.current = { view, toFeed, exit };
  });
  useEffect(() => {
    if (history.state?.enturmaSocial !== "guard")
      history.pushState(stateWith("guard"), "", location.href);
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
      // Back on the Feed itself: leave to the Enturma home.
      latest.current.exit();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, []);
  return {
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
