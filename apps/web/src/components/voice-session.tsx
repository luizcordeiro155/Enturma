"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { callDevice } from "@/lib/call-device";
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
  initialCamera = false,
  onLeave,
}: {
  roomId: string;
  ended: boolean;
  endpoint?: string;
  initialCamera?: boolean;
  onLeave: () => void;
}) {
  const [connected, setConnected] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(false);
  const [screen, setScreen] = useState(false);
  const [activeScreenShare, setActiveScreenShare] = useState<string | null>(
    null,
  );
  const activeScreenShareRef = useRef<string | null>(null);
  const [screenSupported] = useState(
    () =>
      typeof navigator !== "undefined" &&
      Boolean(
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getDisplayMedia === "function",
      ),
  );
  const [error, setError] = useState("");
  const [deviceNotice, setDeviceNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<CallMember[]>([]);
  const room = useRef<import("livekit-client").Room | null>(null);
  const generation = useRef(0);
  const connectionId = useRef<string>("");
  const audio = useRef<HTMLDivElement>(null);
  const videos = useRef<HTMLDivElement>(null);
  const memberGrid = useRef<HTMLDivElement>(null);
  const videoTracks = useRef(
    new Map<
      string,
      { tile: HTMLElement; track: import("livekit-client").Track }
    >(),
  );

  function clearMedia() {
    for (const { tile, track } of videoTracks.current.values()) {
      track.detach().forEach((element) => element.remove());
      tile.remove();
    }
    videoTracks.current.clear();
    audio.current?.replaceChildren();
    videos.current?.replaceChildren();
    activeScreenShareRef.current = null;
  }

  function syncScreenStage(identity: string | null) {
    activeScreenShareRef.current = identity;
    setActiveScreenShare(identity);
    for (const participant of room.current?.remoteParticipants.values() ?? []) {
      for (const publication of participant.trackPublications.values()) {
        if (String(publication.source).startsWith("screen_share"))
          publication.setSubscribed(participant.identity === identity);
      }
    }
    const stage = videos.current;
    if (!stage) return;
    for (const tile of Array.from(
      stage.querySelectorAll<HTMLElement>("[data-call-key]"),
    )) {
      const source = tile.dataset.callSource;
      const owner = tile.dataset.callIdentity;
      if (identity) {
        tile.hidden = source === "screen_share" ? owner !== identity : true;
      } else {
        tile.hidden = source === "screen_share";
      }
    }
  }

  function refreshMembers(call: import("livekit-client").Room) {
    for (const participant of call.remoteParticipants.values()) {
      for (const publication of participant.trackPublications.values()) {
        const subscribe =
          !String(publication.source).startsWith("screen_share") ||
          activeScreenShareRef.current === participant.identity;
        if (publication.isSubscribed !== subscribe)
          publication.setSubscribed(subscribe);
      }
    }
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

    const activeShare = activeScreenShareRef.current;
    if (
      activeShare &&
      !next.some((member) => member.identity === activeShare && member.screen)
    ) {
      syncScreenStage(null);
    }

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
    const previous = videoTracks.current.get(key);
    previous?.track.detach().forEach((element) => element.remove());
    previous?.tile.remove();

    const tile = document.createElement("div");
    tile.className =
      source === "screen_share"
        ? "call-media-tile screen-share"
        : "call-media-tile";
    tile.dataset.callKey = key;
    tile.dataset.callIdentity = identity;
    tile.dataset.callSource = source;
    tile.hidden =
      source === "screen_share"
        ? activeScreenShareRef.current !== identity
        : false;

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
    videoTracks.current.set(key, { tile, track });
  }

  function removeTrack(identity: string, source: string) {
    const key = `${identity}:${source}`;
    const media = videoTracks.current.get(key);
    media?.track.detach().forEach((element) => element.remove());
    media?.tile.remove();
    videoTracks.current.delete(key);

    if (
      source === "screen_share" &&
      activeScreenShareRef.current === identity
    ) {
      syncScreenStage(null);
    }
  }

  useLayoutEffect(() => {
    for (const [key, { tile }] of videoTracks.current) {
      if (!key.endsWith(":camera")) continue;
      const slot = memberGrid.current?.querySelector(
        `[data-camera-for="${CSS.escape(tile.dataset.callIdentity || "")}"]`,
      );
      if (slot && tile.parentElement !== slot) slot.appendChild(tile);
    }
  }, [members]);

  useEffect(
    () => () => {
      generation.current++;
      room.current?.removeAllListeners();
      for (const participant of room.current?.remoteParticipants.values() ?? [])
        for (const publication of participant.trackPublications.values())
          publication.track?.detach().forEach((element) => element.remove());
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
    connectionId.current = crypto.randomUUID();
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
        endpoint?.startsWith("/calls/private/")
          ? { deviceId: callDevice() }
          : {},
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
        if (cancelled()) return;
        setConnected(false);
        setMuted(false);
        setCamera(false);
        setScreen(false);
        setMembers([]);
        clearMedia();
        if (endpoint?.startsWith("/calls/private/")) onLeave();
      });

      await call.connect(credentials.url, credentials.token, {
        autoSubscribe: false,
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
      if (initialCamera && !cancelled()) {
        try {
          await call.localParticipant.setCameraEnabled(true);
          refresh();
        } catch (cause) {
          setDeviceNotice(mediaDeviceMessage(cause, "camera"));
        }
      }
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
    if (!connected || (endpoint && !endpoint.startsWith("/calls/private/")))
      return;
    const ping = () =>
      void post(
        endpoint
          ? endpoint.replace(/\/voice$/, "/heartbeat")
          : `/study-rooms/${roomId}/heartbeat`,
      ).catch((e: Error & { status?: number }) => {
        if (e.status === 403 || e.status === 404 || e.status === 409)
          void room.current?.disconnect();
      });
    ping();
    const timer = setInterval(ping, 15000);
    return () => clearInterval(timer);
  }, [connected, endpoint, roomId]);
  useEffect(() => {
    if (!connected || endpoint) return;
    const publish = () =>
      void post(`/study-rooms/${roomId}/voice/state`, {
        connectionId: connectionId.current,
        connected: true,
        microphone: !muted,
        camera,
        screen,
        deafened,
      }).catch(() => {});
    publish();
    const interval = setInterval(publish, 15000);
    return () => clearInterval(interval);
  }, [connected, endpoint, roomId, muted, camera, screen, deafened]);
  useEffect(
    () => () => {
      if (!endpoint && connectionId.current)
        void post(`/study-rooms/${roomId}/voice/state`, {
          connectionId: connectionId.current,
          connected: false,
          microphone: false,
          camera: false,
          screen: false,
          deafened: false,
        }).catch(() => {});
    },
    [endpoint, roomId],
  );
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
  const selectedScreenShare = ended ? null : activeScreenShare;

  return (
    <div
      className={`call-panel discord-call ${selectedScreenShare ? "has-screen-stage" : ""}`}
    >
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
                const selected = selectedScreenShare === sharer.identity;
                return (
                  <button
                    type="button"
                    className={
                      selected
                        ? "screen-share-person active"
                        : "screen-share-person"
                    }
                    key={sharer.identity}
                    onClick={() =>
                      syncScreenStage(selected ? null : sharer.identity)
                    }
                  >
                    <MonitorUp size={20} />
                    <div>
                      <strong>{sharer.name} está transmitindo</strong>
                      <span>
                        <Eye size={14} />
                        {selected ? "Ocultar transmissão" : "Ver tela"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div ref={memberGrid} className="call-members">
            {members.map((member) => (
              <article
                className={
                  member.speaking ? "call-member speaking" : "call-member"
                }
                key={member.identity}
                data-camera={member.camera}
                data-local={member.local}
              >
                <div
                  className="call-camera-slot"
                  data-camera-for={member.identity}
                />
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
                <div className="call-member-actions">
                  {member.screen ? (
                    <button
                      type="button"
                      className={
                        selectedScreenShare === member.identity
                          ? "call-member-screen active"
                          : "call-member-screen"
                      }
                      aria-label={
                        selectedScreenShare === member.identity
                          ? "Ocultar tela"
                          : "Ver transmissão"
                      }
                      onClick={() =>
                        syncScreenStage(
                          selectedScreenShare === member.identity
                            ? null
                            : member.identity,
                        )
                      }
                    >
                      <MonitorUp size={15} />
                      <span>
                        {selectedScreenShare === member.identity
                          ? "Ocultar tela"
                          : "Ver transmissão"}
                      </span>
                    </button>
                  ) : null}
                  <div className="call-member-icons">
                    {member.microphone ? (
                      <Mic size={16} />
                    ) : (
                      <MicOff size={16} />
                    )}
                    {member.camera ? (
                      <Video size={16} />
                    ) : (
                      <VideoOff size={16} />
                    )}
                    {member.screen ? <MonitorUp size={16} /> : null}
                  </div>
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
