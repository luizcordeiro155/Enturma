"use client";
import { useEffect, useRef, useState } from "react";
import { Eye, Mic, MicOff, MonitorUp, PhoneOff, Radio, Users, Video, VideoOff } from "lucide-react";
import { api, post } from "@/lib/api";
import { Feedback } from "./feedback";
import { MAX_WEB_UPLOAD_BYTES } from "@/lib/upload-limits";

type Material = { id: string; fileName: string; fileSize: number };
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
}: {
  roomId: string;
  ended: boolean;
}) {
  const [cap, setCap] = useState<{
    voice: boolean;
    materials: boolean;
    ai: boolean;
    aiWebSearch: boolean;
  }>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [answer, setAnswer] = useState<Answer>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api<typeof cap>("/capabilities"),
      api<Material[]>(`/study-rooms/${roomId}/materials`),
    ])
      .then(([c, m]) => {
        setCap(c);
        setMaterials(m);
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
      await api("/users/me");
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
      await api("/users/me");
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

  return (
    <div className="room-tools">
      <Feedback error={error} />

      <section className="room-tool-card">
        <div>
          <p className="eyebrow">Sala ao vivo</p>
          <h2>Chamada da turma</h2>
          <p className="muted">
            Converse por voz, abra a câmera e compartilhe sua tela sem sair do Enturma.
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

      <section className="room-tool-card">
        <h2>Materiais da turma</h2>
        {materials.length ? (
          materials.map((m) => (
            <div className="room-row" key={m.id}>
              <span>
                {m.fileName}
                <small>{Math.ceil(m.fileSize / 1024)} KB</small>
              </span>
              <button className="secondary" onClick={() => download(m)}>
                Baixar
              </button>
            </div>
          ))
        ) : (
          <p className="muted">Envie materiais para estudar em grupo e consultar com a IA.</p>
        )}
        {cap?.materials ? (
          <form onSubmit={upload}>
            <label>
              Adicionar PDF ou TXT
              <input
                type="file"
                name="file"
                required
                accept="application/pdf,text/plain,.pdf,.txt"
                disabled={ended || busy}
              />
              <small>
                Até 4 MB e 150 páginas. Compartilhe apenas materiais que você tem
                autorização para usar.
              </small>
            </label>
            <button disabled={ended || busy}>
              {busy ? "Enviando…" : "Enviar material"}
            </button>
          </form>
        ) : (
          <p className="muted">
            O envio de materiais ainda não está disponível nesta instalação.
          </p>
        )}
      </section>

      <section className="room-tool-card">
        <p className="eyebrow">Tutor com fontes</p>
        <h2>Enturma AI</h2>
        <p className="muted">
          Estude seus PDFs, peça resumos, flashcards, quizzes e explicações. No modo
          Pesquisa, a IA também pode consultar fontes externas e mostrar os links usados.
        </p>
        {cap?.ai ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              try {
                setAnswer(
                  await api(`/study-rooms/${roomId}/ai`, {
                    method: "POST",
                    body: JSON.stringify({
                      question: f.get("question"),
                      mode: f.get("mode"),
                    }),
                    signal: AbortSignal.timeout(70000),
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
              Como posso ajudar?
              <select name="mode">
                <option value="QUESTION">Responder usando os materiais</option>
                <option value="SUMMARY">Resumir materiais</option>
                <option value="FLASHCARDS">Criar flashcards</option>
                <option value="QUIZ">Criar quiz</option>
                <option value="SIMPLIFY">Explicar de forma simples</option>
                <option value="STUDY_PLAN">Criar roteiro de estudo</option>
                {cap.aiWebSearch ? (
                  <option value="RESEARCH">Pesquisar na web com fontes</option>
                ) : null}
              </select>
            </label>
            <label>
              Sua pergunta
              <textarea
                name="question"
                maxLength={2000}
                required
                placeholder="Ex.: explique este conceito e crie 3 questões para eu praticar"
              />
            </label>
            <button disabled={busy || ended}>
              {busy ? "Analisando…" : "Perguntar à Enturma AI"}
            </button>
          </form>
        ) : (
          <p className="muted">
            A IA ainda não está disponível nesta instalação.
          </p>
        )}
        {answer ? (
          <article className="ai-answer">
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
      </section>
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

function Voice({ roomId, ended }: { roomId: string; ended: boolean }) {
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
        participant.trackPublications.values() as Iterable<import("livekit-client").TrackPublication>,
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

    for (const tile of Array.from(
      videos.current?.querySelectorAll<HTMLElement>("[data-call-identity]") ?? [],
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

    const label = document.createElement("div");
    label.className = "call-media-label";
    label.textContent =
      source === "screen_share"
        ? `${name} está compartilhando a tela`
        : name;
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
    try {
      const { Room, RoomEvent, Track } = await import("livekit-client");
      const credentials = await post<{ token: string; url: string }>(
        `/study-rooms/${roomId}/voice`,
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

      call.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        track.detach().forEach((element) => element.remove());
        removeTrack(participant.identity, String(publication.source));
        refresh();
      });

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
        removeTrack(
          call.localParticipant.identity,
          String(publication.source),
        );
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

      await call.connect(credentials.url, credentials.token, { autoSubscribe: true });
      await call.localParticipant.setMicrophoneEnabled(true);
      setConnected(true);
      setMuted(false);
      refresh();
    } catch (e) {
      await room.current?.disconnect();
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleMicrophone() {
    const call = room.current;
    if (!call) return;
    try {
      await call.localParticipant.setMicrophoneEnabled(muted);
      setMuted(!muted);
      refreshMembers(call);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleCamera() {
    const call = room.current;
    if (!call) return;
    try {
      const next = !camera;
      await call.localParticipant.setCameraEnabled(next);
      setCamera(next);
      refreshMembers(call);
    } catch (e) {
      setError((e as Error).message);
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
      <div ref={audio} className="call-audio" />

      {connected ? (
        <>
          <div className="call-topbar">
            <div>
              <span className="call-live-dot" />
              <strong>Voz conectada</strong>
              <small>
                {members.length} {members.length === 1 ? "pessoa" : "pessoas"} na chamada
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
                          ? `Assistindo: ${viewers.map((member) => member.name).join(", ")}`
                          : "Aguardando espectadores"}
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
                className={member.speaking ? "call-member speaking" : "call-member"}
                key={member.identity}
              >
                <div className="call-avatar">
                  {member.name.slice(0, 1).toUpperCase()}
                </div>
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
            Todos na chamada aparecem acima. Quem estiver falando recebe destaque em tempo real.
          </small>
        </>
      ) : (
        <div className="call-entry">
          <div>
            <strong>Entre na chamada da turma</strong>
            <span>
              Veja quem está conectado, quem está falando e quem está compartilhando a tela.
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
