"use client";
import { useEffect, type RefObject } from "react";

/**
 * Plays a muted feed video while at least 60% of it is on screen and the document
 * is in the foreground with no dialog open. Only one Social video plays at a time.
 */
export function useAutoplayInView(
  ref: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
): void {
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
        void video.play()?.catch(() => {});
      } else video.pause();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        visible = !!entry && entry.intersectionRatio >= 0.6;
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
