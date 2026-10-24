"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
const Film = dynamic(() => import("./motion/transfer-player"), { ssr: false });
export function DownloadLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  return (
    <>
      <a href={href} className={className} onClick={() => setOpen(true)}>
        {children}
      </a>
      {open && (
        <dialog
          ref={dialog}
          className="download-progress-dialog"
          aria-label="Download do Enturma"
          onCancel={() => setOpen(false)}
        >
          <header>
            <h2>Leve sua turma com você</h2>
            <button
              type="button"
              className="icon-control"
              aria-label="Fechar download"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </header>
          <Film mode="download" />
          <p>
            O download foi solicitado ao navegador. Acompanhe o progresso na
            lista de downloads e abra o instalador quando terminar.
          </p>
          <div className="actions">
            <button onClick={() => setOpen(false)}>Continuar navegando</button>
            <a href={href} className="button secondary">
              Baixar novamente
            </a>
          </div>
        </dialog>
      )}
    </>
  );
}
