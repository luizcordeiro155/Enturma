"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, ShieldAlert, X } from "lucide-react";
import { splitLinks } from "@/lib/forum-links";
export function ForumLinks({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        part.href ? (
          <ConfirmedLink key={i} href={part.href} label={part.text} />
        ) : (
          part.text
        ),
      )}
    </>
  );
}
function ConfirmedLink({ href, label }: { href: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a
        href={href}
        onClick={(e) => {
          const url = new URL(href);
          if (url.origin === location.origin) return;
          e.preventDefault();
          setOpen(true);
        }}
        onAuxClick={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {label}
      </a>
      {open ? (
        <ExternalConfirmation href={href} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
function ExternalConfirmation({
  href,
  onClose,
}: {
  href: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const el = ref.current!,
      previous = document.activeElement as HTMLElement | null;
    el.showModal();
    let animation: Animation | undefined;
    if (
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      document.documentElement.dataset.reducedMotion !== "true"
    )
      animation = el.animate(
        [
          { opacity: 0, transform: "translateY(16px) scale(.97)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 230, easing: "ease-out" },
      );
    return () => {
      animation?.cancel();
      el.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="external-link-dialog"
      ref={ref}
      aria-labelledby="external-link-title"
      onCancel={onClose}
    >
      <header>
        <ShieldAlert size={27} />
        <h2 id="external-link-title">Você está saindo do Enturma</h2>
        <button
          className="icon-control"
          aria-label="Fechar aviso de link"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </header>
      <p>
        Este link foi compartilhado por um usuário e leva a uma página externa,
        não oficial do Enturma. Confira o endereço antes de continuar.
      </p>
      <div className="external-destination">
        <strong>{new URL(href).hostname}</strong>
        <span>{href}</span>
      </div>
      <label className="external-consent">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>Entendo que vou acessar um site externo e aceito continuar.</span>
      </label>
      <div className="actions">
        <button className="secondary" onClick={onClose}>
          Ficar no Enturma
        </button>
        <button
          disabled={!accepted}
          onClick={() => {
            if (accepted) {
              window.open(href, "_blank", "noopener,noreferrer");
              onClose();
            }
          }}
        >
          Abrir link <ExternalLink size={16} />
        </button>
      </div>
    </dialog>
  );
}
