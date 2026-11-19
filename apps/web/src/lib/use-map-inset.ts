"use client";
import { useEffect, useState, type RefObject } from "react";
import { NO_INSET, overlayInset, type Inset } from "./ride-map-focus";

/**
 * Measures how much of the map sits under the panels matched by `selector`
 * (direct children of `root`), and keeps the answer current while they resize,
 * slide, appear or leave.
 */
export function useMapInset(
  root: RefObject<HTMLElement | null>,
  selector: string,
  ready: boolean,
): Inset {
  const [inset, setInset] = useState<Inset>(NO_INSET);
  useEffect(() => {
    const node = root.current;
    if (!node || !ready) return;
    const panels = () => [...node.querySelectorAll<HTMLElement>(selector)];
    const measure = () => {
      const next = overlayInset(
        node.getBoundingClientRect(),
        panels().map((panel) => panel.getBoundingClientRect()),
      );
      setInset((old) =>
        old.top === next.top &&
        old.right === next.right &&
        old.bottom === next.bottom &&
        old.left === next.left
          ? old
          : next,
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const sizes = new ResizeObserver(measure);
    const watch = () => {
      sizes.disconnect();
      sizes.observe(node);
      for (const panel of panels()) sizes.observe(panel);
    };
    watch();
    // The sheet gives way to other panels (and back) as the ride moves on.
    const children = new MutationObserver(() => {
      watch();
      measure();
    });
    children.observe(node, { childList: true });
    return () => {
      sizes.disconnect();
      children.disconnect();
    };
  }, [root, selector, ready]);
  return inset;
}
