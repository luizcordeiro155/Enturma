"use client";
/* eslint-disable @next/next/no-img-element -- authenticated or decrypted blob attachments */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";
import { playMotion } from "@/lib/motion";

export function ChatImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const marker = useRef("");
  function show() {
    marker.current = crypto.randomUUID();
    history.pushState(
      { ...history.state, enturmaImage: marker.current },
      "",
      location.href,
    );
    setOpen(true);
  }
  function dismiss() {
    if (history.state?.enturmaImage === marker.current) history.back();
    else setOpen(false);
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
    const back = () => setOpen(false);
    window.addEventListener("popstate", back);
    return () => {
      motion?.cancel();
      panel?.close();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("popstate", back);
    };
  }, [open]);
  useEffect(() => {
    if (open || !marker.current) return;
    // Browser/Next history restoration runs before returning focus to the thumbnail.
    const frame = requestAnimationFrame(() =>
      trigger.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
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
            <div className="chat-image-canvas">
              <img src={src} alt={alt} />
            </div>
            <p>Esc ou Voltar para fechar</p>
          </dialog>,
          document.body,
        )}
    </>
  );
}
