import { api } from "./api";
export type SocialPerson = {
  id: string;
  name: string;
  username: string;
  hasAvatar?: boolean;
  hasBanner?: boolean;
  verified?: boolean;
};
export type SocialMedia = {
  id: string;
  kind: "IMAGE" | "VIDEO";
  state?: string;
  error?: string;
  durationMs?: number;
  width?: number;
  height?: number;
  recipe?: VideoRecipe;
};
export type SocialPost = SocialPerson & {
  authorId: string;
  kind: "POST" | "CLIP" | "STORY";
  body: string;
  projectUrl?: string;
  publishedAt: string;
  expiresAt?: string;
  pinned: boolean;
  likes: number;
  reposts: number;
  comments: number;
  mine: string[];
  media: SocialMedia[];
  seen?: boolean;
  highlightTitle?: string;
};
export type SocialPage = {
  items: SocialPost[];
  nextCursor: string;
  snapshot: string;
};
export type SocialPreferences = {
  privateAccount: boolean;
  recommendations: boolean;
  autoplay: boolean;
  interests: string[];
  navigation: { automatic: boolean; order: SocialView[] };
};
export type SocialView = "feed" | "clips" | "create";
export type VideoSegment = { start: number; end: number };
export type VideoCaption = {
  text: string;
  start: number;
  end: number;
  y: number;
};
export type VideoRecipe = {
  segments: VideoSegment[];
  zoom: number;
  x: number;
  y: number;
  rotation: number;
  volume: number;
  mute: boolean;
  cover: number;
  captions: VideoCaption[];
};
export const socialWrite = <T = unknown>(
  path: string,
  body?: unknown,
  method = "PUT",
) =>
  api<T>(`/social${path}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
export const mediaUrl = (id: string, thumbnail = false) =>
  `/api/backend/social/media/${id}/content${thumbnail ? "?thumbnail=true" : ""}`;
export const socialLink = (kind: "post" | "person", id: string) =>
  `https://enturma-flax.vercel.app/social?${kind}=${encodeURIComponent(id)}`;
export const postPerson = (p: SocialPost): SocialPerson => ({
  id: p.authorId,
  name: p.name,
  username: p.username,
  hasAvatar: p.hasAvatar,
  verified: p.verified,
});
export const exportDuration = (recipe: VideoRecipe) =>
  recipe.segments.reduce((sum, s) => sum + Math.max(0, s.end - s.start), 0);
export function defaultRecipe(duration: number): VideoRecipe {
  return {
    segments: [{ start: 0, end: Math.min(90, duration) }],
    zoom: 1,
    x: 0.5,
    y: 0.5,
    rotation: 0,
    volume: 1,
    mute: false,
    cover: 0,
    captions: [],
  };
}
export function sourceTime(recipe: VideoRecipe, output: number) {
  let elapsed = 0;
  for (const segment of recipe.segments) {
    if (output < elapsed + segment.end - segment.start)
      return segment.start + output - elapsed;
    elapsed += segment.end - segment.start;
  }
  return recipe.segments.at(-1)?.end ?? 0;
}
export function socialGesture(
  dx: number,
  dy: number,
  ms: number,
  startX: number,
  width: number,
): SocialView | null {
  // Leave the browser/OS edge gesture and vertical scroll alone.
  if (
    startX < 28 ||
    startX > width - 28 ||
    Math.abs(dx) < 70 ||
    Math.abs(dx) < Math.abs(dy) * 1.7 ||
    Math.abs(dx) / Math.max(ms, 1) < 0.12
  )
    return null;
  return dx > 0 ? "clips" : "create";
}
export function mergeSocialPage(
  previous: SocialPost[],
  incoming: SocialPost[],
) {
  const ids = new Set(previous.map((p) => p.id));
  return [
    ...previous,
    ...incoming.filter((p) => !ids.has(p.id) && !!ids.add(p.id)),
  ];
}
