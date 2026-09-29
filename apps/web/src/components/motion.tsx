"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cancelMotion } from "@/lib/motion";
export function Motion() {
  const path = usePathname();
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          if (
            reduced.matches ||
            document.documentElement.dataset.reducedMotion === "true"
          )
            return;
          const a = target.animate(
            [
              { opacity: 0.35, transform: "translateY(12px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 360, easing: "cubic-bezier(.2,.7,.2,1)" },
          );
          animations.add(a);
          a.onfinish = () => animations.delete(a);
        });
      },
      { threshold: 0.08 },
    );
    function scan() {
      document
        .querySelectorAll(
          "main h1, main article, .game-studio, .option-list > button, .hero h1, .onboarding-banner, .study-journey, .guide-welcome",
        )
        .forEach((el) => {
          if (!seen.has(el)) {
            seen.add(el);
            observer.observe(el);
          }
        });
    }
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { subtree: true, childList: true });
    function tap(e: MouseEvent) {
      if (
        reduced.matches ||
        document.documentElement.dataset.reducedMotion === "true"
      )
        return;
      const button = (e.target as Element).closest("button,.button");
      if (!button || button.matches(":disabled")) return;
      const a = button.animate(
        [{ transform: "scale(.97)" }, { transform: "scale(1)" }],
        { duration: 180, easing: "ease-out" },
      );
      animations.add(a);
      a.onfinish = () => animations.delete(a);
    }
    function preference() {
      if (
        reduced.matches ||
        document.documentElement.dataset.reducedMotion === "true"
      ) {
        animations.forEach((a) => a.cancel());
        cancelMotion();
      }
    }
    document.addEventListener("click", tap);
    reduced.addEventListener("change", preference);
    window.addEventListener("enturma-motion", preference);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("click", tap);
      reduced.removeEventListener("change", preference);
      window.removeEventListener("enturma-motion", preference);
      animations.forEach((a) => a.cancel());
      cancelMotion();
    };
  }, [path]);
  return null;
}
