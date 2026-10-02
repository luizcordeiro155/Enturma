"use client";
import { useEffect, useRef, useState } from "react";
import {
  Eye,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Radio,
  Users,
  Video,
  VideoOff,
  Headphones,
} from "lucide-react";
import { LiveMemberIdentityCard } from "./user-identity";
import { post } from "@/lib/api";
import { Feedback } from "./feedback";
type CallMember = {
  identity: string;
  name: string;
  local: boolean;
  speaking: boolean;
  microphone: boolean;
  camera: boolean;
  screen: boolean;
};

export default function VoiceSession({
  roomId,
  ended,
  endpoint,
  onLeave,
}: {
  roomId: string;
  ended: boolean;
  endpoint?: string;
  onLeave: () => void;
}) {
  const [connected, setConnected] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(false);
  const [screen, setScreen] = useState(false);
  const [screenSupported, setScreenSupported] = useState(true);
  const [error, setError] = useState("");
  const [deviceNotice, setDeviceNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<CallMember[]>([]);
  const room = useRef<import("livekit-client").Room | null>(null);
  const generation = useRef(0);
  const audio = useRef<HTMLDivElement>(null);
  const videos = useRef<HTMLDivElement>(null);

  function clearMedia() {
    audio.current?.replaceChildren();
    videos.current?.replaceChildren();
  }

  function refreshMembers(call: import("livekit-client").Room) {
    const participants = [
      call.localParticipant,
      ...Array.from(call.remoteParticipants.values()),
    ];
    const next = participants.map((participant) => {
      const publications = Array.from(
        participant.trackPublications.values() as Iterable<
          import("livekit-client").TrackPublication
        >,
      );
      const active = (source: string) =>
        publications.some(
          (publication) =>
            String(publication.source) === source && !publication.isMuted,
        );
      return {
        identity: participant.identity,
        name: participant.name || participant.identity,
        local: participant === call.localParticipant,
        speaking: participant.isSpeaking,
        microphone: active("microphone"),
        camera: active("camera"),
        screen: active("screen_share"),
      };
    });
    setMembers(next);
    const local = next.find((member) => member.local);
    if (local) {
      setScreen(local.screen);
      setCamera(local.camera);
      setMuted(!local.microphone);
    }

    for (const tile of Array.from(
      videos.current?.querySelectorAll<HTMLElement>("[data-call-identity]") ??
        [],
    )) {
      const member = next.find(
        (candidate) => candidate.identity === tile.dataset.callIdentity,
      );
      tile.classList.toggle("speaking", Boolean(member?.speaking));
    }
  }

  function attachVideoTrack(
    track: import("livekit-client").Track,
    identity: string,
    name: string,
    source: string,
  ) {
    const stage = videos.current;
    if (!stage) return;
    const key = `${identity}:${source}`;
    stage.querySelector(`[data-call-key="${CSS.escape(key)}"]`)?.remove();

    const tile = document.createElement("div");
    tile.className =
      source === "screen_share"
        ? "call-media-tile screen-share"
        : "call-media-tile";
    tile.dataset.callKey = key;
    tile.dataset.callIdentity = identity;

    const media = track.attach();
    media.autoplay = true;
    media.muted = true;
    if (media instanceof HTMLVideoElement) media.playsInline = true;
    tile.appendChild(media);
    if (source === "screen_share") {
      const expand = document.createElement("button");
      expand.type = "button";
      expand.className = "call-media-fullscreen";
      expand.textContent = "Tela cheia";
      expand.onclick = () => {
        if (!tile.requestFullscreen) {
          setError("Use o controle de tela cheia do vídeo neste navegador.");
          return;
        }
        void (
          document.fullscreenElement
            ? document.exitFullscreen()
            : tile.requestFullscreen()
        ).catch(() => setError("Tela cheia indisponível neste navegador."));
      };
      tile.appendChild(expand);
      if (media instanceof HTMLVideoElement) media.controls = true;
    }

    const label = document.createElement("div");
    label.className = "call-media-label";
    label.textContent =
      source === "screen_share" ? `${name} está compartilhando a tela` : name;
    tile.appendChild(label);
    stage.appendChild(tile);
  }

  function removeTrack(identity: string, source: string) {
    const key = `${identity}:${source}`;
    videos.current
      ?.querySelector(`[data-call-key="${CSS.escape(key)}"]`)
      ?.remove();
  }

  useEffect(() => {
    setScreenSupported(
      Boolean(
        navigator.mediaDevices &&
          typeof navigator.mediaDevices.getDisplayMedia === "function",
      ),
    );
  }, []);

  useEffect(
    () => () => {
      generation.current++;
      void room.current?.disconnect();
      clearMedia();
    },
    [],
  );

  useEffect(() => {
    if (ended) {
      generation.current++;
      void room.current?.disconnect();
      clearMedia();
    }
  }, [ended]);

  async function join() {
    const attempt = ++generation.current;
    let joining: import("livekit-client").Room | null = null;
    const cancelled = () => attempt !== generation.current;
    setBusy(true);
    setError("");
    setDeviceNotice("");
    try {
      const { Room, RoomEvent, Track } = await import("livekit-client");
      const credentials = await post<{ token: string; url: string }>(
        endpoint ?? `/study-rooms/${roomId}/voice`,
      );
      if (cancelled()) return;
      const call = (joining = new Room({
        adaptiveStream: true,
        dynacast: true,
      }));
      room.current = call;

      const refresh = () => refreshMembers(call);

      call.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const element = track.attach();
          element.dataset.livekitTrack = "remote-audio";
          audio.current?.appendChild(element);
        } else {
          attachVideoTrack(
            track,
            participant.identity,
            participant.name || participant.identity,
            String(publication.source),
          );
        }
        refresh();
      });

      call.on(
        RoomEvent.TrackUnsubscribed,
        (track, publication, participant) => {
          track.detach().forEach((element) => element.remove());
          removeTrack(participant.identity, String(publication.source));
          refresh();
        },
      );

      call.on(RoomEvent.TrackPublished, refresh);
      call.on(RoomEvent.TrackUnpublished, refresh);
      call.on(RoomEvent.TrackMuted, refresh);
      call.on(RoomEvent.TrackUnmuted, refresh);
      call.on(RoomEvent.ParticipantConnected, refresh);
      call.on(RoomEvent.ParticipantDisconnected, refresh);
      call.on(RoomEvent.ActiveSpeakersChanged, refresh);

      call.on(RoomEvent.LocalTrackPublished, (publication) => {
        const track = publication.track;
        if (
          track &&
          track.kind === Track.Kind.Video &&
          (publication.source === Track.Source.Camera ||
            publication.source === Track.Source.ScreenShare)
        ) {
          attachVideoTrack(
            track,
            call.localParticipant.identity,
            call.localParticipant.name || "Você",
            String(publication.source),
          );
        }
        refresh();
      });

      call.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        publication.track?.detach().forEach((element) => element.remove());
        removeTrack(call.localParticipant.identity, String(publication.source));
        refresh();
      });

      call.on(RoomEvent.Disconnected, () => {
        setConnected(false);
        setMuted(false);
        setCamera(false);
        setScreen(false);
        setMembers([]);
        clearMedia();
      });

      await call.connect(credentials.url, credentials.token, {
        autoSubscribe: true,
      });

      if (cancelled()) {
        await call.disconnect();
        return;
      }

      // Joining the room must not depend on having a microphone.
      // Some desktops, VMs and browsers legitimately have no audio-input device.
      setConnected(true);
      setMuted(true);

      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new DOMException(
            "Este navegador não oferece captura de áudio.",
            "NotSupportedError",
          );

        const devices = await navigator.mediaDevices
          .enumerateDevices()
          .catch(() => []);
        const hasKnownInput =
          devices.length === 0 ||
          devices.some((device) => device.kind === "audioinput");

        if (!hasKnownInput)
          throw new DOMException(
            "Nenhum microfone foi encontrado neste computador.",
            "NotFoundError",
          );

        if (cancelled()) {
          await call.disconnect();
          return;
        }
        await call.localParticipant.setMicrophoneEnabled(true);
        if (cancelled()) {
          await call.disconnect();
          return;
        }
        setMuted(false);
      } catch (micError) {
        setMuted(true);
        setDeviceNotice(mediaDeviceMessage(micError, "microphone"));
      }

      refresh();
    } catch (e) {
      await joining?.disconnect();
      if (!cancelled()) setError(callConnectionMessage(e));
    } finally {
      if (!cancelled()) setBusy(false);
    }
  }

  async function toggleMicrophone() {
    const call = room.current;
    if (!call) return;
    try {
      setError("");
      setDeviceNotice("");
      await call.localParticipant.setMicrophoneEnabled(muted);
      setMuted(!muted);
      refreshMembers(call);
    } catch (e) {
      setMuted(true);
      setDeviceNotice(mediaDeviceMessage(e, "microphone"));
    }
  }

  async function toggleCamera() {
    const call = room.current;
    if (!call) return;
    try {
      setError("");
      setDeviceNotice("");
      const next = !camera;
      await call.localParticipant.setCameraEnabled(next);
      setCamera(next);
      refreshMembers(call);
    } catch (e) {
      setCamera(false);
      setDeviceNotice(mediaDeviceMessage(e, "camera"));
    }
  }

  async function toggleScreen() {
    const call = room.current;
    if (!call) return;
    try {
      const next = !screen;
      await call.localParticipant.setScreenShareEnabled(next);
      setScreen(next);
      refreshMembers(call);
    } catch (e) {
      setError(nextScreenMessage(e));
    }
  }

  const startRef = useRef(join);
  useEffect(() => {
    const timer = setTimeout(() => void startRef.current(), 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!connected || endpoint) return;
    const ping = () =>
      void post(`/study-rooms/${roomId}/heartbeat`).catch(
        (e: Error & { status?: number }) => {
          if (e.status === 403 || e.status === 409)
            void room.current?.disconnect();
        },
      );
    ping();
    const timer = setInterval(ping, 30000);
    return () => clearInterval(timer);
  }, [connected, endpoint, roomId]);
  useEffect(() => {
    const container = audio.current;
    const apply = () =>
      container?.querySelectorAll("audio").forEach((el) => {
        el.muted = deafened;
      });
    apply();
    const observer = new MutationObserver(apply);
    if (container) observer.observe(container, { childList: true });
    return () => observer.disconnect();
  }, [deafened]);
  const speaking = members.filter((member) => member.speaking);
  const screenSharers = members.filter((member) => member.screen);

  return (
    <div className="call-panel discord-call">
      <Feedback error={error} />
      {deviceNotice ? (
        <div className="call-device-notice" role="status">
          {deviceNotice}
        </div>
      ) : null}
      <div ref={audio} className="call-audio" />

      <div ref={videos} className="call-video-stage" />
      {connected ? (
        <>
          <div className="call-topbar">
            <div>
              <span className="call-live-dot" />
              <strong>Voz conectada</strong>
              <small>
                {members.length} {members.length === 1 ? "pessoa" : "pessoas"}{" "}
                na chamada
              </small>
            </div>
            <div className="call-speaking-summary">
              <Radio size={16} />
              {speaking.length
                ? `Falando: ${speaking.map((member) => member.name).join(", ")}`
                : "Ninguém falando agora"}
            </div>
          </div>

          {screenSharers.length ? (
            <div className="screen-share-status">
              {screenSharers.map((sharer) => {
                const viewers = members.filter(
                  (member) => member.identity !== sharer.identity,
                );
                return (
                  <article key={sharer.identity}>
                    <MonitorUp size={20} />
                    <div>
                      <strong>{sharer.name} está transmitindo a tela</strong>
                      <span>
                        <Eye size={14} />
                        {viewers.length
                          ? `${viewers.length} ${viewers.length === 1 ? "participante disponível" : "participantes disponíveis"} na chamada`
                          : "Aguardando participantes"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          <div className="call-members">
            {members.map((member) => (
              <article
                className={
                  member.speaking ? "call-member speaking" : "call-member"
                }
                key={member.identity}
              >
                <LiveMemberIdentityCard
                  id={member.identity}
                  name={member.name}
                  subtitle={
                    member.screen
                      ? "Compartilhando tela"
                      : member.speaking
                        ? "Falando agora"
                        : member.local
                          ? "Você"
                          : "Na chamada"
                  }
                />
                <div className="call-member-icons">
                  {member.microphone ? <Mic size={16} /> : <MicOff size={16} />}
                  {member.camera ? <Video size={16} /> : <VideoOff size={16} />}
                  {member.screen ? <MonitorUp size={16} /> : null}
                </div>
              </article>
            ))}
          </div>

          <div className="call-controls enturma-call-controls">
            <button
              type="button"
              className="call-control"
              aria-pressed={deafened}
              onClick={() => setDeafened(!deafened)}
              title={deafened ? "Ouvir chamada" : "Silenciar áudio"}
            >
              <Headphones size={20} />
              <span>{deafened ? "Ouvir" : "Áudio"}</span>
            </button>
            <button
              type="button"
              className={muted ? "call-control danger" : "call-control"}
              onClick={() => void toggleMicrophone()}
              title={muted ? "Ativar microfone" : "Silenciar"}
            >
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
              <span>{muted ? "Ativar" : "Microfone"}</span>
            </button>
            <button
              type="button"
              className={camera ? "call-control active" : "call-control"}
              onClick={() => void toggleCamera()}
              title={camera ? "Desligar câmera" : "Ligar câmera"}
            >
              {camera ? <Video size={20} /> : <VideoOff size={20} />}
              <span>Câmera</span>
            </button>
            <button
              type="button"
              className={screen ? "call-control active" : "call-control"}
              onClick={() => void toggleScreen()}
              disabled={!screenSupported}
              title={
                screenSupported
                  ? screen
                    ? "Parar compartilhamento"
                    : "Compartilhar tela"
                  : "Compartilhamento de tela indisponível neste Android"
              }
            >
              <MonitorUp size={20} />
              <span>
                {screen
                  ? "Parar tela"
                  : screenSupported
                    ? "Compartilhar"
                    : "Tela indisponível"}
              </span>
            </button>
            <button
              type="button"
              className="call-control hangup"
              onClick={onLeave}
              title="Sair da chamada"
            >
              <PhoneOff size={20} />
              <span>Desconectar</span>
            </button>
          </div>

          <small className="call-privacy-note">
            <Users size={14} />
            Todos na chamada aparecem acima. Quem estiver falando recebe
            destaque em tempo real.
          </small>
        </>
      ) : (
        <div className="call-entry">
          <div>
            <strong>Entre na chamada da turma</strong>
            <span>
              Veja quem está conectado, quem está falando e quem está
              compartilhando a tela.
            </span>
          </div>
          <button disabled={ended || busy} onClick={join}>
            {busy ? "Conectando…" : "Entrar na chamada"}
          </button>
        </div>
      )}
    </div>
  );
}

function mediaDeviceMessage(error: unknown, kind: "microphone" | "camera") {
  const name =
    error instanceof DOMException
      ? error.name
      : error instanceof Error
        ? error.name
        : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = `${name} ${message}`.toLowerCase();
  const label = kind === "microphone" ? "microfone" : "câmera";

  if (
    normalized.includes("notfound") ||
    normalized.includes("requested device not found") ||
    normalized.includes("device not found") ||
    normalized.includes("devicesnotfound") ||
    normalized.includes("nenhum microfone") ||
    normalized.includes("no device")
  )
    return `Nenhum ${label} foi encontrado. Você entrou na chamada normalmente e pode continuar ouvindo ou compartilhando a tela.`;

  if (
    normalized.includes("notallowed") ||
    normalized.includes("permission") ||
    normalized.includes("denied")
  )
    return `O navegador bloqueou o acesso ao ${label}. Libere a permissão do site e tente novamente.`;

  if (
    normalized.includes("notreadable") ||
    normalized.includes("trackstarterror") ||
    normalized.includes("could not start") ||
    normalized.includes("in use")
  )
    return `O ${label} está ocupado por outro aplicativo ou não pôde ser iniciado. Feche outros apps que possam estar usando o dispositivo e tente novamente.`;

  if (normalized.includes("notsupported") || normalized.includes("unsupported"))
    return `Este navegador não oferece suporte ao ${label} nesta chamada. Você ainda pode permanecer conectado.`;

  return `Não foi possível ativar o ${label}. Você continua conectado à chamada e pode tentar novamente pelo botão de ${label}.`;
}

function callConnectionMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  if (
    normalized.includes("requested device not found") ||
    normalized.includes("device not found")
  )
    return "A chamada conectou, mas o navegador não encontrou um dispositivo de áudio. Atualize a página e tente entrar novamente.";
  return message || "Não foi possível entrar na chamada agora.";
}

function nextScreenMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("permission"))
    return "A permissão para compartilhar a tela foi recusada.";
  return message || "Não foi possível iniciar o compartilhamento de tela.";
}
