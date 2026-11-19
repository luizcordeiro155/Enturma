"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock3, Send } from "lucide-react";
import { api, post } from "@/lib/api";
import { useRideUpdates } from "@/lib/use-ride-updates";

export type RideMessage = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  name: string;
};
export type RideChatPeer = {
  id: string;
  name: string;
  hasAvatar?: boolean;
  detail?: string;
};

const QUICK_REPLIES = [
  "Estou a caminho",
  "Cheguei",
  "Onde você está?",
  "Só um minuto",
];
const seenKey = (match: string) => `enturma-ride-chat-seen:${match}`;
function storedSeen(match?: string) {
  try {
    return (match && sessionStorage.getItem(seenKey(match))) || "";
  } catch {
    return "";
  }
}

/**
 * The temporary conversation of one ride: it follows the ride's live updates,
 * knows what is still unread while the chat is closed, and ends with the ride.
 */
export function useRideConversation(
  matchId: string | undefined,
  me: string,
  open: boolean,
) {
  const [loaded, setLoaded] = useState<{
    match?: string;
    messages: RideMessage[];
  }>({ messages: [] });
  const [seen, setSeen] = useState(() => ({
    match: matchId,
    id: storedSeen(matchId),
  }));
  const [error, setError] = useState("");
  const [closedFor, setClosedFor] = useState<string>();
  const messages = loaded.match === matchId ? loaded.messages : [];
  const last = messages.at(-1)?.id ?? "";

  // Another ride is another conversation, with its own read mark.
  if (seen.match !== matchId)
    setSeen({ match: matchId, id: storedSeen(matchId) });
  // With the chat on screen, everything that arrives is read.
  else if (open && last && seen.id !== last)
    setSeen({ match: matchId, id: last });

  useEffect(() => {
    if (!seen.match || !seen.id) return;
    try {
      sessionStorage.setItem(seenKey(seen.match), seen.id);
    } catch {
      // Private mode: the read mark simply lasts for this visit.
    }
  }, [seen]);

  const refresh = useCallback(async () => {
    if (!matchId) return;
    try {
      // The API answers newest first; the screen reads oldest first.
      const page = await api<RideMessage[]>(`/matches/${matchId}/messages`, {
        cache: "no-store",
      });
      setLoaded({ match: matchId, messages: [...page].reverse() });
      setError("");
    } catch (failure) {
      setError((failure as Error).message);
    }
  }, [matchId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useRideUpdates(refresh, !!matchId);

  const send = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!matchId || !body) return;
      try {
        await post(`/matches/${matchId}/messages`, { body });
        await refresh();
      } catch (failure) {
        const message = (failure as Error).message;
        if (/encerrad/i.test(message)) setClosedFor(matchId);
        setError(message);
      }
    },
    [matchId, refresh],
  );

  const readUpTo = messages.findIndex((message) => message.id === seen.id);
  const unread = open
    ? 0
    : messages.filter((message, i) => i > readUpTo && message.userId !== me)
        .length;
  return {
    messages,
    unread,
    error,
    closed: !!matchId && closedFor === matchId,
    send,
  };
}

const clock = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

/** The chat panel shown over the ride sheet while a ride is active. */
export function RideChat({
  me,
  peer,
  messages,
  closed,
  error,
  send,
  onClose,
}: {
  me: string;
  peer: RideChatPeer;
  messages: RideMessage[];
  closed: boolean;
  error: string;
  send: (body: string) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const node = list.current;
    node?.scrollTo?.({ top: node.scrollHeight });
  }, [messages.length]);

  async function deliver(body: string, fromField: boolean) {
    if (busy || !body.trim()) return;
    setBusy(true);
    try {
      await send(body);
      if (fromField) setDraft("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="ride-chat"
      role="dialog"
      aria-label={`Conversa com ${peer.name}`}
    >
      <header className="ride-chat-head">
        <button
          type="button"
          className="ride-circle-button"
          aria-label="Voltar à corrida"
          onClick={onClose}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="ride-person-avatar" aria-hidden="true">
          {peer.hasAvatar ? (
            <img src={`/api/backend/users/${peer.id}/avatar`} alt="" />
          ) : (
            peer.name.slice(0, 2).toUpperCase()
          )}
        </span>
        <div>
          <strong>{peer.name}</strong>
          {peer.detail ? <small>{peer.detail}</small> : null}
        </div>
      </header>
      <ol className="ride-chat-messages" ref={list} aria-live="polite">
        <li className="ride-chat-note">
          <Clock3 size={15} aria-hidden="true" />
          <span>
            Esta conversa só existe durante a corrida. Quando a corrida
            terminar, ela é encerrada e o histórico é apagado em até 24 horas.
          </span>
        </li>
        {messages.map((message) => (
          <li
            key={message.id}
            className="ride-chat-message"
            data-mine={message.userId === me}
          >
            <p>{message.body}</p>
            <time dateTime={message.createdAt}>{clock(message.createdAt)}</time>
          </li>
        ))}
      </ol>
      {closed ? (
        <p className="ride-chat-closed" role="status">
          Conversa encerrada: a corrida terminou.
        </p>
      ) : (
        <>
          {error ? (
            <p className="ride-chat-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="ride-chat-quick" aria-label="Respostas rápidas">
            {QUICK_REPLIES.map((reply) => (
              <button
                type="button"
                key={reply}
                disabled={busy}
                onClick={() => void deliver(reply, false)}
              >
                {reply}
              </button>
            ))}
          </div>
          <form
            className="ride-chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void deliver(draft, true);
            }}
          >
            <input
              aria-label="Mensagem"
              value={draft}
              maxLength={2000}
              autoComplete="off"
              enterKeyHint="send"
              placeholder={`Mensagem para ${peer.name.split(" ")[0]}`}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="submit"
              aria-label="Enviar mensagem"
              disabled={busy || !draft.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </section>
  );
}
