"use client";

import { useEffect } from "react";

export type MobileWebChat = "room" | "private";

/** Detect a real keyboard, never merely the browser address bar collapsing. */
export function isRoomKeyboardVisible(
  baselineHeight: number,
  visibleHeight: number,
  composerFocused: boolean,
): boolean {
  if (!composerFocused || baselineHeight <= 0 || visibleHeight <= 0) return false;
  return baselineHeight - visibleHeight > Math.max(120, baselineHeight * 0.18);
}

/**
 * The inset is measured against the *current layout viewport*. Chrome Android
 * may resize only visualViewport (inset > 0), or both viewports (inset = 0).
 * Neither case should get a second, additive keyboard-height correction.
 */
export function mobileWebKeyboardInset(
  layoutHeight: number,
  visibleHeight: number,
  offsetTop = 0,
): number {
  return Math.max(
    0,
    Math.round(layoutHeight - Math.max(0, offsetTop) - Math.max(0, visibleHeight)),
  );
}

/** The visible bottom remains the source of truth even if Chrome pans its visual viewport. */
export function mobileWebVisibleBottom(visibleHeight: number, offsetTop = 0): number {
  return Math.max(0, Math.round(Math.max(0, offsetTop) + Math.max(0, visibleHeight)));
}

/** Compensate after layout rather than trusting how a browser anchors fixed. */
export function mobileWebComposerCorrection(
  visibleBottom: number,
  composerBottom: number,
): number {
  return Math.round(visibleBottom - 5 - composerBottom);
}

export function mobileWebMessageHeight(
  visibleTop: number,
  visibleBottom: number,
  messagesTop: number,
  composerHeight: number,
  typingHeight = 0,
): number {
  return Math.max(
    56,
    Math.floor(
      visibleBottom -
        Math.max(visibleTop, messagesTop) -
        composerHeight -
        typingHeight -
        10,
    ),
  );
}

/**
 * Shared Web Mobile keyboard anchor for both room and private conversations.
 * Never runs inside the Android APK; its EnturmaNative bridge controls the IME.
 *
 * Instead of shrinking the entire application shell (a source of blank space
 * on Samsung Internet/Chrome), we pin only the focused composer to the
 * visualViewport bottom and limit scrolling to the message history.
 */
export function useMobileWebChatViewport(active: boolean, kind: MobileWebChat) {
  useEffect(() => {
    if (!active) return;

    const root = document.documentElement;
    const mobile = window.matchMedia("(max-width: 760px) and (pointer: coarse)");
    const nativeBridge = (
      window as Window & {
        EnturmaNative?: { setChatComposerFocused?: (focused: boolean) => void };
      }
    ).EnturmaNative?.setChatComposerFocused;

    const isBrowserMobile = () =>
      mobile.matches && !nativeBridge && root.dataset.enturmaMobile !== "true";

    const composerSelector =
      kind === "room"
        ? ".room-section-chat .persistent-composer.enturma-message-composer"
        : ".mobile-private-chat-open .private-composer.enturma-message-composer";
    const messagesSelector =
      kind === "room"
        ? ".room-section-chat .persistent-messages"
        : ".mobile-private-chat-open .private-messages";

    const viewport = window.visualViewport;
    let baselineHeight = viewport?.height ?? window.innerHeight;
    let wasOpen = false;
    let frame = 0;
    const timers: number[] = [];

    const clearKeyboard = () => {
      if (root.dataset.mobileWebChatKeyboard === kind) {
        delete root.dataset.mobileWebChatKeyboard;
        root.style.removeProperty("--mobile-web-chat-bottom");
        root.style.removeProperty("--mobile-web-chat-adjust");
        root.style.removeProperty("--mobile-web-chat-messages-height");
        root.style.removeProperty("--mobile-web-chat-visible-bottom");
      }
      delete root.dataset.roomBrowserKeyboard;
      root.style.removeProperty("--room-visible-height");
      root.style.removeProperty("--room-visible-top");
      root.style.removeProperty("--room-viewport-bottom");
      wasOpen = false;
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!isBrowserMobile()) {
          clearKeyboard();
          if (kind === "room") delete root.dataset.roomBrowserLayout;
          return;
        }

        if (kind === "room") root.dataset.roomBrowserLayout = "true";

        const visibleHeight = viewport?.height ?? window.innerHeight;
        const visibleTop = Math.max(0, viewport?.offsetTop ?? 0);
        const visibleBottom = mobileWebVisibleBottom(visibleHeight, visibleTop);
        const input = document.activeElement;
        const focused =
          input instanceof HTMLElement && Boolean(input.closest(composerSelector));

        if (!focused && !wasOpen) {
          baselineHeight = Math.max(baselineHeight, visibleHeight);
        } else if (visibleHeight > baselineHeight) {
          baselineHeight = visibleHeight;
        }

        const shrunk = isRoomKeyboardVisible(
          baselineHeight,
          visibleHeight,
          focused || wasOpen,
        );
        const inset = mobileWebKeyboardInset(
          window.innerHeight,
          visibleHeight,
          visibleTop,
        );
        // Arm immediately on first focus, before Chrome emits its first IME resize.
        // Waiting for a 120px drop briefly hid the private composer behind the keyboard.
        const keyboardOpen = focused || shrunk;
        if (!keyboardOpen) {
          clearKeyboard();
          return;
        }

        wasOpen = true;
        root.dataset.mobileWebChatKeyboard = kind;
        if (kind === "private") {
          // Private conversations have a full-height flex layout. Resize that
          // conversation to the visual viewport instead of detaching its input
          // with position:fixed, which fails on the first Chrome IME animation.
          // The header stays put; only the messages flex and composer follow IME.
          root.style.setProperty(
            "--mobile-web-chat-visible-bottom",
            `${visibleBottom}px`,
          );
          return;
        }
        root.style.setProperty("--mobile-web-chat-bottom", `${inset}px`);
        // Reset before measuring so each frame corrects the actual new
        // viewport instead of accumulating previous transforms.
        root.style.setProperty("--mobile-web-chat-adjust", "0px");

        const composer = document.querySelector<HTMLElement>(composerSelector);
        const messages = document.querySelector<HTMLElement>(messagesSelector);
        if (!composer) return;

        // Measuring after setting data attributes forces the keyboard-specific
        // CSS to take effect before the correction is calculated.
        const composerRect = composer.getBoundingClientRect();
        root.style.setProperty(
          "--mobile-web-chat-adjust",
          `${mobileWebComposerCorrection(visibleBottom, composerRect.bottom)}px`,
        );

        if (messages) {
          const rect = messages.getBoundingClientRect();
          const typing = kind === "room"
            ? document.querySelector<HTMLElement>(
                ".room-section-chat .typing-status",
              )
            : document.querySelector<HTMLElement>(
                ".mobile-private-chat-open .typing-status",
              );
          const height = mobileWebMessageHeight(
            visibleTop,
            visibleBottom,
            rect.top,
            composerRect.height,
            typing?.getBoundingClientRect().height ?? 0,
          );
          root.style.setProperty(
            "--mobile-web-chat-messages-height",
            `${height}px`,
          );
        }
      });
    };

    const onFocus = (event: FocusEvent) => {
      // Apply the private chat's viewport constraint during focusin itself,
      // before Android Chrome's browser-driven scroll/focus adjustment.
      if (
        kind === "private" &&
        isBrowserMobile() &&
        event.type === "focusin" &&
        event.target instanceof HTMLElement &&
        event.target.closest(composerSelector)
      ) {
        root.dataset.mobileWebChatKeyboard = kind;
        root.style.setProperty(
          "--mobile-web-chat-visible-bottom",
          `${mobileWebVisibleBottom(viewport?.height ?? window.innerHeight, viewport?.offsetTop ?? 0)}px`,
        );
      }
      sync();
      for (const delay of [80, 220, 400]) {
        timers.push(window.setTimeout(sync, delay));
      }
    };
    const onOrientationChange = () => {
      clearKeyboard();
      baselineHeight = viewport?.height ?? window.innerHeight;
      sync();
    };

    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", onOrientationChange);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocus);
    mobile.addEventListener("change", sync);

    // Expanding the textarea/reply preview must not move the field away from
    // the keyboard; bottom anchoring stays constant while height grows upward.
    const composer = document.querySelector<HTMLElement>(composerSelector);
    const observer =
      composer && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(sync)
        : null;
    if (composer && observer) observer.observe(composer);

    return () => {
      cancelAnimationFrame(frame);
      for (const timer of timers) clearTimeout(timer);
      observer?.disconnect();
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", onOrientationChange);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
      mobile.removeEventListener("change", sync);
      clearKeyboard();
      if (kind === "room") delete root.dataset.roomBrowserLayout;
    };
  }, [active, kind]);
}

/** Preserve the room's existing public API. */
export function useRoomBrowserViewport(active: boolean) {
  useMobileWebChatViewport(active, "room");
}
