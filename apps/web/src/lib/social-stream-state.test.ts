import { expect, it } from "vitest";
import type { SocialPost } from "./social";
import { mergeFreshPosts, sharedSocialPostId } from "./social-stream-state";
const post = (id: string, body = id) => ({ id, body }) as SocialPost;
it("silently appends new posts without moving an already playing item", () => {
  expect(
    mergeFreshPosts(
      [post("old")],
      [post("new"), post("old", "updated")],
      false,
    ),
  ).toEqual([post("old", "updated"), post("new")]);
  expect(
    mergeFreshPosts([post("old")], [post("new"), post("old")], true).map(
      (p) => p.id,
    ),
  ).toEqual(["new", "old"]);
});
it("extracts only a canonical Enturma post link, never a third-party URL", () => {
  const id = "198b4058-2776-4bac-840e-f696a15fe890";
  expect(
    sharedSocialPostId(
      `Olha isso\nhttps://enturma-flax.vercel.app/social?post=${id}`,
    ),
  ).toBe(id);
  expect(sharedSocialPostId(`https://evil.test/social?post=${id}`)).toBeNull();
  expect(
    sharedSocialPostId(
      `https://enturma-flax.vercel.app.evil.test/social?post=${id}`,
    ),
  ).toBeNull();
});
