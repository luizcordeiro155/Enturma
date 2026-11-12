"use client";
/* eslint-disable @next/next/no-img-element -- tiny local decoded frames */
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { clamp, timelinePosition, timeLabel } from "@/lib/social-editing";
import type { VideoFrame } from "./use-video-frames";
type Handle = "start" | "end" | "move";
export function MediaTimeline({
  duration,
  frames,
  start,
  end,
  position,
  seek,
  change,
  mode = "trim",
}: {
  duration: number;
  frames: VideoFrame[];
  start: number;
  end: number;
  position: number;
  seek: (time: number) => void;
  change?: (handle: Handle, time: number, commit: boolean) => void;
  mode?: "trim" | "cover";
}) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointer: number;
    mode: Handle | "seek";
    origin: number;
    start: number;
    last: number;
  } | null>(null);
  const percent = (time: number) =>
    100 * clamp(time / Math.max(0.1, duration), 0, 1);
  function begin(event: PointerEvent, handle: Handle | "seek") {
    if (event.button !== 0 || event.isPrimary === false) return;
    event.stopPropagation();
    event.preventDefault();
    const bounds = track.current!.getBoundingClientRect();
    const time = timelinePosition(event.clientX, bounds, 0, duration);
    drag.current = {
      pointer: event.pointerId,
      mode: handle,
      origin: time,
      start,
      last: handle === "start" ? start : handle === "end" ? end : start,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (handle === "seek") seek(clamp(time, 0, Math.max(0, duration - 0.04)));
  }
  function move(event: PointerEvent) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    event.stopPropagation();
    const time = timelinePosition(
      event.clientX,
      track.current!.getBoundingClientRect(),
      0,
      duration,
    );
    current.last =
      current.mode === "move" ? current.start + time - current.origin : time;
    if (current.mode === "seek")
      seek(clamp(time, 0, Math.max(0, duration - 0.04)));
    else change?.(current.mode, current.last, false);
  }
  function endDrag(event: PointerEvent) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    drag.current = null;
    if (current.mode !== "seek") change?.(current.mode, current.last, true);
  }
  function keyboard(
    event: KeyboardEvent,
    handle: Handle | "seek",
    time: number,
  ) {
    const step = event.shiftKey ? 1 : 0.1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? duration
          : event.key === "ArrowRight"
            ? time + step
            : event.key === "ArrowLeft"
              ? time - step
              : null;
    if (next === null) return;
    event.preventDefault();
    if (handle === "seek") seek(clamp(next, 0, Math.max(0, duration - 0.04)));
    else change?.(handle, clamp(next, 0, duration), true);
  }
  const pointerHandlers = {
    onPointerMove: move,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
  };
  return (
    <div className="studio-timeline" data-social-gesture="ignore">
      <div className="studio-timeline-ruler" aria-hidden="true">
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <span key={fraction}>{timeLabel(duration * fraction)}</span>
        ))}
      </div>
      <div
        ref={track}
        className="studio-filmstrip"
        data-testid="media-filmstrip"
        onPointerDown={(event) => begin(event, "seek")}
        {...pointerHandlers}
      >
        <div className="studio-filmstrip-images" aria-hidden="true">
          {frames.length ? (
            frames.map((frame) => (
              <img key={frame.time} src={frame.url} alt="" draggable={false} />
            ))
          ) : (
            <span className="studio-filmstrip-loading">
              Pr&eacute;via do v&iacute;deo
            </span>
          )}
        </div>
        {mode === "trim" && (
          <>
            <div
              className="studio-trim-shade"
              style={{ left: 0, width: `${percent(start)}%` }}
            />
            <div
              className="studio-trim-shade"
              style={{ right: 0, width: `${100 - percent(end)}%` }}
            />
            <div
              className="studio-trim-selection"
              style={{
                left: `${percent(start)}%`,
                width: `${percent(end - start)}%`,
              }}
              onPointerDown={(event) => begin(event, "move")}
              {...pointerHandlers}
            >
              <button
                type="button"
                role="slider"
                className="studio-trim-handle studio-trim-start"
                aria-label="In&iacute;cio do corte"
                aria-valuemin={0}
                aria-valuemax={end - 0.1}
                aria-valuenow={start}
                aria-valuetext={timeLabel(start)}
                onKeyDown={(event) => keyboard(event, "start", start)}
                onPointerDown={(event) => begin(event, "start")}
                {...pointerHandlers}
              >
                <span />
              </button>
              <button
                type="button"
                role="slider"
                className="studio-trim-handle studio-trim-end"
                aria-label="Fim do corte"
                aria-valuemin={start + 0.1}
                aria-valuemax={duration}
                aria-valuenow={end}
                aria-valuetext={timeLabel(end)}
                onKeyDown={(event) => keyboard(event, "end", end)}
                onPointerDown={(event) => begin(event, "end")}
                {...pointerHandlers}
              >
                <span />
              </button>
            </div>
          </>
        )}
        <button
          type="button"
          role="slider"
          className="studio-playhead"
          aria-label={
            mode === "cover"
              ? "Escolher quadro da capa"
              : "Cursor da linha do tempo"
          }
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={position}
          aria-valuetext={timeLabel(position)}
          style={{ left: `${percent(position)}%` }}
          onPointerDown={(event) => begin(event, "seek")}
          onKeyDown={(event) => keyboard(event, "seek", position)}
          {...pointerHandlers}
        />
      </div>
      <p className="studio-timeline-hint">
        {mode === "cover"
          ? "Arraste para escolher o quadro exato da capa."
          : "Arraste as bordas para cortar ou o trecho selecionado para mov\u00ea-lo."}
      </p>
    </div>
  );
}
