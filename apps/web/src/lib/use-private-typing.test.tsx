import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { usePrivateTyping } from "./use-private-typing";
import { api } from "./api";
vi.mock("./api", () => ({ api: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});
test("revalidates an event arriving during an in-flight typing read", async () => {
  let resolve!: (value: unknown) => void;
  vi.mocked(api)
    .mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    )
    .mockResolvedValue([{ userId: "peer", name: "Ana", remainingMs: 2000 }]);
  const { result } = renderHook(() => usePrivateTyping("friendship"));
  await act(async () => {
    await Promise.resolve();
  });
  act(() => window.dispatchEvent(new Event("enturma-private_typing_changed")));
  expect(api).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve([]);
  });
  expect(api).toHaveBeenCalledTimes(2);
  expect(result.current.users[0].name).toBe("Ana");
});
test("stops after idle and sends the first resumed keystroke immediately", async () => {
  vi.useFakeTimers();
  vi.mocked(api).mockResolvedValue([]);
  const { result } = renderHook(() => usePrivateTyping("friendship"));
  await act(async () => {
    await Promise.resolve();
  });
  act(() => result.current.type("Olá"));
  expect(api).toHaveBeenLastCalledWith(
    expect.any(String),
    expect.objectContaining({ body: '{"typing":true}' }),
  );
  act(() => vi.advanceTimersByTime(1800));
  expect(api).toHaveBeenLastCalledWith(
    expect.any(String),
    expect.objectContaining({ body: '{"typing":false}' }),
  );
  act(() => result.current.type("Olá de novo"));
  expect(api).toHaveBeenLastCalledWith(
    expect.any(String),
    expect.objectContaining({ body: '{"typing":true}' }),
  );
});
