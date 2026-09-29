"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Room } from "@enturma/contracts";
import { Bot, Clock, ImagePlus, Reply, Sparkles, Trash2, Users, X } from "lucide-react";
import { api, post } from "@/lib/api";
import {
  createRoomIdentity,
  createRoomKey,
  decryptEvent,
  encryptEvent,
  fileToEncryptedDataUrl,
  type EphemeralChatEvent,
  type RoomPublicKey,
  unwrapRoomKey,
  wrapRoomKey,
} from "@/lib/e2ee-room";
import { Shell } from "./shell";
import { Feedback, Loading } from "./feedback";
import { RoomTools } from "./room-tools";

type AiAnswer = {
  answer: string;
  sources: {
    number: number;
    materialId: string;
    fileName: string;
    page: number | null;
    excerpt: string;
  }[];
  webSources?: {
    title: string;
    url: string;
    startIndex: number;
    endIndex: number;
  }[];
};

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  assistant?: boolean;
  privateAi?: boolean;
  aiAnswer?: AiAnswer;
  createdAt: string;
  text?: string;
  image?: {
    name: string;
    mime: string;
    size: number;
    dataUrl: string;
  };
  replyTo?: string | null;
  deleted: boolean;
  reactions: Record<string, string[]>;
};

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🤔", "👏", "✅", "💡"];

export function RoomView({ id }: { id: string }) {
  const [room, setRoom] = useState<Room>();
  const [me, setMe] = useState<Profile>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [cryptoReady, setCryptoReady] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [aiTask, setAiTask] = useState("QUESTION");
  const [aiBusy, setAiBusy] = useState(false);
  const [capabilities, setCapabilities] = useState<{
    ai: boolean;
    aiWebSearch: boolean;
    voice: boolean;
    materials: boolean;
  }>();
  const [selectedMember, setSelectedMember] = useState<NonNullable<Room["members"]>[number] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const router = useRouter();

  const socketRef = useRef<WebSocket | null>(null);
  const identityRef = useRef<{
    privateKey: CryptoKey;
    publicKey: RoomPublicKey;
  } | null>(null);
  const roomKeyRef = useRef<CryptoKey | null>(null);
  const peerNames = useRef(new Map<string, string>());
  const myIdRef = useRef<string | null>(null);

  const reloadRoom = useCallback(async () => {
    const [r, p, cap] = await Promise.all([
      api<Room>(`/study-rooms/${id}`),
      api<Profile>("/users/me"),
      api<typeof capabilities>("/capabilities"),
    ]);
    setRoom(r);
    setMe(p);
    setCapabilities(cap);
    myIdRef.current = p.id;
  }, [id]);

  const applyEvent = useCallback(
    (event: EphemeralChatEvent, verifiedSenderId: string) => {
      if (event.type === "message") {
        const senderName =
          verifiedSenderId === myIdRef.current
            ? me?.name ?? event.senderName
            : peerNames.current.get(verifiedSenderId) ?? event.senderName;
        setMessages((current) => {
          if (current.some((m) => m.id === event.id)) return current;
          return [
            ...current,
            {
              id: event.id,
              senderId: verifiedSenderId,
              senderName,
              createdAt: event.createdAt,
              text: event.text,
              image: event.image,
              replyTo: event.replyTo,
              deleted: false,
              reactions: {},
            },
          ];
        });
        return;
      }

      if (event.type === "delete") {
        setMessages((current) =>
          current.map((message) =>
            message.id === event.messageId &&
            message.senderId === verifiedSenderId
              ? {
                  ...message,
                  deleted: true,
                  text: undefined,
                  image: undefined,
                  reactions: {},
                }
              : message,
          ),
        );
        return;
      }

      if (event.type === "reaction") {
        setMessages((current) =>
          current.map((message) => {
            if (message.id !== event.messageId || message.deleted) return message;
            const existing = message.reactions[event.emoji] ?? [];
            const users = event.active
              ? Array.from(new Set([...existing, verifiedSenderId]))
              : existing.filter((userId) => userId !== verifiedSenderId);
            const reactions = { ...message.reactions };
            if (users.length) reactions[event.emoji] = users;
            else delete reactions[event.emoji];
            return { ...message, reactions };
          }),
        );
      }
    },
    [me?.name],
  );

  useEffect(() => {
    let alive = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const peerMap = peerNames.current;
    const bootstrap = setTimeout(() => {
      void reloadRoom().catch((e) => setError((e as Error).message));
    }, 0);

    async function connect() {
      if (!alive) return;
      try {
        const identity = await createRoomIdentity();
        identityRef.current = identity;
        roomKeyRef.current = null;
        setCryptoReady(false);

        const session = await fetch("/api/session");
        if (!session.ok) throw Error("Sua sessão expirou. Entre novamente.");
        const { token, url } = await session.json();

        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          socket.send(
            JSON.stringify({
              type: "auth",
              token,
              roomId: id,
              publicKey: identity.publicKey,
            }),
          );
          attempts = 0;
        };

        socket.onmessage = async (message) => {
          try {
            const data = JSON.parse(message.data);

            if (data.type === "ready") {
              setConnected(true);
              setRoom(data.room);
              for (const peer of data.peers ?? [])
                peerNames.current.set(peer.userId, peer.name ?? "Estudante");

              if (!(data.peers?.length > 0)) {
                roomKeyRef.current = await createRoomKey();
                setCryptoReady(true);
              } else {
                socket.send(
                  JSON.stringify({
                    type: "key_request",
                  }),
                );
              }
              return;
            }

            if (data.type === "peer_joined") {
              peerNames.current.set(data.userId, data.name ?? "Estudante");
              if (roomKeyRef.current && identityRef.current) {
                const wrapped = await wrapRoomKey(
                  roomKeyRef.current,
                  identityRef.current.privateKey,
                  data.publicKey,
                );
                socket.send(
                  JSON.stringify({
                    type: "key_offer",
                    targetId: data.userId,
                    ...wrapped,
                  }),
                );
              }
              return;
            }

            if (data.type === "peer_left") {
              peerNames.current.delete(data.userId);
              return;
            }

            if (data.type === "key_request") {
              if (!identityRef.current) return;
              if (!roomKeyRef.current) {
                const ownId = myIdRef.current;
                if (!ownId || ownId.localeCompare(data.senderId) > 0) return;
                roomKeyRef.current = await createRoomKey();
                setCryptoReady(true);
              }
              const wrapped = await wrapRoomKey(
                roomKeyRef.current,
                identityRef.current.privateKey,
                data.publicKey,
              );
              socket.send(
                JSON.stringify({
                  type: "key_offer",
                  targetId: data.senderId,
                  ...wrapped,
                }),
              );
              return;
            }

            if (data.type === "key_offer") {
              if (roomKeyRef.current || !identityRef.current) return;
              roomKeyRef.current = await unwrapRoomKey(
                identityRef.current.privateKey,
                data.senderPublicKey,
                data.iv,
                data.ciphertext,
              );
              setCryptoReady(true);
              return;
            }

            if (data.type === "encrypted_event") {
              if (!roomKeyRef.current) return;
              const event = await decryptEvent(
                roomKeyRef.current,
                data.iv,
                data.ciphertext,
              );
              if (event.senderId !== data.senderId) return;
              applyEvent(event, data.senderId);
            }
          } catch {
            setError(
              "Uma atualização criptografada da sala não pôde ser processada.",
            );
          }
        };

        socket.onclose = () => {
          setConnected(false);
          setCryptoReady(false);
          if (alive && attempts < 6) {
            timeout = setTimeout(
              connect,
              Math.min(30000, 1000 * 2 ** attempts++),
            );
          }
        };
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message);
        if (attempts < 6)
          timeout = setTimeout(
            connect,
            Math.min(30000, 1000 * 2 ** attempts++),
          );
      }
    }

    void connect();
    return () => {
      alive = false;
      if (timeout) clearTimeout(timeout);
      clearTimeout(bootstrap);
      clearInterval(timer);
      socketRef.current?.close();
      roomKeyRef.current = null;
      identityRef.current = null;
      peerMap.clear();
    };
  }, [id, reloadRoom, applyEvent]);

  async function emit(event: EphemeralChatEvent) {
    const socket = socketRef.current;
    const roomKey = roomKeyRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !roomKey)
      throw Error("A criptografia da sala ainda está sendo preparada.");
    const encrypted = await encryptEvent(roomKey, event);
    socket.send(
      JSON.stringify({
        type: "encrypted_event",
        id: event.id,
        ...encrypted,
      }),
    );
    applyEvent(event, event.senderId);
  }

  async function askAi(question: string) {
    if (!me || !capabilities?.ai) return;
    const promptId = crypto.randomUUID();
    const prompt: ChatMessage = {
      id: promptId,
      senderId: me.id,
      senderName: me.name,
      privateAi: true,
      createdAt: new Date().toISOString(),
      text: question,
      deleted: false,
      reactions: {},
    };
    setMessages((current) => [...current, prompt]);
    setAiBusy(true);
    setDraft("");
    try {
      const answer = await api<AiAnswer>(`/study-rooms/${id}/ai`, {
        method: "POST",
        body: JSON.stringify({ question, mode: aiTask }),
        signal: AbortSignal.timeout(70000),
      });
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          senderId: "enturma-ai",
          senderName: "Enturma AI",
          assistant: true,
          privateAi: true,
          aiAnswer: answer,
          createdAt: new Date().toISOString(),
          text: answer.answer,
          deleted: false,
          reactions: {},
        },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAiBusy(false);
    }
  }

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!me) return;
    if (aiMode) {
      if (!draft.trim() || aiBusy) return;
      await askAi(draft.trim());
      return;
    }
    if (!draft.trim() && !image) return;
    setBusy(true);
    setError("");
    try {
      const encryptedImage = image ? await fileToEncryptedDataUrl(image) : undefined;
      const event: EphemeralChatEvent = {
        type: "message",
        id: crypto.randomUUID(),
        senderId: me.id,
        senderName: me.name,
        createdAt: new Date().toISOString(),
        text: draft.trim() || undefined,
        image: encryptedImage,
        replyTo: replyTo?.id ?? null,
      };
      await emit(event);
      setDraft("");
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImage(null);
      setImagePreview(null);
      setReplyTo(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function react(message: ChatMessage, emoji: string) {
    if (!me) return;
    const active = !(message.reactions[emoji] ?? []).includes(me.id);
    try {
      await emit({
        type: "reaction",
        id: crypto.randomUUID(),
        senderId: me.id,
        messageId: message.id,
        emoji,
        active,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeMessage(message: ChatMessage) {
    if (!me || message.senderId !== me.id) return;
    try {
      await emit({
        type: "delete",
        id: crypto.randomUUID(),
        senderId: me.id,
        messageId: message.id,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      setError((e as Error).message);
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

  return (
    <Shell>
      <Feedback error={error} />
      {room ? (
        <div className="discord-room-page">
          <header className="room-channel-header">
            <div>
              <span className="room-channel-mark">#</span>
              <div>
                <h1>{room.subjectName}</h1>
                <p>{room.title}</p>
              </div>
            </div>
            <span className="privacy-pill">E2EE · efêmero</span>
          </header>
          <div className="actions room-session-meta">
            <span className="timer">
              <Clock size={16} />{" "}
              {ended
                ? "Sessão encerrada"
                : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} restantes`}
            </span>
            <span>
              <Users size={16} /> {room.members?.length} estudantes
            </span>
            {room.hostId === me?.id && !ended ? (
              <button className="secondary" onClick={end}>
                Encerrar sessão
              </button>
            ) : null}
          </div>

          <div className="room-layout discord-room-layout">
            <div className="room-main-column">
              <RoomTools roomId={id} ended={ended} />
            <section className="chat discord-chat">
              <div className="chat-heading">
                <div>
                  <h2>Conversa da turma</h2>
                  <small role="status">
                    {connected && cryptoReady
                      ? "Criptografia ponta a ponta ativa · sem histórico no servidor"
                      : connected
                        ? "Conectado · preparando chave criptográfica"
                        : "Reconectando ao chat seguro"}
                  </small>
                </div>
              </div>

              <div className="messages" aria-live="polite">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <p>A conversa começa aqui.</p>
                    <small>
                      Mensagens e imagens existem somente na memória dos participantes
                      conectados e desaparecem ao sair ou atualizar.
                    </small>
                  </div>
                ) : (
                  messages.map((message) => {
                    const replied = messages.find(
                      (candidate) => candidate.id === message.replyTo,
                    );
                    return (
                      <article
                        className={`message discord-message ${message.senderId === me?.id ? "mine" : ""} ${message.assistant ? "assistant-message" : ""}`}
                        key={message.id}
                      >
                        <div className="message-avatar">
                          {message.assistant ? (
                            <Bot size={22} />
                          ) : room.members?.find((m) => m.userId === message.senderId)?.hasAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/backend/users/${message.senderId}/avatar`}
                              alt=""
                            />
                          ) : (
                            <span>{message.senderName.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="message-content">
                        <header>
                          <strong>{message.senderName}</strong>
                          {message.privateAi ? <span className="ai-private-badge">privado</span> : null}
                          <small>
                            {new Date(message.createdAt).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </small>
                        </header>

                        {message.deleted ? (
                          <p className="muted">Mensagem removida pelo autor.</p>
                        ) : (
                          <>
                            {replied ? (
                              <div className="reply-preview">
                                <strong>{replied.senderName}</strong>
                                <span>
                                  {replied.deleted
                                    ? "Mensagem removida"
                                    : replied.text ??
                                      (replied.image ? "Imagem" : "Mensagem")}
                                </span>
                              </div>
                            ) : null}
                            {message.text ? <p>{message.text}</p> : null}
                            {message.image ? (
                              <a
                                className="chat-image-link"
                                href={message.image.dataUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  className="chat-image"
                                  src={message.image.dataUrl}
                                  alt={message.image.name}
                                />
                              </a>
                            ) : null}

                            {!message.assistant && !message.privateAi ? <div className="message-actions">
                              <button
                                className="text-button"
                                onClick={() => setReplyTo(message)}
                              >
                                <Reply size={14} /> Responder
                              </button>
                              {message.senderId === me?.id ? (
                                <button
                                  className="text-button"
                                  onClick={() => void removeMessage(message)}
                                >
                                  <Trash2 size={14} /> Remover
                                </button>
                              ) : null}
                            </div> : null}

                            {!message.assistant && !message.privateAi ? <div
                              className="reaction-row"
                              aria-label="Reações da mensagem"
                            >
                              {QUICK_EMOJIS.map((emoji) => {
                                const users = message.reactions[emoji] ?? [];
                                return (
                                  <button
                                    key={emoji}
                                    className={
                                      users.includes(me?.id ?? "")
                                        ? "reaction active"
                                        : "reaction"
                                    }
                                    aria-label={`Reagir com ${emoji}`}
                                    onClick={() => void react(message, emoji)}
                                  >
                                    {emoji}
                                    {users.length ? <span>{users.length}</span> : null}
                                  </button>
                                );
                              })}
                            </div> : null}
                            {message.aiAnswer?.sources?.length ? (
                              <div className="ai-inline-sources">
                                {message.aiAnswer.sources.map((source) => (
                                  <details key={`${message.id}-${source.materialId}-${source.number}`}>
                                    <summary>
                                      [{source.number}] {source.fileName}
                                      {source.page ? ` · página ${source.page}` : ""}
                                    </summary>
                                    <p>{source.excerpt}</p>
                                  </details>
                                ))}
                              </div>
                            ) : null}
                            {message.aiAnswer?.webSources?.length ? (
                              <div className="ai-inline-links">
                                {message.aiAnswer.webSources.map((source) => (
                                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                                    {source.title}
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </>
                        )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {replyTo ? (
                <div className="composer-reply">
                  <span>
                    Respondendo a <strong>{replyTo.senderName}</strong>
                  </span>
                  <button
                    className="text-button"
                    onClick={() => setReplyTo(null)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : null}

              <form onSubmit={send} className={`chat-composer ${aiMode ? "ai-composer" : ""}`}>
                <div className="composer-mode-bar">
                  <button
                    type="button"
                    className={aiMode ? "ai-mode-toggle active" : "ai-mode-toggle"}
                    disabled={!capabilities?.ai || ended}
                    onClick={() => {
                      setAiMode((value) => !value);
                      setImage(null);
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setImagePreview(null);
                    }}
                  >
                    <Sparkles size={16} />
                    Enturma AI
                  </button>
                  {aiMode ? (
                    <>
                      <select
                        aria-label="Modo da Enturma AI"
                        value={aiTask}
                        onChange={(e) => setAiTask(e.target.value)}
                      >
                        <option value="QUESTION">Perguntar aos materiais</option>
                        <option value="SUMMARY">Resumir materiais</option>
                        <option value="FLASHCARDS">Criar flashcards</option>
                        <option value="QUIZ">Criar quiz</option>
                        <option value="SIMPLIFY">Explicar de forma simples</option>
                        <option value="STUDY_PLAN">Criar roteiro de estudo</option>
                        {capabilities?.aiWebSearch ? (
                          <option value="RESEARCH">Pesquisar na web com fontes</option>
                        ) : null}
                      </select>
                      <small>Consulta privada à IA. Não é enviada aos colegas nem salva pelo Enturma.</small>
                    </>
                  ) : null}
                </div>
                {imagePreview && image && !aiMode ? (
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
                      <small>{(image.size / (1024 * 1024)).toFixed(2)} MB · será criptografada antes do envio</small>
                    </div>
                  </div>
                ) : null}
                <label>
                  Mensagem
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={4000}
                    disabled={ended || (!aiMode && !cryptoReady) || aiBusy}
                    placeholder={
                      ended
                        ? "Esta sessão já terminou."
                        : aiMode
                          ? "Pergunte à Enturma AI sobre os materiais ou o conteúdo estudado…"
                          : cryptoReady
                            ? "Mensagem para a turma…"
                            : "Preparando chat seguro…"
                    }
                  />
                </label>

                <div className="composer-tools">
                  {!aiMode ? <div className="emoji-picker" aria-label="Emojis rápidos">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        className="secondary"
                        onClick={() => setDraft((value) => value + emoji)}
                        disabled={ended || !cryptoReady}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div> : null}

                  {!aiMode ? <label className="image-picker">
                    <ImagePlus size={17} />
                    <span>{image ? image.name : "Imagem"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) return;
                        if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
                          setError("Use uma imagem JPG, PNG, WEBP ou GIF.");
                          e.currentTarget.value = "";
                          return;
                        }
                        if (file.size > 8 * 1024 * 1024) {
                          setError("A imagem do chat pode ter no máximo 8 MB.");
                          e.currentTarget.value = "";
                          return;
                        }
                        if (imagePreview) URL.revokeObjectURL(imagePreview);
                        setError("");
                        setImage(file);
                        setImagePreview(URL.createObjectURL(file));
                      }}
                      disabled={ended || !cryptoReady}
                    />
                  </label> : null}

                  <button
                    disabled={
                      ended ||
                      busy ||
                      aiBusy ||
                      (aiMode ? !draft.trim() : (!cryptoReady || (!draft.trim() && !image)))
                    }
                  >
                    {aiMode
                      ? aiBusy
                        ? "Pensando…"
                        : "Perguntar à IA"
                      : busy
                        ? "Criptografando…"
                        : "Enviar"}
                  </button>
                </div>
                <small>
                  {aiMode
                    ? "A IA recebe somente sua pergunta e os materiais necessários à resposta."
                    : "Imagens JPG, PNG, WEBP ou GIF até 8 MB. Mensagens e anexos do chat são E2EE e efêmeros."}
                </small>
              </form>
            </section>
            </div>

            <aside className="room-members-panel">
              <h2>Participantes</h2>
              {selectedMember ? (
                <section
                  className="member-profile-card"
                  style={{ "--profile-accent": selectedMember.accentColor ?? "#183f36" } as React.CSSProperties}
                >
                  <button className="member-profile-close" onClick={() => setSelectedMember(null)}>×</button>
                  <div
                    className="member-profile-banner"
                    style={
                      selectedMember.hasBanner
                        ? { backgroundImage: `url("/api/backend/users/${selectedMember.userId}/banner")` }
                        : { background: selectedMember.accentColor ?? "#183f36" }
                    }
                  />
                  <div className="member-profile-body">
                    {selectedMember.hasAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/backend/users/${selectedMember.userId}/avatar`} alt="" />
                    ) : (
                      <span className="member-profile-fallback">{selectedMember.name.slice(0, 1).toUpperCase()}</span>
                    )}
                    <strong>{selectedMember.name}</strong>
                    <small>@{selectedMember.username ?? "estudante"}</small>
                    {selectedMember.bio ? <p>{selectedMember.bio}</p> : null}
                  </div>
                </section>
              ) : null}
              {room.members?.map((member) => (
                <div key={member.userId} className="member discord-member">
                  <button className="member-identity" onClick={() => setSelectedMember(member)}>
                    <span className="member-avatar">
                      {member.hasAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/backend/users/${member.userId}/avatar`} alt="" />
                      ) : (
                        member.name.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span>
                      <strong>{member.name}</strong>
                      <small>
                        {member.role === "HOST" ? "Anfitrião" : "Estudante"}
                      </small>
                    </span>
                  </button>
                  {me?.id === room.hostId &&
                  member.userId !== me.id &&
                  !ended ? (
                    <button
                      className="text-button"
                      onClick={async () => {
                        try {
                          await api(
                            `/study-rooms/${id}/participants/${member.userId}`,
                            { method: "DELETE" },
                          );
                          await reloadRoom();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                className="text-button"
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
            </aside>
          </div>
        </div>
      ) : !error ? (
        <Loading />
      ) : null}
    </Shell>
  );
}
