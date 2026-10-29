import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMobileWebChatViewport } from "./use-room-browser-viewport";

let visualHeight = 780;
let visualTop = 0;
let onViewportResize: (() => void) | undefined;
let originalViewport: PropertyDescriptor | undefined;

function PrivateChatFixture() {
  useMobileWebChatViewport(true, "private");
  return (
    <div className="mobile-private-chat-open">
      <form className="private-composer enturma-message-composer">
        <textarea aria-label="Mensagem privada" />
      </form>
      <div className="private-messages" />
    </div>
  );
}

beforeEach(() => {
  visualHeight = 780;
  visualTop = 0;
  onViewportResize = undefined;
  originalViewport = Object.getOwnPropertyDescriptor(window, "visualViewport");
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: {
      get height() { return visualHeight; },
      get offsetTop() { return visualTop; },
      addEventListener(type: string, listener: () => void) {
        if (type === "resize") onViewportResize = listener;
      },
      removeEventListener() {},
    },
  });
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
  });
  delete document.documentElement.dataset.enturmaMobile;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (originalViewport) {
    Object.defineProperty(window, "visualViewport", originalViewport);
  } else {
    delete (window as Window & { visualViewport?: VisualViewport }).visualViewport;
  }
  const root = document.documentElement;
  delete root.dataset.enturmaMobile;
  delete root.dataset.mobileWebChatKeyboard;
  root.style.removeProperty("--mobile-web-chat-visible-bottom");
});

describe("private mobile browser IME", () => {
  it("anchors on the very first focus before viewport resize and follows subsequent IME frames", () => {
    render(<PrivateChatFixture />);
    const field = screen.getByRole("textbox", { name: "Mensagem privada" });
    field.focus();
    const root = document.documentElement;
    expect(root.dataset.mobileWebChatKeyboard).toBe("private");
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-bottom")).toBe("780px");

    visualHeight = 420;
    onViewportResize?.();
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-bottom")).toBe("420px");

    visualTop = 12;
    visualHeight = 400;
    onViewportResize?.();
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-bottom")).toBe("412px");

    field.blur();
    expect(root.dataset.mobileWebChatKeyboard).toBe("private");
    visualHeight = 780;
    visualTop = 0;
    onViewportResize?.();
    expect(root.dataset.mobileWebChatKeyboard).toBeUndefined();
  });

  it("does not install browser keyboard styles inside the Android APK bridge", () => {
    document.documentElement.dataset.enturmaMobile = "true";
    render(<PrivateChatFixture />);
    screen.getByRole("textbox", { name: "Mensagem privada" }).focus();
    expect(document.documentElement.dataset.mobileWebChatKeyboard).toBeUndefined();
  });
});
