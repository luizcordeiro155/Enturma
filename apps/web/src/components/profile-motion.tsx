"use client";
import { useEffect, useRef } from "react";
import type { ProfileVisualAppearance } from "@enturma/contracts";

/** One consistent JavaScript/WAAPI entrance for all public profiles. */
export function profileEntrance(element: HTMLElement, closing = false) {
  if (
    !element.animate ||
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.reducedMotion === "true"
  )
    return;
  const frames = [
    { opacity: 0, transform: "translateY(14px) scale(.985)" },
    { opacity: 1, transform: "translateY(0) scale(1)" },
  ];
  return element.animate(closing ? frames.reverse() : frames, {
    duration: closing ? 170 : 310,
    easing: "cubic-bezier(.2,.85,.22,1)",
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
    let animations: Animation[] = [];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (
        reduced.matches ||
        document.documentElement.dataset.reducedMotion === "true"
      ) {
        animations.forEach((animation) => animation.cancel());
        animations = [];
        return;
      }
      if (!animations.length) {
        animations = [
          ...node.querySelectorAll<HTMLElement>("[data-river-current]"),
        ].map((current, index) =>
          current.animate(
            index === 0
              ? [
                  {
                    transform:
                      "translate(-16%, -12%) rotate(-14deg) scale(1.08)",
                  },
                  { transform: "translate(15%, 13%) rotate(18deg) scale(1.2)" },
                  {
                    transform:
                      "translate(-16%, -12%) rotate(-14deg) scale(1.08)",
                  },
                ]
              : [
                  {
                    transform: "translate(13%, 16%) rotate(20deg) scale(1.12)",
                  },
                  {
                    transform:
                      "translate(-18%, -9%) rotate(-16deg) scale(1.02)",
                  },
                  {
                    transform: "translate(13%, 16%) rotate(20deg) scale(1.12)",
                  },
                ],
            {
              duration: index ? 24000 : 18000,
              iterations: Infinity,
              easing: "ease-in-out",
            },
          ),
        );
      }
      animations.forEach((animation) => {
        if (visible && !document.hidden) animation.play();
        else animation.pause();
      });
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
      animations.forEach((animation) => animation.cancel());
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
      ref={layer}
      className={`profile-color-layer${mural ? " mural-color-layer" : ""}`}
      aria-hidden="true"
    >
      {flow && (
        <>
          <span className="profile-river-current" data-river-current />
          <span className="profile-river-return" data-river-current />
        </>
      )}
      {appearance?.effect === "DOTS" && <span className="profile-color-dots" />}
    </span>
  );
}
