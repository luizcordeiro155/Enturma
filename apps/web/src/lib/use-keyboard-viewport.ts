"use client";

import { useEffect } from "react";
import {
  isTextEntryControl,
  setNativeTextInputFocused,
} from "@/lib/native-chat-ime";

/**
 * Keeps a stable visual-viewport inset for mobile surfaces without repeatedly
 * scrolling the focused control while Android animates the IME.
 *
 * The old implementation called smooth scrollIntoView on every visualViewport
 * resize/scroll event. During keyboard animation that created a feedback loop
 * where the page kept climbing a few pixels at a time.
 */
export function useKeyboardViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    let frame = 0;
    let focusTimer: ReturnType<typeof setTimeout> | undefined;

    const syncInset = () => {
      if (!viewport) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const inset = Math.max(
          0,
          Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
        );
        root.style.setProperty("--ride-keyboard-inset", `${inset}px`);
        root.style.setProperty(
          "--enturma-visual-viewport-height",
          `${Math.round(viewport.height)}px`,
        );
      });
    };

    const ensureFocusedControlVisible = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;
      if (
        !active.matches(
          "input:not([type='file']):not([type='hidden']), textarea, select, [contenteditable='true']",
        )
      )
        return;

      // Chat composers manage their own placement above the IME.
      if (
        active.closest(
          ".enturma-message-composer, .persistent-composer, .private-composer",
        )
      )
        return;

      if (!viewport) return;
      const rect = active.getBoundingClientRect();
      const visibleTop = viewport.offsetTop + 12;
      const visibleBottom = viewport.offsetTop + viewport.height - 16;

      if (rect.top < visibleTop || rect.bottom > visibleBottom) {
        active.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "auto",
        });
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const textEntry = isTextEntryControl(event.target);
      setNativeTextInputFocused(textEntry);
      root.dataset.enturmaTextInput = textEntry ? "true" : "false";
      syncInset();
      if (focusTimer) clearTimeout(focusTimer);
      // Wait for the keyboard to reach its final geometry, then correct once.
      if (textEntry)
        focusTimer = setTimeout(ensureFocusedControlVisible, 260);
    };

    const onFocusOut = () => {
      window.setTimeout(() => {
        const textEntry = isTextEntryControl(document.activeElement);
        setNativeTextInputFocused(textEntry);
        root.dataset.enturmaTextInput = textEntry ? "true" : "false";
      }, 0);
    };

    syncInset();
    viewport?.addEventListener("resize", syncInset);
    viewport?.addEventListener("scroll", syncInset);
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);

    return () => {
      cancelAnimationFrame(frame);
      if (focusTimer) clearTimeout(focusTimer);
      viewport?.removeEventListener("resize", syncInset);
      viewport?.removeEventListener("scroll", syncInset);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
      setNativeTextInputFocused(false);
      delete root.dataset.enturmaTextInput;
      root.style.removeProperty("--ride-keyboard-inset");
      root.style.removeProperty("--enturma-visual-viewport-height");
    };
  }, []);
}
