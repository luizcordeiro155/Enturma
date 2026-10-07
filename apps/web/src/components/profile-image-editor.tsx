"use client";
/* eslint-disable @next/next/no-img-element -- local image crop preview */
import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

export function ProfileImageEditor({
  file,
  kind,
  onApply,
  onCancel,
}: {
  file: File;
  kind: "avatar" | "banner";
  onApply: (file: File) => Promise<void>;
  onCancel: () => void;
}) {
  const preview = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const [src, setSrc] = useState("");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ratio = kind === "avatar" ? 1 : 3;

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    root.dataset.profileCrop = "true";
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      delete root.dataset.profileCrop;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onCancel]);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setSrc(url);
      setSize({ width: image.naturalWidth, height: image.naturalHeight });
      setZoom(1);
      setPosition({ x: 50, y: 50 });
      setError("");
    };
    image.onerror = () =>
      setError("Não foi possível abrir esta imagem. Escolha outro arquivo.");
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const cropWidth = size.width
    ? Math.min(size.width, size.height * ratio) / zoom
    : 0;
  const cropHeight = cropWidth ? cropWidth / ratio : 0;

  async function apply(original = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (original) {
        await onApply(file);
      } else {
        const image = new Image();
        image.src = src;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = kind === "avatar" ? 512 : 1500;
        canvas.height = Math.round(canvas.width / ratio);
        const context = canvas.getContext("2d");
        if (!context)
          throw Error("Seu navegador não conseguiu preparar o recorte.");

        context.drawImage(
          image,
          ((size.width - cropWidth) * position.x) / 100,
          ((size.height - cropHeight) * position.y) / 100,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (value) =>
              value
                ? resolve(value)
                : reject(Error("Falha ao preparar o recorte da imagem.")),
            "image/webp",
            0.9,
          ),
        );

        await onApply(new File([blob], `${kind}.webp`, { type: "image/webp" }));
      }
      onCancel();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="image-crop-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-title"
    >
      <section className="image-crop-dialog">
        <header className="image-crop-header">
          <button
            type="button"
            className="image-crop-close"
            aria-label="Cancelar edição da imagem"
            disabled={busy}
            onClick={onCancel}
          >
            <X size={24} />
          </button>
          <div>
            <h2 id="crop-title">
              {kind === "avatar" ? "Ajustar foto de perfil" : "Ajustar banner"}
            </h2>
            <p>
              Arraste a imagem e use o zoom para escolher exatamente o que
              aparece no seu perfil.
            </p>
          </div>
        </header>

        <div className="image-crop-workspace">
          <div
            ref={preview}
            className={`image-crop-preview crop-${kind}`}
            style={{ aspectRatio: ratio }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {
                x: event.clientX,
                y: event.clientY,
                px: position.x,
                py: position.y,
              };
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onPointerMove={(event) => {
              if (!drag.current || !preview.current || !cropWidth) return;
              const scale = preview.current.clientWidth / cropWidth;
              const dx = (size.width - cropWidth) * scale;
              const dy = (size.height - cropHeight) * scale;
              setPosition({
                x: Math.max(
                  0,
                  Math.min(
                    100,
                    drag.current.px -
                      (dx ? ((event.clientX - drag.current.x) / dx) * 100 : 0),
                  ),
                ),
                y: Math.max(
                  0,
                  Math.min(
                    100,
                    drag.current.py -
                      (dy ? ((event.clientY - drag.current.y) / dy) * 100 : 0),
                  ),
                ),
              });
            }}
          >
            {src && cropWidth > 0 ? (
              <img
                src={src}
                alt="Prévia do recorte"
                draggable={false}
                style={{
                  width: `${(size.width / cropWidth) * 100}%`,
                  height: `${(size.height / cropHeight) * 100}%`,
                  left: `${-(size.width / cropWidth - 1) * position.x}%`,
                  top: `${-(size.height / cropHeight - 1) * position.y}%`,
                }}
              />
            ) : (
              <span className="image-crop-loading">Carregando imagem…</span>
            )}
            <span className="crop-guide" aria-hidden="true" />
          </div>

          <div className="image-crop-controls">
            <label>
              <span>Zoom</span>
              <input
                type="range"
                min="1"
                max="4"
                step="0.01"
                value={zoom}
                disabled={busy}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>

            <div className="image-crop-position-controls">
              <label>
                <span>Horizontal</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.x}
                  disabled={busy}
                  onChange={(event) =>
                    setPosition((current) => ({
                      ...current,
                      x: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span>Vertical</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.y}
                  disabled={busy}
                  onChange={(event) =>
                    setPosition((current) => ({
                      ...current,
                      y: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>

            {file.type === "image/gif" ? (
              <p className="image-crop-gif-note">
                Recortar transforma o GIF em imagem estática. Você pode manter
                o GIF original para preservar a animação.
              </p>
            ) : null}

            {error ? (
              <p className="image-crop-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <footer className="crop-actions">
          <button
            type="button"
            className="secondary image-crop-reset"
            disabled={busy}
            onClick={() => {
              setZoom(1);
              setPosition({ x: 50, y: 50 });
            }}
          >
            <RotateCcw size={18} />
            Redefinir
          </button>

          {file.type === "image/gif" ? (
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => void apply(true)}
            >
              Usar GIF original
            </button>
          ) : null}

          <button
            type="button"
            className="image-crop-apply"
            disabled={busy || !src}
            onClick={() => void apply()}
          >
            <Check size={19} />
            {busy ? "Salvando…" : "Aplicar"}
          </button>
        </footer>
      </section>
    </div>
  );
}
