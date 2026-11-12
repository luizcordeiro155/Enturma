import { exportDuration, type VideoCaption, type VideoRecipe } from "./social";

export type MediaAspect = "9:16" | "4:5" | "3:4" | "1:1" | "1.91:1";
export const MEDIA_ASPECTS: readonly MediaAspect[] = [
  "9:16",
  "4:5",
  "3:4",
  "1:1",
  "1.91:1",
];
export const FILTERS = [
  "ORIGINAL",
  "VIVID",
  "WARM",
  "COOL",
  "MONO",
  "FADE",
  "CONTRAST",
] as const;
export type MediaFilter = (typeof FILTERS)[number];
export const FILTER_CSS: Record<MediaFilter, string> = {
  ORIGINAL: "none",
  VIVID: "saturate(1.3) contrast(1.08)",
  WARM: "sepia(.18) saturate(1.15)",
  COOL: "sepia(.08) hue-rotate(180deg) saturate(.9)",
  MONO: "grayscale(1)",
  FADE: "saturate(.7) contrast(.85) brightness(1.08)",
  CONTRAST: "contrast(1.2)",
};
export const FILTER_LABELS: Record<MediaFilter, string> = {
  ORIGINAL: "Original",
  VIVID: "Vivo",
  WARM: "Quente",
  COOL: "Frio",
  MONO: "P&B",
  FADE: "Suave",
  CONTRAST: "Contraste",
};
export const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, Number.isFinite(value) ? value : low));
export function outputSize(aspect: string = "9:16", width = 720) {
  const ratio: Record<string, number> = {
    "9:16": 9 / 16,
    "4:5": 0.8,
    "3:4": 0.75,
    "1:1": 1,
    "1.91:1": 1.91,
  };
  return {
    width,
    height: Math.floor(width / (ratio[aspect] ?? 9 / 16) / 2) * 2,
  };
}
export function timelinePosition(
  clientX: number,
  box: { left: number; width: number },
  start: number,
  end: number,
) {
  return (
    start +
    clamp((clientX - box.left) / Math.max(1, box.width), 0, 1) *
      Math.max(0, end - start)
  );
}
export function frameTimes(
  duration: number,
  count = 12,
  start = 0,
  end = duration,
) {
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const length = Math.max(2, Math.min(24, Math.floor(count)));
  const from = clamp(start, 0, duration),
    to = clamp(end, from, duration);
  return Array.from({ length }, (_, index) =>
    clamp(
      from + ((to - from) * index) / (length - 1),
      0,
      Math.max(0, duration - 0.04),
    ),
  );
}
export function timeLabel(value: number) {
  const seconds = Math.max(0, Number.isFinite(value) ? value : 0);
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
}
export function normalizeRecipe(recipe: VideoRecipe): VideoRecipe {
  const duration = exportDuration(recipe);
  return {
    ...recipe,
    cover: clamp(recipe.cover, 0, Math.max(0, duration - 0.05)),
    captions: recipe.captions
      .filter((caption) => caption.start < duration)
      .map((caption) => ({ ...caption, end: Math.min(duration, caption.end) })),
  };
}
export function trimSegment(
  recipe: VideoRecipe,
  index: number,
  mode: "start" | "end" | "move",
  time: number,
  sourceDuration: number,
) {
  const segment = recipe.segments[index];
  if (!segment) return recipe;
  const speed = recipe.speed ?? 1;
  const other =
    (exportDuration(recipe) - (segment.end - segment.start) / speed) * speed;
  const maxLength = Math.max(0.1, 90 * speed - other);
  let { start, end } = segment;
  if (mode === "start")
    start = clamp(time, Math.max(0, end - maxLength), end - 0.1);
  if (mode === "end")
    end = clamp(time, start + 0.1, Math.min(sourceDuration, start + maxLength));
  if (mode === "move") {
    const length = end - start;
    start = clamp(time, 0, Math.max(0, sourceDuration - length));
    end = start + length;
  }
  return normalizeRecipe({
    ...recipe,
    segments: recipe.segments.map((part, i) =>
      i === index ? { start, end } : part,
    ),
  });
}
export function captionRange(
  caption: VideoCaption,
  mode: "start" | "end" | "move",
  time: number,
  duration: number,
): VideoCaption {
  let { start, end } = caption;
  if (mode === "start") start = clamp(time, 0, end - 0.1);
  if (mode === "end") end = clamp(time, start + 0.1, duration);
  if (mode === "move") {
    const length = Math.min(end - start, duration);
    start = clamp(time, 0, Math.max(0, duration - length));
    end = start + length;
  }
  return { ...caption, start, end };
}
export function cropAfterDrag(
  recipe: VideoRecipe,
  source: { width: number; height: number },
  viewport: { width: number; height: number },
  dx: number,
  dy: number,
): VideoRecipe {
  const output = outputSize(recipe.aspect);
  const sideways = recipe.rotation === 90 || recipe.rotation === 270;
  const width = sideways ? source.height : source.width,
    height = sideways ? source.width : source.height;
  const scale = Math.max(
    (output.width * recipe.zoom) / width,
    (output.height * recipe.zoom) / height,
  );
  const overflowX =
    ((width * scale - output.width) * viewport.width) / output.width;
  const overflowY =
    ((height * scale - output.height) * viewport.height) / output.height;
  return {
    ...recipe,
    x: overflowX > 0.1 ? clamp(recipe.x - dx / overflowX, 0, 1) : 0.5,
    y: overflowY > 0.1 ? clamp(recipe.y - dy / overflowY, 0, 1) : 0.5,
  };
}
