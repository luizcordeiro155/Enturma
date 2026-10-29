import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMobileWebChatViewport } from "./use-room-browser-viewport";

let visualHeight = 780;
let visualTop = 0;
let onViewportResize: (() => void) | undefined;
let originalViewport: PropertyDescriptor | undefined;

function PrivateChatFixture({ kind = "private" }: { kind?: "private" | "room" }) {
  useMobileWebChatViewport(true, kind);
  return (
    <div className={kind === "room" ? "room-active-shell" : "private-chat-fixture"}>
      <div className={kind === "private" ? "mobile-private-chat-open" : "room-section-chat"}>
      <form className={kind === "private" ? "private-composer enturma-message-composer" : "persistent-composer enturma-message-composer"}>
        <textarea aria-label={kind === "private" ? "Mensagem privada" : "Mensagem"} />
      </form>
      <div className="private-messages" />
      {kind === "room" ? <nav aria-label="Navegação da turma" className="room-mobile-nav" /> : null}
      </div>
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
    Reflect.deleteProperty(window, "visualViewport");
  }
  const root = document.documentElement;
  delete root.dataset.enturmaMobile;
  delete root.dataset.mobileWebChatKeyboard;
  root.style.removeProperty("--mobile-web-chat-visible-bottom");
  root.style.removeProperty("--mobile-web-chat-visible-top");
  root.style.removeProperty("--mobile-web-chat-visible-height");
  root.style.removeProperty("--room-mobile-nav-rest-top");
  delete root.dataset.roomBrowserLayout;
});

describe("private mobile browser IME", () => {
  it("anchors on the very first focus before viewport resize and follows subsequent IME frames", () => {
    render(<PrivateChatFixture />);
    const field = screen.getByRole("textbox", { name: "Mensagem privada" });
    field.focus();
    const root = document.documentElement;
    expect(root.dataset.mobileWebChatKeyboard).toBe("private");
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-bottom")).toBe("780px");
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-top")).toBe("0px");
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-height")).toBe("780px");

    visualHeight = 420;
    onViewportResize?.();
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-bottom")).toBe("420px");

    visualTop = 12;
    visualHeight = 400;
    onViewportResize?.();
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-bottom")).toBe("412px");
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-top")).toBe("12px");
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-height")).toBe("400px");

    field.blur();
    expect(root.dataset.mobileWebChatKeyboard).toBe("private");
    visualHeight = 780;
    visualTop = 0;
    onViewportResize?.();
    expect(root.dataset.mobileWebChatKeyboard).toBeUndefined();
  });

  it("anchors before focus on the first pointer press", () => {
    render(<PrivateChatFixture />);
    const field = screen.getByRole("textbox", { name: "Mensagem privada" });
    fireEvent.pointerDown(field);
    expect(document.documentElement.dataset.mobileWebChatKeyboard).toBe("private");
    expect(document.documentElement.style.getPropertyValue("--mobile-web-chat-visible-height")).toBe("780px");
  });

  it("preserves the four room tabs behind the keyboard and restores them when Android Back dismisses the IME without blur", () => {
    render(<PrivateChatFixture kind="room" />);
    const root = document.documentElement;
    const navigation = screen.getByRole("navigation", { name: "Navegação da turma" });
    vi.spyOn(navigation, "getBoundingClientRect").mockReturnValue({
      top: 714, height: 66,
    } as DOMRect);
    const field = screen.getByRole("textbox", { name: "Mensagem" });
    fireEvent.pointerDown(field);
    field.focus();
    expect(root.dataset.mobileWebChatKeyboard).toBe("room");
    expect(root.style.getPropertyValue("--room-mobile-nav-rest-top")).toBe("714px");

    visualHeight = 380;
    visualTop = 18;
    onViewportResize?.();
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-top")).toBe("18px");
    expect(root.style.getPropertyValue("--mobile-web-chat-visible-height")).toBe("380px");
    expect(root.style.getPropertyValue("--room-mobile-nav-rest-top")).toBe("714px");

    // Keyboard closed, textarea STILL has focus. The navbar must reappear
    // in the normal layout without requiring an extra tap or blur.
    visualHeight = 780;
    visualTop = 0;
    onViewportResize?.();
    expect(document.activeElement).toBe(field);
    expect(root.dataset.mobileWebChatKeyboard).toBeUndefined();
    expect(root.style.getPropertyValue("--room-mobile-nav-rest-top")).toBe("");

    // Tapping the still-focused textbox again opens IME without a focusin.
    fireEvent.pointerDown(field);
    expect(root.dataset.mobileWebChatKeyboard).toBe("room");
    expect(root.style.getPropertyValue("--room-mobile-nav-rest-top")).toBe("714px");
  });

  it("does not install browser keyboard styles inside the Android APK bridge", () => {
    document.documentElement.dataset.enturmaMobile = "true";
    render(<PrivateChatFixture />);
    screen.getByRole("textbox", { name: "Mensagem privada" }).focus();
    expect(document.documentElement.dataset.mobileWebChatKeyboard).toBeUndefined();
  });
});
