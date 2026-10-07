"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { playMotion } from "@/lib/motion";

export type MessageActionAnchor = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
};

export function messageActionAnchor(element: HTMLElement): MessageActionAnchor {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
  };
}

export function MessageActionPopover({
  anchor,
  onDismiss,
  children,
}: {
  anchor: MessageActionAnchor;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const popover = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = popover.current;
    if (!element) return;

    const viewportWidth = window.innerWidth;
    const margin = 12;
    const width = Math.min(286, viewportWidth - margin * 2);
    element.style.width = `${width}px`;

    const measuredHeight = element.offsetHeight || 150;
    const preferredLeft = anchor.left + anchor.width / 2 - width / 2;
    const left = Math.max(
      margin,
      Math.min(viewportWidth - width - margin, preferredLeft),
    );
    const top = Math.max(margin, anchor.top - measuredHeight - 10);

    element.style.left = `${Math.round(left)}px`;
    element.style.top = `${Math.round(top)}px`;
    element.style.setProperty(
      "--message-action-caret-x",
      `${Math.max(20, Math.min(width - 20, anchor.left + anchor.width / 2 - left))}px`,
    );

    const popoverAnimation = playMotion(
      element,
      [
        {
          opacity: 0.25,
          transform: "translateY(9px) scale(.965)",
          filter: "blur(3px)",
        },
        {
          opacity: 1,
          transform: "translateY(0) scale(1)",
          filter: "blur(0)",
        },
      ],
      { duration: 190, easing: "cubic-bezier(.2,.85,.25,1)" },
    );
    const scrimAnimation = scrim.current
      ? playMotion(
          scrim.current,
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 150, easing: "ease-out" },
        )
      : undefined;

    const closeOnLayoutChange = () => onDismiss();
    const closeOnBack = () => onDismiss();
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    window.addEventListener("resize", closeOnLayoutChange);
    window.addEventListener("popstate", closeOnBack);
    window.addEventListener("hashchange", closeOnBack);
    window.addEventListener("keydown", closeOnKey);
    document.addEventListener("scroll", closeOnLayoutChange, true);

    return () => {
      popoverAnimation?.cancel();
      scrimAnimation?.cancel();
      window.removeEventListener("resize", closeOnLayoutChange);
      window.removeEventListener("popstate", closeOnBack);
      window.removeEventListener("hashchange", closeOnBack);
      window.removeEventListener("keydown", closeOnKey);
      document.removeEventListener("scroll", closeOnLayoutChange, true);
    };
  }, [anchor, onDismiss]);

  return (
    <>
      <button
        ref={scrim}
        type="button"
        className="message-action-scrim"
        aria-label="Fechar ações da mensagem"
        onClick={onDismiss}
      />
      <div
        ref={popover}
        className="message-action-popover"
        role="dialog"
        aria-modal="true"
        aria-label="Ações da mensagem"
      >
        {children}
        <span className="message-action-caret" aria-hidden="true" />
      </div>
    </>
  );
}
