"use client";
import Link from "next/link";
import { CallMount as Voice } from "./call-session-provider";
import { useEffect, useState } from "react";
import { Sparkles, FileText, Brain } from "lucide-react";
import { api } from "@/lib/api";
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

export { CallMount as Voice } from "./call-session-provider";
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
