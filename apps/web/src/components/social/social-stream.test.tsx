import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useSocialStream } from "./social-stream";
import { post } from "./social-test-kit";
const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api, invalidateApiCache: vi.fn() }));
vi.mock("./social-post", () => ({ SocialPost: () => null }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("reconciles new publications without moving the existing queue or losing pagination", async () => {
  api
    .mockResolvedValueOnce({ items: [post("old")], nextCursor: "older" })
    .mockResolvedValue({
      items: [post("new"), post("old")],
      nextCursor: "newer-cursor",
    });
  const { result } = renderHook(() => useSocialStream("kind=CLIP", true));
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  act(() => window.dispatchEvent(new Event("enturma-social_changed")));
  await waitFor(() =>
    expect(result.current.items.map((row) => row.id)).toEqual(["old", "new"]),
  );
  expect(result.current.cursor).toBe("older");
});

it("starts with the selected Clip and deduplicates it while keeping cursor pagination", async () => {
  const selected = post("selected", { kind: "CLIP" });
  api
    .mockReset()
    .mockResolvedValueOnce({
      items: [post("ranked-first"), selected],
      nextCursor: "next",
    })
    .mockResolvedValueOnce({ items: [post("next-page")], nextCursor: "" });
  const { result } = renderHook(() =>
    useSocialStream("kind=CLIP", true, undefined, [selected]),
  );
  expect(result.current.items[0].id).toBe("selected");
  await waitFor(() => expect(result.current.cursor).toBe("next"));
  expect(result.current.items.map((row) => row.id)).toEqual([
    "selected",
    "ranked-first",
  ]);
  await act(async () => {
    await result.current.load();
  });
  expect(result.current.items.map((row) => row.id)).toEqual([
    "selected",
    "ranked-first",
    "next-page",
  ]);
  expect(api).toHaveBeenLastCalledWith("/social/feed?kind=CLIP&cursor=next", {
    cache: "no-store",
  });
  await act(async () => {
    result.current.change({ ...selected, mine: ["HIDE"] });
  });
  expect(result.current.items[0].mine).toEqual(["HIDE"]);
});
