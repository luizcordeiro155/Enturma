import { afterEach, expect, it, vi } from "vitest";
import {
  canSyncNotificationKeys,
  clearConversationNotifications,
  syncNotificationKeys,
} from "./native-private-notifications";

afterEach(() => {
  delete (window as { EnturmaNative?: unknown }).EnturmaNative;
});

it("only runs inside the Android app", async () => {
  expect(canSyncNotificationKeys()).toBe(false);
  await syncNotificationKeys("me", ["f1"], async () => new Uint8Array(32));
  clearConversationNotifications("f1");
});

it("hands the phone one key per conversation, skipping any it cannot derive", async () => {
  const storeConversationKeys = vi.fn();
  (window as { EnturmaNative?: unknown }).EnturmaNative = { storeConversationKeys };
  expect(canSyncNotificationKeys()).toBe(true);
  await syncNotificationKeys("me", ["f1", "f2"], async (id) => {
    if (id === "f2") throw new Error("no peer key yet");
    return new Uint8Array(32).fill(7);
  });
  expect(storeConversationKeys).toHaveBeenCalledTimes(1);
  expect(JSON.parse(storeConversationKeys.mock.calls[0][0])).toEqual({
    user: "me",
    keys: { f1: btoa(String.fromCharCode(...new Uint8Array(32).fill(7))) },
  });
});

it("clears a conversation's stacked notification once it is opened", () => {
  const clear = vi.fn();
  (window as { EnturmaNative?: unknown }).EnturmaNative = { clearConversationNotifications: clear };
  clearConversationNotifications("f1");
  expect(clear).toHaveBeenCalledWith("f1");
});
