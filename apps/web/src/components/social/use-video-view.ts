"use client";
import { useEffect, type RefObject } from "react";
import { socialWrite } from "@/lib/social";

/** Count watched playback, never the seek position. The API deduplicates viewers. */
export function useVideoView(
  ref: RefObject<HTMLVideoElement | null>,
  postId?: string,
) {
  useEffect(() => {
    const video = ref.current;
    if (!video || !postId) return;
    let watched = 0,
      previous = video.currentTime,
      sent = false,
      sentCompletion = false,
      pending = false;
    const reset = () => {
      previous = video.currentTime;
    };
    const report = () => {
      const completed =
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        watched >= video.duration * 0.9;
      if (
        pending ||
        (sent && (!completed || sentCompletion)) ||
        (watched < 3 && !completed) ||
        watched <= 0
      )
        return;
      pending = true;
      void socialWrite(`/posts/${postId}/view`, {
        watchedMs: Math.min(90000, Math.round(watched * 1000)),
        completed,
      })
        .then(() => {
          sent = true;
          sentCompletion = completed;
        })
        .catch(() => {})
        .finally(() => {
          pending = false;
        });
    };
    const tick = () => {
      const delta = video.currentTime - previous;
      previous = video.currentTime;
      if (
        video.seeking ||
        document.hidden ||
        video.paused ||
        delta <= 0 ||
        delta > 1
      )
        return;
      watched += delta;
      report();
    };
    video.addEventListener("timeupdate", tick);
    video.addEventListener("seeking", reset);
    video.addEventListener("seeked", reset);
    video.addEventListener("play", reset);
    video.addEventListener("ended", report);
    return () => {
      video.removeEventListener("timeupdate", tick);
      video.removeEventListener("seeking", reset);
      video.removeEventListener("seeked", reset);
      video.removeEventListener("play", reset);
      video.removeEventListener("ended", report);
    };
  }, [ref, postId]);
}
