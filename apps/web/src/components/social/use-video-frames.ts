"use client";
import { useEffect, useState } from "react";
import { frameTimes } from "@/lib/social-editing";
export type VideoFrame = { time: number; url: string };
/** Bounded sequential decoding: one detached video, twelve small JPEGs, no upload. */
export function useVideoFrames(
  url: string,
  duration: number,
  samples?: number[],
) {
  const [result, setResult] = useState<{
    source: string;
    frames: VideoFrame[];
  }>({ source: "", frames: [] });
  const sampleKey = samples?.join(",") ?? "";
  const sourceKey = `${url}:${duration}:${sampleKey}`;
  useEffect(() => {
    if (!url || !Number.isFinite(duration) || duration <= 0) return;
    let stopped = false;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    const canvas = document.createElement("canvas");
    canvas.width = 144;
    canvas.height = 90;
    const resources: string[] = [];
    const pending = new Set<() => void>();
    function event(name: string) {
      return new Promise<void>((resolve, reject) => {
        const finish = (error?: Error) => {
          clearTimeout(timer);
          video.removeEventListener(name, success);
          video.removeEventListener("error", fail);
          pending.delete(cancel);
          if (error) reject(error);
          else resolve();
        };
        const success = () => finish(),
          fail = () => finish(new Error("Frame unavailable"));
        const cancel = () => finish(new Error("Cancelled"));
        const timer = setTimeout(fail, 8000);
        pending.add(cancel);
        video.addEventListener(name, success, { once: true });
        video.addEventListener("error", fail, { once: true });
      });
    }
    void (async () => {
      const loaded = event("loadeddata");
      video.src = url;
      await loaded;
      const context = canvas.getContext("2d");
      if (!context) return;
      const frames: VideoFrame[] = [];
      for (const time of sampleKey
        ? sampleKey.split(",").map(Number)
        : frameTimes(duration)) {
        if (stopped) break;
        if (Math.abs(video.currentTime - time) > 0.01) {
          const sought = event("seeked");
          video.currentTime = time;
          await sought;
        }
        if (stopped) break;
        const scale = Math.max(
          canvas.width / video.videoWidth,
          canvas.height / video.videoHeight,
        );
        const width = video.videoWidth * scale,
          height = video.videoHeight * scale;
        context.drawImage(
          video,
          (canvas.width - width) / 2,
          (canvas.height - height) / 2,
          width,
          height,
        );
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.68),
        );
        if (!blob || stopped) break;
        const image = URL.createObjectURL(blob);
        resources.push(image);
        frames.push({ time, url: image });
        setResult({ source: sourceKey, frames: [...frames] });
      }
    })().catch(() => {
      /* Playback and precise seeking stay usable if a codec cannot generate thumbnails. */
    });
    return () => {
      stopped = true;
      pending.forEach((cancel) => cancel());
      video.pause();
      video.removeAttribute("src");
      video.load();
      resources.forEach((resource) => URL.revokeObjectURL(resource));
    };
  }, [url, duration, sampleKey, sourceKey]);
  return result.source === sourceKey ? result.frames : [];
}
