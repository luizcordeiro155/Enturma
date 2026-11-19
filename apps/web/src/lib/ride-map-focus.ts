export type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};
export type Inset = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
export type SheetSnap = "peek" | "half" | "full";

export const NO_INSET: Inset = { top: 0, right: 0, bottom: 0, left: 0 };
/** However tall a sheet gets, this much of the map stays in view. */
const MIN_VISIBLE = { width: 160, height: 96 };
/** A panel counts as covering an edge when it spans this share of the map. */
const SPAN = 0.6;

/**
 * How much of each edge of the map sits under panels (the top bar, the request
 * sheet on a phone, the side panel on a computer). Small floating controls do
 * not take the map away, so they are ignored.
 */
export function overlayInset(map: Box, overlays: Box[]): Inset {
  const inset = { ...NO_INSET };
  for (const overlay of overlays) {
    const left = Math.max(map.left, overlay.left);
    const right = Math.min(map.right, overlay.right);
    const top = Math.max(map.top, overlay.top);
    const bottom = Math.min(map.bottom, overlay.bottom);
    if (right <= left || bottom <= top) continue;
    if (right - left >= map.width * SPAN) {
      if ((top + bottom) / 2 < map.top + map.height / 2)
        inset.top = Math.max(inset.top, bottom - map.top);
      else inset.bottom = Math.max(inset.bottom, map.bottom - top);
    } else if (bottom - top >= map.height * SPAN) {
      if ((left + right) / 2 < map.left + map.width / 2)
        inset.left = Math.max(inset.left, right - map.left);
      else inset.right = Math.max(inset.right, map.right - left);
    }
  }
  if (map.height - inset.top - inset.bottom < MIN_VISIBLE.height)
    inset.bottom = Math.max(0, map.height - inset.top - MIN_VISIBLE.height);
  if (map.width - inset.left - inset.right < MIN_VISIBLE.width)
    inset.right = Math.max(0, map.width - inset.left - MIN_VISIBLE.width);
  return inset;
}

/** The point of the map the camera centres on: the middle of what is visible. */
export function focusOf(
  size: { width: number; height: number },
  inset: Inset = NO_INSET,
) {
  return {
    x: inset.left + (size.width - inset.left - inset.right) / 2,
    y: inset.top + (size.height - inset.top - inset.bottom) / 2,
  };
}

const ORDER: SheetSnap[] = ["peek", "half", "full"];
/** Where the sheet rests after a pull up, a pull down or a tap on its handle. */
export function nextSnap(
  snap: SheetSnap,
  gesture: "up" | "down" | "tap",
): SheetSnap {
  if (gesture === "tap") return snap === "full" ? "half" : nextSnap(snap, "up");
  const at = ORDER.indexOf(snap) + (gesture === "up" ? 1 : -1);
  return ORDER[Math.max(0, Math.min(ORDER.length - 1, at))];
}
