"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Message, Profile, Room } from "@enturma/contracts";
import {
  Bot,
  Clock,
  FileText,
  Hash,
  ImagePlus,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Reply,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback, Loading } from "./feedback";
import { RoomTools } from "./room-tools";

type Section = "chat" | "call" | "materials" | "ai";
type Upload = { id: string; fileName: string; mimeType: string; fileSize: number };

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🤔", "👏", "✅", "💡"];

export function RoomView({ id }: { id: string }) {
  const [room, setRoom] = useState<Room>();
  const [me, setMe] = useState<Profile>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [section, setSection] = useState<Section>("chat");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [page, setPage] = useState(0);
  const [hasOlder, setHasOlder] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const router = useRouter();
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const normalize = useCallback((items: Message[]) => [...items].reverse(), []);

  const reloadRoom = useCallback(async () => {
    const [r, p] = await Promise.all([
      api<Room>(`/study-rooms/${id}`),
      api<Profile>("/users/me"),
    ]);
    setRoom(r);
    setMe(p);
  }, [id]);

  const loadMessages = useCallback(async () => {
    const items = await api<Message[]>(`/study-rooms/${id}/messages?page=0`);
    setMessages(normalize(items));
    setPage(0);
    setHasOlder(items.length === 50);
  }, [id, normalize]);

  useEffect(() => {
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const tick = setInterval(() => setNow(Date.now()), 1000);

    Promise.all([reloadRoom(), loadMessages()]).catch((e) =>
      setError((e as Error).message),
    );

    async function connect() {
      if (!alive) return;
      try {
        const session = await fetch("/api/session");
        if (!session.ok) throw Error("Sua sessão expirou. Entre novamente.");
        const { token, url } = await session.json();
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          socket.send(JSON.stringify({ token, roomId: id }));
          setConnected(true);
          attempts = 0;
        };
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type !== "snapshot") return;
            setRoom(data.room);
            if (page === 0) {
              const incoming = normalize(data.messages as Message[]);
              setMessages((current) => {
                if (current.length > 50) return current;
                return incoming;
              });
              setHasOlder((data.messages as Message[]).length === 50);
            }
          } catch {
            setError("Não foi possível sincronizar a conversa em tempo real.");
          }
        };
        socket.onclose = () => {
          setConnected(false);
          if (alive && attempts < 6) {
            retry = setTimeout(
              connect,
              Math.min(30000, 1000 * 2 ** attempts++),
            );
          }
        };
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message);
        if (attempts < 6)
          retry = setTimeout(
            connect,
            Math.min(30000, 1000 * 2 ** attempts++),
          );
      }
    }

    void connect();
    return () => {
      alive = false;
      clearInterval(tick);
      if (retry) clearTimeout(retry);
      socketRef.current?.close();
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [id, loadMessages, normalize, reloadRoom]);

  useEffect(() => {
    if (section === "chat" && page === 0)
      bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, section, page]);

  async function loadOlder() {
    if (!hasOlder || busy) return;
    setBusy(true);
    try {
      const next = page + 1;
      const older = await api<Message[]>(`/study-rooms/${id}/messages?page=${next}`);
      setMessages((current) => [...normalize(older), ...current]);
      setPage(next);
      setHasOlder(older.length === 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage() {
    if (!image) return null;
    const form = new FormData();
    form.set("file", image);
    const response = await fetch(
      `/api/backend/study-rooms/${id}/messages/attachments`,
      { method: "POST", body: form, signal: AbortSignal.timeout(45000) },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw Error(body.message ?? "Não foi possível enviar a imagem.");
    }
    return (await response.json()) as Upload;
  }

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim() && !image) return;
    setBusy(true);
    setError("");
    try {
      const attachment = await uploadImage();
      await post(`/study-rooms/${id}/messages`, {
        body: draft.trim() || null,
        replyTo: replyTo?.id ?? null,
        attachmentId: attachment?.id ?? null,
      });
      setDraft("");
      setReplyTo(null);
      setImage(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      await loadMessages();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function end() {
    if (!window.confirm("Encerrar esta sessão para todos os participantes?"))
      return;
    try {
      await post(`/study-rooms/${id}/end`);
      await reloadRoom();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const seconds = room
    ? Math.max(0, Math.floor((Date.parse(room.endsAt) - now) / 1000))
    : 0;
  const ended = room?.status === "ENDED" || seconds === 0;

  const messageMap = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  if (!room && !error)
    return (
      <Shell>
        <Loading />
      </Shell>
    );

  return (
    <Shell>
      <div className="study-room-page">
        <Feedback error={error} />
        {room ? (
          <>
            <header className="study-room-header">
              <div>
                <button className="text-button room-back" onClick={() => router.push("/rooms")}>
                  ← Minhas turmas
                </button>
                <h1>{room.title}</h1>
                <p>{room.subjectName}</p>
              </div>
              <div className="study-room-status">
                <span className="timer">
                  <Clock size={16} />
                  {ended
                    ? "Sessão encerrada"
                    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} restantes`}
                </span>
                <span>
                  <Users size={16} />
                  {room.members?.filter((m) => !m.leftAt).length ?? 0} participantes
                </span>
                {room.hostId === me?.id && !ended ? (
                  <button className="secondary" onClick={end}>Encerrar sessão</button>
                ) : null}
              </div>
            </header>

            {room.hasEarlierHistory && section === "chat" ? (
              <div className="late-join-banner">
                <Sparkles size={20} />
                <div>
                  <strong>Você entrou depois que esta turma começou.</strong>
                  <span>A conversa anterior continua disponível e a IA pode explicar o contexto completo.</span>
                </div>
                <button onClick={() => setSection("ai")}>Me atualizar com IA</button>
              </div>
            ) : null}

            <div className="study-room-shell">
              <nav className="room-channel-nav" aria-label="Áreas da turma">
                <div className="room-channel-title">
                  <strong>Sua turma</strong>
                  <small>Conhecimento que continua depois da sessão.</small>
                </div>
                <ChannelButton active={section === "chat"} onClick={() => setSection("chat")} icon={<Hash size={19} />} label="Conversa" />
                <ChannelButton active={section === "call"} onClick={() => setSection("call")} icon={<Phone size={19} />} label="Chamada" />
                <ChannelButton active={section === "materials"} onClick={() => setSection("materials")} icon={<FileText size={19} />} label="Materiais" />
                <ChannelButton active={section === "ai"} onClick={() => setSection("ai")} icon={<Bot size={19} />} label="Enturma AI" />
                <div className="room-channel-note">
                  <MessageCircle size={17} />
                  <span>Durante a sessão, participantes autorizados veem o histórico. Ao encerrar, o chat bruto é eliminado.</span>
                </div>
              </nav>

              <main className="room-main-panel">
                {section === "chat" ? (
                  <section className="persistent-chat">
                    <div className="chat-heading persistent-heading">
                      <div>
                        <h2>Conversa da turma</h2>
                        <small role="status">
                          {connected
                            ? "Sincronizado em tempo real · histórico persistente"
                            : "Reconectando · o histórico continua salvo"}
                        </small>
                      </div>
                      <span className="privacy-pill">Histórico da turma</span>
                    </div>

                    <div className="messages persistent-messages" aria-live="polite">
                      {hasOlder ? (
                        <button className="load-older" disabled={busy} onClick={() => void loadOlder()}>
                          {busy ? <Loader2 className="spin" size={16} /> : null}
                          Carregar mensagens anteriores
                        </button>
                      ) : null}

                      {messages.length === 0 ? (
                        <div className="chat-empty modern-empty">
                          <Hash size={44} />
                          <h3>Boas ideias começam com uma conversa.</h3>
                          <p>Compartilhe sua primeira dúvida com a turma.</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const replied = message.replyTo ? messageMap.get(message.replyTo) : undefined;
                          return (
                            <article
                              className={`message persistent-message ${message.userId === me?.id ? "mine" : ""}`}
                              key={message.id}
                            >
                              <div className="message-avatar" aria-hidden="true">
                                {message.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="message-content">
                                <header>
                                  <strong>{message.name}</strong>
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
                                  <button className="reply-preview" onClick={() => document.getElementById(`message-${replied.id}`)?.scrollIntoView({ behavior: "smooth" })}>
                                    <Reply size={13} />
                                    <strong>{replied.name}</strong>
                                    <span>{replied.deletedAt ? "Mensagem removida" : replied.body ?? "Imagem"}</span>
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
                                          href={`/api/backend/study-rooms/${id}/messages/attachments/${message.attachmentId}`}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            className="chat-image"
                                            src={`/api/backend/study-rooms/${id}/messages/attachments/${message.attachmentId}`}
                                            alt={message.attachmentName ?? "Imagem compartilhada"}
                                            loading="lazy"
                                          />
                                        </a>
                                      ) : null}
                                    </>
                                  )}
                                </div>
                                {!message.deletedAt ? (
                                  <div className="message-actions">
                                    <button className="text-button" onClick={() => setReplyTo(message)}>
                                      <Reply size={14} /> Responder
                                    </button>
                                    <div className="quick-reactions">
                                      {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
                                        <button
                                          type="button"
                                          key={emoji}
                                          title={`Reagir com ${emoji}`}
                                          aria-label={`Reagir com ${emoji}`}
                                          onClick={() =>
                                            api(`/study-rooms/${id}/messages/${message.id}/reactions?emoji=${encodeURIComponent(emoji)}`, { method: "POST" })
                                              .catch((e) => setError((e as Error).message))
                                          }
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                    {message.userId === me?.id ? (
                                      <button
                                        className="text-button"
                                        onClick={async () => {
                                          try {
                                            await api(`/study-rooms/${id}/messages/${message.id}`, { method: "DELETE" });
                                            await loadMessages();
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
                      <form onSubmit={send} className="chat-composer persistent-composer">
                        {replyTo ? (
                          <div className="composer-reply">
                            <span>Respondendo a <strong>{replyTo.name}</strong></span>
                            <button type="button" className="text-button" onClick={() => setReplyTo(null)}>
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
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            maxLength={4000}
                            placeholder="Compartilhe uma ideia ou uma dúvida…"
                          />
                        </label>

                        <div className="composer-tools">
                          <div className="emoji-picker" aria-label="Emojis rápidos">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                type="button"
                                key={emoji}
                                className="secondary"
                                onClick={() => setDraft((value) => value + emoji)}
                                aria-label={`Adicionar ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <label className="image-picker">
                            <ImagePlus size={17} />
                            <span>Imagem</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                if (!file) return;
                                if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
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
                              }}
                            />
                          </label>
                          <button disabled={busy || (!draft.trim() && !image)}>
                            {busy ? "Enviando…" : "Enviar"}
                          </button>
                        </div>
                        <small>Imagens até 8 MB. O histórico fica disponível apenas para participantes autorizados da turma.</small>
                      </form>
                    ) : (
                      <div className="ended-chat-note">
                        A sessão terminou. O chat bruto e as imagens deixam de ficar disponíveis; use o relatório consolidado na Enturma AI.
                      </div>
                    )}
                  </section>
                ) : (
                  <RoomTools roomId={id} ended={ended} view={section} />
                )}
              </main>

              <aside className="room-members-panel">
                <div className="participants-heading">
                  <h2>Participantes</h2>
                  <span>{room.members?.length ?? 0}</span>
                </div>
                {room.members?.map((member) => (
                  <div key={member.userId} className={`participant-row ${member.leftAt ? "offline" : ""}`}>
                    <div className="participant-avatar">{member.name.slice(0, 2).toUpperCase()}</div>
                    <span>
                      <strong>{member.name}</strong>
                      <small>
                        {member.role === "HOST" ? "Anfitrião" : member.leftAt ? "Saiu da sessão" : "Estudante"}
                      </small>
                    </span>
                    {me?.id === room.hostId && member.userId !== me.id && !ended && !member.leftAt ? (
                      <button
                        className="icon-control"
                        aria-label={`Opções de ${member.name}`}
                        title="Remover participante"
                        onClick={async () => {
                          try {
                            await api(`/study-rooms/${id}/participants/${member.userId}`, { method: "DELETE" });
                            await reloadRoom();
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    ) : null}
                  </div>
                ))}
                {!ended ? (
                  <button
                    className="text-button leave-room"
                    onClick={async () => {
                      try {
                        await post(`/study-rooms/${id}/leave`);
                        router.push("/home");
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Sair da turma
                  </button>
                ) : null}
              </aside>
            </div>

            <nav className="room-mobile-nav" aria-label="Navegação da turma">
              <ChannelButton active={section === "chat"} onClick={() => setSection("chat")} icon={<Hash size={20} />} label="Chat" />
              <ChannelButton active={section === "call"} onClick={() => setSection("call")} icon={<Phone size={20} />} label="Chamada" />
              <ChannelButton active={section === "materials"} onClick={() => setSection("materials")} icon={<FileText size={20} />} label="Materiais" />
              <ChannelButton active={section === "ai"} onClick={() => setSection("ai")} icon={<Sparkles size={20} />} label="IA" />
            </nav>
          </>
        ) : null}
      </div>
    </Shell>
  );
}

function ChannelButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className={active ? "room-channel active" : "room-channel"}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
