"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Message, Profile, Room } from "@enturma/contracts";
import {
  Bot,
  Clock,
  FileText,
  Hash,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";
import { prepareChatImage } from "@/lib/chat-image";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback, Loading } from "./feedback";
import { RoomTools } from "./room-tools";
import { UserIdentity } from "./user-identity";
import { RoomChat } from "./room-chat";

type Section = "chat" | "call" | "materials" | "ai";
type Upload = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

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
  const pageRef = useRef(0);
  const connectedRef = useRef(false);

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
        await api("/users/me");
        if (!alive) return;
        const session = await fetch("/api/session");
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
      socketRef.current?.close();
    };
  }, [id, loadMessages, normalize, reloadRoom]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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

  async function uploadImage() {
    if (!image) return null;
    await api("/users/me");
    const form = new FormData();
    form.set("file", await prepareChatImage(image));
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
      await loadMessages();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const seconds = room
    ? Math.max(0, Math.floor((Date.parse(room.endsAt) - now) / 1000))
    : 0;
  const ended = room?.status === "ENDED" || seconds === 0;

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
    onReloadMessages: loadMessages,
    setDraft,
    setImage,
    setImagePreview,
    setReplyTo,
    setError,
  };

  return (
    <Shell>
      <div className="study-room-page">
        <Feedback error={error} />
        {room ? (
          <>
            <header className="study-room-header">
              <div>
                <button
                  className="text-button room-back"
                  onClick={() => router.push("/rooms")}
                >
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
                  {room.members?.filter((m) => !m.leftAt).length ?? 0}{" "}
                  participantes
                </span>
                {room.hostId === me?.id && !ended ? (
                  <button className="secondary" onClick={end}>
                    Encerrar sessão
                  </button>
                ) : null}
              </div>
            </header>

            {room.hasEarlierHistory && section === "chat" ? (
              <div className="late-join-banner">
                <Sparkles size={20} />
                <div>
                  <strong>Você entrou depois que esta turma começou.</strong>
                  <span>
                    O histórico da sessão está disponível e a IA pode explicar o
                    contexto anterior.
                  </span>
                </div>
                <button onClick={() => setSection("ai")}>
                  Me atualizar com IA
                </button>
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

                <div className="room-channel-note">
                  <MessageCircle size={17} />
                  <span>
                    Mensagens, reações e imagens ficam disponíveis aos
                    participantes, inclusive após encerrar a sessão.
                  </span>
                </div>
              </nav>

              <main
                className={
                  section === "call"
                    ? "room-main-panel call-mode"
                    : "room-main-panel"
                }
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
              </main>

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
                      <UserIdentity
                        user={{ ...member, id: member.userId }}
                        subtitle={
                          member.role === "HOST"
                            ? "Anfitrião"
                            : member.leftAt
                              ? "Saiu da sessão"
                              : "Estudante"
                        }
                      />

                      {me?.id === room.hostId &&
                      member.userId !== me.id &&
                      !ended &&
                      !member.leftAt ? (
                        <button
                          className="icon-control"
                          aria-label={`Opções de ${member.name}`}
                          title="Remover participante"
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
              ) : null}
            </div>

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
                label="IA"
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
