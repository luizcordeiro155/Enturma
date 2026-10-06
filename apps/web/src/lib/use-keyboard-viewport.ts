"use client";

import { useEffect } from "react";

export function useKeyboardViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const inset = Math.max(
          0,
          Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
        );
        root.style.setProperty("--ride-keyboard-inset", `${inset}px`);

        if (inset < 80) return;
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          active.matches("input, textarea, select, [contenteditable='true']")
        ) {
          active.scrollIntoView({
            block: "center",
            inline: "nearest",
            behavior: "smooth",
          });
        }
      });
    };

    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    window.addEventListener("focusin", sync);
    sync();

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      window.removeEventListener("focusin", sync);
      root.style.removeProperty("--ride-keyboard-inset");
    };
  }, []);
}
