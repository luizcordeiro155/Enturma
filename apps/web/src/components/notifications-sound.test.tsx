import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { NotificationsProvider } from "./notifications";
const state = vi.hoisted(() => ({
  refresh: undefined as undefined | (() => Promise<void>),
  items: [] as object[],
  sound: vi.fn(),
  unlock: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: vi.fn(async () => ({
    items: state.items,
    unreadCount: state.items.length,
  })),
  post: vi.fn(),
}));
vi.mock("@/lib/live-updates", () => ({
  useAppConnection: vi.fn(),
  useLiveRefresh: (_: string, refresh: () => Promise<void>) => {
    state.refresh = refresh;
  },
}));
vi.mock("@/lib/notification-presentation", () => ({
  watchNotificationBadge: () => () => {},
}));
vi.mock("@/lib/notification-sound", () => ({
  notificationSoundEnabled: () => true,
  unlockNotificationSound: state.unlock,
  playNotificationSound: state.sound,
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  state.sound.mockClear();
  state.unlock.mockClear();
});
test("foreground inbox sound does not require OS notification permission and skips old notices", async () => {
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.stubGlobal("Notification", { permission: "denied" });
  state.items = [
    { id: "old", readAt: null, kind: "FRIEND_REQUEST", contextKey: null },
  ];
  render(
    <NotificationsProvider>
      <div>Inbox</div>
    </NotificationsProvider>,
  );
  await waitFor(() => expect(state.refresh).toBeDefined());
  await act(async () => {
    await state.refresh!();
  });
  expect(state.sound).not.toHaveBeenCalled();
  state.items = [
    ...state.items,
    { id: "new", readAt: null, kind: "FRIEND_REQUEST", contextKey: null },
  ];
  await act(async () => {
    await state.refresh!();
  });
  expect(state.sound).toHaveBeenCalledExactlyOnceWith(false, "new");
  await act(async () => {
    await state.refresh!();
  });
  expect(state.sound).toHaveBeenCalledTimes(1);
});

test("desktop chimes in the background without replaying unread notices", async () => {
  vi.spyOn(document, "hasFocus").mockReturnValue(false);
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  Object.defineProperty(window, "enturmaDesktop", { configurable: true, value: {} });
  state.items = [];
  render(<NotificationsProvider><div>Desktop</div></NotificationsProvider>);
  fireEvent.pointerDown(window);
  expect(state.unlock).toHaveBeenCalledOnce();
  await act(async () => { await state.refresh!(); });
  state.items = [{ id: "desktop-new", readAt: null, kind: "PRIVATE_MESSAGE", contextKey: "friend:other" }];
  await act(async () => { await state.refresh!(); });
  expect(state.sound).toHaveBeenCalledExactlyOnceWith(false, "desktop-new");
  await act(async () => { await state.refresh!(); });
  expect(state.sound).toHaveBeenCalledTimes(1);
  Object.defineProperty(window, "enturmaDesktop", { configurable: true, value: undefined });
});
