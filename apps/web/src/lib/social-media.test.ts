import { expect, it } from "vitest";
import type { SocialPost } from "./social";
import {
  groupStories,
  mediaAspect,
  relativeTime,
  storyTapZone,
} from "./social-media";

const now = new Date("2026-11-11T12:00:00Z");
it("limita a proporção entre 4:5 e 1,91:1", () => {
  expect(mediaAspect(1080, 1920)).toBe(0.8);
  expect(mediaAspect(1920, 800)).toBe(1.91);
  expect(mediaAspect(1080, 1080)).toBe(1);
  expect(mediaAspect()).toBe(1);
});
it("escreve o tempo relativo em português", () => {
  expect(relativeTime("2026-11-11T11:59:40Z", now)).toBe("agora");
  expect(relativeTime("2026-11-11T11:55:00Z", now)).toBe("há 5 min");
  expect(relativeTime("2026-11-11T09:00:00Z", now)).toBe("há 3 h");
  expect(relativeTime("2026-11-09T12:00:00Z", now)).toBe("há 2 d");
  expect(relativeTime("2026-10-01T12:00:00Z", now)).toMatch(/1 de out/);
});
it("agrupa Stories por autor, do mais antigo ao mais novo, na ordem de chegada", () => {
  const s = (id: string, authorId: string, publishedAt: string) =>
    ({ id, authorId, publishedAt }) as SocialPost;
  expect(
    groupStories([
      s("b2", "b", "2026-11-11T10:00:00Z"),
      s("a1", "a", "2026-11-11T09:00:00Z"),
      s("b1", "b", "2026-11-11T08:00:00Z"),
    ]).map((g) => [g.authorId, g.items.map((i) => i.id)]),
  ).toEqual([
    ["b", ["b1", "b2"]],
    ["a", ["a1"]],
  ]);
});
it("divide o toque do Story em voltar (30% à esquerda) e avançar", () => {
  expect(storyTapZone(100, 390)).toBe("back");
  expect(storyTapZone(118, 390)).toBe("forward");
});
