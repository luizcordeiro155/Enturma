import type { SocialPost } from "./social";

/** Width / height for the feed, kept between portrait 4:5 and landscape 1.91:1. */
export function mediaAspect(width?: number, height?: number): number {
  if (!width || !height) return 1;
  return Math.min(1.91, Math.max(0.8, width / height));
}

export function relativeTime(iso: string, now: Date): string {
  const seconds = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `há ${Math.floor(seconds / 86400)} d`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

/** One group per author in arrival order; each author's Stories play oldest first. */
export function groupStories(
  items: SocialPost[],
): { authorId: string; items: SocialPost[] }[] {
  const groups = new Map<string, SocialPost[]>();
  for (const item of items) {
    const group = groups.get(item.authorId);
    if (group) group.push(item);
    else groups.set(item.authorId, [item]);
  }
  return [...groups].map(([authorId, stories]) => ({
    authorId,
    items: [...stories].sort(
      (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
    ),
  }));
}

/** The left 30% of a Story goes back; everything else advances. */
export function storyTapZone(x: number, width: number): "back" | "forward" {
  return x < width * 0.3 ? "back" : "forward";
}

/** Pull to refresh: only from the top of the list, downwards, and clearly vertical. */
export function pullRefreshes(scrollTop: number, dx: number, dy: number): boolean {
  return scrollTop <= 0 && dy > 70 && dy > Math.abs(dx) * 1.2;
}
