"use client";
import { useEffect, useRef } from "react";

/** How far the finger must pull, in pixels, before letting go refreshes. */
export const PULL_READY = 70;

/**
 * Instagram-style refresh at the top of the Feed: a ring fills while the finger
 * pulls and spins (Web Animations, so it stays smooth) until fresh posts arrive.
 */
export function SocialPullRefresh({
  distance,
  refreshing,
}: {
  distance: number;
  refreshing: boolean;
}) {
  const ring = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const element = ring.current;
    if (!refreshing || !element || typeof element.animate !== "function") return;
    const reduced = document.documentElement.dataset.reducedMotion === "true";
    const spin = element.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      { duration: reduced ? 2400 : 760, iterations: Infinity, easing: "linear" },
    );
    return () => spin.cancel();
  }, [refreshing]);
  const progress = refreshing ? 1 : Math.min(1, distance / PULL_READY);
  const offset = refreshing ? 56 : Math.min(distance, 96) * 0.7;
  if (!refreshing && distance <= 0) return null;
  return (
    <div
      className="social-pull-refresh"
      data-ready={progress >= 1}
      data-refreshing={refreshing}
      style={{
        transform: `translate(-50%, ${offset}px)`,
        opacity: refreshing ? 1 : Math.min(1, 0.25 + progress),
      }}
      {...(refreshing ? { role: "status", "aria-label": "Atualizando o Feed" } : { "aria-hidden": true })}
    >
      <svg
        ref={ring}
        viewBox="0 0 36 36"
        width="30"
        height="30"
        style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
      >
        <circle cx="18" cy="18" r="14" className="social-pull-track" />
        <circle
          cx="18"
          cy="18"
          r="14"
          className="social-pull-arc"
          pathLength={100}
          strokeDasharray={`${refreshing ? 72 : Math.max(8, progress * 80)} 100`}
        />
      </svg>
    </div>
  );
}
