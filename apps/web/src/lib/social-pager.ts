import type { SocialView } from "./social";

/** Mobile pages laid out left to right. The Feed sits in the middle. */
export const PAGER_ORDER: readonly SocialView[] = ["clips", "feed", "create"];
/** Leave the system back gesture alone near either screen edge. */
export const EDGE_GUARD = 28;
export const AXIS_LOCK = 10;
/** Same phone limit as the application shell, so both switch layouts together. */
export const PHONE_QUERY = "(max-width: 760px)";

/** `dx > 0` means the finger travelled to the right, revealing the page on the left. */
export function pagerNeighbor(view: SocialView, dx: number): SocialView | null {
  if (!dx) return null;
  const next = PAGER_ORDER.indexOf(view) + (dx > 0 ? -1 : 1);
  return PAGER_ORDER[next] ?? null;
}

/** Decide the gesture axis once; diagonal movement stays with vertical scrolling. */
export function lockAxis(dx: number, dy: number): "x" | "y" | null {
  const x = Math.abs(dx),
    y = Math.abs(dy);
  if (Math.max(x, y) < AXIS_LOCK) return null;
  return x > y * 1.2 ? "x" : "y";
}

/** A page change commits past a quarter of the width, or with a deliberate flick. */
export function pagerSettles(dx: number, ms: number, width: number): boolean {
  const distance = Math.abs(dx);
  return (
    distance >= 0.25 * width ||
    (distance >= 24 && distance / Math.max(ms, 1) >= 0.5)
  );
}

export function gestureStartAllowed(startX: number, width: number): boolean {
  return startX >= EDGE_GUARD && startX <= width - EDGE_GUARD;
}
