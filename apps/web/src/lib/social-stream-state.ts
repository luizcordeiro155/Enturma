import type { SocialPost } from "./social";
export function mergeFreshPosts(
  existing: SocialPost[],
  fresh: SocialPost[],
  prepend = false,
): SocialPost[] {
  const updates = new Map(fresh.map((post) => [post.id, post]));
  const seen = new Set(existing.map((post) => post.id));
  const added = fresh.filter((post) => !seen.has(post.id));
  const retained = existing.map((post) => updates.get(post.id) ?? post);
  return prepend ? [...added, ...retained] : [...retained, ...added];
}
/** Only a canonical first-party post link can trigger an authenticated preview request. */
export function sharedSocialPostId(text: string): string | null {
  for (const match of text.matchAll(/https?:\/\/[^\s<>]+/g)) {
    try {
      const url = new URL(match[0]);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "enturma-flax.vercel.app" ||
        url.port ||
        url.username ||
        url.password ||
        url.pathname !== "/social"
      )
        continue;
      const id = url.searchParams.get("post");
      if (
        id &&
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
          id,
        )
      )
        return id;
    } catch {
      /* Non-links stay plain text. */
    }
  }
  return null;
}
