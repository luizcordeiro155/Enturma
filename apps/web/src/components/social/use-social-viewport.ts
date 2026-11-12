"use client";
import { useEffect } from "react";
import {
  isTextEntryControl,
  setNativeChatComposerFocused,
} from "@/lib/native-chat-ime";
type VirtualKeyboard = EventTarget & {
  overlaysContent: boolean;
  boundingRect: DOMRect;
};
export function useSocialViewport() {
  useEffect(() => {
    const root = document.documentElement,
      viewport = window.visualViewport;
    const keyboard = (
      navigator as Navigator & { virtualKeyboard?: VirtualKeyboard }
    ).virtualKeyboard;
    const oldOverlay = keyboard?.overlaysContent;
    if (keyboard) keyboard.overlaysContent = true;
    let restHeight = window.innerHeight,
      frame = 0,
      focusTimer: ReturnType<typeof setTimeout> | undefined,
      blurTimer: ReturnType<typeof setTimeout> | undefined;
    let lastNative = -1,
      lastHeight = -1,
      lastInset = -1;
    function sync() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!matchMedia("(max-width:760px)").matches) return;
        const native =
          parseFloat(
            getComputedStyle(root).getPropertyValue("--native-keyboard-bottom"),
          ) || 0;
        const focused = isTextEntryControl(document.activeElement);
        const inset = Math.max(
          native,
          keyboard?.boundingRect.height ?? 0,
          window.innerHeight -
            (viewport?.height ?? window.innerHeight) -
            (viewport?.offsetTop ?? 0),
        );
        if (!focused && inset < 100) restHeight = window.innerHeight;
        root.style.setProperty("--social-rest-height", `${restHeight}px`);
        root.style.setProperty(
          "--social-ime-height",
          `${Math.max(0, restHeight - window.innerHeight, inset)}px`,
        );
        if (
          lastNative !== native ||
          lastHeight !== window.innerHeight ||
          lastInset !== inset
        ) {
          lastInset = inset;
          lastNative = native;
          lastHeight = window.innerHeight;
          window.dispatchEvent(new Event("enturma-social-viewport"));
        }
      });
    }
    function onFocus() {
      const focused =
        isTextEntryControl(document.activeElement) &&
        Boolean(
          document.activeElement?.closest(
            ".social-active-shell,.social-dialog",
          ),
        );
      setNativeChatComposerFocused(focused);
      sync();
      clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        const control = document.activeElement;
        if (
          !(control instanceof HTMLElement) ||
          control.closest(
            ".social-dialog,.social-comment-form,.social-live-composer",
          )
        )
          return;
        const page = control.closest<HTMLElement>(
          '.social-pager-page[data-page="create"]',
        );
        if (!page) return;
        const bottom = Math.min(
          viewport?.height ?? innerHeight,
          innerHeight - (keyboard?.boundingRect.height ?? 0),
        );
        const overflow = control.getBoundingClientRect().bottom - bottom + 16;
        if (overflow > 0) page.scrollTop += overflow;
      }, 280);
    }
    const blur = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(onFocus, 0);
    };
    const observe = new MutationObserver(() => {
      const native =
        parseFloat(
          getComputedStyle(root).getPropertyValue("--native-keyboard-bottom"),
        ) || 0;
      if (native !== lastNative) sync();
    });
    observe.observe(root, {
      attributes: true,
      attributeFilter: ["style", "data-enturma-ime"],
    });
    sync();
    window.addEventListener("resize", sync);
    viewport?.addEventListener("resize", sync);
    keyboard?.addEventListener("geometrychange", sync);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", blur);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(blurTimer);
      clearTimeout(focusTimer);
      observe.disconnect();
      window.removeEventListener("resize", sync);
      viewport?.removeEventListener("resize", sync);
      keyboard?.removeEventListener("geometrychange", sync);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", blur);
      if (keyboard && oldOverlay !== undefined)
        keyboard.overlaysContent = oldOverlay;
      root.style.removeProperty("--social-rest-height");
      root.style.removeProperty("--social-ime-height");
      setNativeChatComposerFocused(false);
    };
  }, []);
}
