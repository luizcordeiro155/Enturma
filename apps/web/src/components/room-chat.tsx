"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Message, Profile, RoomSystemEvent } from "@enturma/contracts";
import {
  BookOpen,
  Pencil,
  Hash,
  ImagePlus,
  Loader2,
  Send,
  Smile,
  Reply,
  Trash2,
  X,
} from "lucide-react";
import { UserIdentity } from "./user-identity";
import { ConversationNotice, useNotificationTarget } from "./notifications";
import { api } from "@/lib/api";

import { RichMessage } from "./rich-message";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🤔", "👏", "✅", "💡"];

type Props = {
  typing?: { id: string; name: string }[];
  systemEvents?: RoomSystemEvent[];
  roomId: string;
  ended: boolean;
  connected: boolean;
  messages: Message[];
  me?: Profile;
  hasOlder: boolean;
  busy: boolean;
  draft: string;
  image: File | null;
  imagePreview: string | null;
  replyTo: Message | null;
  compact?: boolean;
  onLoadOlder: () => Promise<void>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onReloadMessages: () => Promise<void>;
  setDraft: (value: string) => void;
  setImage: (value: File | null) => void;
  setImagePreview: (value: string | null) => void;
  setReplyTo: (value: Message | null) => void;
  setError: (value: string) => void;
};

export function RoomChat(props: Props) {
  const {
    roomId,
    ended,
    connected,
    messages,
    me,
    hasOlder,
    busy,
    draft,
    image,
    imagePreview,
    replyTo,
    compact = false,
    onLoadOlder,
    onSubmit,
    onReloadMessages,
    setDraft,
    setImage,
    setImagePreview,
    setReplyTo,
    setError,
  } = props;

  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [unseen, setUnseen] = useState(0);
  const [firstUnread, setFirstUnread] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const newestRef = useRef<string | undefined>(undefined);
  const countRef = useRef(messages.length);
  useNotificationTarget();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const nearBottom = useRef(true);
  const forceFollowLatest = useRef(false);
  const messageMap = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  useEffect(() => {
    const latest = messages.at(-1)?.id;
    const previousIndex = messages.findIndex((m) => m.id === newestRef.current);
    if (
      !nearBottom.current &&
      newestRef.current &&
      previousIndex >= 0 &&
      latest !== newestRef.current
    ) {
      const incoming = messages.slice(previousIndex + 1);
      queueMicrotask(() => {
        setUnseen((n) => n + incoming.length);
        setFirstUnread((old) => old ?? incoming[0]?.id ?? null);
      });
    }
    newestRef.current = latest;
    countRef.current = messages.length;
    const composerFocused = document.activeElement === composerRef.current;
    if (
      (nearBottom.current || forceFollowLatest.current || composerFocused) &&
      scrollRef.current
    ) {
      requestAnimationFrame(() => {
        const viewport = scrollRef.current;
        if (!viewport) return;
        viewport.scrollTop = viewport.scrollHeight;
        nearBottom.current = true;
        forceFollowLatest.current = false;
        setUnseen(0);
        setFirstUnread(null);
      });
    }
  }, [messages, compact]);

  function selectImage(file: File | null) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setError("Use JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("A imagem pode ter no máximo 8 MB.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  return (
    <section
      data-notification-context={`room:${roomId}`}
      className={compact ? "persistent-chat call-chat-pane" : "persistent-chat"}
    >
      <div className="chat-heading persistent-heading">
        <div>
          <h2>{compact ? "Chat da turma" : "Conversa da turma"}</h2>
          <small role="status">
            {ended
              ? "Sessão encerrada"
              : connected
                ? "Tempo real · histórico disponível aos participantes"
                : "Reconectando · seu histórico está preservado"}
          </small>
        </div>
        {!compact ? (
          <span className="privacy-pill">Histórico da turma</span>
        ) : null}
      </div>

      <ConversationNotice context={`room:${roomId}`} />
      <div
        ref={scrollRef}
        className="messages persistent-messages"
        aria-live="polite"
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
          if (nearBottom.current) {
            setUnseen(0);
            setFirstUnread(null);
          }
        }}
      >
        {hasOlder ? (
          <button
            className="load-older"
            disabled={busy}
            onClick={async () => {
              nearBottom.current = false;
              const el = scrollRef.current;
              const height = el?.scrollHeight ?? 0;
              await onLoadOlder();
              requestAnimationFrame(() => {
                if (el) el.scrollTop += el.scrollHeight - height;
              });
            }}
            type="button"
          >
            {busy ? <Loader2 className="spin" size={16} /> : null}
            Carregar mensagens anteriores
          </button>
        ) : null}

        {(props.systemEvents ?? [])
          .slice(0, 4)
          .reverse()
          .map((event) => (
            <article className="monitor-card" key={event.id}>
              <BookOpen size={22} />
              <div>
                <strong>
                  Monitor Enturma <span className="privacy-pill">APP</span>
                </strong>
                <p>
                  {event.kind === "WELCOME"
                    ? `Bem-vindo à sala${event.name ? ", " + event.name : ""}!`
                    : event.kind === "FAREWELL"
                      ? `Até a próxima${event.name ? ", " + event.name : ""}.`
                      : event.message}
                </p>
                {event.userId && event.name && (
                  <UserIdentity
                    compact
                    user={{
                      id: event.userId,
                      name: event.name,
                      username: event.username ?? "",
                      hasAvatar: event.hasAvatar,
                    }}
                  />
                )}
                {event.kind === "WELCOME" && (
                  <p className="muted">
                    {event.subjectName} · anfitrião: {event.hostName}
                    <br />
                    {event.topicText ||
                      "Troque dúvidas e compartilhe seu aprendizado."}
                    <br />
                    Converse com respeito, evite spam e proteja seus dados.
                    {event.endsAt &&
                      ` A sala termina em ${new Date(event.endsAt).toLocaleString("pt-BR")}.`}
                  </p>
                )}
                <small>
                  {new Date(event.createdAt).toLocaleString("pt-BR")}
                </small>
              </div>
            </article>
          ))}
        {messages.length === 0 ? (
          <div className="chat-empty modern-empty">
            <Hash size={compact ? 34 : 44} />
            <h3>Boas ideias começam com uma conversa.</h3>
            <p>Compartilhe sua primeira dúvida com a turma.</p>
          </div>
        ) : (
          messages.map((message) => {
            const replied = message.replyTo
              ? messageMap.get(message.replyTo)
              : undefined;
            return (
              <article
                className={`message persistent-message ${message.userId === me?.id ? "mine" : ""}`}
                key={message.id}
              >
                {message.id === firstUnread && (
                  <div
                    className="unread-divider"
                    role="separator"
                    aria-label="Mensagens não lidas"
                  >
                    Novas mensagens
                  </div>
                )}
                <div className="message-avatar">
                  <UserIdentity
                    compact
                    user={{ ...message, id: message.userId }}
                  />
                </div>
                <div className="message-content">
                  <header>
                    <UserIdentity
                      nameOnly
                      user={{ ...message, id: message.userId }}
                    />
                    <small>
                      {new Date(message.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </header>

                  {replied ? (
                    <button
                      className="reply-preview"
                      type="button"
                      onClick={() =>
                        document
                          .getElementById(`message-${replied.id}`)
                          ?.scrollIntoView({
                            behavior:
                              document.documentElement.dataset.reducedMotion ===
                                "true" ||
                              matchMedia("(prefers-reduced-motion: reduce)")
                                .matches
                                ? "instant"
                                : "smooth",
                            block: "center",
                          })
                      }
                    >
                      <Reply size={13} />
                      <strong>{replied.name}</strong>
                      <span>
                        {replied.deletedAt
                          ? "Mensagem removida"
                          : (replied.body ?? "Imagem")}
                      </span>
                    </button>
                  ) : null}

                  <div id={`message-${message.id}`}>
                    {message.deletedAt ? (
                      <p className="muted">Mensagem removida.</p>
                    ) : (
                      <>
                        {editing === message.id ? (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              try {
                                await api(
                                  `/study-rooms/${roomId}/messages/${message.id}`,
                                  {
                                    method: "PUT",
                                    body: JSON.stringify({ body: editBody }),
                                  },
                                );
                                setEditing(null);
                                await onReloadMessages();
                              } catch (e) {
                                setError((e as Error).message);
                              }
                            }}
                          >
                            <label>
                              Editar mensagem
                              <textarea
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                maxLength={4000}
                              />
                            </label>
                            <button>Salvar edição</button>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => setEditing(null)}
                            >
                              Cancelar
                            </button>
                          </form>
                        ) : message.body ? (
                          <RichMessage text={message.body} />
                        ) : null}
                        {message.editedAt && (
                          <small className="muted">editada</small>
                        )}
                        {message.attachmentId ? (
                          <a
                            className="chat-image-link"
                            href={`/api/backend/study-rooms/${roomId}/messages/attachments/${message.attachmentId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              className="chat-image"
                              src={`/api/backend/study-rooms/${roomId}/messages/attachments/${message.attachmentId}`}
                              alt={
                                message.attachmentName ?? "Imagem compartilhada"
                              }
                              loading="lazy"
                            />
                          </a>
                        ) : null}
                      </>
                    )}
                  </div>

                  {!message.deletedAt && (
                    <div className="message-reactions">
                      {message.reactions?.map((r) => (
                        <button
                          type="button"
                          key={r.emoji}
                          aria-pressed={r.mine}
                          onClick={() =>
                            api(
                              `/study-rooms/${roomId}/messages/${message.id}/reactions?emoji=${encodeURIComponent(r.emoji)}`,
                              { method: "POST" },
                            )
                              .then(onReloadMessages)
                              .catch((e) => setError(e.message))
                          }
                        >
                          {r.emoji} {r.count}
                        </button>
                      ))}
                    </div>
                  )}
                  {!message.deletedAt ? (
                    <div className="message-actions">
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => setReplyTo(message)}
                      >
                        <Reply size={14} /> Responder
                      </button>

                      <div className="quick-reactions">
                        {QUICK_EMOJIS.slice(0, compact ? 2 : 4).map((emoji) => (
                          <button
                            type="button"
                            key={emoji}
                            title={`Reagir com ${emoji}`}
                            aria-label={`Reagir com ${emoji}`}
                            onClick={() =>
                              api(
                                `/study-rooms/${roomId}/messages/${message.id}/reactions?emoji=${encodeURIComponent(emoji)}`,
                                { method: "POST" },
                              ).catch((e) => setError((e as Error).message))
                            }
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {message.userId === me?.id && message.body && !ended && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setEditing(message.id);
                            setEditBody(message.body ?? "");
                          }}
                        >
                          <Pencil size={14} /> Editar
                        </button>
                      )}
                      {message.userId === me?.id ? (
                        <button
                          className="text-button"
                          type="button"
                          onClick={async () => {
                            try {
                              await api(
                                `/study-rooms/${roomId}/messages/${message.id}`,
                                {
                                  method: "DELETE",
                                },
                              );
                              await onReloadMessages();
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          <Trash2 size={14} /> Remover
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {unseen > 0 && (
        <button
          type="button"
          className="chat-unread"
          onClick={() => {
            if (scrollRef.current)
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            nearBottom.current = true;
            setUnseen(0);
          }}
        >
          {unseen} nova(s) mensagem(ns) ↓
        </button>
      )}
      <div className="typing-status" role="status">
        {props.typing?.length
          ? `${props.typing.map((p) => p.name).join(", ")} ${props.typing.length === 1 ? "está digitando" : "estão digitando"}…`
          : ""}
      </div>
      {!ended ? (
        <form
          onSubmit={async (event) => {
            forceFollowLatest.current = true;
            nearBottom.current = true;
            setEmojiOpen(false);
            await onSubmit(event);
            requestAnimationFrame(() => {
              const viewport = scrollRef.current;
              if (!viewport) return;
              viewport.scrollTop = viewport.scrollHeight;
              setUnseen(0);
              setFirstUnread(null);
              composerRef.current?.focus({ preventScroll: true });
            });
          }}
          className="chat-composer persistent-composer enturma-message-composer"
        >
          {replyTo ? (
            <div className="composer-reply">
              <span>
                Respondendo a <strong>{replyTo.name}</strong>
              </span>
              <button
                type="button"
                className="text-button"
                onClick={() => setReplyTo(null)}
              >
                <X size={15} /> Cancelar
              </button>
            </div>
          ) : null}

          {imagePreview && image ? (
            <div className="attachment-preview">
              <div className="attachment-preview-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt={image.name} />
                <button
                  type="button"
                  className="attachment-remove"
                  aria-label="Remover imagem selecionada"
                  onClick={() => {
                    URL.revokeObjectURL(imagePreview);
                    setImage(null);
                    setImagePreview(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <div>
                <strong>{image.name}</strong>
                <small>{(image.size / (1024 * 1024)).toFixed(2)} MB</small>
              </div>
            </div>
          ) : null}

          {emojiOpen ? (
            <div className="composer-emoji-tray" aria-label="Emojis rápidos">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  disabled={busy}
                  onClick={() => {
                    setDraft(draft + emoji);
                    setEmojiOpen(false);
                    composerRef.current?.focus({ preventScroll: true });
                  }}
                  aria-label={`Adicionar ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}

          <div className="composer-main-row">
            <button
              type="button"
              className="composer-icon-button"
              aria-label="Adicionar emoji"
              aria-expanded={emojiOpen}
              onClick={() => setEmojiOpen((open) => !open)}
            >
              <Smile size={22} />
            </button>

            <label className="composer-icon-button composer-image-button">
              <ImagePlus size={22} />
              <span className="sr-only">Adicionar imagem</span>
              <input
                type="file"
                disabled={busy}
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  selectImage(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>

            <label className="composer-text-field">
              <span className="sr-only">Mensagem</span>
              <textarea
                ref={composerRef}
                aria-busy={busy}
                value={draft}
                onFocus={() => {
                  forceFollowLatest.current = true;
                  nearBottom.current = true;
                }}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={4000}
                rows={1}
                placeholder={
                  compact
                    ? "Mensagem"
                    : "Compartilhe uma ideia ou uma dúvida…"
                }
              />
            </label>

            <button
              className="composer-send-button"
              aria-label="Enviar mensagem"
              disabled={busy || (!draft.trim() && !image)}
            >
              {busy ? <Loader2 className="spin" size={20} /> : <Send size={22} />}
            </button>
          </div>
        </form>
      ) : (
        <div className="ended-chat-note">
          A sessão terminou. O histórico e as imagens foram preservados;
          consulte o relatório consolidado na Enturma AI.
        </div>
      )}
    </section>
  );
}
