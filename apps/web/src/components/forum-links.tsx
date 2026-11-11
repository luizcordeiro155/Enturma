"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, ShieldAlert, X } from "lucide-react";
import { RoomJoinDialog } from "./room-join-dialog";
import { roomInviteCode } from "@/lib/room-invite";
import { internalEnturmaPath, splitLinks } from "@/lib/forum-links";
import { socialPath } from "@/lib/social";
import { useRouter } from "next/navigation";
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
export function ConfirmedLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [invitation, setInvitation] = useState<string | null>(null);
  return (
    <>
      <a
        href={href}
        className="message-link"
        onClick={(e) => {
          const social = socialPath(href, location.origin);
          if (social) {
            e.preventDefault();
            e.stopPropagation();
            router.push(social);
            return;
          }
          const code = roomInviteCode(href, location.origin);
          if (code) {
            e.preventDefault();
            e.stopPropagation();
            setInvitation(code);
            return;
          }
          const path = internalEnturmaPath(href, location.origin);
          if (path !== null) {
            // The official Enturma URL may have a different origin in a local
            // or preview installation. Keep it in this app window.
            if (
              new URL(href, location.origin).origin !== location.origin ||
              e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
            ) {
              e.preventDefault();
              location.assign(path);
            }
            return;
          }
          e.preventDefault();
          setOpen(true);
        }}
        onAuxClick={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            const code = roomInviteCode(href, location.origin);
            if (code) {
              setInvitation(code);
              return;
            }
            const path = internalEnturmaPath(href, location.origin);
            if (path !== null) location.assign(path);
            else setOpen(true);
          }
        }}
      >
        {label}
      </a>
      {invitation && (
        <RoomJoinDialog code={invitation} onClose={() => setInvitation(null)} />
      )}
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
  const [openingError, setOpeningError] = useState("");
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
  // The profile popover listens for outside pointerdown and Escape on document.
  // Portaled dialog interactions must not dismiss the parent profile.
  return createPortal(
    <dialog
      className="external-link-dialog"
      ref={ref}
      aria-labelledby="external-link-title"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.stopPropagation();
      }}
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
      {openingError ? <p role="alert">{openingError}</p> : null}
      <div className="actions">
        <button type="button" className="secondary" onClick={onClose}>
          Ficar no Enturma
        </button>
        <button
          type="button"
          disabled={!accepted}
          onClick={() => {
            if (!accepted) return;
            setOpeningError("");
            const url = new URL(href);
            if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
              setOpeningError("Este endereço não é permitido.");
              return;
            }
            // Electron owns system-browser navigation. Android WebView blocks
            // target=_blank, so same-window navigation is intercepted natively.
            if (window.enturmaDesktop?.openExternal) {
              void window.enturmaDesktop.openExternal(url.href).then(
                () => onClose(),
                () => setOpeningError("Não foi possível abrir o link externo."),
              );
              return;
            }
            if (/EnturmaMobile\//.test(navigator.userAgent)) {
              window.location.assign(url.href);
              onClose();
              return;
            }
            window.open(url.href, "_blank", "noopener,noreferrer");
            onClose();
          }}
        >
          Abrir link <ExternalLink size={16} />
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
