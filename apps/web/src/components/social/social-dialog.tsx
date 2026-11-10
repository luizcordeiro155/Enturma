"use client";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { playMotion } from "@/lib/motion";
import {
  useOverlayHistory,
  waitForOverlayHistory,
} from "@/lib/use-overlay-history";
export function SocialDialog({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  const latest = useRef(close);
  useEffect(() => {
    latest.current = close;
  }, [close]);
  useOverlayHistory(() => latest.current());
  useEffect(() => {
    const element = ref.current!,
      prior = document.activeElement as HTMLElement;
    element.showModal();
    document.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
      if (!element.contains(video)) video.pause();
    });
    const viewport = window.visualViewport;
    const fit = () =>
      element.style.setProperty(
        "--social-viewport",
        `${viewport?.height ?? innerHeight}px`,
      );
    fit();
    viewport?.addEventListener("resize", fit);
    const animation = playMotion(element, [
      { opacity: 0, transform: "translateY(18px) scale(.98)" },
      { opacity: 1, transform: "none" },
    ]);
    return () => {
      animation?.cancel();
      viewport?.removeEventListener("resize", fit);
      element.close();
      void waitForOverlayHistory().then(() =>
        prior?.focus({ preventScroll: true }),
      );
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`social-dialog ${wide ? "social-dialog-wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button className="icon-control" aria-label="Fechar" onClick={close}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>,
    document.body,
  );
}
