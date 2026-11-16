"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { EnturmaAppIcon } from "./enturma-app-icon";
import { playMotion } from "@/lib/motion";
import { RELEASE_NOTES, RELEASE_NOTES_DATE } from "@/lib/release-notes";
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
/** The current release notes, grouped by area. */
export function ReleaseNotesList() {
  return (
    <div className="release-notes-list">
      {RELEASE_NOTES.map((group) => (
        <section key={group.area}>
          <h3>{group.area}</h3>
          <ul>
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function DesktopReleaseNotes({
  version,
  storageKey = "enturma-desktop-seen-version",
}: {
  version: string;
  storageKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!/^\d+\.\d+\.\d+$/.test(version)) return;
    const timer = setTimeout(() => {
      try {
        const previous = localStorage.getItem(storageKey);
        localStorage.setItem(storageKey, version);
        if (previous && versionIncreased(previous, version)) setOpen(true);
      } catch {
        /* Storage disabled: avoid repeating a release announcement. */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [version, storageKey]);
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
      <p>
        Versão {version} instalada. Veja o que chegou desde a última
        atualização ({RELEASE_NOTES_DATE}).
      </p>
      <TransferFilm mode="update" progress={100} />
      <ReleaseNotesList />
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
