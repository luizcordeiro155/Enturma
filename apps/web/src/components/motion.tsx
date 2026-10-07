"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { cancelMotion, reducedMotion } from "@/lib/motion";

const REVEAL =
  "main h1,.room-row,.home-subject-card,.forum-entry,.profile-editor-section,.study-journey,.guide-welcome,.showcase-widget,.notification-item";
const EXCLUDED =
  ".enturma-intro,.persistent-messages,.private-messages,.call-video-stage,.ride-map-container";

/** One scoped motion lifecycle per route. Chat history and media never receive layout motion. */
export function Motion() {
  const path = usePathname();
  useEffect(() => {
    const seen = new WeakSet<Element>();
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let context = gsap.context(() => {});
    let pressed: HTMLElement | null = null;
    let scanFrame = 0;
    const animate = (el: Element, from: gsap.TweenVars, to: gsap.TweenVars) => {
      if (reducedMotion() || el.closest(EXCLUDED)) return;
      context.add(() => {
        gsap.fromTo(el, from, {
          duration: 0.28,
          ease: "power2.out",
          overwrite: "auto",
          clearProps: "transform,opacity",
          ...to,
        });
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          animate(entry.target, { opacity: 0.25, y: 8 }, { opacity: 1, y: 0 });
        }
      },
      { threshold: 0.08 },
    );
    const scan = () => {
      scanFrame = 0;
      document.querySelectorAll(REVEAL).forEach((el) => {
        if (seen.has(el) || el.closest(EXCLUDED)) return;
        seen.add(el);
        observer.observe(el);
      });
    };
    const mutations = new MutationObserver((records) => {
      if (
        scanFrame ||
        !records.some(
          (record) =>
            !(record.target instanceof Element) ||
            !record.target.closest(EXCLUDED),
        )
      )
        return;
      scanFrame = requestAnimationFrame(scan);
    });
    const release = () => {
      if (!pressed) return;
      const el = pressed;
      pressed = null;
      context.add(() => {
        gsap.to(el, {
          scale: 1,
          duration: reducedMotion() ? 0 : 0.16,
          overwrite: true,
          clearProps: "transform",
        });
      });
    };
    const press = (event: PointerEvent) => {
      if (
        event.button !== 0 ||
        reducedMotion() ||
        !(event.target instanceof Element)
      )
        return;
      release();
      const target = event.target.closest<HTMLElement>(
        "button:not(:disabled),a.button",
      );
      if (!target || target.closest(".enturma-intro")) return;
      pressed = target;
      context.add(() => {
        gsap.to(target, { scale: 0.97, duration: 0.1, overwrite: true });
      });
    };
    const preference = () => {
      if (!reducedMotion()) return;
      pressed = null;
      context.revert();
      context = gsap.context(() => {});
      cancelMotion();
    };
    const attributes = new MutationObserver(preference);
    attributes.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion"],
    });
    scan();
    mutations.observe(document.body, { subtree: true, childList: true });
    document.addEventListener("pointerdown", press, { passive: true });
    document.addEventListener("pointerup", release, { passive: true });
    document.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("blur", release);
    media.addEventListener("change", preference);
    window.addEventListener("enturma-motion", preference);
    return () => {
      cancelAnimationFrame(scanFrame);
      observer.disconnect();
      mutations.disconnect();
      attributes.disconnect();
      document.removeEventListener("pointerdown", press);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      media.removeEventListener("change", preference);
      window.removeEventListener("enturma-motion", preference);
      context.revert();
      cancelMotion();
    };
  }, [path]);
  return null;
}
