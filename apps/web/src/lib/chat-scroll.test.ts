import { describe, expect, it, vi } from "vitest";
import { isChatAtLatest, revealChatMessage } from "./chat-scroll";
describe("chat reading position", () => {
  it("marks read only when the bottom is visible, not one message above it", () => {
    expect(
      isChatAtLatest({ scrollHeight: 1200, clientHeight: 500, scrollTop: 610 }),
    ).toBe(false);
    expect(
      isChatAtLatest({ scrollHeight: 1200, clientHeight: 500, scrollTop: 690 }),
    ).toBe(true);
  });
  it("reveals replies inside the conversation without moving the app viewport", () => {
    const viewport = document.createElement("div");
    viewport.className = "private-messages";
    const message = document.createElement("article");
    viewport.append(message);
    viewport.scrollTo = vi.fn();
    message.scrollIntoView = vi.fn();
    expect(revealChatMessage(message, "smooth")).toBe(true);
    expect(viewport.scrollTo).toHaveBeenCalledOnce();
    expect(message.scrollIntoView).not.toHaveBeenCalled();
  });
});
