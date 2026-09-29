"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Message, Profile } from "@enturma/contracts";
import { Hash, ImagePlus, Loader2, Reply, Trash2, X } from "lucide-react";
import { UserIdentity } from "./user-identity";
import { api } from "@/lib/api";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🤔", "👏", "✅", "💡"];

type Props = {
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

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nearBottom = useRef(true);
  const messageMap = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  useEffect(() => {
    if (nearBottom.current && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, compact]);

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

      <div
        ref={scrollRef}
        className="messages persistent-messages"
        aria-live="polite"
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
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
                        {message.body ? <p>{message.body}</p> : null}
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

      {!ended ? (
        <form onSubmit={onSubmit} className="chat-composer persistent-composer">
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

          <label>
            <span className="sr-only">Mensagem</span>
            <textarea
              disabled={busy}
              value={draft}
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
              rows={compact ? 2 : 3}
              placeholder={
                compact
                  ? "Conversar enquanto assiste…"
                  : "Compartilhe uma ideia ou uma dúvida…"
              }
            />
          </label>

          <div className="composer-tools">
            {!compact ? (
              <div className="emoji-picker" aria-label="Emojis rápidos">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    className="secondary"
                    disabled={busy}
                    onClick={() => setDraft(draft + emoji)}
                    aria-label={`Adicionar ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}

            <label className="image-picker">
              <ImagePlus size={17} />
              <span>{compact ? "Imagem" : "Adicionar imagem"}</span>
              <input
                type="file"
                disabled={busy}
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => selectImage(e.target.files?.[0] ?? null)}
              />
            </label>

            <button disabled={busy || (!draft.trim() && !image)}>
              {busy ? "Enviando…" : "Enviar"}
            </button>
          </div>

          <small className="composer-hint">
            Enter envia · Shift+Enter cria uma nova linha
            {!compact ? " · imagens até 8 MB, otimizadas antes do envio" : ""}
          </small>
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
