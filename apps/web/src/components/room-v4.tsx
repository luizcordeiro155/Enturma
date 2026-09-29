"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Room } from "@enturma/contracts";
import {
  Bot, Clock, FileText, Hash, Headphones, ImagePlus, Reply, Sparkles, Trash2, Users, X
} from "lucide-react";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback, Loading } from "./feedback";
import { RoomTools } from "./room-tools";

type RoomDetail = Room & {
  messagesBeforeJoin?: number;
  messageCount?: number;
};

type ChatMessage = {
  id: string;
  userId: string;
  senderName: string;
  body?: string | null;
  imageName?: string | null;
  imageData?: string | null;
  replyTo?: string | null;
  createdAt: string;
  deletedAt?: string | null;
  reactions: Record<string, string[]>;
};

type Summary = {
  status: string;
  content?: string | null;
  messageCount?: number;
  generatedAt?: string | null;
};

type Section = "chat" | "call" | "materials" | "ai";

const QUICK = ["👍", "❤️", "😂", "🎉", "🤔", "👏", "✅", "💡"];

export function RoomView({ id }: { id: string }) {
  const [room, setRoom] = useState<RoomDetail>();
  const [me, setMe] = useState<Profile>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [section, setSection] = useState<Section>("chat");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recap, setRecap] = useState("");
  const [recapBusy, setRecapBusy] = useState(false);
  const [summary, setSummary] = useState<Summary>();
  const [now, setNow] = useState(() => Date.now());
  const socketRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const reload = useCallback(async () => {
    const [r, p, m] = await Promise.all([
      api<RoomDetail>(`/study-rooms/${id}`),
      api<Profile>("/users/me"),
      api<ChatMessage[]>(`/study-rooms/${id}/messages?page=0`),
    ]);
    setRoom(r);
    setMe(p);
    setMessages(m);
    if (r.status === "ENDED") {
      api<Summary>(`/study-rooms/${id}/study-summary`)
        .then(setSummary)
        .catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    const bootstrap = setTimeout(() => {
      void reload().catch((e) => setError((e as Error).message));
    }, 0);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(bootstrap);
      clearInterval(clock);
    };
  }, [reload]);

  useEffect(() => {
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    async function connect() {
      try {
        const session = await fetch("/api/session");
        if (!session.ok) throw Error("Sua sessão expirou. Entre novamente.");
        const { token, url } = await session.json();
        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "auth", token, roomId: id }));
          attempt = 0;
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "ready") {
            setConnected(true);
            setRoom(data.room);
          } else if (data.type === "message") {
            setMessages((items) => {
              const incoming = data.message as ChatMessage;
              return items.some((item) => item.id === incoming.id)
                ? items.map((item) => (item.id === incoming.id ? incoming : item))
                : [...items, incoming];
            });
          } else if (data.type === "delete") {
            setMessages((items) =>
              items.map((item) =>
                item.id === data.messageId
                  ? { ...item, body: null, imageData: null, deletedAt: new Date().toISOString(), reactions: {} }
                  : item,
              ),
            );
          } else if (data.type === "reaction") {
            setMessages((items) =>
              items.map((item) => {
                if (item.id !== data.messageId) return item;
                const current = item.reactions?.[data.emoji] ?? [];
                const next = data.active
                  ? Array.from(new Set([...current, data.userId]))
                  : current.filter((user) => user !== data.userId);
                const reactions = { ...(item.reactions ?? {}) };
                if (next.length) reactions[data.emoji] = next;
                else delete reactions[data.emoji];
                return { ...item, reactions };
              }),
            );
          } else if (data.type === "error") {
            setError(data.message);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          if (active && attempt < 6)
            retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt++));
        };
      } catch (e) {
        setError((e as Error).message);
      }
    }

    void connect();
    return () => {
      active = false;
      if (retry) clearTimeout(retry);
      socketRef.current?.close();
    };
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const seconds = room ? Math.max(0, Math.floor((Date.parse(room.endsAt) - now) / 1000)) : 0;
  const ended = room?.status === "ENDED" || seconds === 0;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() && !image) return;
    setBusy(true);
    try {
      const payload = {
        type: "chat_message",
        id: crypto.randomUUID(),
        body: draft.trim() || null,
        replyTo: replyTo?.id ?? null,
        image: image ? await readImage(image) : null,
      };
      const ws = socketRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      } else {
        await api(`/study-rooms/${id}/messages`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await reload();
      }
      setDraft("");
      setReplyTo(null);
      if (preview) URL.revokeObjectURL(preview);
      setImage(null);
      setPreview(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function react(message: ChatMessage, emoji: string) {
    if (!me) return;
    const active = !(message.reactions?.[emoji] ?? []).includes(me.id);
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "chat_reaction", messageId: message.id, emoji, active }));
    } else {
      await api(`/study-rooms/${id}/messages/${message.id}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji, active }),
      });
      await reload();
    }
  }

  async function removeMessage(message: ChatMessage) {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "chat_delete", messageId: message.id }));
    } else {
      await api(`/study-rooms/${id}/messages/${message.id}`, { method: "DELETE" });
      await reload();
    }
  }

  async function buildRecap() {
    setRecapBusy(true);
    try {
      const result = await post<{ answer: string }>(`/study-rooms/${id}/study-summary/recap`);
      setRecap(result.answer);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRecapBusy(false);
    }
  }

  async function requestSummary() {
    setRecapBusy(true);
    try {
      setSummary(await post<Summary>(`/study-rooms/${id}/study-summary`));
      setTimeout(async () => {
        try {
          setSummary(await api<Summary>(`/study-rooms/${id}/study-summary`));
        } catch {}
      }, 16000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRecapBusy(false);
    }
  }

  return (
    <Shell>
      <Feedback error={error} />
      {!room ? (!error ? <Loading /> : null) : (
        <div className="room-experience">
          <header className="room-titlebar">
            <div>
              <button className="text-button" onClick={() => router.push("/home")}>← Minhas turmas</button>
              <h1>{room.subjectName}</h1>
              <p>{room.title}</p>
            </div>
            <div className="room-session-actions">
              <span><Clock size={16} /> {ended ? "Sessão encerrada" : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} restantes`}</span>
              <span><Users size={16} /> {room.members?.length ?? 0} participantes</span>
              {room.hostId === me?.id && !ended ? (
                <button className="secondary" onClick={async () => { await post(`/study-rooms/${id}/end`); await reload(); }}>Encerrar sessão</button>
              ) : null}
            </div>
          </header>

          {(room.messagesBeforeJoin ?? 0) > 0 && !recap ? (
            <section className="late-join-banner">
              <Sparkles size={22} />
              <div>
                <strong>Você entrou com a conversa em andamento.</strong>
                <span>Há {room.messagesBeforeJoin} mensagens anteriores. Leia tudo ou peça um resumo explicativo.</span>
              </div>
              <button disabled={recapBusy} onClick={() => void buildRecap()}>
                {recapBusy ? "Preparando…" : "Entender o que perdi"}
              </button>
            </section>
          ) : null}

          {recap ? (
            <section className="ai-recap">
              <div><Sparkles size={18} /><strong>Contexto recuperado pela Enturma AI</strong></div>
              <p>{recap}</p>
              <button className="text-button" onClick={() => setRecap("")}>Fechar</button>
            </section>
          ) : null}

          <div className="room-discord-layout">
            <nav className="room-channel-list">
              <div className="room-channel-caption">
                <strong>Sua turma</strong>
                <small>Um espaço para aprender junto.</small>
              </div>
              <Channel active={section === "chat"} icon={<Hash size={18} />} label="Conversa" onClick={() => setSection("chat")} />
              <Channel active={section === "call"} icon={<Headphones size={18} />} label="Chamada" onClick={() => setSection("call")} />
              <Channel active={section === "materials"} icon={<FileText size={18} />} label="Materiais" onClick={() => setSection("materials")} />
              <Channel active={section === "ai"} icon={<Bot size={18} />} label="Enturma AI" onClick={() => setSection("ai")} />
              <small className="room-channel-note">O histórico fica disponível aos participantes e alimenta os resumos da IA.</small>
            </nav>

            <main className="room-main-panel">
              {section !== "chat" ? (
                <RoomTools roomId={id} ended={ended} section={section} />
              ) : (
                <>
                  <div className="chat-heading">
                    <div>
                      <h2>Conversa da turma</h2>
                      <small>{connected ? "Tempo real conectado · histórico privado da turma" : "Reconectando · histórico preservado"}</small>
                    </div>
                    <span className="privacy-pill">Histórico da turma</span>
                  </div>

                  <div className="messages discord-messages">
                    {messages.length === 0 ? (
                      <div className="chat-empty">
                        <Hash size={46} />
                        <strong>Boas ideias começam com uma conversa.</strong>
                        <span>Compartilhe a primeira dúvida com a turma.</span>
                      </div>
                    ) : messages.map((message) => {
                      const replied = messages.find((m) => m.id === message.replyTo);
                      return (
                        <article className={`message ${message.userId === me?.id ? "mine" : ""}`} key={message.id}>
                          <div className="message-avatar">{message.senderName?.slice(0, 1).toUpperCase()}</div>
                          <div className="message-body">
                            <header>
                              <strong>{message.senderName}</strong>
                              <small>{new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
                            </header>
                            {message.deletedAt ? (
                              <p className="muted">Mensagem removida pelo autor.</p>
                            ) : (
                              <>
                                {replied ? <div className="reply-preview"><strong>{replied.senderName}</strong><span>{replied.body ?? "Imagem"}</span></div> : null}
                                {message.body ? <p>{message.body}</p> : null}
                                {message.imageData ? (
                                  <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img className="chat-image" src={message.imageData} alt={message.imageName ?? "Imagem"} />
                                  </>
                                ) : null}
                                {!ended ? (
                                  <>
                                    <div className="message-actions">
                                      <button className="text-button" onClick={() => setReplyTo(message)}><Reply size={14} /> Responder</button>
                                      {message.userId === me?.id ? <button className="text-button" onClick={() => void removeMessage(message)}><Trash2 size={14} /> Remover</button> : null}
                                    </div>
                                    <div className="reaction-row">
                                      {QUICK.map((emoji) => {
                                        const users = message.reactions?.[emoji] ?? [];
                                        return <button key={emoji} className={users.includes(me?.id ?? "") ? "reaction active" : "reaction"} onClick={() => void react(message, emoji)}>{emoji}{users.length ? <span>{users.length}</span> : null}</button>;
                                      })}
                                    </div>
                                  </>
                                ) : null}
                              </>
                            )}
                          </div>
                        </article>
                      );
                    })}
                    <div ref={endRef} />
                  </div>

                  {!ended ? (
                    <>
                      {replyTo ? <div className="composer-reply"><span>Respondendo a <strong>{replyTo.senderName}</strong></span><button className="text-button" onClick={() => setReplyTo(null)}>Cancelar</button></div> : null}
                      <form className="chat-composer discord-composer" onSubmit={send}>
                        {preview && image ? (
                          <div className="attachment-preview">
                            <div className="attachment-preview-media">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={preview} alt={image.name} />
                              <button type="button" className="attachment-remove" onClick={() => { URL.revokeObjectURL(preview); setPreview(null); setImage(null); }}><X size={16} /></button>
                            </div>
                            <div><strong>{image.name}</strong><small>{(image.size / 1024 / 1024).toFixed(2)} MB</small></div>
                          </div>
                        ) : null}
                        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} placeholder="Compartilhe uma ideia ou uma dúvida…" />
                        <div className="composer-tools">
                          <div className="emoji-picker">{QUICK.map((emoji) => <button type="button" className="secondary" key={emoji} onClick={() => setDraft((v) => v + emoji)}>{emoji}</button>)}</div>
                          <label className="image-picker">
                            <ImagePlus size={17} /><span>{image ? image.name : "Imagem"}</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              if (!file) return;
                              if (file.size > 8 * 1024 * 1024) { setError("A imagem pode ter no máximo 8 MB."); return; }
                              if (preview) URL.revokeObjectURL(preview);
                              setImage(file);
                              setPreview(URL.createObjectURL(file));
                            }} />
                          </label>
                          <button disabled={busy || (!draft.trim() && !image)}>{busy ? "Enviando…" : "Enviar"}</button>
                        </div>
                      </form>
                    </>
                  ) : <div className="room-ended-note"><strong>Esta sessão foi encerrada.</strong><span>O histórico continua disponível para revisão.</span></div>}
                </>
              )}
            </main>

            <aside className="room-participants">
              <h2>Participantes <small>{room.members?.length ?? 0}</small></h2>
              {room.members?.map((member) => (
                <div key={member.userId} className="member">
                  <span className="participant-avatar">{member.name.slice(0, 1).toUpperCase()}</span>
                  <span>{member.name}<small>{member.role === "HOST" ? "Anfitrião" : "Estudante"}</small></span>
                </div>
              ))}
            </aside>
          </div>

          {ended ? (
            <section className="session-study-card">
              <div>
                <p className="eyebrow">Biblioteca da sessão</p>
                <h2>Estudo completo gerado pela Enturma AI</h2>
                <p>A conversa e os materiais são consolidados para revisão posterior.</p>
              </div>
              {summary?.status === "READY" && summary.content ? (
                <article className="session-study-content">{summary.content}</article>
              ) : (
                <button disabled={recapBusy} onClick={() => void requestSummary()}>
                  {summary?.status === "PENDING" || summary?.status === "PROCESSING" ? "Gerando estudo…" : "Gerar estudo da sessão"}
                </button>
              )}
            </section>
          ) : null}
        </div>
      )}
    </Shell>
  );
}

function Channel({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" className={active ? "room-channel active" : "room-channel"} onClick={onClick}>{icon}<span>{label}</span></button>;
}

async function readImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) throw Error("Formato de imagem não permitido.");
  if (file.size > 8 * 1024 * 1024) throw Error("A imagem pode ter no máximo 8 MB.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
  return { name: file.name, mime: file.type, size: file.size, dataUrl };
}
