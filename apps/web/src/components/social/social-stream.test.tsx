import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useSocialStream } from "./social-stream";
import { post, stubIntersectionObserver } from "./social-test-kit";
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

it("tapping Enturma refreshes the Feed with a spinning indicator until new posts arrive", async () => {
  const { render, screen } = await import("@testing-library/react");
  const { SocialStream } = await import("./social-stream");
  stubIntersectionObserver();
  let finish: (value: unknown) => void = () => {};
  api
    .mockReset()
    .mockResolvedValueOnce({ items: [post("a")], nextCursor: "" })
    .mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
  const props = { query: "kind=ALL", active: true, me: "me", person: () => {} };
  const view = render(<SocialStream {...props} refreshKey={0} />);
  await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
  view.rerender(<SocialStream {...props} refreshKey={1} />);
  expect(await screen.findByRole("status", { name: "Atualizando o Feed" })).toBeInTheDocument();
  await act(async () => finish({ items: [post("b")], nextCursor: "" }));
  await waitFor(() => expect(screen.queryByRole("status", { name: "Atualizando o Feed" })).toBeNull());
});

it("pulling the top of the Feed down shows the indicator and refreshes on release", async () => {
  const { fireEvent, render, screen } = await import("@testing-library/react");
  const { SocialStream } = await import("./social-stream");
  stubIntersectionObserver();
  api
    .mockReset()
    .mockResolvedValueOnce({ items: [post("a")], nextCursor: "" })
    .mockImplementationOnce(() => new Promise(() => {}));
  render(<SocialStream query="kind=ALL" active me="me" person={() => {}} />);
  await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
  const stream = screen.getByLabelText("Publicações");
  fireEvent.touchStart(stream, { touches: [{ clientX: 10, clientY: 10 }] });
  fireEvent.touchMove(stream, { touches: [{ clientX: 12, clientY: 200 }] });
  const indicator = document.querySelector(".social-pull-refresh") as HTMLElement;
  expect(indicator).toHaveAttribute("data-ready", "true");
  fireEvent.touchEnd(stream, { changedTouches: [{ clientX: 12, clientY: 200 }] });
  expect(await screen.findByRole("status", { name: "Atualizando o Feed" })).toBeInTheDocument();
  expect(api).toHaveBeenCalledTimes(2);
});
