"use client";
import { ChatImage } from "./chat-image-viewer";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Message, Profile, RoomSystemEvent } from "@enturma/contracts";
import {
  BookOpen,
  MoreHorizontal,
  Hash,
  ImagePlus,
  Loader2,
  Send,
  Smile,
  Reply,
  X,
} from "lucide-react";
import { UserIdentity } from "./user-identity";
import { ConversationNotice, useNotificationTarget } from "./notifications";
import { api } from "@/lib/api";
import {
  isMobileTextEntryContext,
  resizeMessageComposerTextarea,
  setNativeChatComposerFocused,
} from "@/lib/native-chat-ime";

import { RichMessage } from "./rich-message";
import { isChatAtLatest, revealChatMessage } from "@/lib/chat-scroll";
import {
  MessageActionPopover,
  messageActionAnchor,
  type MessageActionAnchor,
} from "./message-action-popover";

import { MessageMenu } from "./message-menu";
import { EmojiPicker, AnimatedEmoji } from "./emoji-picker";

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
    messages: allMessages,
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

  const messages = useMemo(
    () => allMessages.filter((m) => !m.hiddenAt),
    [allMessages],
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [unseen, setUnseen] = useState(0);
  const [firstUnread, setFirstUnread] = useState<string | null>(null);
  const [roomAtLatest, setRoomAtLatest] = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState<MessageActionAnchor | null>(
    null,
  );
  const [roomActionMessage, setRoomActionMessage] = useState<Message | null>(
    null,
  );
  const [roomActionAnchor, setRoomActionAnchor] =
    useState<MessageActionAnchor | null>(null);
  const newestRef = useRef<string | undefined>(undefined);
  const countRef = useRef(messages.length);
  useNotificationTarget();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const nearBottom = useRef(true);
  const forceFollowLatest = useRef(false);
  const roomLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomLongPressOrigin = useRef<{ x: number; y: number } | null>(null);
  const messageMap = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  const scrollRoomToLatest = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      const viewport = scrollRef.current;
      if (!viewport) return;

      // Scroll only the room message viewport. Using scrollIntoView here also
      // moved outer ancestors and made the newest message climb too high above
      // the composer on Android.
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      nearBottom.current = isChatAtLatest(viewport);
      setRoomAtLatest(nearBottom.current);
      if (!nearBottom.current) return;
      setUnseen(0);
      setFirstUnread(null);
      window.dispatchEvent(
        new CustomEvent("enturma-conversation-latest", {
          detail: { context: `room:${roomId}` },
        }),
      );
    },
    [roomId],
  );

  useLayoutEffect(() => {
    const latest = messages.at(-1)?.id;
    const firstBatch = !newestRef.current && !!latest;
    const newMessage = latest !== newestRef.current;
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
    if (
      (firstBatch ||
        (newMessage && nearBottom.current) ||
        forceFollowLatest.current) &&
      scrollRef.current
    ) {
      scrollRoomToLatest("auto");
      forceFollowLatest.current = false;
    }
  }, [messages, compact, scrollRoomToLatest]);

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

  useEffect(() => {
    return () => {
      setNativeChatComposerFocused(false);
      if (roomLongPressTimer.current) clearTimeout(roomLongPressTimer.current);
    };
  }, []);

  function cancelRoomLongPress() {
    if (roomLongPressTimer.current) clearTimeout(roomLongPressTimer.current);
    roomLongPressTimer.current = null;
    roomLongPressOrigin.current = null;
  }

  function startRoomLongPress(
    event: React.PointerEvent<HTMLElement>,
    message: Message,
  ) {
    if (
      event.pointerType === "mouse" ||
      (event.target as HTMLElement).closest("button,a,input,textarea")
    )
      return;
    cancelRoomLongPress();
    roomLongPressOrigin.current = { x: event.clientX, y: event.clientY };
    const target = event.currentTarget;
    roomLongPressTimer.current = setTimeout(() => {
      setRoomActionAnchor(messageActionAnchor(target));
      setRoomActionMessage(message);
      roomLongPressTimer.current = null;
      roomLongPressOrigin.current = null;
    }, 430);
  }

  function moveRoomLongPress(event: React.PointerEvent<HTMLElement>) {
    const origin = roomLongPressOrigin.current;
    if (!origin) return;
    if (
      Math.abs(event.clientX - origin.x) > 10 ||
      Math.abs(event.clientY - origin.y) > 10
    )
      cancelRoomLongPress();
  }

  async function deleteRoomMessage(message: Message, scope: "me" | "everyone") {
    await api(
      `/study-rooms/${roomId}/messages/${message.id}${scope === "me" ? "/hide" : ""}`,
      { method: scope === "me" ? "POST" : "DELETE" },
    );
    await onReloadMessages();
  }
  async function react(message: Message, emoji: string) {
    const mine = messages
      .find((m) => m.id === message.id)
      ?.reactions?.some((r) => r.emoji === emoji && r.mine);
    await api(
      `/study-rooms/${roomId}/messages/${message.id}/reactions?emoji=${encodeURIComponent(emoji)}`,
      { method: mine ? "DELETE" : "POST" },
    );
    await onReloadMessages();
  }

  useEffect(() => {
    resizeMessageComposerTextarea(composerRef.current);
  }, [draft]);

  return (
    <section
      data-notification-context={`room:${roomId}`}
      data-notification-at-latest={roomAtLatest ? "true" : "false"}
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
          nearBottom.current = isChatAtLatest(el);
          setRoomAtLatest(nearBottom.current);
          if (nearBottom.current) {
            setUnseen(0);
            setFirstUnread(null);
            window.dispatchEvent(
              new CustomEvent("enturma-conversation-latest", {
                detail: { context: `room:${roomId}` },
              }),
            );
          }
        }}
      >
        {hasOlder ? (
          <button
            className="load-older"
            disabled={busy}
            onClick={async () => {
              nearBottom.current = false;
              setRoomAtLatest(false);
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
                className={`message persistent-message ${message.userId === me?.id ? "mine" : ""} ${roomActionMessage?.id === message.id ? "message-action-selected" : ""}`}
                key={message.id}
                onPointerDown={(event) => startRoomLongPress(event, message)}
                onPointerMove={moveRoomLongPress}
                onPointerUp={cancelRoomLongPress}
                onPointerCancel={cancelRoomLongPress}
                onContextMenu={(event) => {
                  if (
                    !(event.target as HTMLElement).closest("input,textarea")
                  ) {
                    event.preventDefault();
                    setRoomActionAnchor(
                      messageActionAnchor(event.currentTarget),
                    );
                    setRoomActionMessage(message);
                  }
                }}
              >
                <button
                  type="button"
                  className="message-overflow-trigger"
                  aria-label="Ações da mensagem"
                  onClick={(event) => {
                    setRoomActionAnchor(
                      messageActionAnchor(
                        event.currentTarget.closest("article")!,
                      ),
                    );
                    setRoomActionMessage(message);
                  }}
                >
                  <MoreHorizontal size={19} />
                </button>
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
                      onClick={() => {
                        const target = document.getElementById(
                          `message-${replied.id}`,
                        );
                        if (target)
                          revealChatMessage(
                            target,
                            document.documentElement.dataset.reducedMotion ===
                              "true" ||
                              matchMedia("(prefers-reduced-motion: reduce)")
                                .matches
                              ? "instant"
                              : "smooth",
                          );
                      }}
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
                          <ChatImage
                            src={`/api/backend/study-rooms/${roomId}/messages/attachments/${message.attachmentId}`}
                            alt={
                              message.attachmentName ?? "Imagem compartilhada"
                            }
                          />
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
                            void react(message, r.emoji).catch((e) =>
                              setError(e.message),
                            )
                          }
                        >
                          <AnimatedEmoji value={r.emoji} /> {r.count}
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
                              void react(message, emoji).catch((e) =>
                                setError(e.message),
                              )
                            }
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
        <div
          ref={bottomRef}
          className="chat-bottom-spacer"
          aria-hidden="true"
        />
      </div>

      {unseen > 0 && (
        <button
          type="button"
          className="chat-unread"
          onClick={() => {
            scrollRoomToLatest("smooth");
          }}
        >
          {unseen} nova(s) mensagem(ns) ↓
        </button>
      )}
      {roomActionMessage && roomActionAnchor ? (
        <MessageMenu
          anchor={roomActionAnchor}
          onDismiss={() => {
            setRoomActionMessage(null);
            setRoomActionAnchor(null);
          }}
          text={roomActionMessage.body ?? undefined}
          onReply={
            !roomActionMessage.deletedAt
              ? () => setReplyTo(roomActionMessage)
              : undefined
          }
          onEdit={
            roomActionMessage.userId === me?.id &&
            roomActionMessage.body &&
            !ended &&
            !roomActionMessage.deletedAt
              ? () => {
                  setEditing(roomActionMessage.id);
                  setEditBody(roomActionMessage.body ?? "");
                }
              : undefined
          }
          canDeleteEveryone={
            roomActionMessage.userId === me?.id &&
            !ended &&
            !roomActionMessage.deletedAt
          }
          onDelete={(scope) => deleteRoomMessage(roomActionMessage, scope)}
          onReact={
            !ended && !roomActionMessage.deletedAt
              ? (emoji) => react(roomActionMessage, emoji)
              : undefined
          }
        />
      ) : null}

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

          {emojiOpen && emojiAnchor ? (
            <MessageActionPopover
              anchor={emojiAnchor}
              label="Emojis"
              wide
              onDismiss={() => setEmojiOpen(false)}
            >
              <EmojiPicker
                onSelect={(emoji) => {
                  setDraft(draft + emoji);
                  setEmojiOpen(false);
                  composerRef.current?.focus({ preventScroll: true });
                }}
              />
            </MessageActionPopover>
          ) : null}

          <div className="composer-main-row">
            <button
              type="button"
              className="composer-icon-button"
              aria-label="Adicionar emoji"
              aria-expanded={emojiOpen}
              onPointerDown={(event) => event.preventDefault()}
              onClick={(event) => {
                setEmojiAnchor(messageActionAnchor(event.currentTarget));
                setEmojiOpen((open) => !open);
              }}
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
                  setNativeChatComposerFocused(true);
                  requestAnimationFrame(() => {
                    const viewport = scrollRef.current;
                    if (viewport && nearBottom.current)
                      viewport.scrollTop = viewport.scrollHeight;
                  });
                }}
                onBlur={() => {
                  setNativeChatComposerFocused(false);
                }}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing &&
                    !isMobileTextEntryContext()
                  ) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={4000}
                rows={1}
                enterKeyHint="enter"
                inputMode="text"
                placeholder="Mensagem"
              />
            </label>

            <button
              className="composer-send-button"
              aria-label="Enviar mensagem"
              onPointerDown={(event) => event.preventDefault()}
              disabled={busy || (!draft.trim() && !image)}
            >
              {busy ? (
                <Loader2 className="spin" size={20} />
              ) : (
                <Send size={22} />
              )}
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
