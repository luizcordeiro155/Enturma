"use client";

type NativeTextInputWindow = Window & {
  EnturmaNative?: {
    setChatComposerFocused?: (focused: boolean) => void;
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
export const setNativeChatComposerFocused = setNativeTextInputFocused;

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
  const minHeight = 42;
  const maxHeight = 96;
  field.style.height = `${minHeight}px`;
  const required = Math.max(minHeight, field.scrollHeight);
  field.style.height = `${Math.min(required, maxHeight)}px`;
  field.style.overflowY = required > maxHeight ? "auto" : "hidden";
}
