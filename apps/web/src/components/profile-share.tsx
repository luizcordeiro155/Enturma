"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Search, Send, Share2, Users, X } from "lucide-react";
import { api, post } from "@/lib/api";
import { playMotion } from "@/lib/motion";
import { preparePrivateShare } from "@/lib/send-room-invitation";
import { socialLink } from "@/lib/social";
import {
  useOverlayHistory,
  waitForOverlayHistory,
} from "@/lib/use-overlay-history";
import { Avatar, type PublicProfile } from "./user-identity";
import "./profile-share.css";

type Friend = PublicProfile & {
  userId: string;
  status: string;
  online?: boolean;
};

/**
 * Sends a profile to friends the same way a room invitation goes: straight into the
 * private conversation, sealed like any message, with the link left for everywhere else.
 */
function ProfileShareDialog({
  person,
  onClose,
}: {
  person: PublicProfile;
  onClose: () => void;
}) {
  const titleId = useId(),
    searchId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState<string>();
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const busy = useRef(false);
  // A sealed message is kept across retries, so an uncertain answer never sends it twice.
  const pending = useRef(
    new Map<string, Awaited<ReturnType<typeof preparePrivateShare>>>(),
  );
  const alive = useRef(true);
  const link = socialLink("person", person.id);
  useOverlayHistory(onClose);

  useEffect(() => {
    alive.current = true;
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const viewport = window.visualViewport;
    const fit = () =>
      element.style.setProperty(
        "--invite-viewport",
        `${viewport?.height ?? window.innerHeight}px`,
      );
    fit();
    viewport?.addEventListener("resize", fit);
    const animation = playMotion(
      element,
      [
        { opacity: 0, transform: "translateY(22px) scale(.97)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 300 },
    );
    return () => {
      alive.current = false;
      animation?.cancel();
      viewport?.removeEventListener("resize", fit);
      element.close();
      void waitForOverlayHistory().then(() =>
        previous?.focus({ preventScroll: true }),
      );
    };
  }, []);

  useEffect(() => {
    let active = true;
    api<Friend[]>("/friends", { cache: "no-store" })
      .then((people) => {
        if (active)
          setFriends(
            people.filter(
              (friend) =>
                friend.status === "ACCEPTED" && friend.userId !== person.id,
            ),
          );
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
  }, [person.id]);

  async function send(friend: Friend) {
    if (busy.current || sent.has(friend.id)) return;
    busy.current = true;
    setSending(friend.id);
    setError("");
    setStatus("");
    try {
      let payload = pending.current.get(friend.id);
      if (!payload) {
        payload = await preparePrivateShare(
          friend.id,
          link,
          crypto.randomUUID(),
        );
        pending.current.set(friend.id, payload);
      }
      // The messages API checks the friendship, blocks and how fast messages go.
      await post(`/friends/${friend.id}/messages`, payload);
      pending.current.delete(friend.id);
      if (alive.current) {
        setSent((previous) => new Set([...previous, friend.id]));
        setStatus(`Perfil enviado para ${friend.name}.`);
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
    try {
      await navigator.clipboard.writeText(link);
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

  async function shareOutside() {
    try {
      if (navigator.share)
        await navigator.share({
          title: `${person.name} no Enturma`,
          text: `Veja o perfil de ${person.name} no Enturma`,
          url: link,
        });
      else await copy();
    } catch (cause) {
      if ((cause as Error).name !== "AbortError")
        setError(
          "Não foi possível abrir o compartilhamento. Você ainda pode copiar o link.",
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
      className="room-invite-dialog profile-share-dialog"
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
            <small>PERFIL NO ENTURMA</small>
            <h2 id={titleId}>Compartilhar perfil</h2>
            <p>Envie este perfil direto na conversa com seus amigos.</p>
          </div>
          <button
            type="button"
            className="icon-control"
            aria-label="Fechar compartilhamento"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="profile-share-person">
          <Avatar user={person} />
          <div>
            <strong>{person.name}</strong>
            {person.username ? <span>@{person.username}</span> : null}
          </div>
        </div>
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
                Buscando seus amigos…
              </p>
            ) : visible.length ? (
              visible.map((friend, index) => (
                <div
                  className="room-invite-friend"
                  key={friend.id}
                  style={{ "--row": Math.min(index, 8) } as React.CSSProperties}
                >
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
                    disabled={Boolean(sending) || sent.has(friend.id)}
                    onClick={() => void send(friend)}
                    aria-label={`${sent.has(friend.id) ? "Perfil enviado para" : "Enviar para"} ${friend.name}`}
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
                        Enviar
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
        <footer className="room-invite-share-footer profile-share-footer">
          <div className="room-invite-web-link">
            <label className="sr-only" htmlFor={`${searchId}-url`}>
              Link do perfil
            </label>
            <input
              id={`${searchId}-url`}
              value={link}
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
          <div className="room-invite-share-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => void shareOutside()}
            >
              <Share2 size={16} /> Compartilhar em outro app
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}

/** The share icon of a profile: opens the sheet that sends it to friends. */
export function ProfileShareButton({ person }: { person: PublicProfile }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="icon-control"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Compartilhar perfil"
        onClick={() => setOpen(true)}
      >
        <Share2 />
      </button>
      {open &&
        createPortal(
          <ProfileShareDialog person={person} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}
