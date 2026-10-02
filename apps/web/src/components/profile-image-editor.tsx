"use client";
/* eslint-disable @next/next/no-img-element -- local image crop preview */
import { useEffect, useRef, useState } from "react";

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
  const dialog = useRef<HTMLDialogElement>(null);
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
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setSrc(url);
      setSize({ width: image.width, height: image.height });
    };
    image.onerror = () =>
      setError("Não foi possível abrir esta imagem. Escolha outro arquivo.");
    image.src = url;
    dialog.current?.showModal();
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const cropWidth = Math.min(size.width, size.height * ratio) / zoom;
  const cropHeight = cropWidth / ratio;
  async function apply(original = false) {
    setBusy(true);
    setError("");
    try {
      if (original) await onApply(file);
      else {
        const image = new Image();
        image.src = src;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = kind === "avatar" ? 512 : 1500;
        canvas.height = canvas.width / ratio;
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
            (b) =>
              b ? resolve(b) : reject(Error("Falha ao recortar imagem.")),
            "image/webp",
            0.9,
          ),
        );
        await onApply(new File([blob], `${kind}.webp`, { type: "image/webp" }));
      }
      onCancel();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="image-crop-dialog"
      aria-labelledby="crop-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onCancel();
      }}
    >
      <h2 id="crop-title">
        Editar {kind === "avatar" ? "foto de perfil" : "banner"}
      </h2>
      <p>Arraste a imagem ou use os controles para ajustar o recorte.</p>
      <div
        ref={preview}
        className={`image-crop-preview crop-${kind}`}
        style={{ aspectRatio: ratio }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            px: position.x,
            py: position.y,
          };
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onPointerMove={(e) => {
          if (!drag.current || !preview.current || !cropWidth) return;
          const scale = preview.current.clientWidth / cropWidth;
          const dx = (size.width - cropWidth) * scale,
            dy = (size.height - cropHeight) * scale;
          setPosition({
            x: Math.max(
              0,
              Math.min(
                100,
                drag.current.px -
                  (dx ? ((e.clientX - drag.current.x) / dx) * 100 : 0),
              ),
            ),
            y: Math.max(
              0,
              Math.min(
                100,
                drag.current.py -
                  (dy ? ((e.clientY - drag.current.y) / dy) * 100 : 0),
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
          <span>Carregando imagem…</span>
        )}
        <span className="crop-guide" />
      </div>
      <label>
        Zoom
        <input
          type="range"
          min="1"
          max="4"
          step="0.01"
          value={zoom}
          disabled={busy}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </label>
      <label>
        Posição horizontal
        <input
          type="range"
          min="0"
          max="100"
          value={position.x}
          disabled={busy}
          onChange={(e) =>
            setPosition((p) => ({ ...p, x: Number(e.target.value) }))
          }
        />
      </label>
      <label>
        Posição vertical
        <input
          type="range"
          min="0"
          max="100"
          value={position.y}
          disabled={busy}
          onChange={(e) =>
            setPosition((p) => ({ ...p, y: Number(e.target.value) }))
          }
        />
      </label>
      {file.type === "image/gif" ? (
        <p>
          O recorte transforma o GIF em imagem estática. Use o GIF original para manter a animação no perfil e nos cards de membros.
        </p>
      ) : null}
      <p role="alert">{error}</p>
      <div className="crop-actions">
        <button
          className="secondary"
          disabled={busy}
          onClick={() => {
            setZoom(1);
            setPosition({ x: 50, y: 50 });
          }}
        >
          Redefinir
        </button>
        <button className="secondary" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
        {file.type === "image/gif" ? (
          <button disabled={busy} onClick={() => void apply(true)}>
            Usar GIF animado
          </button>
        ) : null}
        <button disabled={busy || !src} onClick={() => void apply()}>
          {busy ? "Enviando…" : "Aplicar recorte"}
        </button>
      </div>
    </dialog>
  );
}
