"use client";
import { useEffect, useRef, useState } from "react";
import type { SocialView } from "@/lib/social";
import {
  PAGER_ORDER,
  PHONE_QUERY,
  gestureStartAllowed,
  lockAxis,
  pagerNeighbor,
  pagerSettles,
} from "@/lib/social-pager";

/** A horizontal drag that starts on one of these keeps its own meaning. */
export const PAGER_IGNORE =
  "[data-social-gesture],input,textarea,select,[contenteditable],[role=slider],dialog";

type Drag = { x: number; y: number; at: number; axis: "x" | "y" | null };

/**
 * Owns the Clips / Feed / Create pages. On phones the pages sit side by side and
 * follow the finger; from 761 px up only the selected page is shown. The dock and
 * rail remain the button alternative to every gesture.
 */
export function SocialPager({
  view,
  select,
  peek,
  children,
}: {
  view: SocialView;
  select: (view: SocialView) => void;
  peek: (view: SocialView) => void;
  children: (page: SocialView) => React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null),
    track = useRef<HTMLDivElement>(null),
    drag = useRef<Drag | null>(null),
    swallowClick = useRef(false);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = matchMedia(PHONE_QUERY);
    const sync = () => setPhone(query.matches);
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);
  const index = PAGER_ORDER.indexOf(view);
  function release() {
    drag.current = null;
    root.current?.classList.remove("is-dragging");
    if (track.current) track.current.style.transform = "";
  }
  return (
    <div
      ref={root}
      className="social-pager"
      data-view={view}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        drag.current =
          !phone ||
          event.touches.length !== 1 ||
          (event.target as HTMLElement).closest(PAGER_IGNORE) ||
          !gestureStartAllowed(touch.clientX, innerWidth)
            ? null
            : {
                x: touch.clientX,
                y: touch.clientY,
                at: performance.now(),
                axis: null,
              };
      }}
      onTouchMove={(event) => {
        const state = drag.current,
          touch = event.touches[0];
        if (!state || !touch) return;
        const dx = touch.clientX - state.x;
        if (!state.axis) {
          state.axis = lockAxis(dx, touch.clientY - state.y);
          if (state.axis === "y") return release();
          if (state.axis !== "x") return;
          const next = pagerNeighbor(view, dx);
          if (next) peek(next);
          root.current?.classList.add("is-dragging");
        }
        if (!track.current) return;
        // Resist at the outer edges: there is no page beyond Clips or Create.
        const offset = pagerNeighbor(view, dx) ? dx : dx / 4;
        track.current.style.transform = `translateX(calc(${index} * -33.3333% + ${offset}px))`;
      }}
      onTouchEnd={(event) => {
        const state = drag.current,
          touch = event.changedTouches[0];
        release();
        if (!state || state.axis !== "x" || !touch) return;
        swallowClick.current = true;
        setTimeout(() => (swallowClick.current = false), 350);
        const dx = touch.clientX - state.x,
          next = pagerNeighbor(view, dx);
        if (next && pagerSettles(dx, performance.now() - state.at, innerWidth))
          select(next);
      }}
      onTouchCancel={release}
      onClickCapture={(event) => {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div
        ref={track}
        className="social-pager-track"
        style={{ "--social-pager-index": index } as React.CSSProperties}
      >
        {PAGER_ORDER.map((page) => (
          <section
            key={page}
            data-page={page}
            className={`social-pager-page social-${page}-view`}
            inert={page !== view}
            aria-hidden={page !== view || undefined}
          >
            {children(page)}
          </section>
        ))}
      </div>
    </div>
  );
}
