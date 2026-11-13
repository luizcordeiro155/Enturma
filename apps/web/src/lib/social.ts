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
  storyOverlays?: StoryOverlay[];
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
export type StoryOverlay = { text: string; x: number; y: number };
/** Only this application's canonical social URLs are handled as in-app navigation. */
export function socialPath(raw: string, origin: string): string | null {
  try {
    const url = new URL(raw, origin);
    if (
      ![new URL(origin).origin, "https://enturma-flax.vercel.app"].includes(
        url.origin,
      ) ||
      url.username ||
      url.password ||
      url.pathname !== "/social"
    )
      return null;
    const key = url.searchParams.has("post") ? "post" : "person",
      id = url.searchParams.get(key);
    return id &&
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)
      ? `/social?${key}=${id}`
      : null;
  } catch {
    return null;
  }
}
export type VideoSegment = { start: number; end: number };
export type VideoCaption = {
  text: string;
  start: number;
  end: number;
  y: number;
  x?: number;
  size?: number;
  color?: string;
};
export type VideoRecipe = {
  aspect?: "9:16" | "4:5" | "3:4" | "1:1" | "1.91:1";
  filter?:
    "ORIGINAL" | "VIVID" | "WARM" | "COOL" | "MONO" | "FADE" | "CONTRAST";
  speed?: number;
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
export const storyDuration = (media: SocialMedia | undefined) =>
  media?.kind === "VIDEO" && (media.durationMs ?? 0) > 0
    ? media.durationMs!
    : 7000;
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
  recipe.segments.reduce((sum, s) => sum + Math.max(0, s.end - s.start), 0) /
  (recipe.speed ?? 1);
/** Match the export order: rotate the source, scale to cover, then crop. */
export function videoPreviewFrame(
  width: number,
  height: number,
  recipe: VideoRecipe,
) {
  const ratios: Record<string, number> = {
    "9:16": 9 / 16,
    "4:5": 0.8,
    "3:4": 0.75,
    "1:1": 1,
    "1.91:1": 1.91,
  };
  const outWidth = 720,
    outHeight =
      Math.floor(720 / (ratios[recipe.aspect ?? "9:16"] ?? 9 / 16) / 2) * 2;
  const sideways = recipe.rotation === 90 || recipe.rotation === 270;
  const rotatedWidth = sideways ? height : width;
  const rotatedHeight = sideways ? width : height;
  const scale = Math.max(
    (Math.floor((outWidth * recipe.zoom) / 2) * 2) / rotatedWidth,
    (Math.floor((outHeight * recipe.zoom) / 2) * 2) / rotatedHeight,
  );
  return {
    width: `${((width * scale) / outWidth) * 100}%`,
    height: `${((height * scale) / outHeight) * 100}%`,
    left: `${(((rotatedWidth * scale) / 2 - (rotatedWidth * scale - outWidth) * recipe.x) / outWidth) * 100}%`,
    top: `${(((rotatedHeight * scale) / 2 - (rotatedHeight * scale - outHeight) * recipe.y) / outHeight) * 100}%`,
    transform: `translate(-50%, -50%) rotate(${recipe.rotation}deg)`,
  };
}
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
  output *= recipe.speed ?? 1;
  let elapsed = 0;
  for (const segment of recipe.segments) {
    if (output < elapsed + segment.end - segment.start)
      return segment.start + output - elapsed;
    elapsed += segment.end - segment.start;
  }
  return recipe.segments.at(-1)?.end ?? 0;
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
