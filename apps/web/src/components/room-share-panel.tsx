"use client";
/* eslint-disable @next/next/no-img-element -- same-origin authenticated room QR */

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Search, Send, Users, X } from "lucide-react";
import { api, post } from "@/lib/api";
import { playMotion } from "@/lib/motion";
import { type RoomInvitation } from "@/lib/room-invite";
import { prepareRoomInvitation } from "@/lib/send-room-invitation";
import {
  useOverlayHistory,
  waitForOverlayHistory,
} from "@/lib/use-overlay-history";
import { isDesktop, isMobileApp } from "./desktop-updates";
import { Avatar, type PublicProfile } from "./user-identity";
import { RoomArtwork } from "./room-artwork";

type Friend = PublicProfile & {
  userId: string;
  status: string;
  online?: boolean;
};
type Share = { code: string; url: string };

function ShareDialog({
  roomId,
  onClose,
}: {
  roomId: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const searchId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [share, setShare] = useState<Share>();
  const [room, setRoom] = useState<RoomInvitation>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState<string>();
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const busy = useRef(false);
  // Retain encrypted payloads across retries: an uncertain response cannot duplicate a message.
  const pending = useRef(
    new Map<string, Awaited<ReturnType<typeof prepareRoomInvitation>>>(),
  );
  const alive = useRef(true);
  const nativeApp = isDesktop() || isMobileApp();
  useOverlayHistory(onClose);

  useEffect(() => {
    alive.current = true;
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const animation = playMotion(
      element,
      [
        { opacity: 0, transform: "translateY(20px) scale(.97)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 300 },
    );
    return () => {
      alive.current = false;
      animation?.cancel();
      element.close();
      void waitForOverlayHistory().then(() =>
        previous?.focus({ preventScroll: true }),
      );
    };
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      post<Share>(`/study-rooms/${roomId}/share-code`),
      api<Friend[]>("/friends", { cache: "no-store" }),
    ])
      .then(async ([invitation, people]) => {
        if (!active) return;
        setShare(invitation);
        setFriends(people.filter((friend) => friend.status === "ACCEPTED"));
        const preview = await api<RoomInvitation>(
          `/study-rooms/join-code/${invitation.code}`,
        );
        if (active) setRoom(preview);
      })
      .catch((cause) => {
        if (active) setError((cause as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [roomId]);

  async function invite(friend: Friend) {
    if (busy.current || sent.has(friend.id) || !share) return;
    busy.current = true;
    setSending(friend.id);
    setError("");
    setStatus("");
    try {
      let payload = pending.current.get(friend.id);
      if (!payload) {
        payload = await prepareRoomInvitation(
          roomId,
          friend.id,
          crypto.randomUUID(),
        );
        pending.current.set(friend.id, payload);
      }
      // Existing API verifies accepted friendship, blocks and message rate limits.
      await post(`/friends/${friend.id}/messages`, payload);
      pending.current.delete(friend.id);
      if (alive.current) {
        setSent((previous) => new Set([...previous, friend.id]));
        setStatus(`Convite enviado para ${friend.name}.`);
      }
    } catch (cause) {
      if (alive.current)
        setError(
          (cause as { status?: number }).status === 404
            ? "A conversa ainda não está disponível. Peça ao seu amigo para abrir Amigos e tente novamente."
            : (cause as Error).message,
        );
    } finally {
      busy.current = false;
      if (alive.current) setSending(undefined);
    }
  }

  async function copy() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      if (alive.current) {
        setCopied(true);
        setStatus("Link copiado.");
      }
    } catch {
      if (alive.current)
        setError(
          "Não foi possível copiar. Selecione o link abaixo para copiá-lo.",
        );
    }
  }

  const search = query.trim().toLocaleLowerCase("pt-BR");
  const visible = friends.filter((friend) =>
    `${friend.name} ${friend.username ?? ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(search),
  );
  return (
    <dialog
      ref={dialog}
      className="room-invite-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="room-invite-dialog-content">
        <header className="room-invite-dialog-header">
          <div>
            <small>APRENDER FICA MELHOR JUNTO</small>
            <h2 id={titleId}>Convide sua turma</h2>
            <p>Envie o convite direto na conversa com seus amigos.</p>
          </div>
          <button
            type="button"
            className="icon-control"
            aria-label="Fechar convite"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {room && (
          <div className="room-invite-destination">
            <RoomArtwork room={room} />
            <div>
              <strong>{room.title}</strong>
              <span>{room.subjectName}</span>
            </div>
          </div>
        )}
        <div className="room-invite-friends">
          <label className="room-invite-search" htmlFor={searchId}>
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar amigos</span>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar amigos"
              autoComplete="off"
            />
          </label>
          <div
            className="room-invite-friends-list"
            aria-label="Seus amigos"
            aria-busy={loading}
          >
            {loading ? (
              <p className="room-invite-empty" role="status">
                Preparando seu convite…
              </p>
            ) : visible.length ? (
              visible.map((friend) => (
                <div className="room-invite-friend" key={friend.id}>
                  <Avatar user={{ ...friend, id: friend.userId }} />
                  <div>
                    <strong>{friend.name}</strong>
                    <small>
                      {friend.online ? (
                        <>
                          <i />
                          Disponível agora
                        </>
                      ) : (
                        `@${friend.username ?? "estudante"}`
                      )}
                    </small>
                  </div>
                  <button
                    type="button"
                    className={
                      sent.has(friend.id)
                        ? "secondary room-invite-sent"
                        : "secondary"
                    }
                    disabled={
                      Boolean(sending) ||
                      sent.has(friend.id) ||
                      !share ||
                      room?.available === false
                    }
                    onClick={() => void invite(friend)}
                    aria-label={`${sent.has(friend.id) ? "Convite enviado para" : "Convidar"} ${friend.name}`}
                  >
                    {sent.has(friend.id) ? (
                      <>
                        <Check size={16} />
                        Enviado
                      </>
                    ) : sending === friend.id ? (
                      "Enviando…"
                    ) : (
                      <>
                        <Send size={15} />
                        Convidar
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="room-invite-empty">
                <Users size={26} />
                <p>
                  {search
                    ? "Nenhum amigo com esse nome."
                    : "Seus amigos aparecerão aqui depois que a amizade for aceita."}
                </p>
              </div>
            )}
          </div>
        </div>
        {room?.available === false && (
          <p className="room-invite-feedback">Esta sala já foi encerrada.</p>
        )}
        {error && (
          <p
            className="room-invite-feedback room-invitation-error"
            role="alert"
          >
            {error}
          </p>
        )}
        <p className="room-invite-status" role="status" aria-live="polite">
          {status}
        </p>
        {share && (
          <footer className="room-invite-share-footer">
            <img
              src={`/api/backend/study-rooms/${roomId}/qr`}
              alt={`QR Code para entrar na sala ${share.code}`}
              width={76}
              height={76}
            />
            <div>
              <small>Ou use o código da sala</small>
              <strong className="room-invite-code">{share.code}</strong>
              <p>
                Convidados podem entrar mesmo com a turma completa ou já
                iniciada.
              </p>
            </div>
            {!nativeApp && (
              <div className="room-invite-web-link">
                <label className="sr-only" htmlFor={`${searchId}-url`}>
                  Link do convite
                </label>
                <input
                  id={`${searchId}-url`}
                  value={share.url}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void copy()}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copiado" : "Copiar link"}
                </button>
              </div>
            )}
          </footer>
        )}
      </div>
    </dialog>
  );
}

export function RoomSharePanel({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="room-share-control">
      <button
        type="button"
        className="secondary"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Users size={16} /> Compartilhar
      </button>
      {open &&
        createPortal(
          <ShareDialog roomId={roomId} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </div>
  );
}
