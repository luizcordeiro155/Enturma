"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { EnturmaAppIcon } from "./enturma-app-icon";
import { playMotion } from "@/lib/motion";
const TransferFilm = dynamic(() => import("./motion/transfer-player"), {
  ssr: false,
});

/** Only a confirmed native version increase may announce an installed update. */
export function versionIncreased(previous: string, current: string) {
  if (!/^\d+\.\d+\.\d+$/.test(previous) || !/^\d+\.\d+\.\d+$/.test(current))
    return false;
  const left = previous.split(".").map(Number),
    right = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (right[i] !== left[i]) return right[i] > left[i];
  }
  return false;
}
export function DesktopReleaseNotes({ version }: { version: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    window.enturmaDesktop
      ?.getInfo()
      .then((info) => {
        if (
          active &&
          info.version === version &&
          Array.isArray(info.releaseNotes)
        )
          setNotes(
            info.releaseNotes
              .filter((note): note is string => typeof note === "string")
              .slice(0, 8),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [version]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!/^\d+\.\d+\.\d+$/.test(version)) return;
    const timer = setTimeout(() => {
      try {
        const previous = localStorage.getItem("enturma-desktop-seen-version");
        localStorage.setItem("enturma-desktop-seen-version", version);
        if (previous && versionIncreased(previous, version)) setOpen(true);
      } catch {
        /* Storage disabled: avoid repeating a release announcement. */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [version]);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    element.showModal();
    const animation = playMotion(element, [
      { opacity: 0.5, transform: "translateY(18px)" },
      { opacity: 1, transform: "none" },
    ]);
    return () => {
      animation?.cancel();
      element.close();
    };
  }, [open]);
  return open ? (
    <dialog
      ref={dialog}
      className="release-dialog"
      aria-labelledby="release-title"
      onCancel={() => setOpen(false)}
    >
      <header>
        <EnturmaAppIcon size={42} />
        <button
          className="icon-control"
          aria-label="Fechar novidades"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
      </header>
      <h2 id="release-title">Enturma atualizado.</h2>
      <p>Versão instalada: {version}. Seu espaço de estudo continua aqui.</p>
      <TransferFilm mode="update" progress={100} />
      {notes.length > 0 ? (
        <ul>
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : (
        <p>
          Consulte as notas desta versão para conhecer as mudanças e correções.
        </p>
      )}
      <a
        className="auth-action-link"
        href={`https://github.com/luizcordeiro155/Enturma/releases`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Ver notas oficiais da atualização
      </a>
      <button className="button wide" onClick={() => setOpen(false)}>
        Continuar estudando
      </button>
    </dialog>
  ) : null;
}
