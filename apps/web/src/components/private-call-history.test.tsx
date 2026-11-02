import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { api } from "@/lib/api";
import { usePrivateCallHistory } from "./private-call-history";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("@/lib/live-updates", () => ({ useLiveRefresh: vi.fn() }));
afterEach(cleanup);

it("does not replace newer call history when returning to a conversation with an older request in flight", async () => {
  const complete: ((value: unknown) => void)[] = [];
  vi.mocked(api).mockImplementation(
    () => new Promise((resolve) => complete.push(resolve)),
  );
  const view = renderHook(({ id }) => usePrivateCallHistory(id), {
    initialProps: { id: "friend-a" },
  });
  view.rerender({ id: "friend-b" });
  view.rerender({ id: "friend-a" });
  const latest = [{ id: "new-call", state: "DECLINED" }];
  await act(async () => complete[2](latest));
  expect(view.result.current).toEqual(latest);
  await act(async () => {
    complete[0]([]);
    complete[1]([{ id: "another-friend-call" }]);
  });
  expect(view.result.current).toEqual(latest);
});
