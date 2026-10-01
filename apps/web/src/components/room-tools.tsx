"use client";
import Link from "next/link";
import { LiveIdentity } from "./user-identity";
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
  Sparkles,
  FileText,
  Brain,
} from "lucide-react";
import { api, post } from "@/lib/api";
import { Feedback } from "./feedback";
import { MAX_WEB_UPLOAD_BYTES } from "@/lib/upload-limits";

type Material = { id: string; fileName: string; fileSize: number };
type Artifact = {
  id: string;
  kind: string;
  title: string;
  content?: string;
  createdAt: string;
};
type Answer = {
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

export function RoomTools({
  roomId,
  ended,
  view,
}: {
  roomId: string;
  ended: boolean;
  view: "call" | "materials" | "ai";
}) {
  const [cap, setCap] = useState<{
    voice: boolean;
    materials: boolean;
    ai: boolean;
    aiWebSearch: boolean;
  }>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [answer, setAnswer] = useState<Answer>();
  const [error, setError] = useState("");
  const [deviceNotice, setDeviceNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api<typeof cap>("/capabilities"),
      api<Material[]>(`/study-rooms/${roomId}/materials`),
      api<Artifact[]>(`/study-rooms/${roomId}/ai/artifacts`).catch(() => []),
    ])
      .then(([c, m, a]) => {
        setCap(c);
        setMaterials(m);
        setArtifacts(a);
      })
      .catch((e) => setError(e.message));
  }, [roomId]);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const file = form.get("file");
      if (!(file instanceof File) || file.size > MAX_WEB_UPLOAD_BYTES)
        throw Error("Selecione um PDF ou TXT de até 4 MB.");
      const res = await fetch(`/api/backend/study-rooms/${roomId}/materials`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        const err = await res.json();
        throw Error(err.message ?? "Não foi possível enviar o arquivo.");
      }
      setMaterials(await api(`/study-rooms/${roomId}/materials`));
      e.currentTarget.reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function download(m: Material) {
    try {
      const res = await fetch(
        `/api/backend/study-rooms/${roomId}/materials/${m.id}`,
      );
      if (!res.ok) throw Error("Não foi possível baixar o material.");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = m.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function runAi(path: string) {
    setBusy(true);
    setError("");
    try {
      const result = await api<Answer>(`/study-rooms/${roomId}/ai/${path}`, {
        method: "POST",
        signal: AbortSignal.timeout(90000),
      });
      setAnswer(result);
      setArtifacts(
        await api<Artifact[]>(`/study-rooms/${roomId}/ai/artifacts`),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openArtifact(id: string) {
    try {
      const item = await api<Artifact>(
        `/study-rooms/${roomId}/ai/artifacts/${id}`,
      );
      setAnswer({ answer: item.content ?? "", sources: [], webSources: [] });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="room-tools room-channel-content">
      <Feedback error={error} />

      {view === "call" ? (
        <section className="room-tool-card channel-card">
          <div>
            <p className="eyebrow">Sala ao vivo</p>
            <h2>Chamada da turma</h2>
            <p className="muted">
              Voz, câmera e compartilhamento de tela com participantes e
              indicador de fala.
            </p>
          </div>
          {cap?.voice ? (
            <Voice roomId={roomId} ended={ended} />
          ) : (
            <p className="muted">
              As chamadas ainda não estão disponíveis nesta instalação.
            </p>
          )}
        </section>
      ) : null}

      {view === "materials" ? (
        <section className="room-tool-card channel-card">
          <div>
            <p className="eyebrow">Biblioteca compartilhada</p>
            <h2>Materiais da turma</h2>
          </div>
          {materials.length ? (
            materials.map((m) => (
              <div className="room-row" key={m.id}>
                <span>
                  {m.fileName}
                  <small>{Math.ceil(m.fileSize / 1024)} KB</small>
                </span>
                <button className="secondary" onClick={() => void download(m)}>
                  Baixar
                </button>
              </div>
            ))
          ) : (
            <div className="empty compact">
              <FileText size={28} />
              <p>Nenhum material compartilhado ainda.</p>
            </div>
          )}
          {cap?.materials && !ended ? (
            <form onSubmit={upload}>
              <label>
                Adicionar PDF ou TXT
                <input
                  type="file"
                  name="file"
                  required
                  accept="application/pdf,text/plain,.pdf,.txt"
                  disabled={busy}
                />
                <small>Até 4 MB e 150 páginas.</small>
              </label>
              <button disabled={busy}>
                {busy ? "Enviando…" : "Enviar material"}
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      {view === "ai" ? (
        <section className="room-tool-card channel-card ai-channel">
          <div className="ai-channel-heading">
            <div>
              <p className="eyebrow">Memória da turma</p>
              <h2>Enturma AI</h2>
              <Link className="button secondary" href="/notebooks">
                Abrir meus cadernos de estudo
              </Link>
              <p className="muted">
                A IA consulta histórico autorizado, checkpoints e materiais sem
                carregar a sala inteira no navegador.
              </p>
            </div>
            <Brain size={30} />
          </div>

          {cap?.ai ? (
            <>
              <div className="ai-quick-actions">
                <button disabled={busy} onClick={() => void runAi("catch-up")}>
                  <Sparkles size={17} /> Me atualizar com IA
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => void runAi("session-report")}
                >
                  Gerar relatório da sessão
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => void runAi("study-material")}
                >
                  Gerar material de estudo
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  const form = new FormData(e.currentTarget);
                  try {
                    setAnswer(
                      await api(`/study-rooms/${roomId}/ai`, {
                        method: "POST",
                        body: JSON.stringify({
                          question: form.get("question"),
                          mode: form.get("mode"),
                        }),
                        signal: AbortSignal.timeout(90000),
                      }),
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Tipo de ajuda
                  <select name="mode">
                    <option value="QUESTION">Perguntar sobre a turma</option>
                    <option value="SUMMARY">Resumir o que foi estudado</option>
                    <option value="FLASHCARDS">Criar flashcards</option>
                    <option value="QUIZ">Criar quiz</option>
                    <option value="SIMPLIFY">Explicar de forma simples</option>
                    <option value="STUDY_PLAN">Criar roteiro de estudo</option>
                    {cap.aiWebSearch ? (
                      <option value="RESEARCH">
                        Pesquisar na web com fontes
                      </option>
                    ) : null}
                  </select>
                </label>
                <label>
                  Pergunta
                  <textarea
                    name="question"
                    maxLength={2000}
                    required
                    placeholder="Ex.: o que estudamos sobre recursividade?"
                  />
                </label>
                <button disabled={busy}>
                  {busy ? "Analisando contexto…" : "Perguntar à Enturma AI"}
                </button>
              </form>
            </>
          ) : (
            <p className="muted">
              A IA ainda não está disponível nesta instalação.
            </p>
          )}

          {answer ? (
            <article className="ai-answer" aria-live="polite">
              <p>{renderCitedAnswer(answer.answer, answer.webSources ?? [])}</p>
              {answer.sources.length ? <h3>Materiais usados</h3> : null}
              {answer.sources.map((s) => (
                <details key={`${s.materialId}-${s.number}`}>
                  <summary>
                    [{s.number}] {s.fileName}
                    {s.page ? ` · página ${s.page}` : ""}
                  </summary>
                  <blockquote>{s.excerpt}</blockquote>
                </details>
              ))}
              {answer.webSources?.length ? (
                <>
                  <h3>Fontes da pesquisa</h3>
                  <div className="ai-web-sources">
                    {answer.webSources.map((s) => (
                      <a
                        key={`${s.url}-${s.startIndex}`}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                </>
              ) : null}
            </article>
          ) : null}

          {artifacts.length ? (
            <div className="session-artifacts">
              <h3>Conhecimento salvo desta sessão</h3>
              {artifacts.map((artifact) => (
                <button
                  className="artifact-row"
                  key={artifact.id}
                  onClick={() => void openArtifact(artifact.id)}
                >
                  <FileText size={17} />
                  <span>
                    <strong>{artifact.title}</strong>
                    <small>
                      {new Date(artifact.createdAt).toLocaleString("pt-BR")}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

type CallMember = {
  identity: string;
  name: string;
  local: boolean;
  speaking: boolean;
  microphone: boolean;
  camera: boolean;
  screen: boolean;
};

export function Voice({
  roomId,
  ended,
  endpoint,
}: {
  roomId: string;
  ended: boolean;
  endpoint?: string;
}) {
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(false);
  const [screen, setScreen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<CallMember[]>([]);
  const room = useRef<import("livekit-client").Room | null>(null);
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

  useEffect(
    () => () => {
      void room.current?.disconnect();
      clearMedia();
    },
    [],
  );

  useEffect(() => {
    if (ended) {
      void room.current?.disconnect();
      clearMedia();
    }
  }, [ended]);

  async function join() {
    setBusy(true);
    setError("");
    setDeviceNotice("");
    try {
      const { Room, RoomEvent, Track } = await import("livekit-client");
      const credentials = await post<{ token: string; url: string }>(
        endpoint ?? `/study-rooms/${roomId}/voice`,
      );
      const call = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
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

        await call.localParticipant.setMicrophoneEnabled(true);
        setMuted(false);
      } catch (micError) {
        setMuted(true);
        setDeviceNotice(mediaDeviceMessage(micError, "microphone"));
      }

      refresh();
    } catch (e) {
      await room.current?.disconnect();
      setError(callConnectionMessage(e));
    } finally {
      setBusy(false);
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

          <div ref={videos} className="call-video-grid" />

          <div className="call-members">
            {members.map((member) => (
              <article
                className={
                  member.speaking ? "call-member speaking" : "call-member"
                }
                key={member.identity}
              >
                <LiveIdentity id={member.identity} name={member.name} />
                <div className="call-member-info">
                  <strong>
                    {member.name}
                    {member.local ? " (você)" : ""}
                  </strong>
                  <small>
                    {member.screen
                      ? "Compartilhando tela"
                      : member.speaking
                        ? "Falando agora"
                        : "Na chamada"}
                  </small>
                </div>
                <div className="call-member-icons">
                  {member.microphone ? <Mic size={16} /> : <MicOff size={16} />}
                  {member.camera ? <Video size={16} /> : <VideoOff size={16} />}
                  {member.screen ? <MonitorUp size={16} /> : null}
                </div>
              </article>
            ))}
          </div>

          <div className="call-controls discord-controls">
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
              title={screen ? "Parar compartilhamento" : "Compartilhar tela"}
            >
              <MonitorUp size={20} />
              <span>{screen ? "Parar tela" : "Compartilhar"}</span>
            </button>
            <button
              type="button"
              className="call-control hangup"
              onClick={() => room.current?.disconnect()}
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

function mediaDeviceMessage(
  error: unknown,
  kind: "microphone" | "camera",
) {
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

function renderCitedAnswer(
  text: string,
  sources: NonNullable<Answer["webSources"]>,
) {
  if (!sources.length) return text;
  const ordered = [...sources]
    .filter(
      (source) =>
        source.startIndex >= 0 &&
        source.endIndex > source.startIndex &&
        source.endIndex <= text.length,
    )
    .sort((a, b) => a.startIndex - b.startIndex);

  if (!ordered.length) return text;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const source of ordered) {
    if (source.startIndex < cursor) continue;
    if (source.startIndex > cursor)
      parts.push(text.slice(cursor, source.startIndex));
    parts.push(
      <a
        key={`${source.url}-${source.startIndex}`}
        href={source.url}
        target="_blank"
        rel="noreferrer"
        title={source.title}
      >
        {text.slice(source.startIndex, source.endIndex)}
      </a>,
    );
    cursor = source.endIndex;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
