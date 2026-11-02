import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { NotificationsProvider } from "./notifications";
import { api, prepareSessionNavigation } from "@/lib/api";
import { useAppConnection } from "@/lib/live-updates";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
  post: vi.fn(),
  prepareSessionNavigation: vi.fn(),
}));
vi.mock("@/lib/live-updates", () => ({
  useAppConnection: vi.fn(),
  useLiveRefresh: vi.fn(),
}));
vi.mock("@/lib/notification-presentation", () => ({
  watchNotificationBadge: () => () => {},
}));
vi.mock("@/lib/notification-sound", () => ({
  notificationSoundEnabled: () => false,
  unlockNotificationSound: vi.fn(),
  playNotificationSound: vi.fn(),
}));
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(api).mockImplementation(async (path) =>
    path === "/auth/session-view"
      ? { academicAccess: true }
      : path === "/messages/pending-delivery"
        ? []
        : { items: [], unreadCount: 0 },
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.resetAllMocks();
});
const protectedRequests = () =>
  vi.mocked(api).mock.calls.filter(([path]) => !path.startsWith("/auth/"));

test("restoration waits for a confirmed student session before fetching inbox or messages", async () => {
  let resolve!: (ready: boolean) => void;
  vi.mocked(prepareSessionNavigation).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(
    <NotificationsProvider>
      <div>Restaurando</div>
    </NotificationsProvider>,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
  expect(api).not.toHaveBeenCalled();
  expect(useAppConnection).toHaveBeenLastCalledWith(false);
  await act(async () => {
    resolve(true);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
  expect(api).toHaveBeenCalledWith("/auth/session-view", { cache: "no-store" });
  expect(api).toHaveBeenCalledWith(
    "/messages/pending-delivery",
    expect.anything(),
  );
  expect(useAppConnection).toHaveBeenLastCalledWith(true);
});

test("no private requests when restoration denies authentication or academic verification is pending", async () => {
  vi.mocked(prepareSessionNavigation).mockResolvedValue(false);
  const first = render(
    <NotificationsProvider>
      <div>Sem sessão</div>
    </NotificationsProvider>,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1200);
  });
  expect(api).not.toHaveBeenCalled();
  first.unmount();
  vi.mocked(prepareSessionNavigation).mockResolvedValue(true);
  vi.mocked(api).mockRejectedValue({ status: 403 });
  render(
    <NotificationsProvider>
      <div>Verificação acadêmica pendente</div>
    </NotificationsProvider>,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1200);
  });
  expect(protectedRequests()).toHaveLength(0);
  expect(useAppConnection).toHaveBeenLastCalledWith(false);
});

test("logout cancels delivery immediately and focus cannot restart requests before a new login", async () => {
  vi.mocked(prepareSessionNavigation).mockResolvedValue(true);
  let finish!: (rows: unknown) => void;
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === "/auth/session-view") return { academicAccess: true };
    if (path === "/messages/pending-delivery")
      return new Promise((resolve) => {
        finish = resolve;
      });
    return { items: [], unreadCount: 0 };
  });
  render(
    <NotificationsProvider>
      <div>Home</div>
    </NotificationsProvider>,
  );
  await act(async () => {});
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
  const signal = vi
    .mocked(api)
    .mock.calls.find(([path]) => path === "/messages/pending-delivery")![1]!
    .signal!;
  const count = protectedRequests().length;
  await act(async () => {
    window.dispatchEvent(
      new CustomEvent("enturma-session-changed", {
        detail: { path: "/auth/logout" },
      }),
    );
    finish([
      {
        id: "00000000-0000-4000-8000-000000000001",
        contextKey: "friend:00000000-0000-4000-8000-000000000002",
      },
    ]);
  });
  expect(signal.aborted).toBe(true);
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("enturma-notifications_changed"));
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(protectedRequests()).toHaveLength(count);
  expect(useAppConnection).toHaveBeenLastCalledWith(false);
});

test.each(["expired", "pending"])(
  "%s session never starts student background endpoints",
  async (kind) => {
    vi.mocked(prepareSessionNavigation).mockResolvedValue(true);
    if (kind === "expired") vi.mocked(api).mockRejectedValue({ status: 401 });
    else vi.mocked(api).mockResolvedValue({ academicAccess: false });
    render(
      <NotificationsProvider>
        <div>Login ou verificação</div>
      </NotificationsProvider>,
    );
    await act(async () => {});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(protectedRequests()).toHaveLength(0);
    expect(useAppConnection).toHaveBeenLastCalledWith(false);
  },
);

test("a temporary session failure retries without clearing the session or issuing student requests", async () => {
  vi.mocked(prepareSessionNavigation)
    .mockRejectedValueOnce({ status: 503 })
    .mockResolvedValue(true);
  render(
    <NotificationsProvider>
      <div>Reconectando</div>
    </NotificationsProvider>,
  );
  await act(async () => {});
  expect(api).not.toHaveBeenCalled();
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
  expect(useAppConnection).toHaveBeenLastCalledWith(true);
  expect(api).toHaveBeenCalledWith(
    "/messages/pending-delivery",
    expect.anything(),
  );
  expect(
    vi.mocked(api).mock.calls.some(([path]) => path === "/auth/logout"),
  ).toBe(false);
});
