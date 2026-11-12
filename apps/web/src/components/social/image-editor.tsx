"use client";
/* eslint-disable @next/next/no-img-element -- local image chosen by the author */
import { useState, type ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { videoPreviewFrame, type VideoRecipe } from "@/lib/social";
import {
  MEDIA_ASPECTS,
  FILTERS,
  FILTER_CSS,
  FILTER_LABELS,
  type MediaAspect,
  type MediaFilter,
} from "@/lib/social-editing";
import { EditableMediaFrame } from "./editable-media-frame";
export function ImageEditor({
  url,
  value,
  onChange,
  overlay,
}: {
  url: string;
  value: VideoRecipe;
  onChange: (recipe: VideoRecipe) => void;
  overlay?: ReactNode;
}) {
  const [size, setSize] = useState({ width: 1080, height: 1350 });
  return (
    <section
      className="studio-image-editor"
      aria-label="Editor de imagem"
      data-social-gesture="ignore"
    >
      <EditableMediaFrame
        value={value}
        source={size}
        position={0}
        change={onChange}
      >
        <img
          src={url}
          draggable={false}
          alt="Pr&eacute;via da imagem escolhida"
          onLoad={(event) =>
            setSize({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
          style={{
            ...videoPreviewFrame(size.width, size.height, value),
            filter: FILTER_CSS[value.filter ?? "ORIGINAL"],
          }}
        />
        {overlay}
      </EditableMediaFrame>
      <p className="studio-preview-hint">
        Arraste para alinhar. Use dois dedos para ampliar.
      </p>
      <div
        className="studio-aspects"
        aria-label="Propor&ccedil;&atilde;o da imagem"
      >
        {MEDIA_ASPECTS.map((aspect) => (
          <button
            type="button"
            key={aspect}
            aria-pressed={value.aspect === aspect}
            onClick={() =>
              onChange({ ...value, aspect: aspect as MediaAspect })
            }
          >
            {aspect}
          </button>
        ))}
      </div>
      <div className="social-edit-controls">
        <label>
          Zoom da imagem
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={value.zoom}
            onChange={(event) =>
              onChange({ ...value, zoom: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Filtro da imagem
          <select
            value={value.filter ?? "ORIGINAL"}
            onChange={(event) =>
              onChange({ ...value, filter: event.target.value as MediaFilter })
            }
          >
            {FILTERS.map((filter) => (
              <option key={filter} value={filter}>
                {FILTER_LABELS[filter]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            onChange({ ...value, rotation: (value.rotation + 90) % 360 })
          }
        >
          <RotateCw size={18} />
          Girar imagem
        </button>
      </div>
    </section>
  );
}
