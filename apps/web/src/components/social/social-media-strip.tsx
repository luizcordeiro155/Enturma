"use client";
/* eslint-disable @next/next/no-img-element -- private draft media */
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Plus,
  TriangleAlert,
} from "lucide-react";
import type { DraftFile } from "@/lib/social-draft";
import { mediaUrl } from "@/lib/social";

const isVideo = (item: DraftFile) =>
  item.media?.kind === "VIDEO" || !!item.file?.type.startsWith("video/");

function Thumb({ item }: { item: DraftFile }) {
  const [url, setUrl] = useState("");
  // The cover the person picked stands for a video; otherwise the file itself.
  const file = item.coverFile ?? item.file;
  useEffect(() => {
    if (!file) return;
    const blob = URL.createObjectURL(file);
    const timer = setTimeout(() => setUrl(blob), 0);
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(blob);
    };
  }, [file]);
  if (!file)
    return item.media ? (
      <img
        src={mediaUrl(item.id, item.media.kind === "VIDEO")}
        alt=""
        draggable={false}
      />
    ) : null;
  if (!url) return null;
  return file.type.startsWith("video/") ? (
    // The first frame, as a still.
    <video src={`${url}#t=0.1`} muted playsInline preload="metadata" />
  ) : (
    <img src={url} alt="" draggable={false} />
  );
}

/**
 * The media of a publication in order, as thumbnails: one is open at a time, and the last tile
 * adds more. It scrolls sideways when the line is longer than the screen.
 */
export function SocialMediaStrip({
  items,
  current,
  onSelect,
  onAdd,
  disabled,
}: {
  items: DraftFile[];
  current: number;
  onSelect: (index: number) => void;
  /** Leave out where nothing can be added (the review, or a full publication). */
  onAdd?: () => void;
  disabled?: boolean;
}) {
  const list = useRef<HTMLOListElement>(null);
  // Keep the open one in sight when the line is longer than the screen. Only this line moves:
  // scrollIntoView would also drag the page and the Social pager sideways.
  useEffect(() => {
    const line = list.current;
    const open = line?.children[current] as HTMLElement | undefined;
    if (!line || !open) return;
    line.scrollTo?.({
      left:
        open.offsetLeft -
        line.offsetLeft -
        (line.clientWidth - open.clientWidth) / 2,
      behavior: "auto",
    });
  }, [current]);
  return (
    <div
      className="social-media-strip"
      role="group"
      aria-label="Mídias da publicação"
      data-social-gesture="ignore"
    >
      {items.length > 1 && (
        <button
          type="button"
          className="social-media-strip-step"
          aria-label="Mídia anterior"
          disabled={current <= 0}
          onClick={() => onSelect(current - 1)}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      )}
      <ol ref={list}>
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              aria-label={`Abrir mídia ${index + 1}`}
              aria-pressed={index === current}
              data-kind={isVideo(item) ? "VIDEO" : "IMAGE"}
              data-state={item.media?.state}
              onClick={() => onSelect(index)}
            >
              <Thumb item={item} />
              <span className="social-media-strip-number" aria-hidden="true">
                {index + 1}
              </span>
              {isVideo(item) && (
                <Film
                  className="social-media-strip-kind"
                  size={14}
                  aria-hidden="true"
                />
              )}
              {item.media?.state === "FAILED" && (
                <TriangleAlert
                  className="social-media-strip-failed"
                  size={16}
                  aria-label="Falha no processamento"
                />
              )}
            </button>
          </li>
        ))}
        {onAdd && (
          <li>
            <button
              type="button"
              className="social-media-strip-add"
              aria-label="Adicionar mídia"
              disabled={disabled}
              onClick={onAdd}
            >
              <Plus size={22} aria-hidden="true" />
            </button>
          </li>
        )}
      </ol>
      {items.length > 1 && (
        <button
          type="button"
          className="social-media-strip-step"
          aria-label="Próxima mídia"
          disabled={current >= items.length - 1}
          onClick={() => onSelect(current + 1)}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
