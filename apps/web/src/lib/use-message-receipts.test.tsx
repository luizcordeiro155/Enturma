import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { useMessageReceipts } from "./use-message-receipts";
import { post } from "./api";
vi.mock("./api", () => ({ post: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
test("delivery is explicit; reading requires an intersecting message in a visible focused document", async () => {
  vi.useFakeTimers();
  vi.mocked(post).mockResolvedValue(undefined);
  let notify!: IntersectionObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  let visible = false;
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() =>
    visible ? "visible" : "hidden",
  );
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
  function Chat() {
    const viewport = useRef<HTMLDivElement>(null);
    useMessageReceipts(
      "/friends/peer/messages/receipts",
      ["message"],
      viewport,
    );
    return (
      <div ref={viewport}>
        <article data-receipt-id="message">Mensagem</article>
      </div>
    );
  }
  const { container, unmount } = render(<Chat />);
  await act(async () => {
    await Promise.resolve();
  });
  expect(post).toHaveBeenCalledWith("/friends/peer/messages/receipts", {
    messageIds: ["message"],
    read: false,
  });
  act(() =>
    notify(
      [
        {
          target: container.querySelector("article"),
          isIntersecting: true,
          intersectionRect: { height: 100 },
          boundingClientRect: { height: 100 },
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1200);
  });
  expect(post).toHaveBeenCalledTimes(1);
  visible = true;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });
  expect(post).toHaveBeenLastCalledWith("/friends/peer/messages/receipts", {
    messageIds: ["message"],
    read: true,
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1200);
  });
  expect(post).toHaveBeenCalledTimes(2);
  unmount();
  expect(disconnect).toHaveBeenCalled();
});

test("failed acknowledgments retry without inferring success and clean up on navigation", async () => {
  vi.useFakeTimers();
  vi.mocked(post)
    .mockRejectedValueOnce(Error("offline"))
    .mockResolvedValue(undefined);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(document, "hasFocus").mockReturnValue(false);
  function Chat() {
    const viewport = useRef<HTMLDivElement>(null);
    useMessageReceipts(
      "/friends/peer/messages/receipts",
      ["message"],
      viewport,
    );
    return <div ref={viewport} />;
  }
  const { unmount } = render(<Chat />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(4800);
  });
  expect(post).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1200);
  });
  expect(post).toHaveBeenCalledTimes(2);
  unmount();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(post).toHaveBeenCalledTimes(2);
});

test("does not mark read when the document loses focus while delivery is in flight", async () => {
  vi.useFakeTimers();
  let finish!: (value: unknown) => void;
  vi.mocked(post).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let notify!: IntersectionObserverCallback;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  let focused = true;
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.spyOn(document, "hasFocus").mockImplementation(() => focused);
  function Chat() {
    const viewport = useRef<HTMLDivElement>(null);
    useMessageReceipts(
      "/friends/peer/messages/receipts",
      ["message"],
      viewport,
    );
    return (
      <div ref={viewport}>
        <article data-receipt-id="message" />
      </div>
    );
  }
  const { container } = render(<Chat />);
  act(() =>
    notify(
      [
        {
          target: container.querySelector("article"),
          isIntersecting: true,
          intersectionRect: { height: 100 },
          boundingClientRect: { height: 100 },
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  );
  focused = false;
  await act(async () => {
    finish(undefined);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1200);
  });
  expect(post).toHaveBeenCalledTimes(1);
});
