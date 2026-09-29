"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Message, Profile, Room } from "@enturma/contracts";
import { Clock, Users } from "lucide-react";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback, Loading } from "./feedback";
import { RoomTools } from "./room-tools";
export function RoomView({ id }: { id: string }) {
  const [room, setRoom] = useState<Room>();
  const [me, setMe] = useState<Profile>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const router = useRouter();
  const reload = useCallback(async () => {
    const [r, m, p] = await Promise.all([
      api<Room>(`/study-rooms/${id}`),
      api<Message[]>(`/study-rooms/${id}/messages`),
      api<Profile>("/users/me"),
    ]);
    setRoom(r);
    setMessages(m);
    setMe(p);
  }, [id]);
  useEffect(() => {
    let alive = true;
    let socket: WebSocket | undefined;
    let timeout: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    Promise.resolve()
      .then(reload)
      .catch((e) => setError(e.message));
    async function connect() {
      if (!alive) return;
      try {
        await api("/users/me");
        const res = await fetch("/api/session");
        if (!res.ok) throw Error("Sua sessão expirou. Entre novamente.");
        const { token, url } = await res.json();
        if (!alive) return;
        socket = new WebSocket(url);
        socket.onopen = () => {
          socket?.send(JSON.stringify({ token, roomId: id }));
          setConnected(true);
          attempts = 0;
        };
        socket.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === "snapshot") {
              setMessages(data.messages);
              setRoom(data.room);
            }
          } catch {
            setError("Não foi possível atualizar o chat.");
          }
        };
        socket.onclose = () => {
          setConnected(false);
          if (alive && attempts < 6) {
            timeout = setTimeout(
              connect,
              Math.min(30000, 1000 * 2 ** attempts++),
            );
          }
        };
      } catch (e) {
        if (alive) {
          setError((e as Error).message);
          if (attempts < 6)
            timeout = setTimeout(
              connect,
              Math.min(30000, 1000 * 2 ** attempts++),
            );
        }
      }
    }
    void connect();
    return () => {
      alive = false;
      clearTimeout(timeout);
      clearInterval(timer);
      socket?.close();
    };
  }, [id, reload]);
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form).get("message");
    setBusy(true);
    setError("");
    try {
      await post(`/study-rooms/${id}/messages`, { body, replyTo: null });
      form.reset();
      await reload();
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
      await reload();
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
        <>
          <h1>{room.subjectName}</h1>
          <p className="lead">{room.title}</p>
          <div className="actions">
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
          <div className="room-layout">
            <section className="chat">
              <h2>Conversa da turma</h2>
              <small role="status">
                {connected
                  ? "Conectado em tempo real"
                  : "Reconectando ao chat. Você ainda pode atualizar a conversa."}
              </small>
              {!connected ? (
                <button
                  className="text-button"
                  onClick={() => reload().catch((e) => setError(e.message))}
                >
                  Atualizar conversa
                </button>
              ) : null}
              <div className="messages" aria-live="polite">
                {messages.length === 0 ? (
                  <p className="muted">
                    A conversa começa com você. Compartilhe sua dúvida com a
                    turma.
                  </p>
                ) : (
                  [...messages].reverse().map((m) => (
                    <article className="message" key={m.id}>
                      <header>
                        <strong>{m.name}</strong>
                        <small>
                          {new Date(m.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </header>
                      <p>{m.deletedAt ? "Mensagem removida" : m.body}</p>
                      {m.userId === me?.id && !m.deletedAt ? (
                        <button
                          className="text-button"
                          onClick={async () => {
                            try {
                              await api(`/study-rooms/${id}/messages/${m.id}`, {
                                method: "DELETE",
                              });
                              await reload();
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          Excluir
                        </button>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
              <form onSubmit={send}>
                <label>
                  Mensagem
                  <textarea
                    name="message"
                    required
                    maxLength={4000}
                    disabled={ended}
                    placeholder={
                      ended
                        ? "Esta sessão já terminou."
                        : "Compartilhe uma ideia ou uma dúvida…"
                    }
                  />
                </label>
                <button disabled={ended || busy}>
                  {busy ? "Enviando…" : "Enviar"}
                </button>
              </form>
            </section>
            <aside>
              <h2>Participantes</h2>
              {room.members?.map((m) => (
                <div key={m.userId} className="member">
                  <span>
                    {m.name}
                    <small>{m.role === "HOST" ? " · anfitrião" : ""}</small>
                  </span>
                  {me?.id === room.hostId && m.userId !== me.id && !ended ? (
                    <button
                      className="text-button"
                      onClick={async () => {
                        try {
                          await api(
                            `/study-rooms/${id}/participants/${m.userId}`,
                            { method: "DELETE" },
                          );
                          await reload();
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
          <RoomTools roomId={id} ended={ended} />
        </>
      ) : !error ? (
        <Loading />
      ) : null}
    </Shell>
  );
}
