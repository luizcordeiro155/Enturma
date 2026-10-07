"use client";

type EnturmaNativeBridge = {
  setChatComposerFocused?: (focused: boolean) => void;
};

declare global {
  interface Window {
    EnturmaNative?: EnturmaNativeBridge;
  }
}

/**
 * Tells the Android shell that a real message composer owns focus.
 * The native shell then resizes the WebView to the top of the IME, exactly
 * like a messenger activity, instead of trying to float the textarea in CSS.
 */
export function setNativeChatComposerFocused(focused: boolean) {
  try {
    window.EnturmaNative?.setChatComposerFocused?.(focused);
  } catch {
    // Browser/PWA builds do not expose the Android bridge.
  }
}
