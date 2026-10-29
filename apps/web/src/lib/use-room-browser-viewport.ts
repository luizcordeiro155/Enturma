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
 * The visual viewport is the one geometry source for the active conversation:
 * resize the chat screen (never the document or an independently floating
 * composer), and let its flex message list absorb the keyboard animation.
 * The room only switches to its IME layout AFTER the visual viewport shrinks;
 * focusing or touching the textarea alone must never cover the room tabs.
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
    const viewport = window.visualViewport;
    let baselineHeight = viewport?.height ?? window.innerHeight;
    let wasOpen = false;
    // Tracks an actual keyboard, not simply a focused textarea. Android
    // back can close the IME without blurring the input.
    let keyboardWasVisible = false;
    let focusArmedUntil = 0;
    let roomNavRestTop: number | null = null;
    let frame = 0;
    const timers: number[] = [];

    const captureRoomNavigationPosition = () => {
      if (kind !== "room") return;
      const navigation = document.querySelector<HTMLElement>(
        ".room-active-shell .room-section-chat .room-mobile-nav",
      );
      if (!navigation) return;
      const rect = navigation.getBoundingClientRect();
      if (rect.height > 20 && Number.isFinite(rect.top) && !wasOpen) {
        // Capture its original location before the browser starts the IME
        // animation; do not change ANY styling on pointerdown/focusin.
        roomNavRestTop = Math.round(rect.top);
      }
    };

    const clearKeyboard = () => {
      const hadKeyboardLayout = root.dataset.mobileWebChatKeyboard === kind;
      if (hadKeyboardLayout) {
        delete root.dataset.mobileWebChatKeyboard;
        root.style.removeProperty("--mobile-web-chat-visible-top");
        root.style.removeProperty("--mobile-web-chat-visible-height");
        root.style.removeProperty("--mobile-web-chat-visible-bottom");
        root.style.removeProperty("--mobile-web-chat-bottom");
        root.style.removeProperty("--mobile-web-chat-adjust");
        root.style.removeProperty("--mobile-web-chat-messages-height");
      }
      if (kind === "room") {
        root.style.removeProperty("--room-mobile-nav-rest-top");
        if (hadKeyboardLayout) roomNavRestTop = null;
      }
      delete root.dataset.roomBrowserKeyboard;
      root.style.removeProperty("--room-visible-height");
      root.style.removeProperty("--room-visible-top");
      root.style.removeProperty("--room-viewport-bottom");
      wasOpen = false;
    };

    const geometry = () => {
      const height = Math.max(1, Math.round(viewport?.height || window.innerHeight));
      const top = Math.max(0, Math.round(viewport?.offsetTop ?? 0));
      return { height, top };
    };

    const pinConversation = () => {
      if (kind === "room" && !wasOpen) {
        if (roomNavRestTop === null) captureRoomNavigationPosition();
        if (roomNavRestTop !== null)
          root.style.setProperty("--room-mobile-nav-rest-top", String(roomNavRestTop) + "px");
      }
      const { height, top } = geometry();
      root.dataset.mobileWebChatKeyboard = kind;
      root.style.setProperty("--mobile-web-chat-visible-top", String(top) + "px");
      root.style.setProperty("--mobile-web-chat-visible-height", String(height) + "px");
      root.style.setProperty("--mobile-web-chat-visible-bottom", String(top + height) + "px");
      wasOpen = true;
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
        const { height } = geometry();
        const input = document.activeElement;
        const focused =
          input instanceof HTMLElement && Boolean(input.closest(composerSelector));

        if (!focused && !wasOpen) {
          baselineHeight = Math.max(baselineHeight, height);
        } else if (height > baselineHeight) {
          baselineHeight = height;
        }
        const keyboardVisible = isRoomKeyboardVisible(
          baselineHeight,
          height,
          focused || wasOpen,
        );
        if (keyboardVisible) keyboardWasVisible = true;

        // Samsung/Chrome can dismiss the IME with the Android Back button
        // while the textarea stays focused. Release the keyboard layout so
        // the four navigation tabs return to their original in-flow position.
        const recovered = keyboardWasVisible && !keyboardVisible &&
          height >= baselineHeight - 40;
        // Private chats retain their first-focus behavior. In study rooms,
        // activation before a real viewport shrink makes the composer leap
        // down over Chat/Chamada/Materiais/AI before the IME even appears.
        const openingPrivateChat = kind === "private" && focused &&
          !keyboardWasVisible && performance.now() < focusArmedUntil;
        if (recovered || (!keyboardVisible && !openingPrivateChat)) {
          clearKeyboard();
          return;
        }

        pinConversation();
      });
    };

    const onFocus = (event: FocusEvent) => {
      if (
        event.type === "focusin" &&
        isBrowserMobile() &&
        event.target instanceof HTMLElement &&
        event.target.closest(composerSelector)
      ) {
        focusArmedUntil = performance.now() + 900;
        keyboardWasVisible = false;
        if (kind === "room")
          captureRoomNavigationPosition();
        else
          pinConversation();
      }
      sync();
      for (const delay of [80, 180, 300, 450]) {
        timers.push(window.setTimeout(sync, delay));
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const element = event.target;
      if (
        !isBrowserMobile() ||
        !(element instanceof HTMLElement) ||
        !(element.matches("textarea") || element.closest(".composer-text-field")) ||
        !element.closest(composerSelector)
      ) return;
      const textarea = element.closest(composerSelector)?.querySelector("textarea");
      if (textarea instanceof HTMLTextAreaElement && !textarea.disabled) {
        focusArmedUntil = performance.now() + 900;
        keyboardWasVisible = false;
        if (kind === "room")
          captureRoomNavigationPosition();
        else
          pinConversation();
      }
    };
    const onOrientationChange = () => {
      clearKeyboard();
      keyboardWasVisible = false;
      focusArmedUntil = 0;
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
    document.addEventListener("pointerdown", onPointerDown, true);
    mobile.addEventListener("change", sync);

    // Composer height changes consume message space within the flex column
    // without moving its bottom edge independently of the visual viewport.
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
      document.removeEventListener("pointerdown", onPointerDown, true);
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
