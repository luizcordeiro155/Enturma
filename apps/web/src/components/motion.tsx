"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cancelMotion, playMotion, reducedMotion } from "@/lib/motion";

const REVEAL_SELECTOR = [
  "main h1",
  "main h2",
  "main article",
  ".card",
  ".room-row",
  ".participant-row",
  ".member-profile-strip",
  ".showcase-widget",
  ".profile-editor-section",
  ".profile-preview-stage",
  ".notification-item",
  ".forum-entry",
  ".friends-workspace article",
  ".call-member",
  ".user-profile-dialog",
  ".room-mobile-details-sheet",
  ".option-list > button",
  ".study-journey",
  ".guide-welcome",
].join(",");

const TILT_SELECTOR = [
  ".public-profile-card",
  ".member-profile-strip",
  ".showcase-widget",
  ".profile-media-action",
].join(",");

function motionDisabled() {
  return (
    reducedMotion() ||
    document.documentElement.dataset.reducedMotion === "true"
  );
}

export function Motion() {
  const path = usePathname();

  useEffect(() => {
    const seen = new WeakSet<Element>();
    const hoverAnimations = new WeakMap<Element, Animation>();
    const pressAnimations = new WeakMap<Element, Animation>();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover:hover) and (pointer:fine)");

    function animate(
      element: Element | null | undefined,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) {
      if (!element || motionDisabled()) return;
      return playMotion(element, frames, options);
    }

    function animatePage() {
      if (motionDisabled()) return;
      const content =
        document.querySelector(".workspace > main") ??
        document.querySelector("main") ??
        document.querySelector("#content");
      animate(
        content,
        [
          {
            opacity: 0.68,
            transform: "scale(.996)",
          },
          {
            opacity: 0.9,
            transform: "scale(.999)",
            offset: 0.58,
          },
          {
            opacity: 1,
            transform: "scale(1)",
          },
        ],
        {
          duration: 300,
          easing: "cubic-bezier(.16,1,.3,1)",
        },
      );

      const active = document.querySelector(
        '.mobile-bottom-nav [aria-current="page"],.sidebar [aria-current="page"]',
      );
      animate(
        active,
        [
          { opacity: 0.72 },
          { opacity: 1 },
        ],
        { duration: 220, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (motionDisabled()) continue;

          const index = Number(
            (entry.target as HTMLElement).dataset.motionIndex ?? "0",
          );
          animate(
            entry.target,
            [
              {
                opacity: 0,
                transform: "scale(.992)",
              },
              {
                opacity: 1,
                transform: "scale(1)",
              },
            ],
            {
              duration: 430,
              delay: Math.min(index, 6) * 34,
              easing: "cubic-bezier(.16,1,.3,1)",
              fill: "both",
            },
          );

          const banner = entry.target.querySelector?.(
            ".public-profile-banner img,.member-profile-strip-banner",
          );
          if (banner) {
            animate(
              banner,
              [
                { transform: "scale(1.055) translate3d(0,-2px,0)" },
                { transform: "scale(1) translate3d(0,0,0)" },
              ],
              {
                duration: 720,
                easing: "cubic-bezier(.16,1,.3,1)",
                fill: "both",
              },
            );
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -24px 0px" },
    );

    function scan() {
      let index = 0;
      document.querySelectorAll(REVEAL_SELECTOR).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        (element as HTMLElement).dataset.motionIndex = String(index++ % 7);
        observer.observe(element);
      });

      document
        .querySelectorAll<HTMLDialogElement>("dialog[open],.mobile-more-sheet")
        .forEach((dialog) => {
          if (dialog.dataset.motionOpen === "1") return;
          dialog.dataset.motionOpen = "1";
          animate(
            dialog,
            [
              {
                opacity: 0,
                transform: "translate3d(0,18px,0) scale(.965)",
              },
              {
                opacity: 1,
                transform: "translate3d(0,0,0) scale(1)",
              },
            ],
            {
              duration: 340,
              easing: "cubic-bezier(.16,1,.3,1)",
              fill: "both",
            },
          );
        });
    }

    function pressStart(event: PointerEvent) {
      if (motionDisabled() || event.button !== 0) return;
      const target = (event.target as Element).closest<HTMLElement>(
        "button:not(:disabled),a[href],.identity-trigger,.profile-media-action",
      );
      if (!target) return;
      pressAnimations.get(target)?.cancel();
      const navigationControl = target.closest(".mobile-bottom-nav,.sidebar nav");
      const animation = navigationControl
        ? target.animate(
            [{ opacity: 1 }, { opacity: 0.72 }],
            {
              duration: 95,
              easing: "cubic-bezier(.2,.8,.2,1)",
              fill: "forwards",
            },
          )
        : target.animate(
            [
              { transform: "scale(1)" },
              { transform: "scale(.965)" },
            ],
            {
              duration: 115,
              easing: "cubic-bezier(.2,.8,.2,1)",
              fill: "forwards",
            },
          );
      pressAnimations.set(target, animation);
    }

    function pressEnd(event: PointerEvent) {
      const target = (event.target as Element).closest<HTMLElement>(
        "button,a[href],.identity-trigger,.profile-media-action",
      );
      if (!target || motionDisabled()) return;
      pressAnimations.get(target)?.cancel();
      const navigationControl = target.closest(".mobile-bottom-nav,.sidebar nav");
      const animation = navigationControl
        ? target.animate(
            [{ opacity: 0.72 }, { opacity: 1 }],
            {
              duration: 160,
              easing: "cubic-bezier(.16,1,.3,1)",
            },
          )
        : target.animate(
            [
              { transform: "scale(.965)" },
              { transform: "scale(1.012)", offset: 0.62 },
              { transform: "scale(1)" },
            ],
            {
              duration: 240,
              easing: "cubic-bezier(.16,1,.3,1)",
            },
          );
      pressAnimations.set(target, animation);
    }

    function tilt(event: PointerEvent) {
      if (!finePointer.matches || motionDisabled()) return;
      const target = (event.target as Element).closest<HTMLElement>(TILT_SELECTOR);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const rx = Math.max(-3.2, Math.min(3.2, py * -5.5));
      const ry = Math.max(-4.2, Math.min(4.2, px * 7));
      hoverAnimations.get(target)?.cancel();
      const animation = target.animate(
        [
          {
            transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(0,-1px,0)`,
          },
        ],
        {
          duration: 170,
          easing: "cubic-bezier(.2,.8,.2,1)",
          fill: "forwards",
        },
      );
      hoverAnimations.set(target, animation);
    }

    function untilt(event: PointerEvent) {
      if (motionDisabled()) return;
      const target = (event.target as Element).closest<HTMLElement>(TILT_SELECTOR);
      if (!target) return;
      hoverAnimations.get(target)?.cancel();
      const animation = target.animate(
        [
          {
            transform:
              "perspective(900px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)",
          },
        ],
        {
          duration: 360,
          easing: "cubic-bezier(.16,1,.3,1)",
          fill: "forwards",
        },
      );
      hoverAnimations.set(target, animation);
    }

    function focusIn(event: FocusEvent) {
      if (motionDisabled()) return;
      const target = (event.target as Element).closest<HTMLElement>(
        "button,a,input,textarea,select,.identity-trigger",
      );
      if (!target) return;
      animate(
        target,
        [
          { transform: "translate3d(0,0,0)" },
          { transform: "translate3d(0,-1px,0)" },
        ],
        { duration: 180, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    }

    function preferenceChanged() {
      if (motionDisabled()) cancelMotion();
    }

    scan();
    requestAnimationFrame(animatePage);

    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { subtree: true, childList: true });

    document.addEventListener("pointerdown", pressStart, { passive: true });
    document.addEventListener("pointerup", pressEnd, { passive: true });
    document.addEventListener("pointercancel", pressEnd, { passive: true });
    document.addEventListener("pointermove", tilt, { passive: true });
    document.addEventListener("pointerleave", untilt, true);
    document.addEventListener("focusin", focusIn);
    media.addEventListener("change", preferenceChanged);
    window.addEventListener("enturma-motion", preferenceChanged);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("pointerdown", pressStart);
      document.removeEventListener("pointerup", pressEnd);
      document.removeEventListener("pointercancel", pressEnd);
      document.removeEventListener("pointermove", tilt);
      document.removeEventListener("pointerleave", untilt, true);
      document.removeEventListener("focusin", focusIn);
      media.removeEventListener("change", preferenceChanged);
      window.removeEventListener("enturma-motion", preferenceChanged);
      cancelMotion();
    };
  }, [path]);

  return null;
}
