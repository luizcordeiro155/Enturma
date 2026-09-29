"use client";
import { useEffect, useRef, useState } from "react";
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

function Voice({ roomId, ended }: { roomId: string; ended: boolean }) {
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(false);
  const [screen, setScreen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const room = useRef<import("livekit-client").Room | null>(null);
  const audio = useRef<HTMLDivElement>(null);
  const videos = useRef<HTMLDivElement>(null);

  function clearMedia() {
    audio.current?.replaceChildren();
    videos.current?.replaceChildren();
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
      const c = await post<{ token: string; url: string }>(
        `/study-rooms/${roomId}/voice`,
      );
      const call = new Room({ adaptiveStream: true, dynacast: true });
      room.current = call;

      call.on(RoomEvent.TrackSubscribed, (track) => {
        const element = track.attach();
        element.dataset.livekitTrack = "remote";
        if (track.kind === Track.Kind.Audio) audio.current?.appendChild(element);
        else videos.current?.appendChild(element);
      });

      call.on(RoomEvent.TrackUnsubscribed, (track) =>
        track.detach().forEach((el) => el.remove()),
      );

      call.on(RoomEvent.ActiveSpeakersChanged, (people) =>
        setSpeakers(people.map((p) => p.name ?? p.identity)),
      );

      call.on(RoomEvent.Disconnected, () => {
        setConnected(false);
        setMuted(false);
        setCamera(false);
        setScreen(false);
        clearMedia();
      });

      await call.connect(c.url, c.token);
      await call.localParticipant.setMicrophoneEnabled(true);
      setConnected(true);
      setMuted(false);
    } catch (e) {
      await room.current?.disconnect();
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleCamera() {
    if (!room.current) return;
    try {
      const next = !camera;
      await room.current.localParticipant.setCameraEnabled(next);
      setCamera(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleScreen() {
    if (!room.current) return;
    try {
      const next = !screen;
      await room.current.localParticipant.setScreenShareEnabled(next);
      setScreen(next);
    } catch (e) {
      setError(
        nextScreenMessage(e),
      );
    }
  }

  return (
    <div className="call-panel">
      <Feedback error={error} />
      <div ref={audio} className="call-audio" />
      <div ref={videos} className="call-video-grid" />

      {connected ? (
        <>
          <p className="call-status">
            {speakers.length
              ? `Falando agora: ${speakers.join(", ")}`
              : "Conectado à chamada da turma."}
          </p>
          <div className="call-controls">
            <button
              className={muted ? "secondary" : ""}
              onClick={async () => {
                try {
                  await room.current?.localParticipant.setMicrophoneEnabled(muted);
                  setMuted(!muted);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              {muted ? "Ativar microfone" : "Silenciar"}
            </button>
            <button className={camera ? "" : "secondary"} onClick={toggleCamera}>
              {camera ? "Desligar câmera" : "Ligar câmera"}
            </button>
            <button className={screen ? "" : "secondary"} onClick={toggleScreen}>
              {screen ? "Parar transmissão" : "Compartilhar tela"}
            </button>
            <button
              className="secondary"
              onClick={() => room.current?.disconnect()}
            >
              Sair da chamada
            </button>
          </div>
          <small>
            O navegador sempre pede sua autorização antes de compartilhar câmera, microfone ou tela.
          </small>
        </>
      ) : (
        <button disabled={ended || busy} onClick={join}>
          {busy ? "Conectando…" : "Entrar na chamada"}
        </button>
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
