"use client";

type NativeTextInputWindow = Window & {
  EnturmaNative?: {
    setChatComposerFocused?: (focused: boolean) => void;
    setChatSurfaceFocused?: (focused: boolean) => void;
  };
};

/**
 * The Android bridge keeps this historical method name for APK compatibility,
 * but the same native resize behavior now applies to every real text field.
 */
export function setNativeTextInputFocused(focused: boolean) {
  try {
    (window as NativeTextInputWindow).EnturmaNative?.setChatComposerFocused?.(
      focused,
    );
  } catch {
    // Browser/PWA builds do not expose the Android bridge.
  }
}

/**
 * Backwards-compatible alias used by the room and private-message composers.
 */
export function setNativeChatComposerFocused(focused: boolean) {
  setNativeTextInputFocused(focused);
  try {
    // Optional for earlier installed APKs; new APKs keep WebView full-height.
    (window as NativeTextInputWindow).EnturmaNative?.setChatSurfaceFocused?.(
      focused,
    );
  } catch {
    // No native bridge in browsers and PWAs.
  }
}

export function isTextEntryControl(
  target: EventTarget | Element | null,
): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return !target.disabled;
  if (target.isContentEditable) return true;
  if (!(target instanceof HTMLInputElement) || target.disabled) return false;

  return ![
    "button",
    "checkbox",
    "color",
    "date",
    "datetime-local",
    "file",
    "hidden",
    "image",
    "month",
    "radio",
    "range",
    "reset",
    "submit",
    "time",
    "week",
  ].includes(target.type);
}

/**
 * Phones and the Android app keep Enter as a line break. Desktop keeps the
 * existing Enter-to-send shortcut; Shift+Enter continues to work there too.
 */
export function isMobileTextEntryContext() {
  if (typeof window === "undefined") return false;
  const root = document.documentElement;
  if (root.dataset.enturmaMobile === "true") return true;
  return window.matchMedia(
    "(max-width: 900px) and (pointer: coarse)",
  ).matches;
}

export function resizeMessageComposerTextarea(
  field: HTMLTextAreaElement | null,
) {
  if (!field) return;
  const minHeight = 46;
  const maxHeight = 112;
  field.style.height = `${minHeight}px`;
  const required = Math.max(minHeight, field.scrollHeight);
  field.style.height = `${Math.min(required, maxHeight)}px`;
  field.style.overflowY = required > maxHeight ? "auto" : "hidden";
}

/** Focus can survive Android's Back button after the keyboard was dismissed. */
export function composerKeyboardVisible() {
  if (!isMobileTextEntryContext()) return true;
  const root = document.documentElement;
  if (root.dataset.enturmaMobile === "true") return root.dataset.enturmaIme === "true";
  if (root.dataset.mobileWebChatKeyboard) return true;
  const viewport = window.visualViewport;
  return Boolean(viewport && innerHeight - viewport.height - viewport.offsetTop > 120);
}
