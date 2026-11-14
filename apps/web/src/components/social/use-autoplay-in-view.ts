"use client";
import { useEffect, useRef, type RefObject } from "react";

/**
 * Plays a muted feed video while at least 60% of it is on screen and the document
 * is in the foreground with no dialog open. Only one Social video plays at a time.
 */
export function useAutoplayInView(
  ref: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  /** The browser refused to start with sound; the video continues muted. */
  onSoundBlocked?: () => void,
): void {
  const blocked = useRef(onSoundBlocked);
  useEffect(() => {
    blocked.current = onSoundBlocked;
  });
  useEffect(() => {
    const video = ref.current;
    if (!enabled || !video || typeof IntersectionObserver === "undefined") return;
    let visible = false;
    const sync = () => {
      if (
        visible &&
        !document.hidden &&
        !document.querySelector("dialog[open]")
      ) {
        document
          .querySelectorAll<HTMLVideoElement>(".social-page video")
          .forEach((other) => {
            if (other !== video) other.pause();
          });
        void video.play()?.catch((error: unknown) => {
          // Sound left on from an earlier video may need a fresh tap on this page.
          if ((error as Error)?.name !== "NotAllowedError" || video.muted) return;
          video.muted = true;
          blocked.current?.();
          void video.play()?.catch(() => {});
        });
      } else video.pause();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        const next = !!entry && entry.intersectionRatio >= 0.6;
        // Scrolled past: like Instagram, it starts over when it comes back.
        // Pausing for a dialog or another tab keeps the position.
        if (visible && !next) {
          video.pause();
          video.currentTime = 0;
        }
        visible = next;
        sync();
      },
      { threshold: [0, 0.6] },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [ref, enabled]);
}
