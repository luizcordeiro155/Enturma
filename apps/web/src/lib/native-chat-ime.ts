"use client";

type NativeChatWindow = Window & {
  EnturmaNative?: {
    setChatComposerFocused?: (focused: boolean) => void;
  };
};

/**
 * Tells the Android shell that a real message composer owns focus.
 * The native shell then resizes the WebView to the top of the IME, exactly
 * like a messenger activity, instead of trying to float the textarea in CSS.
 */
export function setNativeChatComposerFocused(focused: boolean) {
  try {
    (window as NativeChatWindow).EnturmaNative?.setChatComposerFocused?.(
      focused,
    );
  } catch {
    // Browser/PWA builds do not expose the Android bridge.
  }
}
