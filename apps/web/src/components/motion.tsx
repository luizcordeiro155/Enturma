"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function Motion() {
  const path = usePathname();
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    const animations = new Set<Animation>();
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          if (reduced.matches) return;
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
          "main h1, main article, .game-studio, .option-list > button, .hero h1",
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
    function tap(e: PointerEvent) {
      if (reduced.matches) return;
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
      if (reduced.matches) animations.forEach((a) => a.cancel());
    }
    document.addEventListener("pointerup", tap);
    reduced.addEventListener("change", preference);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("pointerup", tap);
      reduced.removeEventListener("change", preference);
      animations.forEach((a) => a.cancel());
    };
  }, [path]);
  return null;
}
