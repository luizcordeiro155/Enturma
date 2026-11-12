"use client";
import {
  useRef,
  type ReactNode,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { clamp, cropAfterDrag, outputSize } from "@/lib/social-editing";
import type { VideoRecipe } from "@/lib/social";
/** The preview is the editor: drag the image, pinch to zoom, drag a timed caption. */
export function EditableMediaFrame({
  value,
  source,
  position,
  change,
  children,
}: {
  value: VideoRecipe;
  source: { width: number; height: number };
  position: number;
  change: (recipe: VideoRecipe, commit: boolean) => void;
  children: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    recipe: VideoRecipe;
    x: number;
    y: number;
    distance: number;
    caption: number | null;
    last: VideoRecipe;
  } | null>(null);
  const output = outputSize(value.aspect);
  function distance() {
    const points = [...pointers.current.values()];
    return points.length === 2
      ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
      : 0;
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const caption = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-caption]",
    );
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      recipe: value,
      x: event.clientX,
      y: event.clientY,
      distance: distance(),
      caption: caption ? Number(caption.dataset.caption) : null,
      last: value,
    };
    event.preventDefault();
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const bounds = frame.current!.getBoundingClientRect();
    let next = start.recipe;
    if (pointers.current.size === 2 && start.distance > 0)
      next = {
        ...next,
        zoom: clamp((start.recipe.zoom * distance()) / start.distance, 1, 3),
      };
    else if (start.caption !== null) {
      const caption = start.recipe.captions[start.caption];
      if (!caption) return;
      const text = frame.current?.querySelector<HTMLElement>(
        `[data-caption="${start.caption}"]`,
      );
      next = {
        ...next,
        captions: next.captions.map((item, index) =>
          index === start.caption
            ? {
                ...item,
                x: clamp(
                  (caption.x ?? 0.5) +
                    (event.clientX - start.x) /
                      Math.max(1, bounds.width - (text?.offsetWidth ?? 0)),
                  0,
                  1,
                ),
                y: clamp(
                  caption.y +
                    (event.clientY - start.y) /
                      Math.max(1, bounds.height - (text?.offsetHeight ?? 0)),
                  0,
                  1,
                ),
              }
            : item,
        ),
      };
    } else
      next = cropAfterDrag(
        start.recipe,
        source,
        bounds,
        event.clientX - start.x,
        event.clientY - start.y,
      );
    start.last = next;
    change(next, false);
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (gesture.current) change(gesture.current.last, true);
    gesture.current = null;
    pointers.current.clear();
  }
  return (
    <div
      ref={frame}
      className="social-edit-preview studio-preview"
      style={
        {
          aspectRatio: `${output.width}/${output.height}`,
          "--studio-aspect": output.width / output.height,
        } as CSSProperties
      }
      role="group"
      aria-label="Enquadramento da m&iacute;dia"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {children}
      {value.captions.map(
        (caption, index) =>
          position >= caption.start &&
          position <= caption.end && (
            <span
              key={index}
              className="social-edit-caption studio-caption"
              data-caption={index}
              role="button"
              tabIndex={0}
              aria-label={`Mover texto ${index + 1}: ${caption.text}`}
              style={{
                left: `${(caption.x ?? 0.5) * 100}%`,
                top: `${caption.y * 100}%`,
                transform: `translate(-${(caption.x ?? 0.5) * 100}%,-${caption.y * 100}%)`,
                fontSize: `${((caption.size ?? 36) / 720) * 100}cqw`,
                color: caption.color ?? "#ffffff",
              }}
              onKeyDown={(event) => {
                const dx =
                  event.key === "ArrowLeft"
                    ? -0.02
                    : event.key === "ArrowRight"
                      ? 0.02
                      : 0;
                const dy =
                  event.key === "ArrowUp"
                    ? -0.02
                    : event.key === "ArrowDown"
                      ? 0.02
                      : 0;
                if (!dx && !dy) return;
                event.preventDefault();
                change(
                  {
                    ...value,
                    captions: value.captions.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            x: clamp((item.x ?? 0.5) + dx, 0, 1),
                            y: clamp(item.y + dy, 0, 1),
                          }
                        : item,
                    ),
                  },
                  true,
                );
              }}
            >
              {caption.text}
            </span>
          ),
      )}
    </div>
  );
}
