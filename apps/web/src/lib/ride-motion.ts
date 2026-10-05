"use client";

import { playMotion, reducedMotion } from "@/lib/motion";

export function rideEnter(element: Element | null, index = 0) {
  if (!element) return;
  return playMotion(
    element,
    [
      { opacity: 0, transform: "translateY(14px) scale(.985)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: 280, delay: Math.min(index * 45, 220), fill: "backwards" },
  );
}

export function rideAccept(element: Element | null) {
  if (!element || reducedMotion()) return;
  return playMotion(
    element,
    [
      { transform: "scale(1)", filter: "brightness(1)" },
      { transform: "scale(.96)", filter: "brightness(1.08)", offset: 0.35 },
      { transform: "scale(1.025)", filter: "brightness(1.12)", offset: 0.72 },
      { transform: "scale(1)", filter: "brightness(1)" },
    ],
    { duration: 420 },
  );
}

export function rideStatus(element: Element | null) {
  if (!element) return;
  return playMotion(
    element,
    [
      { opacity: 0.5, transform: "translateX(-8px)" },
      { opacity: 1, transform: "translateX(0)" },
    ],
    { duration: 240 },
  );
}

export function ridePanel(element: Element | null) {
  if (!element) return;
  return playMotion(
    element,
    [
      { opacity: 0, transform: "translateY(18px) scale(.985)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: 320 },
  );
}

export function ridePulse(element: Element | null) {
  if (!element || reducedMotion()) return;
  return playMotion(
    element,
    [
      { transform: "scale(1)", opacity: 0.75 },
      { transform: "scale(1.08)", opacity: 1, offset: 0.5 },
      { transform: "scale(1)", opacity: 0.85 },
    ],
    { duration: 900, iterations: 2 },
  );
}

export function animateRouteLine(element: SVGPathElement | null) {
  if (!element || reducedMotion()) return;
  const length = element.getTotalLength();
  element.style.strokeDasharray = String(length);
  element.style.strokeDashoffset = String(length);
  const animation = element.animate(
    [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
    { duration: 650, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" },
  );
  animation.addEventListener(
    "finish",
    () => {
      element.style.strokeDashoffset = "0";
    },
    { once: true },
  );
  return animation;
}
