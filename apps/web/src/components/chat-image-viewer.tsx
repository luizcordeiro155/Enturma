"use client";
/* eslint-disable @next/next/no-img-element -- authenticated or decrypted blob attachments */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { playMotion } from "@/lib/motion";
import {
  useOverlayHistory,
  waitForOverlayHistory,
} from "@/lib/use-overlay-history";

export function ChatImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const hasOpened = useRef(false);
  useOverlayHistory(() => setOpen(false), open);
  const canvas = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const current = useRef(view);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; distance: number } | null>(
    null,
  );
  const update = useCallback(
    (scale: number, x = current.current.x, y = current.current.y) => {
      const area = canvas.current,
        img = picture.current;
      scale = Math.max(1, Math.min(5, scale));
      const maxX =
        area && img
          ? Math.max(0, (img.offsetWidth * scale - area.clientWidth) / 2)
          : 0;
      const maxY =
        area && img
          ? Math.max(0, (img.offsetHeight * scale - area.clientHeight) / 2)
          : 0;
      current.current = {
        scale,
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
      setView(current.current);
    },
    [],
  );
  const zoomAt = useCallback(
    (scale: number, clientX?: number, clientY?: number) => {
      const rect = canvas.current?.getBoundingClientRect();
      const next = Math.max(1, Math.min(5, scale));
      const factor = next / current.current.scale;
      const x =
        rect && clientX !== undefined
          ? clientX - rect.left - rect.width / 2
          : 0;
      const y =
        rect && clientY !== undefined
          ? clientY - rect.top - rect.height / 2
          : 0;
      update(
        next,
        x - (x - current.current.x) * factor,
        y - (y - current.current.y) * factor,
      );
    },
    [update],
  );
  function gesturePosition() {
    const points = [...pointers.current.values()];
    if (!points.length) return null;
    return points.length === 1
      ? { ...points[0], distance: 0 }
      : {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
          distance: Math.hypot(
            points[0].x - points[1].x,
            points[0].y - points[1].y,
          ),
        };
  }
  function show() {
    current.current = { scale: 1, x: 0, y: 0 };
    setView(current.current);
    pointers.current.clear();
    gesture.current = null;
    hasOpened.current = true;
    setOpen(true);
  }
  function dismiss() {
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const panel = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.showModal();
    const motion =
      panel &&
      playMotion(
        panel,
        [
          { opacity: 0, transform: "scale(.97)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 200 },
      );
    const surface = canvas.current;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(
        current.current.scale * Math.exp(-event.deltaY * 0.003),
        event.clientX,
        event.clientY,
      );
    };
    surface?.addEventListener("wheel", wheel, { passive: false });
    return () => {
      motion?.cancel();
      panel?.close();
      document.body.style.overflow = previousOverflow;
      surface?.removeEventListener("wheel", wheel);
    };
  }, [open, zoomAt]);
  useEffect(() => {
    if (open || !hasOpened.current) return;
    // Browser/Next history restoration runs before returning focus to the thumbnail.
    let cancelled = false;
    let frame = 0;
    void waitForOverlayHistory().then(() => {
      if (cancelled) return;
      frame = requestAnimationFrame(() =>
        trigger.current?.focus({ preventScroll: true }),
      );
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [open]);
  return (
    <>
      <button
        ref={trigger}
        className="chat-image-thumbnail"
        type="button"
        aria-label={`Ampliar imagem: ${alt}`}
        onClick={show}
      >
        <img src={src} alt={alt} loading="lazy" />
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className="chat-image-viewer"
            aria-label="Visualização de imagem"
            onKeyDown={(event) => {
              if (
                [
                  "+",
                  "=",
                  "-",
                  "0",
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                ].includes(event.key)
              ) {
                event.preventDefault();
                if (event.key === "+" || event.key === "=")
                  zoomAt(current.current.scale + 0.5);
                else if (event.key === "-") zoomAt(current.current.scale - 0.5);
                else if (event.key === "0") update(1, 0, 0);
                else
                  update(
                    current.current.scale,
                    current.current.x +
                      (event.key === "ArrowLeft"
                        ? 60
                        : event.key === "ArrowRight"
                          ? -60
                          : 0),
                    current.current.y +
                      (event.key === "ArrowUp"
                        ? 60
                        : event.key === "ArrowDown"
                          ? -60
                          : 0),
                  );
              }
            }}
            onCancel={(event) => {
              event.preventDefault();
              dismiss();
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) dismiss();
            }}
          >
            <header>
              <span>{alt}</span>
              <button
                type="button"
                aria-label="Diminuir imagem"
                disabled={view.scale <= 1}
                onClick={() => zoomAt(current.current.scale - 0.5)}
              >
                <ZoomOut size={20} />
              </button>
              <button
                type="button"
                aria-label="Ampliar imagem aberta"
                disabled={view.scale >= 5}
                onClick={() => zoomAt(current.current.scale + 0.5)}
              >
                <ZoomIn size={20} />
              </button>
              <button
                type="button"
                aria-label="Restaurar tamanho da imagem"
                onClick={() => update(1, 0, 0)}
              >
                <RotateCcw size={19} />
              </button>
              <a href={src} download={alt} aria-label="Baixar imagem">
                <Download size={21} />
              </a>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Fechar imagem"
              >
                <X size={24} />
              </button>
            </header>
            <div
              ref={canvas}
              className="chat-image-canvas"
              data-zoomed={view.scale > 1}
              data-scale={view.scale.toFixed(2)}
              onDoubleClick={(event) =>
                zoomAt(
                  current.current.scale > 1 ? 1 : 2.5,
                  event.clientX,
                  event.clientY,
                )
              }
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                pointers.current.set(event.pointerId, {
                  x: event.clientX,
                  y: event.clientY,
                });
                gesture.current = gesturePosition();
              }}
              onPointerMove={(event) => {
                if (!pointers.current.has(event.pointerId)) return;
                pointers.current.set(event.pointerId, {
                  x: event.clientX,
                  y: event.clientY,
                });
                const next = gesturePosition(),
                  prev = gesture.current;
                if (next && prev) {
                  if (next.distance && prev.distance)
                    zoomAt(
                      (current.current.scale * next.distance) / prev.distance,
                      next.x,
                      next.y,
                    );
                  update(
                    current.current.scale,
                    current.current.x + next.x - prev.x,
                    current.current.y + next.y - prev.y,
                  );
                }
                gesture.current = next;
              }}
              onPointerUp={(event) => {
                pointers.current.delete(event.pointerId);
                gesture.current = gesturePosition();
              }}
              onPointerCancel={(event) => {
                pointers.current.delete(event.pointerId);
                gesture.current = gesturePosition();
              }}
            >
              <img
                ref={picture}
                src={src}
                alt={alt}
                draggable={false}
                style={{
                  transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`,
                }}
              />
            </div>
            <p>
              <span className="image-zoom-label">
                {Math.round(view.scale * 100)}%
              </span>{" "}
              · Pinça ou rolagem para ampliar · Esc ou Voltar para fechar
            </p>
          </dialog>,
          document.body,
        )}
    </>
  );
}
