"use client";

import { useEffect } from "react";

/**
 * Mobile browsers vary: some resize the layout viewport with the keyboard,
 * while others resize only visualViewport. Compare against the pre-focus
 * visual height, not window.innerHeight at the time the IME is visible.
 */
export function isRoomKeyboardVisible(
  baselineHeight: number,
  visibleHeight: number,
  composerFocused: boolean,
): boolean {
  if (!composerFocused || baselineHeight <= 0 || visibleHeight <= 0) {
    return false;
  }
  return baselineHeight - visibleHeight > Math.max(120, baselineHeight * 0.18);
}

/**
 * Isolated to the Web/mobile room chat. The Android APK has its own native
 * keyboard bridge and must retain its existing adjustResize behavior.
 *
 * The room, not the page, owns scrolling; when the IME is visible, the room
 * becomes exactly as tall as visualViewport and its composer remains in flow.
 * The room navigation is hidden below the keyboard until it closes.
 */
export function useRoomBrowserViewport(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const root = document.documentElement;
    const viewport = window.visualViewport;
    const mobile = window.matchMedia("(max-width: 760px) and (pointer: coarse)");
    const nativeBridge = (
      window as Window & {
        EnturmaNative?: { setChatComposerFocused?: (focused: boolean) => void };
      }
    ).EnturmaNative?.setChatComposerFocused;

    let baselineHeight = viewport?.height ?? window.innerHeight;
    let frame = 0;
    let focusTimer = 0;
    let wasOpen = false;

    const clear = () => {
      delete root.dataset.roomBrowserLayout;
      delete root.dataset.roomBrowserKeyboard;
      root.style.removeProperty("--room-visible-height");
      root.style.removeProperty("--room-visible-top");
      root.style.removeProperty("--room-viewport-bottom");
      wasOpen = false;
    };

    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!mobile.matches || nativeBridge) {
          clear();
          return;
        }

        root.dataset.roomBrowserLayout = "true";
        const visibleHeight = viewport?.height ?? window.innerHeight;
        const focus = document.activeElement;
        const composerFocused =
          focus instanceof HTMLElement &&
          Boolean(focus.closest(".room-section-chat .persistent-composer"));

        // Track a stable unoccluded baseline. Do not rebase while the IME
        // is animating, including a brief blur when the send button is tapped.
        if (!composerFocused && !wasOpen) {
          baselineHeight = Math.max(visibleHeight, window.innerHeight);
        } else if (visibleHeight > baselineHeight) {
          baselineHeight = visibleHeight;
        }

        const open = isRoomKeyboardVisible(
          baselineHeight,
          visibleHeight,
          composerFocused || wasOpen,
        );
        wasOpen = open;
        if (!open) {
          delete root.dataset.roomBrowserKeyboard;
          root.style.removeProperty("--room-visible-height");
          root.style.removeProperty("--room-visible-top");
          root.style.removeProperty("--room-viewport-bottom");
          return;
        }

        root.dataset.roomBrowserKeyboard = "true";
        root.style.setProperty(
          "--room-visible-height",
          `${Math.round(visibleHeight)}px`,
        );
        const top = Math.max(0, viewport?.offsetTop ?? 0);
        root.style.setProperty("--room-visible-top", `${Math.round(top)}px`);
        root.style.setProperty("--room-viewport-bottom", `${Math.max(0, Math.round(window.innerHeight - top - visibleHeight))}px`);
      });
    };

    const onFocus = () => {
      sync();
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(sync, 180);
    };
    const onOrientationChange = () => {
      baselineHeight = viewport?.height ?? window.innerHeight;
      wasOpen = false;
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

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(focusTimer);
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", onOrientationChange);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
      mobile.removeEventListener("change", sync);
      clear();
    };
  }, [active]);
}
