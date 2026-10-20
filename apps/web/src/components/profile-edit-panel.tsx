"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import { profileEntrance } from "./profile-motion";
import { useOverlayHistory } from "@/lib/use-overlay-history";

/** Each editor keeps the parent's live draft; cancel restores its opening snapshot. */
export function ProfileEditPanel({
  title,
  description,
  thumbnail,
  preview,
  children,
  onBegin,
  onCancel,
}: {
  title: string;
  description: string;
  thumbnail?: ReactNode;
  preview: ReactNode;
  children: ReactNode;
  onBegin: () => void;
  onCancel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const id = useId();
  async function close(cancel = false) {
    if (closing.current) return;
    closing.current = true;
    if (cancel) onCancel();
    try {
      await (dialog.current
        ? profileEntrance(dialog.current, true)?.finished
        : undefined);
    } catch {}
    dialog.current?.close();
    setOpen(false);
    closing.current = false;
    trigger.current?.focus({ preventScroll: true });
  }
  useOverlayHistory(() => void close(true), open);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const node = dialog.current;
    node.showModal();
    const animation = profileEntrance(node);
    return () => {
      animation?.cancel();
      node.close();
    };
  }, [open]);
  return (
    <>
      <button
        type="button"
        ref={trigger}
        className="profile-edit-launch"
        aria-haspopup="dialog"
        onClick={() => {
          onBegin();
          setOpen(true);
        }}
      >
        {thumbnail && (
          <span className="profile-edit-thumbnail">{thumbnail}</span>
        )}
        <span>
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
        <ChevronRight size={18} />
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className="profile-edit-dialog"
            aria-labelledby={id}
            onCancel={(event) => {
              event.preventDefault();
              void close(true);
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                const rect = event.currentTarget.getBoundingClientRect();
                if (
                  event.clientX < rect.left ||
                  event.clientX > rect.right ||
                  event.clientY < rect.top ||
                  event.clientY > rect.bottom
                )
                  void close(true);
              }
            }}
          >
            <header>
              <div>
                <small>PERSONALIZAR PERFIL</small>
                <h2 id={id}>{title}</h2>
              </div>
              <button
                type="button"
                className="icon-control"
                aria-label="Cancelar edição"
                onClick={() => void close(true)}
              >
                <X />
              </button>
            </header>
            <div className="profile-edit-dialog-body">
              <div className="profile-edit-fields">{children}</div>
              <aside
                className="profile-edit-live-preview"
                aria-label="Prévia desta edição"
              >
                <span>PRÉVIA AO VIVO</span>
                {preview}
              </aside>
            </div>
            <footer>
              <small>As alterações são publicadas ao salvar o perfil.</small>
              <button
                type="button"
                className="button secondary"
                onClick={() => void close(true)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button"
                onClick={() => {
                  const invalid =
                    dialog.current?.querySelector<HTMLInputElement>(
                      "input:invalid, textarea:invalid",
                    );
                  if (invalid) {
                    invalid.reportValidity();
                    return;
                  }
                  void close();
                }}
              >
                Aplicar
              </button>
            </footer>
          </dialog>,
          document.body,
        )}
    </>
  );
}
