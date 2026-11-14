import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { SOCIAL_EXIT_WINDOW_MS, useSocialBack } from "./use-social-back";
import type { SocialView } from "@/lib/social";

function back() {
  return act(async () => {
    history.back();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}
function setup(view: SocialView = "feed") {
  const toFeed = vi.fn();
  const exit = vi.fn();
  const hook = renderHook((props: { view: SocialView }) => useSocialBack({ ...props, toFeed, exit }), {
    initialProps: { view },
  });
  return { ...hook, toFeed, exit };
}

beforeEach(() => {
  history.replaceState(null, "", "/social");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("Back from Clips or Criar returns to the Feed instead of leaving the Social", async () => {
  const { result, rerender, toFeed, exit } = setup();
  expect(history.state?.enturmaSocial).toBe("guard");
  act(() => result.current.entered("clips"));
  rerender({ view: "clips" });
  expect(history.state?.enturmaSocial).toBe("view");
  // Moving between Clips and Criar does not stack more steps.
  act(() => result.current.entered("create"));
  rerender({ view: "create" });
  await back();
  expect(toFeed).toHaveBeenCalledTimes(1);
  expect(exit).not.toHaveBeenCalled();
});

it("on the Feed, one Back only warns; a second Back right away goes to the Enturma home", async () => {
  const { result, exit } = setup();
  await back();
  expect(result.current.hint).toBe(true);
  expect(exit).not.toHaveBeenCalled();
  expect(history.state?.enturmaSocial).toBe("guard");
  await back();
  expect(exit).toHaveBeenCalledTimes(1);
});

it("a second Back after the warning has gone just warns again", async () => {
  const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
  const { result, exit } = setup();
  await back();
  now.mockReturnValue(1_000 + SOCIAL_EXIT_WINDOW_MS + 1);
  await back();
  expect(exit).not.toHaveBeenCalled();
  expect(result.current.hint).toBe(true);
});

it("going back to the Feed from the bar undoes the extra step", async () => {
  const { result, rerender, toFeed } = setup();
  act(() => result.current.entered("clips"));
  rerender({ view: "clips" });
  await act(async () => {
    result.current.entered("feed");
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  rerender({ view: "feed" });
  expect(history.state?.enturmaSocial).toBe("guard");
  expect(toFeed).not.toHaveBeenCalled();
});

it("leaves dialogs and linked Clips to their own Back handling", async () => {
  const { exit, result } = setup();
  history.pushState({ ...history.state, enturmaOverlay: "dialog" }, "", "/social");
  history.pushState({ ...history.state, enturmaOverlay: "dialog-2" }, "", "/social");
  await back();
  history.pushState({}, "", "/social?post=p1");
  history.pushState({}, "", "/social?post=p2");
  await back();
  expect(exit).not.toHaveBeenCalled();
  expect(result.current.hint).toBe(false);
  await waitFor(() => expect(location.search).toBe("?post=p1"));
});
