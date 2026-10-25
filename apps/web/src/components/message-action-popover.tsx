"use client";
import { useLayoutEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { playMotion } from "@/lib/motion";
import { isTextEntryControl } from "@/lib/native-chat-ime";
import {
  useOverlayHistory,
  waitForOverlayHistory,
} from "@/lib/use-overlay-history";

export type MessageActionAnchor = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  element?: HTMLElement;
};
export function messageActionAnchor(element: HTMLElement): MessageActionAnchor {
  const { top, left, right, bottom, width } = element.getBoundingClientRect();
  return { top, left, right, bottom, width, element };
}
export function MessageActionPopover({
  anchor,
  onDismiss,
  children,
  label = "Ações da mensagem",
  wide = false,
  composer = false,
}: {
  anchor: MessageActionAnchor;
  onDismiss: () => void;
  children: ReactNode;
  label?: string;
  wide?: boolean;
  composer?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onDismiss);
  useLayoutEffect(() => {
    close.current = onDismiss;
  }, [onDismiss]);
  useOverlayHistory(onDismiss);
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    let frame = 0;
    const place = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      const viewportWidth = viewport?.width ?? innerWidth;
      const offsetLeft = viewport?.offsetLeft ?? 0;
      const current = anchor.element?.isConnected
        ? anchor.element.getBoundingClientRect()
        : anchor;
      const nativeTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--native-safe-top")) || 0;
      const visibleTop = Math.max(offset, nativeTop) + 12;
      const visibleBottom = offset + height - 12;
      const composerTop = composer
        ? anchor.element?.closest(".enturma-message-composer")?.getBoundingClientRect().top ?? current.top
        : current.top;
      const aboveBottom = Math.min(composerTop - 8, visibleBottom);
      const width = Math.min(wide ? 408 : 296, viewportWidth - 24);
      el.style.width = `${width}px`;
      el.style.maxHeight = `${Math.max(0, (composer ? aboveBottom : visibleBottom) - visibleTop)}px`;
      const left = Math.max(
        offsetLeft + 12,
        Math.min(offsetLeft + viewportWidth - width - 12, current.right - width),
      );
      const below = current.bottom + 8;
      const top =
        !composer && below + el.offsetHeight < visibleBottom
          ? below
          : aboveBottom - el.offsetHeight;
      el.style.left = `${left}px`;
      el.style.top = `${Math.max(visibleTop, Math.min(top, visibleBottom - el.offsetHeight))}px`;
    };
    const schedulePlace = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    place();
    const resize = new ResizeObserver(schedulePlace);
    resize.observe(el);
    if (anchor.element) resize.observe(anchor.element);
    const owner = anchor.element?.closest(".enturma-message-composer");
    if (owner) resize.observe(owner);
    window.visualViewport?.addEventListener("resize", schedulePlace);
    window.visualViewport?.addEventListener("scroll", schedulePlace, { passive: true });
    window.addEventListener("resize", schedulePlace);
    window.addEventListener("scroll", schedulePlace, { capture: true, passive: true });
    const animation = playMotion(
      el,
      [
        { opacity: 0.2, transform: "translateY(8px) scale(.96)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 210 },
    );
    // Moving focus to a dialog hides Android/iOS's software keyboard.
    if (!composer || !isTextEntryControl(previous)) el.focus({ preventScroll: true });
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key !== "Tab" || composer) return;
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
    const keyTarget = composer ? document : el;
    keyTarget.addEventListener("keydown", keys as EventListener);
    return () => {
      animation?.cancel();
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("resize", schedulePlace);
      window.removeEventListener("scroll", schedulePlace, true);
      window.visualViewport?.removeEventListener("resize", schedulePlace);
      window.visualViewport?.removeEventListener("scroll", schedulePlace);
      keyTarget.removeEventListener("keydown", keys as EventListener);
      // Restore the composer before a focused search field is unmounted.
      if (composer && previous?.isConnected && isTextEntryControl(previous) &&
          (el.contains(document.activeElement) || document.activeElement === document.body)) {
        previous.focus({ preventScroll: true });
      }
      void waitForOverlayHistory().then(() =>
        requestAnimationFrame(() => {
          if (
            previous?.isConnected &&
            (!document.activeElement ||
              document.activeElement === document.body)
          )
            previous.focus({ preventScroll: true });
        }),
      );
    };
  }, [anchor, wide, composer]);
  const preserveTextFocus = (event: PointerEvent) => {
    if (composer && isTextEntryControl(document.activeElement) &&
        event.target instanceof Element &&
        !event.target.closest("input,textarea,select,label,[contenteditable='true']")) {
      event.preventDefault();
    }
  };
  return createPortal(
    <div className="message-overlay-root">
      <button
        type="button"
        className="message-action-scrim"
        tabIndex={-1}
        aria-label="Fechar ações da mensagem"
        onPointerDown={preserveTextFocus}
        onClick={onDismiss}
      />
      <div
        ref={panel}
        className={`message-action-popover${composer ? " composer-media-popover" : ""}`}
        role="dialog"
        aria-modal={composer ? undefined : true}
        aria-label={label}
        tabIndex={-1}
        onPointerDown={preserveTextFocus}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
