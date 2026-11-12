import { expect, it } from "vitest";
import {
  defaultRecipe,
  exportDuration,
  sourceTime,
  mergeSocialPage,
  socialPath,
  storyDuration,
  videoPreviewFrame,
  type SocialPost,
  type SocialMedia,
} from "./social";

it("keeps photo and text Stories readable instead of advancing on zero image duration", () => {
  expect(storyDuration(undefined)).toBe(7000);
  expect(storyDuration({ kind: "IMAGE", durationMs: 0 } as SocialMedia)).toBe(
    7000,
  );
  expect(
    storyDuration({ kind: "VIDEO", durationMs: 15300 } as SocialMedia),
  ).toBe(15300);
});

it("previews rotation before crop and keeps the selected edge inside the 9:16 frame", () => {
  const recipe = { ...defaultRecipe(3), rotation: 90, x: 0, y: 1 };
  const frame = videoPreviewFrame(1920, 1080, recipe);
  // A landscape source rotated clockwise exactly fills a portrait export.
  expect(parseFloat(frame.width)).toBeCloseTo(177.7778, 3);
  expect(parseFloat(frame.height)).toBeCloseTo(56.25, 3);
  expect(frame.left).toBe("50%");
  expect(frame.top).toBe("50%");
  const zoomed = videoPreviewFrame(1920, 1080, { ...recipe, zoom: 2 });
  expect(zoomed.left).toBe("100%");
  expect(zoomed.top).toBe("0%");
});

it("opens canonical Social shares inside the client without trusting lookalike hosts", () => {
  const id = "11111111-1111-1111-1111-111111111111";
  expect(
    socialPath(
      `https://enturma-flax.vercel.app/social?post=${id}`,
      "https://localhost",
    ),
  ).toBe(`/social?post=${id}`);
  expect(
    socialPath(
      `https://enturma-flax.vercel.app.evil.test/social?post=${id}`,
      "https://localhost",
    ),
  ).toBeNull();
  expect(
    socialPath(
      `https://user@enturma-flax.vercel.app/social?person=${id}`,
      "https://localhost",
    ),
  ).toBeNull();
  expect(socialPath("javascript:alert(1)", "https://localhost")).toBeNull();
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
