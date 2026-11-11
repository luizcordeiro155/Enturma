"use client";
import dynamic from "next/dynamic";
import { Aperture } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { reducedMotion } from "@/lib/motion";
import { useAppShellState } from "../app-shell-state";

const SocialOpeningPlayer = dynamic(
  () => import("../motion/social-opening-player"),
  {
    ssr: false,
    loading: () => <Aperture size={72} aria-hidden="true" />,
  },
);

export function SocialOpening() {
  const { claimSocialOpening } = useAppShellState();
  const [visible, setVisible] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const animation = useRef<Animation | undefined>(undefined);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = dialog.current;
    if (!el || reducedMotion() || !el.animate) {
      setVisible(false);
      return;
    }
    animation.current = el.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(1.025)" },
      ],
      { duration: 280, easing: "ease-out", fill: "forwards" },
    );
    void animation.current.finished
      .then(() => {
        el.style.opacity = "0";
        setVisible(false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (claimSocialOpening() && !reducedMotion()) setVisible(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [claimSocialOpening]);
  useEffect(() => {
    if (!visible) return;
    const el = dialog.current!;
    el.showModal();
    // Loading or decoding an animation must never block access to the Social.
    const fallback = setTimeout(close, 6000);
    return () => {
      clearTimeout(fallback);
      animation.current?.cancel();
      el.close();
    };
  }, [visible, close]);

  if (!visible) return null;
  return (
    <dialog
      ref={dialog}
      className="social-opening"
      aria-label="Bem-vindo ao Enturma Social"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="social-opening-art" aria-hidden="true">
        <SocialOpeningPlayer ended={close} />
      </div>
      <h2>
        Enturma Social<span>.</span>
      </h2>
      <p>
        Uma ideia vira conversa.
        <br />
        Uma turma abre possibilidades.
      </p>
      <button type="button" className="button" onClick={close}>
        Explorar o Social
      </button>
    </dialog>
  );
}
