export type StoryAction = 'previous' | 'next' | 'previous-author' | 'next-author' | 'close';
export type StoryGroup = { authorId: string; items: { id: string }[] };

/** A hold releases playback; it must not also skip a story. */
export function resolveStoryGesture({ dx, dy, ms, x, width }: {
  dx: number; dy: number; ms: number; x: number; width: number;
}): StoryAction | null {
  if (![dx, dy, ms, x, width].every(Number.isFinite) || width <= 0) return null;
  if (Math.hypot(dx, dy) < 10 && ms < 250) return x < width * 0.3 ? 'previous' : 'next';
  if (dy >= 90 && dy > Math.abs(dx) * 1.2) return 'close';
  if (x >= 28 && x <= width - 28 && Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.2)
    return dx < 0 ? 'next-author' : 'previous-author';
  return null;
}

/** Return null only when the viewer should close, never an out-of-range index. */
export function navigateStory(groups: readonly StoryGroup[], current: string, action: StoryAction): string | null {
  if (action === 'close') return null;
  const groupIndex = groups.findIndex(group => group.items.some(item => item.id === current));
  if (groupIndex < 0) return groups[0]?.items[0]?.id ?? null;
  const group = groups[groupIndex];
  const itemIndex = group.items.findIndex(item => item.id === current);
  if (action === 'next-author') return groups[groupIndex + 1]?.items[0]?.id ?? null;
  if (action === 'previous-author') return groups[Math.max(0, groupIndex - 1)]?.items[0]?.id ?? null;
  if (action === 'next') return group.items[itemIndex + 1]?.id ?? groups[groupIndex + 1]?.items[0]?.id ?? null;
  return group.items[itemIndex - 1]?.id ?? groups[groupIndex - 1]?.items.at(-1)?.id ?? current;
}
