import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useOverlayHistory, waitForOverlayHistory } from "./use-overlay-history";

afterEach(async () => {
  cleanup();
  await waitForOverlayHistory();
  history.replaceState({}, "", location.href);
});

async function openOverlay() {
  const close = vi.fn();
  const previous = history.state?.enturmaOverlay;
  const hook = renderHook(() => useOverlayHistory(close));
  await waitFor(() =>
    expect(history.state?.enturmaOverlay).not.toBe(previous),
  );
  return { ...hook, close, id: history.state.enturmaOverlay };
}

it("Back closes only the top overlay, keeping its ancestors open", async () => {
  const explore = await openOverlay();
  const viewer = await openOverlay();
  const options = await openOverlay();
  act(() => history.back());
  await waitFor(() => expect(options.close).toHaveBeenCalledOnce());
  expect(explore.close).not.toHaveBeenCalled();
  expect(viewer.close).not.toHaveBeenCalled();
  options.unmount();
  act(() => history.back());
  await waitFor(() => expect(viewer.close).toHaveBeenCalledOnce());
  expect(explore.close).not.toHaveBeenCalled();
});

it("closing the top overlay does not dismiss panels underneath", async () => {
  const explore = await openOverlay();
  const viewer = await openOverlay();
  const options = await openOverlay();
  options.unmount();
  await act(() => waitForOverlayHistory());
  expect(history.state.enturmaOverlay).toBe(viewer.id);
  expect(viewer.close).not.toHaveBeenCalled();
  expect(explore.close).not.toHaveBeenCalled();
});

it("replacing a panel waits for history traversal and preserves the parent", async () => {
  const explore = await openOverlay();
  const viewer = await openOverlay();
  const options = await openOverlay();
  options.unmount();
  const collections = await openOverlay();
  expect(viewer.close).not.toHaveBeenCalled();
  expect(explore.close).not.toHaveBeenCalled();
  expect(collections.close).not.toHaveBeenCalled();
  act(() => history.back());
  await waitFor(() => expect(collections.close).toHaveBeenCalledOnce());
  expect(history.state.enturmaOverlay).toBe(viewer.id);
  expect(viewer.close).not.toHaveBeenCalled();
  expect(explore.close).not.toHaveBeenCalled();
});
