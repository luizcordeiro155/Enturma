"use client";
import { useStudyActivity } from "@/lib/use-study-activity";
import { useRoomBrowserViewport } from "@/lib/use-room-browser-viewport";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Message, Profile, Room } from "@enturma/contracts";
import {
  BookOpen,
  Database,
  Bot,
  ChevronLeft,
  Clock,
  FileText,
  Hash,
  MessageCircle,
  Phone,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { prepareChatImage } from "@/lib/chat-image";
import type { KlipyGif } from "@/lib/klipy";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback, Loading } from "./feedback";
import { RoomTools } from "./room-tools";
import { LiveMemberIdentityCard } from "./user-identity";
import { focusMessage } from "./notifications";
import { useCallSession } from "./call-session-provider";
import { RoomChat } from "./room-chat";
import { RoomSharePanel } from "./room-share-panel";
import { RoomSettings } from "./room-artwork";
import { RoomParticipantActions } from "./room-participant-actions";

type Section = "chat" | "call" | "materials" | "ai";
type Upload = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export function RoomView({ id }: { id: string }) {
  const callSession = useCallSession();
  const params = useSearchParams();
  const requestedPanel = params.get("panel");
  const [typing, setTyping] = useState<{ id: string; name: string }[]>([]);
  const lastTyping = useRef(0);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [room, setRoom] = useState<Room>();
  useStudyActivity("ROOM", Boolean(room && room.status !== "ENDED"));
  const [me, setMe] = useState<Profile>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [section, setSection] = useState<Section>(
    ["call", "materials", "ai"].includes(params.get("panel") ?? "")
      ? (params.get("panel") as Section)
      : "chat",
  );
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [contextNoticeHidden, setContextNoticeHidden] = useState(false);
  useRoomBrowserViewport(section === "chat");
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
  const pageRef = useRef(0);
  const connectedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const jump = async () => {
      const target = location.hash.match(/^#message-([a-f0-9-]+)$/)?.[1];
      if (!target) return;
      setSection("chat");
      try {
        const rows = await api<Message[]>(
          `/study-rooms/${id}/messages/target/${target}`,
        );
        if (active) {
          setMessages((old) =>
            [...new Map([...old, ...rows].map((m) => [m.id, m])).values()].sort(
              (a, b) => a.createdAt.localeCompare(b.createdAt),
            ),
          );
          focusMessage(`message-${target}`);
        }
      } catch {}
    };
    const timer = setTimeout(() => void jump(), 300);
    window.addEventListener("hashchange", jump);
    window.addEventListener("enturma-notification-open", jump);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("hashchange", jump);
      window.removeEventListener("enturma-notification-open", jump);
    };
  }, [id]);
  useEffect(() => {
    if (
      requestedPanel &&
      ["call", "materials", "ai"].includes(requestedPanel)
    ) {
      const t = setTimeout(() => setSection(requestedPanel as Section), 0);
      return () => clearTimeout(t);
    }
  }, [requestedPanel]);
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
    pageRef.current = 0;
    setHasOlder(items.length === 50);
  }, [id, normalize]);

  useEffect(() => {
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const tick = setInterval(() => setNow(Date.now()), 1000);

    const bootstrap = setTimeout(() => {
      void Promise.all([reloadRoom(), loadMessages()]).catch((e) =>
        setError((e as Error).message),
      );
    }, 0);

    async function connect() {
      if (!alive) return;
      try {
        await api("/users/me", { cache: "no-store" });
        if (!alive) return;
        const session = await fetch("/api/session", { cache: "no-store" });
        if (!session.ok) throw Error("Sua sessão expirou. Entre novamente.");
        const { token, url } = await session.json();
        if (!alive) return;
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          socket.send(JSON.stringify({ token, roomId: id }));
          attempts = 0;
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "typing") {
              setTyping(data.users);
              return;
            }
            if (data.type !== "snapshot") return;
            setConnected(true);
            connectedRef.current = true;
            setError("");
            setRoom(data.room);
            const incoming = normalize(data.messages as Message[]);
            setMessages((current) => {
              const combined = new Map(current.map((m) => [m.id, m]));
              incoming.forEach((m) => combined.set(m.id, m));
              return [...combined.values()].sort(
                (a, b) =>
                  a.createdAt.localeCompare(b.createdAt) ||
                  a.id.localeCompare(b.id),
              );
            });
            if (pageRef.current === 0) setHasOlder(data.messages.length === 50);
          } catch {
            setError("Não foi possível sincronizar a conversa em tempo real.");
          }
        };

        socket.onclose = () => {
          setConnected(false);
          connectedRef.current = false;
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
          retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts++));
      }
    }

    const poll = setInterval(() => {
      if (
        !alive ||
        connectedRef.current ||
        document.visibilityState !== "visible"
      )
        return;
      void Promise.all([
        reloadRoom(),
        post(`/study-rooms/${id}/heartbeat`),
        api<Message[]>(`/study-rooms/${id}/messages?page=0`).then(
          (incoming) => {
            if (!alive) return;
            setMessages((current) =>
              [
                ...new Map(
                  [...current, ...incoming].map((m) => [m.id, m]),
                ).values(),
              ].sort(
                (a, b) =>
                  a.createdAt.localeCompare(b.createdAt) ||
                  a.id.localeCompare(b.id),
              ),
            );
          },
        ),
      ]).catch(() => {});
    }, 5000);
    void connect();
    return () => {
      alive = false;
      clearInterval(tick);
      clearInterval(poll);
      clearTimeout(bootstrap);
      if (retry) clearTimeout(retry);
      clearTimeout(typingStopTimer.current);
      lastTyping.current = 0;
      socketRef.current?.close();
    };
  }, [id, loadMessages, normalize, reloadRoom]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const myId = me?.id;
  useEffect(() => {
    if (!myId) return;
    const draftKey = `enturma-room-draft:${myId}:${id}`;
    const timer = setTimeout(() => {
      try {
        setDraft(localStorage.getItem(draftKey) || "");
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, [myId, id]);
  function changeDraft(value: string) {
    clearTimeout(typingStopTimer.current);
    setDraft(value);
    if (me)
      try {
        localStorage.setItem(`enturma-room-draft:${me.id}:${id}`, value);
      } catch {}
    const socket = socketRef.current;
    const now = Date.now();
    if (
      socket?.readyState === WebSocket.OPEN &&
      (!value.trim() || now - lastTyping.current >= 1000)
    ) {
      socket.send(
        JSON.stringify({
          type: value.trim() ? "typing_started" : "typing_stopped",
        }),
      );
      lastTyping.current = value.trim() ? now : 0;
    }
    if (value.trim())
      typingStopTimer.current = setTimeout(() => {
        if (socket?.readyState === WebSocket.OPEN && lastTyping.current) {
          socket.send(JSON.stringify({ type: "typing_stopped" }));
        }
        lastTyping.current = 0;
      }, 1800);
  }
  async function loadOlder() {
    if (!hasOlder || busy) return;
    setBusy(true);
    try {
      const next = page + 1;
      const older = await api<Message[]>(
        `/study-rooms/${id}/messages?page=${next}`,
      );
      setMessages((current) => [
        ...new Map(
          [...normalize(older), ...current].map((m) => [m.id, m]),
        ).values(),
      ]);
      setPage(next);
      pageRef.current = next;
      setHasOlder(older.length === 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file = image) {
    if (!file) return null;
    await api("/users/me");
    const form = new FormData();
    form.set("file", await prepareChatImage(file));
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
    if (busy || (!draft.trim() && !image)) return;
    setBusy(true);
    setError("");
    try {
      const attachment = await uploadImage();
      await post(`/study-rooms/${id}/messages`, {
        body: draft.trim() || null,
        replyTo: replyTo?.id ?? null,
        attachmentId: attachment?.id ?? null,
      });
      changeDraft("");
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
      await loadMessages();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function sendKlipy(gif: KlipyGif) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await post(`/study-rooms/${id}/messages`, { body: gif.url });
      await loadMessages();
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function sendMedia(file: File, mediaKind: "STICKER" | "GIF") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const attachment = await uploadImage(file);
      await post(`/study-rooms/${id}/messages`, {
        attachmentId: attachment?.id,
        mediaKind,
      });
      await loadMessages();
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    try {
      await post(`/study-rooms/${id}/leave`);
      if (callSession.session?.roomId === id) callSession.leave();
      router.push("/home");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const seconds = room
    ? Math.max(0, Math.floor((Date.parse(room.endsAt) - now) / 1000))
    : 0;
  const ended = room?.status === "ENDED" || seconds === 0;
  const activeMemberCount =
    room?.members?.filter((member) => !member.leftAt).length ?? 0;
  const roomAvatar = room?.hasAvatar
    ? `/api/backend/study-rooms/${id}/media/avatar?v=${room.mediaVersion ?? 0}`
    : null;
  const roomBanner = room?.hasBanner
    ? `/api/backend/study-rooms/${id}/media/banner?v=${room.mediaVersion ?? 0}`
    : null;

  if (!room && !error)
    return (
      <Shell>
        <Loading />
      </Shell>
    );

  const chatProps = {
    roomId: id,
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
    onLoadOlder: loadOlder,
    onSubmit: send,
    onSendMedia: sendMedia,
    onSendKlipy: sendKlipy,
    onReloadMessages: loadMessages,
    setDraft: changeDraft,
    typing,
    systemEvents: room?.systemEvents ?? [],
    setImage,
    setImagePreview,
    setReplyTo,
    setError,
  };

  return (
    <Shell>
      <div className={`study-room-page room-section-${section}`}>
        <Feedback error={error} />
        {room ? (
          <>
            <header className="room-mobile-toolbar">
              <button
                type="button"
                className="room-mobile-icon-button"
                aria-label="Voltar para minhas turmas"
                onClick={() => router.push("/rooms")}
              >
                <ChevronLeft size={24} />
              </button>

              <div className="room-mobile-title">
                <span className="room-mobile-channel-mark">
                  {roomAvatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={roomAvatar}
                      alt=""
                      className="room-mobile-artwork-avatar"
                    />
                  ) : (
                    <Hash size={19} />
                  )}
                </span>
                <div>
                  <strong>{room.title}</strong>
                  <small>{room.subjectName}</small>
                </div>
              </div>

              <button
                type="button"
                className="room-mobile-info-button"
                aria-label="Ver detalhes e participantes da turma"
                onClick={() => setMobileDetailsOpen(true)}
              >
                <Users size={20} />
                <span>{activeMemberCount}</span>
              </button>
            </header>

            <header
              className={`study-room-header ${roomBanner ? "has-room-banner" : ""}`}
              style={
                roomBanner
                  ? {
                      backgroundImage: `linear-gradient(90deg,rgba(10,18,19,.90),rgba(10,18,19,.63)),url("${roomBanner}")`,
                    }
                  : undefined
              }
            >
              <div className="room-header-intro">
                <button
                  type="button"
                  className="text-button room-back"
                  onClick={() => router.push("/rooms")}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Minhas turmas
                </button>
                <div className="room-header-identity">
                  <span
                    className="room-header-identity-mark"
                    aria-hidden="true"
                  >
                    {roomAvatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="room-header-avatar"
                        src={roomAvatar}
                        alt=""
                      />
                    ) : /\b(sql|banco de dados|database)\b/i.test(
                        room.title + " " + room.subjectName,
                      ) ? (
                      <Database size={29} />
                    ) : (
                      <BookOpen size={29} />
                    )}
                  </span>
                  <div className="room-header-copy">
                    <h1>{room.title}</h1>
                    <p className="room-header-caption">
                      {room.lifecycle === "MULTIDAY"
                        ? "Sala de vários dias · sua vaga permanece reservada"
                        : "Sala de estudos"}
                      {room.topicText ? <> · {room.topicText}</> : null}
                    </p>
                    <div className="room-header-tags">
                      <span>
                        <BookOpen size={14} aria-hidden="true" />
                        {room.subjectName}
                      </span>
                      <span>
                        <Users size={14} aria-hidden="true" />
                        {activeMemberCount} participantes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="study-room-status">
                <span className="timer">
                  <Clock size={16} />
                  {ended
                    ? "Sessão encerrada"
                    : seconds > 86400
                      ? `${Math.ceil(seconds / 86400)} dias restantes`
                      : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} restantes`}
                </span>
                <span>
                  <Users size={16} />
                  {activeMemberCount} participantes
                </span>
                <RoomSharePanel roomId={id} />
                {room.hostId === me?.id && !ended ? (
                  <button className="secondary" onClick={end}>
                    Encerrar sessão
                  </button>
                ) : null}
              </div>
            </header>

            {room.hasEarlierHistory &&
            section === "chat" &&
            !contextNoticeHidden ? (
              <div className="late-join-banner">
                <Sparkles size={20} />
                <div>
                  <strong>Você entrou depois que esta turma começou.</strong>
                  <span>
                    O histórico da sessão está disponível e a IA pode explicar o
                    contexto anterior.
                  </span>
                </div>
                <div className="late-join-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setContextNoticeHidden(true);
                      setSection("ai");
                    }}
                  >
                    Me atualizar com IA
                  </button>
                  <button
                    type="button"
                    className="late-join-later"
                    onClick={() => setContextNoticeHidden(true)}
                  >
                    Atualizar depois
                  </button>
                </div>
              </div>
            ) : null}

            <div
              className={
                section === "call"
                  ? "study-room-shell call-active"
                  : "study-room-shell"
              }
            >
              <nav className="room-channel-nav" aria-label="Áreas da turma">
                <div className="room-channel-title">
                  <strong>Sua turma</strong>
                  <small>
                    Converse, participe da chamada e estude sem sair da sala.
                  </small>
                </div>

                <ChannelButton
                  active={section === "chat"}
                  onClick={() => setSection("chat")}
                  icon={<Hash size={19} />}
                  label="Conversa"
                />
                <ChannelButton
                  active={section === "call"}
                  onClick={() => setSection("call")}
                  icon={<Phone size={19} />}
                  label="Chamada"
                />
                <ChannelButton
                  active={section === "materials"}
                  onClick={() => setSection("materials")}
                  icon={<FileText size={19} />}
                  label="Materiais"
                />
                <ChannelButton
                  active={section === "ai"}
                  onClick={() => setSection("ai")}
                  icon={<Bot size={19} />}
                  label="Enturma AI"
                />

                {me?.id === room.hostId && !ended && (
                  <RoomSettings room={room} onSaved={reloadRoom} />
                )}
                <div className="room-channel-note">
                  <MessageCircle size={17} />
                  <span>
                    Mensagens, reações e imagens ficam disponíveis aos
                    participantes, inclusive após encerrar a sessão.
                  </span>
                </div>
              </nav>

              <section
                className={
                  section === "call"
                    ? "room-main-panel call-mode"
                    : "room-main-panel"
                }
                aria-label="Conteúdo da turma"
              >
                {section === "chat" ? <RoomChat {...chatProps} /> : null}

                {section === "call" ? (
                  <div className="call-chat-layout">
                    <div className="call-stage">
                      <RoomTools roomId={id} ended={ended} view="call" />
                    </div>
                    <RoomChat {...chatProps} compact />
                  </div>
                ) : null}

                {section === "materials" || section === "ai" ? (
                  <RoomTools roomId={id} ended={ended} view={section} />
                ) : null}
              </section>

              {section !== "call" ? (
                <aside className="room-members-panel">
                  <div className="participants-heading">
                    <h2>Participantes</h2>
                    <span>{room.members?.length ?? 0}</span>
                  </div>

                  {room.members?.map((member) => (
                    <div
                      key={member.userId}
                      className={`participant-row ${member.leftAt ? "offline" : ""}`}
                    >
                      <LiveMemberIdentityCard
                        id={member.userId}
                        name={member.name}
                        subtitle={
                          member.inCall
                            ? member.screen
                              ? "Transmitindo tela"
                              : member.camera
                                ? "Na chamada · câmera ligada"
                                : "Na chamada"
                            : member.role === "HOST"
                              ? "Anfitrião"
                              : member.leftAt
                                ? "Saiu da sessão"
                                : "Estudante"
                        }
                      />

                      {member.userId !== me?.id && !member.leftAt ? (
                        <RoomParticipantActions
                          roomId={id}
                          memberId={member.userId}
                          memberName={member.name}
                          canRemove={me?.id === room.hostId}
                          onRemoved={reloadRoom}
                        />
                      ) : null}
                    </div>
                  ))}

                  {!ended ? (
                    <button className="text-button leave-room" onClick={leave}>
                      Sair da turma
                    </button>
                  ) : null}
                </aside>
              ) : null}
            </div>

            {mobileDetailsOpen ? (
              <div className="room-mobile-details-layer">
                <button
                  type="button"
                  className="room-mobile-details-backdrop"
                  aria-label="Fechar detalhes da turma"
                  onClick={() => setMobileDetailsOpen(false)}
                />
                <aside
                  className="room-mobile-details-sheet"
                  aria-label="Detalhes da turma"
                >
                  <header>
                    <div>
                      <span className="eyebrow">Turma atual</span>
                      <h2>{room.title}</h2>
                      <p>{room.subjectName}</p>
                    </div>
                    <button
                      type="button"
                      className="room-mobile-icon-button"
                      aria-label="Fechar detalhes"
                      onClick={() => setMobileDetailsOpen(false)}
                    >
                      <X size={21} />
                    </button>
                  </header>

                  <div className="room-mobile-meta-grid">
                    <span>
                      <Clock size={17} />
                      {ended
                        ? "Encerrada"
                        : seconds > 86400
                          ? `${Math.ceil(seconds / 86400)} dias`
                          : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
                    </span>
                    <span>
                      <Users size={17} />
                      {activeMemberCount} online
                    </span>
                  </div>

                  {room.topicText ? (
                    <div className="room-mobile-topic">
                      <strong>Sobre esta turma</strong>
                      <p>{room.topicText}</p>
                    </div>
                  ) : null}

                  <div className="room-mobile-members">
                    <div className="participants-heading">
                      <h3>Participantes</h3>
                      <span>{room.members?.length ?? 0}</span>
                    </div>
                    <div className="room-mobile-members-list">
                      {room.members?.map((member) => (
                        <div
                          key={member.userId}
                          className={`participant-row ${member.leftAt ? "offline" : ""}`}
                        >
                          <LiveMemberIdentityCard
                            id={member.userId}
                            name={member.name}
                            subtitle={
                              member.inCall
                                ? member.screen
                                  ? "Transmitindo tela"
                                  : member.camera
                                    ? "Na chamada · câmera ligada"
                                    : "Na chamada"
                                : member.role === "HOST"
                                  ? "Anfitrião"
                                  : member.leftAt
                                    ? "Offline"
                                    : "Estudante"
                            }
                          />
                          {member.userId !== me?.id && !member.leftAt ? (
                            <RoomParticipantActions
                              roomId={id}
                              memberId={member.userId}
                              memberName={member.name}
                              canRemove={me?.id === room.hostId}
                              onRemoved={reloadRoom}
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {me?.id === room.hostId && !ended && (
                    <RoomSettings room={room} onSaved={reloadRoom} />
                  )}
                  <div className="room-mobile-sheet-actions">
                    {me?.id === room.hostId && !ended ? (
                      <button className="secondary" onClick={end}>
                        Encerrar sessão
                      </button>
                    ) : null}
                    {!ended ? (
                      <button
                        className="text-button leave-room"
                        onClick={leave}
                      >
                        Sair da turma
                      </button>
                    ) : null}
                  </div>
                </aside>
              </div>
            ) : null}

            <nav className="room-mobile-nav" aria-label="Navegação da turma">
              <ChannelButton
                active={section === "chat"}
                onClick={() => setSection("chat")}
                icon={<Hash size={20} />}
                label="Chat"
              />
              <ChannelButton
                active={section === "call"}
                onClick={() => setSection("call")}
                icon={<Phone size={20} />}
                label="Chamada"
              />
              <ChannelButton
                active={section === "materials"}
                onClick={() => setSection("materials")}
                icon={<FileText size={20} />}
                label="Materiais"
              />
              <ChannelButton
                active={section === "ai"}
                onClick={() => setSection("ai")}
                icon={<Sparkles size={20} />}
                label="Enturma AI"
              />
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
