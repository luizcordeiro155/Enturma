import { expect, it } from "vitest";
import {
  defaultRecipe,
  exportDuration,
  sourceTime,
  socialGesture,
  mergeSocialPage,
  type SocialPost,
} from "./social";

it("distinguishes horizontal navigation from vertical, slow and OS edge gestures", () => {
  expect(socialGesture(100, 15, 250, 120, 390)).toBe("clips");
  expect(socialGesture(-100, 15, 250, 220, 390)).toBe("create");
  for (const args of [
    [100, 90, 250, 120, 390],
    [30, 0, 100, 120, 390],
    [100, 0, 2000, 120, 390],
    [100, 0, 250, 10, 390],
    [-100, 0, 250, 380, 390],
  ])
    expect(
      socialGesture(...(args as [number, number, number, number, number])),
    ).toBeNull();
});
it("maps the output playhead through reordered cuts without extending the 90 second default", () => {
  const recipe = defaultRecipe(600);
  expect(exportDuration(recipe)).toBe(90);
  recipe.segments = [
    { start: 40, end: 50 },
    { start: 2, end: 7 },
  ];
  expect(exportDuration(recipe)).toBe(15);
  expect(sourceTime(recipe, 3)).toBe(43);
  expect(sourceTime(recipe, 10)).toBe(2);
  expect(sourceTime(recipe, 14)).toBe(6);
  expect(sourceTime(recipe, 15)).toBe(7);
});
it("deduplicates retried cursor pages without replacing previously read cards", () => {
  const first = { id: "one", body: "kept" } as SocialPost;
  const two = { id: "two" } as SocialPost;
  expect(
    mergeSocialPage(
      [first],
      [{ id: "one", body: "new" } as SocialPost, two, two],
    ),
  ).toEqual([first, two]);
});
