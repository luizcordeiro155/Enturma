import { vi } from "vitest";
import type { SocialMedia, SocialPost } from "@/lib/social";

/** Shared fixtures for Social component tests. Not imported by production code. */
export const img = (id: string, width = 1080, height = 1080): SocialMedia => ({
  id,
  kind: "IMAGE",
  width,
  height,
});
export const video = (id: string): SocialMedia => ({
  id,
  kind: "VIDEO",
  width: 720,
  height: 1280,
  durationMs: 6000,
});
export const post = (
  id: string,
  overrides: Partial<SocialPost> = {},
): SocialPost => ({
  id,
  authorId: "author",
  name: "Ana Souza",
  username: "ana",
  kind: "POST",
  body: "",
  publishedAt: "2026-11-11T11:00:00Z",
  pinned: false,
  likes: 0,
  reposts: 0,
  comments: 0,
  mine: [],
  media: [img(`m-${id}`)],
  ...overrides,
});

type Entry = { target: Element; callback: IntersectionObserverCallback };
const observed: Entry[] = [];
/** jsdom has no IntersectionObserver; this one records targets so a test can fire them. */
export function stubIntersectionObserver() {
  observed.length = 0;
  const Observer = vi.fn(function (
    this: IntersectionObserver,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    Object.defineProperty(this, "root", { value: options?.root ?? null });
    this.observe = (target: Element) => void observed.push({ target, callback });
    this.unobserve = () => {};
    this.disconnect = () => {};
  });
  vi.stubGlobal("IntersectionObserver", Observer);
  return Observer;
}
export function intersect(target: Element, ratio: number) {
  for (const entry of observed)
    if (entry.target === target)
      entry.callback(
        [
          {
            target,
            isIntersecting: ratio > 0,
            intersectionRatio: ratio,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
}
