"use client";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { playMotion } from "@/lib/motion";
import { useOverlayHistory } from "@/lib/use-overlay-history";

export type MessageActionAnchor = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
};
export function messageActionAnchor(element: HTMLElement): MessageActionAnchor {
  const { top, left, right, bottom, width } = element.getBoundingClientRect();
  return { top, left, right, bottom, width };
}
export function MessageActionPopover({
  anchor,
  onDismiss,
  children,
  label = "Ações da mensagem",
  wide = false,
}: {
  anchor: MessageActionAnchor;
  onDismiss: () => void;
  children: ReactNode;
  label?: string;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onDismiss);
  useLayoutEffect(() => {
    close.current = onDismiss;
  }, [onDismiss]);
  useOverlayHistory(onDismiss);
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    const place = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      const width = Math.min(wide ? 408 : 296, innerWidth - 24);
      el.style.width = `${width}px`;
      el.style.maxHeight = `${height - 24}px`;
      const left = Math.max(
        12,
        Math.min(innerWidth - width - 12, anchor.right - width),
      );
      const below = anchor.bottom + 8;
      const top =
        below + el.offsetHeight < height + offset - 12
          ? below
          : anchor.top - el.offsetHeight - 8;
      el.style.left = `${left}px`;
      el.style.top = `${Math.max(offset + 12, Math.min(top, height + offset - el.offsetHeight - 12))}px`;
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(el);
    window.visualViewport?.addEventListener("resize", place);
    window.addEventListener("resize", place);
    const animation = playMotion(
      el,
      [
        { opacity: 0.2, transform: "translateY(8px) scale(.96)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 210 },
    );
    el.focus({ preventScroll: true });
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,select,textarea,[tabindex="0"]',
        ),
      );
      const first = focusable[0],
        last = focusable.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === el)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last || document.activeElement === el)
      ) {
        e.preventDefault();
        first?.focus();
      }
    };
    el.addEventListener("keydown", keys);
    return () => {
      animation?.cancel();
      resize.disconnect();
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
      el.removeEventListener("keydown", keys);
      requestAnimationFrame(() => {
        if (
          previous?.isConnected &&
          (!document.activeElement || document.activeElement === document.body)
        )
          previous.focus({ preventScroll: true });
      });
    };
  }, [anchor, wide]);
  return createPortal(
    <div className="message-overlay-root">
      <button
        type="button"
        className="message-action-scrim"
        tabIndex={-1}
        aria-label="Fechar ações da mensagem"
        onClick={onDismiss}
      />
      <div
        ref={panel}
        className="message-action-popover"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
