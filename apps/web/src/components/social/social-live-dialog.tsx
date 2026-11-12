"use client";
import { useEffect, useRef, useState } from "react";
import {
  Eye,
  Heart,
  Mic,
  MicOff,
  Radio,
  Send,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import type {
  Room,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
} from "livekit-client";
import { api } from "@/lib/api";
import { socialWrite, type SocialPerson } from "@/lib/social";
import {
  decodeLiveMessage,
  encodeLiveMessage,
  type SocialLive,
} from "@/lib/social-live";
import { SocialDialog } from "./social-dialog";
import { Avatar } from "../user-identity";
import { ComposerMedia } from "../composer-media";
const TOPIC = "enturma-social-live-v1";
type Chat = {
  id: string;
  name: string;
  body: string;
  heart: boolean;
  identity?: string;
};
export function SocialLiveDialog({
  initialId,
  me,
  close,
  changed,
}: {
  initialId?: string;
  me: SocialPerson;
  close: () => void;
  changed: () => void;
}) {
  const [id, setId] = useState(initialId),
    [live, setLive] = useState<SocialLive>();
  const [title, setTitle] = useState(""),
    [visibility, setVisibility] = useState("PUBLIC"),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [ended, setEnded] = useState(false),
    [retry, setRetry] = useState(0);
  const [connected, setConnected] = useState(false),
    [mic, setMic] = useState(true),
    [camera, setCamera] = useState(true),
    [soundBlocked, setSoundBlocked] = useState(false);
  const [text, setText] = useState(""),
    [chat, setChat] = useState<Chat[]>([]),
    [confirmEnd, setConfirmEnd] = useState(false);
  const room = useRef<Room | null>(null),
    media = useRef<HTMLDivElement>(null),
    scroll = useRef<HTMLDivElement>(null),
    latestChanged = useRef(changed);
  const pendingId = useRef(crypto.randomUUID()),
    lastSent = useRef(0),
    sending = useRef(false),
    host = useRef(false);
  useEffect(() => {
    latestChanged.current = changed;
  }, [changed]);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    let current: Room | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    const rates = new Map<string, number>();
    function append(message: Chat) {
      setChat((previous) =>
        previous.some((row) => row.id === message.id)
          ? previous
          : [...previous.slice(-79), message],
      );
    }
    function attach(
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) {
      if (!media.current || participant.identity !== hostIdentity) return;
      const element = track.attach();
      element.className =
        track.kind === "video" ? "social-live-video" : "social-live-audio";
      media.current.appendChild(element);
      if (element instanceof HTMLVideoElement) element.playsInline = true;
    }
    let hostIdentity = "";
    async function sync() {
      if (!alive || !current) return;
      try {
        const state = host.current
          ? await socialWrite<SocialLive>(
              `/live/${id}/heartbeat`,
              undefined,
              "POST",
            )
          : await api<SocialLive>(`/social/live/${id}`, { cache: "no-store" });
        if (!alive) return;
        setLive(state);
        if (state.state === "ENDED") {
          setEnded(true);
          setConnected(false);
          void current.disconnect();
          latestChanged.current();
        } else if (state.state === "LIVE") latestChanged.current();
      } catch (cause) {
        if (alive) {
          setError((cause as Error).message);
          void current.disconnect();
          setConnected(false);
        }
      }
    }
    void (async () => {
      try {
        setStatus("Conectando \u00e0 live\u2026");
        setError("");
        const details = await api<SocialLive>(`/social/live/${id}`, {
          cache: "no-store",
        });
        if (!alive) return;
        setLive(details);
        hostIdentity = details.authorId;
        if (details.state === "ENDED") {
          setEnded(true);
          return;
        }
        const grant = await socialWrite<{
          url: string;
          token: string;
          host: boolean;
        }>(`/live/${id}/token`, undefined, "POST");
        const sdk = await import("livekit-client");
        if (!alive) return;
        current = new sdk.Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: { width: 720, height: 1280, frameRate: 24 },
          },
        });
        room.current = current;
        host.current = grant.host;
        current.on(sdk.RoomEvent.TrackSubscribed, attach);
        current.on(sdk.RoomEvent.LocalTrackPublished, (publication) => {
          if (
            !media.current ||
            publication.source !== sdk.Track.Source.Camera ||
            !publication.track
          )
            return;
          const element = publication.track.attach();
          element.className = "social-live-video";
          element.muted = true;
          if (element instanceof HTMLVideoElement) element.playsInline = true;
          media.current.appendChild(element);
        });
        current.on(sdk.RoomEvent.LocalTrackUnpublished, (publication) =>
          publication.track?.detach().forEach((element) => element.remove()),
        );
        current.on(sdk.RoomEvent.TrackUnsubscribed, (track) =>
          track.detach().forEach((element) => element.remove()),
        );
        current.on(sdk.RoomEvent.Reconnecting, () => {
          if (alive) {
            setConnected(false);
            setStatus("Reconectando\u2026");
          }
        });
        current.on(sdk.RoomEvent.Reconnected, () => {
          if (alive) {
            setConnected(true);
            setStatus("");
            void sync();
          }
        });
        current.on(sdk.RoomEvent.Disconnected, () => {
          if (alive) {
            setConnected(false);
            setStatus("Conex\u00e3o encerrada.");
          }
        });
        current.on(sdk.RoomEvent.AudioPlaybackStatusChanged, () => {
          if (alive && current) setSoundBlocked(!current.canPlaybackAudio);
        });
        // Text streams carry the authenticated sender identity even when their
        // first message beats the participant update on the signalling channel.
        current.registerTextStreamHandler(TOPIC, async (reader, sender) => {
          if (
            !alive ||
            !sender.identity ||
            !reader.info.size ||
            reader.info.size > 4096
          )
            return;
          const now = Date.now(),
            last = rates.get(sender.identity) ?? 0;
          if (now - last < 400) return;
          rates.set(sender.identity, now);
          if (rates.size > 1000) rates.clear();
          try {
            const text = await reader.readAll({
              signal: AbortSignal.timeout(5000),
            });
            const message = decodeLiveMessage(new TextEncoder().encode(text));
            if (!alive || !message) return;
            append({
              id: message.id,
              identity: sender.identity,
              name:
                current?.getParticipantByIdentity(sender.identity)?.name ||
                "Estudante",
              body: message.body,
              heart: message.kind === "HEART",
            });
          } catch {
            /* Incomplete or oversized streams are not chat messages. */
          }
        });
        current.on(sdk.RoomEvent.ParticipantConnected, (participant) => {
          if (alive)
            setChat((previous) =>
              previous.map((message) =>
                message.identity === participant.identity
                  ? { ...message, name: participant.name || "Estudante" }
                  : message,
              ),
            );
        });
        current.on(
          sdk.RoomEvent.DataReceived,
          (bytes, participant, _kind, topic) => {
            if (!alive || topic !== TOPIC || !participant) return;
            const now = Date.now(),
              last = rates.get(participant.identity) ?? 0;
            if (now - last < 400) return;
            rates.set(participant.identity, now);
            if (rates.size > 1000) rates.clear();
            const message = decodeLiveMessage(bytes);
            if (!message) return;
            append({
              id: message.id,
              name: participant.name || "Estudante",
              body: message.body,
              heart: message.kind === "HEART",
            });
          },
        );
        await current.connect(grant.url, grant.token);
        if (!alive) {
          void current.disconnect();
          return;
        }
        if (grant.host) {
          await current.localParticipant.setCameraEnabled(true);
          await current.localParticipant.setMicrophoneEnabled(true);
        }
        setConnected(true);
        setStatus("");
        await sync();
        timer = setInterval(() => void sync(), 10000);
      } catch (cause) {
        if (alive) {
          setError(
            (cause as Error).message ||
              "N\u00e3o foi poss\u00edvel abrir a live.",
          );
          setConnected(false);
        }
        void current?.disconnect();
      }
    })();
    return () => {
      alive = false;
      clearInterval(timer);
      void current?.disconnect();
      room.current = null;
      media.current?.replaceChildren();
    };
  }, [id, retry]);
  useEffect(() => {
    scroll.current?.scrollTo({
      top: scroll.current.scrollHeight,
      behavior: "auto",
    });
  }, [chat.length]);
  async function start() {
    if (busy || !title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const created = await socialWrite<SocialLive>(
        "/live",
        { id: pendingId.current, title: title.trim(), visibility },
        "POST",
      );
      setId(created.id);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (!id || busy) return;
    setBusy(true);
    setError("");
    try {
      await socialWrite(`/live/${id}/end`, undefined, "POST");
      await room.current?.disconnect();
      setEnded(true);
      setConfirmEnd(false);
      setConnected(false);
      changed();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function send(heart = false) {
    const now = Date.now();
    if (
      !connected ||
      !room.current ||
      sending.current ||
      now - lastSent.current < 500 ||
      (!heart && !text.trim())
    )
      return;
    sending.current = true;
    lastSent.current = now;
    try {
      const bytes = encodeLiveMessage(
        heart ? "HEART" : "CHAT",
        heart ? "" : text,
      );
      await room.current.localParticipant.sendText(
        new TextDecoder().decode(bytes),
        {
          topic: TOPIC,
        },
      );
      const message = decodeLiveMessage(bytes)!;
      setChat((previous) => [
        ...previous.slice(-79),
        { id: message.id, name: me.name, body: message.body, heart },
      ]);
      if (!heart) setText("");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      sending.current = false;
    }
  }
  async function toggle(kind: "mic" | "camera") {
    if (!room.current || busy) return;
    setBusy(true);
    setError("");
    try {
      if (kind === "mic") {
        await room.current.localParticipant.setMicrophoneEnabled(!mic);
        setMic(!mic);
      } else {
        await room.current.localParticipant.setCameraEnabled(!camera);
        setCamera(!camera);
      }
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function leave() {
    if (id && live?.authorId === me.id && !ended) setConfirmEnd(true);
    else close();
  }
  return (
    <SocialDialog
      title={id ? "Live no Enturma" : "Iniciar live"}
      close={leave}
      variant="viewer"
      wide
    >
      {!id ? (
        <div className="social-dialog-body social-live-setup">
          <Radio size={36} />
          <h3>Compartilhe ao vivo com a turma</h3>
          <label>
            T&iacute;tulo
            <input
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Qual assunto vamos conversar?"
            />
          </label>
          <label>
            Quem pode assistir
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
            >
              <option value="PUBLIC">Comunidade Enturma</option>
              <option value="FOLLOWERS">Meus seguidores</option>
            </select>
          </label>
          <p>
            Ao iniciar, a c&acirc;mera e o microfone ser&atilde;o solicitados. A
            privacidade da conta continua valendo. Esta live n&atilde;o
            ser&aacute; gravada pelo Enturma.
          </p>
          <button disabled={busy || !title.trim()} onClick={() => void start()}>
            Iniciar transmiss&atilde;o
          </button>
        </div>
      ) : (
        <div className="social-live-view">
          <div className="social-live-stage">
            <div ref={media} className="social-live-tracks" />
            <header className="social-live-top">
              {live && (
                <>
                  <Avatar user={{ ...live, id: live.authorId }} />
                  <div>
                    <strong>{live.name}</strong>
                    <p>{live.title}</p>
                  </div>
                  <span className="social-live-state">
                    {ended ? "ENCERRADA" : connected ? "AO VIVO" : "CONECTANDO"}
                  </span>
                  <span>
                    <Eye size={16} />
                    {live.viewers}
                  </span>
                </>
              )}
            </header>
            {!connected && !ended && (
              <p role="status" className="social-live-connection">
                {status || "Preparando transmiss\u00e3o\u2026"}
              </p>
            )}
            {ended && (
              <div className="social-live-ended">
                <h3>Esta live terminou</h3>
                <button className="secondary" onClick={close}>
                  Voltar ao Social
                </button>
              </div>
            )}
            {soundBlocked && connected && (
              <button
                className="secondary social-live-sound"
                onClick={() =>
                  void room.current
                    ?.startAudio()
                    .then(() => setSoundBlocked(false))
                }
              >
                <Volume2 />
                Ativar som
              </button>
            )}
            {live?.authorId === me.id && !ended && (
              <div className="social-live-host-controls">
                <button
                  className="icon-control"
                  disabled={busy || !connected}
                  aria-label={mic ? "Silenciar microfone" : "Ativar microfone"}
                  onClick={() => void toggle("mic")}
                >
                  {mic ? <Mic /> : <MicOff />}
                </button>
                <button
                  className="icon-control"
                  disabled={busy || !connected}
                  aria-label={
                    camera ? "Desligar c\u00e2mera" : "Ativar c\u00e2mera"
                  }
                  onClick={() => void toggle("camera")}
                >
                  {camera ? <Video /> : <VideoOff />}
                </button>
                <button
                  className="secondary"
                  onClick={() => setConfirmEnd(true)}
                >
                  Encerrar live
                </button>
              </div>
            )}
          </div>
          <section className="social-live-chat" aria-label="Conversa ao vivo">
            <div
              ref={scroll}
              className="social-live-messages"
              role="log"
              aria-live="polite"
            >
              {chat.map((message) => (
                <p
                  key={message.id}
                  className={message.heart ? "social-live-heart" : ""}
                >
                  <strong>{message.name}</strong>{" "}
                  {message.heart ? "\u2764\ufe0f" : message.body}
                </p>
              ))}
              {!chat.length && (
                <p>
                  Envie uma mensagem. O chat desta live n&atilde;o &eacute;
                  salvo.
                </p>
              )}
            </div>
            <form
              className="social-live-composer"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <label className="sr-only" htmlFor="social-live-message">
                Mensagem na live
              </label>
              <input
                id="social-live-message"
                value={text}
                maxLength={500}
                disabled={!connected || ended}
                onChange={(event) => setText(event.target.value)}
                placeholder="Mensagem..."
              />
              <ComposerMedia
                disabled={!connected || ended}
                onEmoji={(emoji) =>
                  setText((previous) => (previous + emoji).slice(0, 500))
                }
              />
              <button
                className="icon-control"
                disabled={!connected || ended || !text.trim()}
                aria-label="Enviar mensagem na live"
              >
                <Send size={20} />
              </button>
              <button
                type="button"
                className="icon-control"
                disabled={!connected || ended}
                aria-label={"Enviar cora\u00e7\u00e3o"}
                onClick={() => void send(true)}
              >
                <Heart />
              </button>
            </form>
          </section>
        </div>
      )}
      {error && (
        <div className="social-error" role="alert">
          <p>{error}</p>
          {id && !ended && (
            <button
              className="text-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Reconectar
            </button>
          )}
        </div>
      )}
      {confirmEnd && (
        <SocialDialog
          title="Encerrar sua live?"
          close={() => setConfirmEnd(false)}
        >
          <div className="social-dialog-body">
            <p>A transmiss&atilde;o ser&aacute; encerrada para todos.</p>
            <div className="social-row">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => setConfirmEnd(false)}
              >
                Continuar ao vivo
              </button>
              <button disabled={busy} onClick={() => void finish()}>
                Encerrar live
              </button>
            </div>
          </div>
        </SocialDialog>
      )}
    </SocialDialog>
  );
}
