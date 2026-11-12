import { expect, it } from "vitest";
import type { SocialPost } from "./social";
import { groupStories, mediaAspect, pullRefreshes, relativeTime, storyTapZone } from "./social-media";

const now = new Date("2026-11-11T12:00:00Z");
it("preserva fotos 3:4, 4:5 e quadradas no feed sem cortar a altura", () => {
  expect(mediaAspect(1080, 1440)).toBe(3 / 4);
  expect(mediaAspect(1080, 1350)).toBe(4 / 5);
  expect(mediaAspect(1080, 1080)).toBe(1);
});
it("limita apenas as proporcoes externas ao intervalo 3:4 ate 1.91:1", () => {
  expect(mediaAspect(1080, 1920)).toBe(3 / 4);
  expect(mediaAspect(1920, 800)).toBe(1.91);
  expect(mediaAspect()).toBe(1);
});
it("escreve o tempo relativo em portugues", () => {
  expect(relativeTime("2026-11-11T11:59:40Z", now)).toBe("agora");
  expect(relativeTime("2026-11-11T11:55:00Z", now)).toBe("h\u00e1 5 min");
  expect(relativeTime("2026-11-11T09:00:00Z", now)).toBe("h\u00e1 3 h");
  expect(relativeTime("2026-11-09T12:00:00Z", now)).toBe("h\u00e1 2 d");
  expect(relativeTime("2026-10-01T12:00:00Z", now)).toMatch(/1 de out/);
});
it("agrupa Stories por autor e preserva a ordem cronologica de cada pessoa", () => {
  const story = (id: string, authorId: string, publishedAt: string) => ({ id, authorId, publishedAt }) as SocialPost;
  expect(groupStories([
    story("b2", "b", "2026-11-11T10:00:00Z"),
    story("a1", "a", "2026-11-11T09:00:00Z"),
    story("b1", "b", "2026-11-11T08:00:00Z"),
  ]).map(group => [group.authorId, group.items.map(item => item.id)])).toEqual([
    ["b", ["b1", "b2"]], ["a", ["a1"]],
  ]);
});
it("divide o toque do Story em voltar a esquerda e avancar a direita", () => {
  expect(storyTapZone(100, 390)).toBe("back");
  expect(storyTapZone(118, 390)).toBe("forward");
});
it("puxar para atualizar so vale no topo para baixo e na vertical", () => {
  expect(pullRefreshes(0, 4, 90)).toBe(true);
  expect(pullRefreshes(0, 4, 60)).toBe(false);
  expect(pullRefreshes(12, 4, 90)).toBe(false);
  expect(pullRefreshes(0, 90, 90)).toBe(false);
  expect(pullRefreshes(0, 4, -90)).toBe(false);
});
