import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
  api: vi.fn(async () => ({ id: "me" })),
  invalidateApiCache: vi.fn(),
}));

class FakeSocket {
  static last: FakeSocket | undefined;
  static OPEN = 1;
  readyState = 1;
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  onerror?: () => void;
  constructor() {
    FakeSocket.last = this;
  }
  send() {}
  close() {
    this.onclose?.();
  }
}

async function flush() {
  for (let i = 0; i < 5; i++) await act(async () => {});
}

describe("private call refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    FakeSocket.last = undefined;
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ token: "t", url: "wss://example.test/ws" }))),
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("polls every 5 seconds while realtime is down", async () => {
    const { useLiveRefresh } = await import("./live-updates");
    const refresh = vi.fn(async () => {});
    renderHook(() => useLiveRefresh("private_call_changed", refresh, 5000));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(refresh.mock.calls.length).toBeGreaterThanOrEqual(11);
  });

  it("relies on the socket and keeps only a 20-second safety net while connected", async () => {
    const live = await import("./live-updates");
    renderHook(() => live.useAppConnection(true));
    await flush();
    act(() => {
      FakeSocket.last!.onopen?.();
      FakeSocket.last!.onmessage?.({ data: JSON.stringify({ type: "app_ready" }) });
    });
    expect(document.documentElement.dataset.realtime).toBe("connected");
    const refresh = vi.fn(async () => {});
    renderHook(() => live.useLiveRefresh("private_call_changed", refresh, 5000));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(refresh.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(refresh.mock.calls.length).toBeLessThanOrEqual(4);

    // A pushed call event still refreshes immediately.
    const before = refresh.mock.calls.length;
    await act(async () => {
      window.dispatchEvent(new Event("enturma-private_call_changed"));
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(refresh.mock.calls.length).toBe(before + 1);
  });
});
