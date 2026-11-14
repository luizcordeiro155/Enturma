import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { SocialClips } from "./social-clips";
import { getSocialSound, resetSocialSound, setSocialSound } from "@/lib/social-sound";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));

beforeEach(() => {
  sessionStorage.clear();
  resetSocialSound();
  api.mockResolvedValue({ items: [], cursor: "" });
  globalThis.IntersectionObserver ??= class {
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
  globalThis.ResizeObserver ??= class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

it("opening Clips always turns the sound on, even after it was muted", async () => {
  const props = { me: "me", autoplay: true, person: () => {} };
  const view = render(<SocialClips {...props} active={false} />);
  await act(async () => {});
  expect(getSocialSound().muted).toBe(true);

  setSocialSound({ volume: 0 });
  view.rerender(<SocialClips {...props} active />);
  await act(async () => {});
  expect(getSocialSound()).toEqual({ muted: false, volume: 1 });

  setSocialSound({ muted: true });
  view.rerender(<SocialClips {...props} active />);
  expect(getSocialSound().muted).toBe(true);
  view.rerender(<SocialClips {...props} active={false} />);
  view.rerender(<SocialClips {...props} active />);
  await act(async () => {});
  expect(getSocialSound().muted).toBe(false);
});
