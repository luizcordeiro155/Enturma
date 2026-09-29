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
      <h2>Chamada de voz</h2>
      {cap?.voice ? (
        <Voice roomId={roomId} ended={ended} />
      ) : (
        <p className="muted">
          As chamadas ainda não estão disponíveis nesta instalação.
        </p>
      )}
      <h2>Materiais da turma</h2>
      {materials.map((m) => (
        <div className="room-row" key={m.id}>
          <span>
            {m.fileName}
            <small>{Math.ceil(m.fileSize / 1024)} KB</small>
          </span>
          <button className="secondary" onClick={() => download(m)}>
            Baixar
          </button>
        </div>
      ))}
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
      <h2>Enturma AI</h2>
      <p className="muted">
        Pergunte sobre os materiais da sala. As fontes utilizadas aparecem junto
        da resposta.
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
                  signal: AbortSignal.timeout(60000),
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
              <option value="QUESTION">Responder uma pergunta</option>
              <option value="SUMMARY">Resumir materiais</option>
              <option value="FLASHCARDS">Criar flashcards</option>
              <option value="QUIZ">Criar quiz</option>
              <option value="SIMPLIFY">Explicar de forma simples</option>
              <option value="STUDY_PLAN">Criar roteiro de estudo</option>
            </select>
          </label>
          <label>
            Sua pergunta
            <textarea name="question" maxLength={2000} required />
          </label>
          <button disabled={busy || ended}>
            {busy ? "Consultando os materiais…" : "Perguntar à Enturma AI"}
          </button>
        </form>
      ) : (
        <p className="muted">
          A IA ainda não está disponível nesta instalação.
        </p>
      )}
      {answer ? (
        <article className="ai-answer">
          <p>{answer.answer}</p>
          {answer.sources.map((s) => (
            <details key={s.number}>
              <summary>
                [{s.number}] {s.fileName}
                {s.page ? ` · página ${s.page}` : ""}
              </summary>
              <blockquote>{s.excerpt}</blockquote>
            </details>
          ))}
        </article>
      ) : null}
    </div>
  );
}
function Voice({ roomId, ended }: { roomId: string; ended: boolean }) {
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const room = useRef<import("livekit-client").Room | null>(null);
  const audio = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      void room.current?.disconnect();
    },
    [],
  );
  useEffect(() => {
    if (ended) void room.current?.disconnect();
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
        if (track.kind === Track.Kind.Audio)
          audio.current?.appendChild(track.attach());
      });
      call.on(RoomEvent.TrackUnsubscribed, (track) =>
        track.detach().forEach((el) => el.remove()),
      );
      call.on(RoomEvent.ActiveSpeakersChanged, (people) =>
        setSpeakers(people.map((p) => p.name ?? p.identity)),
      );
      call.on(RoomEvent.Disconnected, () => {
        setConnected(false);
        audio.current?.replaceChildren();
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
  return (
    <div>
      <Feedback error={error} />
      <div ref={audio} />
      {connected ? (
        <>
          <p>
            {speakers.length
              ? `Falando: ${speakers.join(", ")}`
              : "Você está na chamada."}
          </p>
          <div className="actions">
            <button
              onClick={async () => {
                try {
                  await room.current?.localParticipant.setMicrophoneEnabled(
                    muted,
                  );
                  setMuted(!muted);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              {muted ? "Ativar microfone" : "Silenciar"}
            </button>
            <button
              className="secondary"
              onClick={() => room.current?.disconnect()}
            >
              Sair da chamada
            </button>
          </div>
        </>
      ) : (
        <button disabled={ended || busy} onClick={join}>
          {busy ? "Conectando…" : "Entrar na chamada"}
        </button>
      )}
    </div>
  );
}
