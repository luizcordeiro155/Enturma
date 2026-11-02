"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { LogIn, X } from "lucide-react";
import { api, post } from "@/lib/api";
import { playMotion } from "@/lib/motion";
import type { RoomInvitation } from "@/lib/room-invite";
import { RoomArtwork } from "./room-artwork";

export function RoomJoinDialog({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const title = useId();
  const router = useRouter();
  const [room, setRoom] = useState<RoomInvitation>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const joining = useRef(false);
  useEffect(() => {
    let active = true;
    const previous = document.activeElement as HTMLElement | null;
    const element = ref.current!;
    element.showModal();
    const animation = playMotion(element, [
      { opacity: 0, transform: "translateY(16px) scale(.97)" },
      { opacity: 1, transform: "none" },
    ]);
    void api<RoomInvitation>(`/study-rooms/join-code/${code}`, {
      cache: "no-store",
    })
      .then((value) => {
        if (active) setRoom(value);
      })
      .catch(() => {
        if (active)
          setError(
            "Este convite não está disponível. Confira o código ou peça um novo convite.",
          );
      });
    return () => {
      active = false;
      animation?.cancel();
      element.close();
      previous?.focus({ preventScroll: true });
    };
  }, [code]);
  async function join() {
    if (!room?.available || joining.current) return;
    joining.current = true;
    setBusy(true);
    setError("");
    try {
      const joined = await post<{ id: string }>(
        `/study-rooms/join-code/${code}/join`,
      );
      onClose();
      router.push(`/rooms/${joined.id}`);
    } catch (cause) {
      setError((cause as Error).message);
      joining.current = false;
      setBusy(false);
    }
  }
  return createPortal(
    <dialog
      ref={ref}
      className="room-invite-dialog room-join-dialog"
      aria-labelledby={title}
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <header className="room-invite-dialog-header">
        <div>
          <small>UM CONVITE PARA APRENDER JUNTO</small>
          <h2 id={title}>Entrar nesta turma?</h2>
          <p>Você decide se quer participar da sala.</p>
        </div>
        <button
          type="button"
          className="icon-control"
          aria-label="Fechar convite"
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {room ? (
        <div className="room-invite-destination">
          <RoomArtwork room={room} />
          <div>
            <strong>{room.title}</strong>
            <span>
              {room.subjectName} · {room.participantCount} participantes
            </span>
          </div>
        </div>
      ) : (
        !error && (
          <p className="room-invite-feedback" role="status">
            Carregando convite…
          </p>
        )
      )}
      {room && !room.available && (
        <p className="room-invite-feedback">Esta sala já foi encerrada.</p>
      )}
      {error && (
        <p className="room-invite-feedback room-invitation-error" role="alert">
          {error}
        </p>
      )}
      <footer className="room-join-actions">
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onClose}
        >
          Agora não
        </button>
        <button
          type="button"
          disabled={!room?.available || busy}
          onClick={() => void join()}
        >
          <LogIn size={18} />
          {busy ? "Entrando…" : "Aceitar e entrar"}
        </button>
      </footer>
    </dialog>,
    document.body,
  );
}
