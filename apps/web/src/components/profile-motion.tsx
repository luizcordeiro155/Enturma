"use client";
import { useEffect, useRef } from "react";
import type { ProfileVisualAppearance } from "@enturma/contracts";

export function profileEntrance(
  element: HTMLElement,
  mode = "RISE",
  closing = false,
) {
  if (
    !element.animate ||
    mode === "NONE" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.reducedMotion === "true"
  )
    return;
  const initial =
    mode === "BOOK"
      ? "perspective(1200px) rotateY(-18deg) scale(.94)"
      : mode === "ORBIT"
        ? "translate(24px,18px) rotate(3deg) scale(.94)"
        : "translateY(20px) scale(.97)";
  const frames = [
    { opacity: 0, transform: initial },
    {
      opacity: 1,
      transform: "perspective(1200px) translate(0,0) rotateY(0deg) scale(1)",
    },
  ];
  return element.animate(closing ? frames.reverse() : frames, {
    duration: closing ? 180 : 520,
    easing: "cubic-bezier(.16,1,.3,1)",
    fill: closing ? "forwards" : "none",
  });
}

/** Decorative layer is clipped independently, so avatar and banner pixels are never tinted. */
export function ProfileBackdrop({
  appearance,
  mural = false,
}: {
  appearance?: ProfileVisualAppearance;
  mural?: boolean;
}) {
  const flow =
    appearance?.gradientFlow === "FLOW" || appearance?.effect === "AURORA";
  const layer = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = layer.current;
    if (
      !node ||
      !flow ||
      (mural &&
        (!appearance?.muralMode || appearance.muralMode === "DEFAULT")) ||
      !node.animate
    )
      return;
    let visible = true;
    let animation: Animation | undefined;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (
        reduced.matches ||
        document.documentElement.dataset.reducedMotion === "true"
      ) {
        animation?.cancel();
        animation = undefined;
        return;
      }
      animation ??= node.animate(
        [
          { transform: "translate(-7%,-5%) rotate(-8deg) scale(1.05)" },
          { transform: "translate(8%,7%) rotate(9deg) scale(1.15)" },
          { transform: "translate(-7%,-5%) rotate(-8deg) scale(1.05)" },
        ],
        { duration: 18000, iterations: Infinity, easing: "ease-in-out" },
      );
      if (visible && !document.hidden) animation.play();
      else animation.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const settings = new MutationObserver(sync);
    observer.observe(node);
    settings.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion"],
    });
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      animation?.cancel();
      observer.disconnect();
      settings.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [flow, mural, appearance?.muralMode]);
  if (mural && (!appearance?.muralMode || appearance.muralMode === "DEFAULT"))
    return null;
  return (
    <span
      className={`profile-color-layer${mural ? " mural-color-layer" : ""}`}
      aria-hidden="true"
    >
      <span
        ref={layer}
        className={
          appearance?.effect === "DOTS" ? "profile-color-dots" : undefined
        }
      />
    </span>
  );
}
