"use client";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { socialKeyboardGeometry } from "@/lib/social-viewport";
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
  variant,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  wide?: boolean;
  variant?: "sheet" | "panel" | "story" | "profile" | "viewer" | "explore";
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  const latest = useRef(close);
  useEffect(() => {
    latest.current = close;
  }, [close]);
  useOverlayHistory(() => latest.current());
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const prior = document.activeElement as HTMLElement | null;
    element.showModal();
    document.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
      if (!element.contains(video) && !video.closest(".social-live-tracks"))
        video.pause();
    });
    window.dispatchEvent(new Event("enturma-social-overlay-changed"));
    const viewport = window.visualViewport;
    const fit = () => {
      const root = document.documentElement;
      const overlay =
        (
          navigator as Navigator & {
            virtualKeyboard?: { boundingRect: DOMRect };
          }
        ).virtualKeyboard?.boundingRect.height ?? 0;
      const geometry = socialKeyboardGeometry({
        height: window.innerHeight,
        visibleHeight: viewport?.height ?? window.innerHeight,
        top: viewport?.offsetTop ?? 0,
        scale: viewport?.scale ?? 1,
        native:
          parseFloat(
            getComputedStyle(root).getPropertyValue("--native-keyboard-bottom"),
          ) || 0,
        overlay,
      });
      element.style.setProperty("--social-viewport", `${geometry.height}px`);
      element.style.setProperty("--social-viewport-top", `${geometry.top}px`);
      element.style.setProperty(
        "--social-keyboard-bottom",
        `${geometry.bottom}px`,
      );
    };
    fit();
    viewport?.addEventListener("resize", fit);
    viewport?.addEventListener("scroll", fit);
    window.addEventListener("resize", fit);
    window.addEventListener("enturma-social-viewport", fit);
    const animation = playMotion(element, [
      {
        opacity: 0,
        transform: matchMedia("(max-width:760px)").matches
          ? "translateY(60px)"
          : "translateX(22px)",
      },
      { opacity: 1, transform: "none" },
    ]);
    return () => {
      animation?.cancel();
      viewport?.removeEventListener("resize", fit);
      viewport?.removeEventListener("scroll", fit);
      window.removeEventListener("resize", fit);
      window.removeEventListener("enturma-social-viewport", fit);
      element.close();
      window.dispatchEvent(new Event("enturma-social-overlay-changed"));
      void waitForOverlayHistory().then(() => {
        if (prior?.isConnected) prior.focus({ preventScroll: true });
      });
    };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`social-dialog ${wide ? "social-dialog-wide" : ""} ${variant ? `social-dialog-${variant}` : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          close();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button
          type="button"
          className="icon-control"
          aria-label="Fechar"
          onClick={close}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>,
    document.body,
  );
}
