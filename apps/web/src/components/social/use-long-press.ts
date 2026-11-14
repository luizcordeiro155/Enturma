"use client";
import { useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";

/** How long a finger must stay down before it counts as "pressing and holding". */
export const LONG_PRESS_MS = 500;

/**
 * Press and hold on touch, or right-click / the context-menu key on a computer.
 * The tap that ends a long press does not also run the element's click.
 */
export function useLongPress(onLongPress: () => void, delay = LONG_PRESS_MS) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const latest = useRef(onLongPress);
  useEffect(() => {
    latest.current = onLongPress;
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function cancel() {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    start.current = null;
  }
  return {
    onPointerDown(event: PointerEvent) {
      fired.current = false;
      cancel();
      if (event.pointerType === "mouse") return;
      start.current = { x: event.clientX, y: event.clientY };
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        fired.current = true;
        latest.current();
      }, delay);
    },
    onPointerMove(event: PointerEvent) {
      const origin = start.current;
      // Scrolling the rail is not a press.
      if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 10)
        cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu(event: MouseEvent) {
      event.preventDefault();
      // Android also raises contextmenu for the same long press: open once.
      if (fired.current) return;
      const touch = timer.current !== undefined;
      cancel();
      if (touch) fired.current = true;
      latest.current();
    },
    onClickCapture(event: MouseEvent) {
      if (!fired.current) return;
      fired.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
