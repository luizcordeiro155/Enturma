import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useSocialViewport } from "./use-social-viewport";
vi.mock("@/lib/native-chat-ime", () => ({
  isTextEntryControl: () => true,
  setNativeChatComposerFocused: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("notifies dialogs when an overlay keyboard changes without resizing the app", () => {
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frame = callback;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  const keyboard = Object.assign(new EventTarget(), {
    overlaysContent: false,
    boundingRect: { height: 0 },
  });
  Object.defineProperty(navigator, "virtualKeyboard", {
    value: keyboard,
    configurable: true,
  });
  const changed = vi.fn();
  const page = document.createElement("section");
  page.className = "social-pager-page";
  page.dataset.page = "create";
  const field = document.createElement("textarea");
  page.append(field);
  document.body.append(page);
  field.focus();
  vi.spyOn(field, "getBoundingClientRect").mockReturnValue({
    bottom: innerHeight - 20,
  } as DOMRect);
  window.addEventListener("enturma-social-viewport", changed);
  const { unmount } = renderHook(useSocialViewport);
  act(() => frame(0));
  const initial = changed.mock.calls.length;
  keyboard.boundingRect.height = 320;
  act(() => {
    keyboard.dispatchEvent(new Event("geometrychange"));
    frame(1);
  });
  expect(changed).toHaveBeenCalledTimes(initial + 1);
  expect(
    document.documentElement.style.getPropertyValue("--social-ime-height"),
  ).toBe("320px");
  expect(document.documentElement.dataset.socialKeyboard).toBe("true");
  expect(page.scrollTop).toBe(316);
  keyboard.boundingRect.height = 0;
  act(() => {
    keyboard.dispatchEvent(new Event("geometrychange"));
    frame(2);
  });
  expect(document.documentElement.dataset.socialKeyboard).toBe("false");
  unmount();
  expect(document.documentElement.dataset.socialKeyboard).toBeUndefined();
  expect(keyboard.overlaysContent).toBe(false);
  page.remove();
  window.removeEventListener("enturma-social-viewport", changed);
  delete (navigator as Navigator & { virtualKeyboard?: unknown })
    .virtualKeyboard;
});
