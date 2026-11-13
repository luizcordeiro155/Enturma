"use client";
/* eslint-disable @next/next/no-img-element -- private draft media */
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { DraftFile } from "@/lib/social-draft";
import {
  defaultRecipe,
  mediaUrl,
  sourceTime,
  videoPreviewFrame,
} from "@/lib/social";
import { FILTER_CSS, outputSize } from "@/lib/social-editing";

/** A still review of the chosen frame; editing remains in the preceding step. */
export function SocialDraftPreview({
  item,
  overlay,
}: {
  item: DraftFile;
  overlay?: ReactNode;
}) {
  const [url, setUrl] = useState("");
  const [size, setSize] = useState({ width: 1080, height: 1350 });
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
  const recipe = item.recipe ?? { ...defaultRecipe(1), aspect: "4:5" as const };
  const output = outputSize(recipe.aspect);
  const exported = !file && item.media?.state === "READY";
  const customCover = !!item.coverFile;
  const video = !customCover && !!item.file?.type.startsWith("video/");
  const source = exported
    ? mediaUrl(item.id, item.media?.kind === "VIDEO")
    : url;
  const style =
    exported || customCover
      ? { width: "100%", height: "100%", objectFit: "contain" as const }
      : {
          ...videoPreviewFrame(size.width, size.height, recipe),
          filter: FILTER_CSS[recipe.filter ?? "ORIGINAL"],
        };
  return (
    <figure className="social-draft-preview">
      <div
        className="studio-preview"
        role="img"
        aria-label="Prévia da publicação"
        style={
          {
            aspectRatio: `${output.width}/${output.height}`,
            "--studio-aspect": output.width / output.height,
          } as CSSProperties
        }
      >
        {source &&
          (video ? (
            <video
              src={source}
              muted
              playsInline
              preload="auto"
              draggable={false}
              style={style}
              onLoadedMetadata={(event) => {
                const media = event.currentTarget;
                setSize({ width: media.videoWidth, height: media.videoHeight });
                media.currentTime = sourceTime(recipe, recipe.cover);
              }}
            />
          ) : (
            <img
              src={source}
              alt=""
              draggable={false}
              style={style}
              onLoad={(event) =>
                setSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
            />
          ))}
        {!exported &&
          !customCover &&
          recipe.captions
            .filter(
              (caption) =>
                recipe.cover >= caption.start && recipe.cover <= caption.end,
            )
            .map((caption, index) => (
              <span
                key={index}
                className="studio-caption"
                style={{
                  left: `${(caption.x ?? 0.5) * 100}%`,
                  top: `${caption.y * 100}%`,
                  transform: `translate(-${(caption.x ?? 0.5) * 100}%,-${caption.y * 100}%)`,
                  fontSize: `${((caption.size ?? 36) / 720) * 100}cqw`,
                  color: caption.color ?? "#fff",
                }}
              >
                {caption.text}
              </span>
            ))}
        {overlay}
      </div>
      <figcaption>
        {item.file?.type.startsWith("video/") || item.media?.kind === "VIDEO"
          ? "Prévia da capa · Revise o vídeo na etapa Editar"
          : "Prévia da publicação"}
      </figcaption>
    </figure>
  );
}
