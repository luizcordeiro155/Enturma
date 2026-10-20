"use client";
import { useStudyActivity } from "@/lib/use-study-activity";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Plus,
  FileText,
  Link as LinkIcon,
  Upload,
  Sparkles,
  Trash2,
  Download,
  Send,
  LoaderCircle,
} from "lucide-react";
import { api, post, peekApiSnapshot } from "@/lib/api";
import { prepareChatImage } from "@/lib/chat-image";
import { Shell } from "./shell";
import { NotebookArtwork, NotebookArtworkEditor } from "./notebook-artwork";
import { Feedback } from "./feedback";
import { resilientRead, refreshWhenOnline } from "@/lib/offline-data";
type Source = {
  id: string;
  title: string;
  kind: string;
  status: string;
  url?: string;
  error?: string;
  content?: string;
};
type Citation = {
  number: number;
  id: string;
  title: string;
  excerpt: string;
  url?: string;
};
type Generation = {
  id: string;
  question: string;
  mode: string;
  level: string;
  answer: string;
  status: string;
  error?: string;
  citations: Citation[];
  createdAt: string;
  externalSources?: { title: string; url: string }[];
};
type Notebook = {
  notebook: NotebookIdentity;
  webSearchEnabled: boolean;
  aiEnabled: boolean;
  sources: Source[];
  generations: Generation[];
};
type NotebookIdentity = {
  id: string;
  title: string;
  hasAvatar?: boolean;
  hasBanner?: boolean;
  mediaVersion?: number;
  updatedAt?: string;
};
const modes = [
  {
    id: "LESSON",
    title: "Aula explicativa",
    description: "Conceitos, exemplos e exercícios resolvidos",
  },
  {
    id: "SUMMARY",
    title: "Resumo e revisão",
    description: "Organize o essencial do conteúdo",
  },
  {
    id: "SIMPLIFY",
    title: "Explicar de forma simples",
    description: "Analogias e método Feynman",
  },
  {
    id: "FLASHCARDS",
    title: "Flashcards",
    description: "Pratique recuperação ativa",
  },
  {
    id: "QUIZ",
    title: "Quiz comentado",
    description: "Questões e gabarito explicado",
  },
  {
    id: "STUDY_PLAN",
    title: "Plano de estudos",
    description: "Sete dias de prática e revisão espaçada",
  },
];
export function StudyNotebooks({ id }: { id?: string }) {
  useStudyActivity("NOTEBOOK", Boolean(id));
  const router = useRouter();
  const [items, setItems] = useState<NotebookIdentity[]>(
    () =>
      peekApiSnapshot<{
        items: NotebookIdentity[];
      }>("/notebooks")?.items ?? [],
  );
  const [data, setData] = useState<Notebook | undefined>(() =>
    id ? peekApiSnapshot<Notebook>(`/notebooks/${id}`) : undefined,
  );
  const [search, setSearch] = useState("");
  const [planDays, setPlanDays] = useState(7);
  const [planMinutes, setPlanMinutes] = useState(30);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sourceMode, setSourceMode] = useState("FILE");
  const [sourceTitle, setSourceTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ title: string; content: string }>();
  const [remove, setRemove] = useState<string>();
  const [activeGeneration, setActiveGeneration] = useState<string>();
  const conversation = useRef<HTMLDivElement>(null);
  const followConversation = useRef(true);
  const lastResponse = data?.generations.at(-1);
  useEffect(() => {
    if (followConversation.current && conversation.current)
      conversation.current.scrollTop = conversation.current.scrollHeight;
  }, [lastResponse?.id, lastResponse?.status]);
  useEffect(() => {
    const restore = () => {
      const match = location.hash.match(/^#generation-([a-f0-9-]+)$/i);
      if (match) setActiveGeneration(match[1]);
    };
    restore();
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, []);
  useEffect(() => {
    if (activeGeneration)
      history.replaceState(null, "", `#generation-${activeGeneration}`);
  }, [activeGeneration]);
  const load = useCallback(async () => {
    if (id) {
      const cached = await resilientRead("notebook:" + id, () =>
        api<Notebook>(`/notebooks/${id}`, { cache: "no-store" }),
      );
      setData(cached.value);
      setOffline(cached.offline);
    } else {
      const cached = await resilientRead<{ items: typeof items }>(
        "notebooks:list",
        () => api<{ items: typeof items }>("/notebooks", { cache: "no-store" }),
      );
      setItems(cached.value.items);
      setOffline(cached.offline);
    }
  }, [id]);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active)
        void load().catch((e) => {
          if (active) setError(e.message);
        });
    };
    refresh();
    const timer = id
      ? setInterval(() => {
          if (!document.hidden) refresh();
        }, 5000)
      : undefined;
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, load]);
  useEffect(() => refreshWhenOnline(() => void load()), [load]);
  const selected =
    data?.sources
      .filter((s) => s.status === "READY" && !excluded.includes(s.id))
      .slice(0, 10) ?? [];
  async function persistFlashcards() {
    if (!id) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const out = await post<{ created: number }>(
        `/practice/notebooks/${id}/flashcards`,
      );
      setNotice(
        `${out.created} flashcards foram criados e entraram na revisão espaçada do Campus.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function generate(mode: string) {
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      const r = await post<{ id: string }>(`/notebooks/${id}/generations`, {
        id: crypto.randomUUID(),
        question:
          mode === "STUDY_PLAN"
            ? `Monte um plano de ${planDays} dias com ${planMinutes} minutos por dia usando somente as fontes selecionadas. Inclua revisão e prática de recuperação. ${question}`
            : question,
        mode,
        level,
        sourceIds: selected.map((s) => s.id),
        webSearch: webSearch && data?.webSearchEnabled,
      });
      setActiveGeneration(r.id);
      followConversation.current = true;
      await load();
      setQuestion("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function addSource() {
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      await post(`/notebooks/${id}/sources`, {
        title:
          sourceTitle ||
          (sourceMode === "LINK" ? "Leitura da web" : "Minhas anotações"),
        kind: sourceMode,
        content: text,
        url,
      });
      setText("");
      setUrl("");
      setSourceTitle("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || !id) return;
    setBusy(true);
    setError("");
    try {
      if (file.type.startsWith("image/")) file = await prepareChatImage(file);
      if (file.size > 3 * 1024 * 1024)
        throw Error(
          "Envie arquivos de até 3 MB. Divida PDFs maiores em partes.",
        );
      await api("/users/me");
      const form = new FormData();
      form.set("file", file);
      const r = await fetch(`/api/backend/notebooks/${id}/files`, {
        method: "POST",
        body: form,
      });
      if (!r.ok)
        throw Error(
          (await r.json().catch(() => ({}))).message ??
            "Não foi possível enviar a fonte.",
        );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const pending = data?.generations.some((g) =>
    ["PENDING", "PROCESSING"].includes(g.status),
  );
  const canSend =
    !busy && !pending && !offline && !!data?.aiEnabled && selected.length > 0;
  function download(g: Generation) {
    const blob = new Blob(
      [
        `# ${data?.notebook.title}\n\n${g.answer}\n\n## Fontes\n${g.citations.map((c) => `[${c.number}] ${c.title}${c.url ? " — " + c.url : ""}\n${c.excerpt}`).join("\n\n")}`,
      ],
      { type: "text/markdown;charset=utf-8" },
    );
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "enturma-estudo.md";
    a.click();
    URL.revokeObjectURL(href);
  }
  return (
    <Shell>
      <div className={`notebooks-page ${id ? "notebook-detail" : ""}`}>
        <header className="notebooks-heading">
          <div>
            <span className="eyebrow">Enturma AI · seu espaço de estudo</span>
            <h1>
              {data?.notebook.title ??
                "Transforme suas fontes em conhecimento."}
            </h1>
            <p>
              Documentos, links, imagens e anotações. Aulas e respostas
              fundamentadas no que você escolheu estudar.
            </p>
          </div>
          {id ? (
            <Link className="button secondary" href="/notebooks">
              Meus cadernos
            </Link>
          ) : (
            <BookOpen size={44} />
          )}
        </header>
        <Feedback
          error={error}
          success={
            offline
              ? "Modo offline: mostrando a última cópia sincronizada."
              : notice
          }
        />
        {!id ? (
          <>
            <form
              className="notebook-create"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const n = await post<{ id: string }>("/notebooks", { title });
                  router.push(`/notebooks/${n.id}`);
                } catch (e) {
                  setError((e as Error).message);
                  setBusy(false);
                }
              }}
            >
              <label>
                Nome do caderno
                <input
                  value={title}
                  maxLength={120}
                  required
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Matemática computacional"
                />
              </label>
              <button disabled={busy || !title.trim()}>
                <Plus size={18} />
                Criar caderno
              </button>
            </form>
            <label className="notebook-library-search">
              Buscar caderno
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome do caderno…"
              />
            </label>
            <div className="notebook-library">
              {items
                .filter((n) =>
                  n.title
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase()),
                )
                .map((n) => (
                  <Link
                    key={n.id}
                    href={`/notebooks/${n.id}`}
                    className="notebook-cover"
                  >
                    <NotebookArtwork notebook={n} />
                    <h2>{n.title}</h2>
                    <span>
                      Atualizado em{" "}
                      {new Date(n.updatedAt ?? "").toLocaleDateString("pt-BR")}
                    </span>
                  </Link>
                ))}
            </div>
            {!items.length ? (
              <div className="notebook-empty">
                <Sparkles />
                <h2>Comece pelo que você quer aprender.</h2>
                <p>
                  Crie um caderno, adicione sua primeira fonte e converse com o
                  Enturma APP. Tudo fica salvo para revisar depois.
                </p>
              </div>
            ) : null}
          </>
        ) : !data ? (
          <p role="status">Abrindo caderno…</p>
        ) : (
          <>
            <NotebookArtwork notebook={data.notebook} />
            <div className="notebook-toolbar">
              <button
                className="secondary notebook-sources-toggle"
                onClick={() => setSourcesOpen((open) => !open)}
                aria-expanded={sourcesOpen}
              >
                Fontes · {data.sources.length}
              </button>
              <label>
                Nível de explicação
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="BEGINNER">Iniciante</option>
                  <option value="INTERMEDIATE">Intermediário</option>
                  <option value="ADVANCED">Avançado</option>
                </select>
              </label>
              <details>
                <summary>Gerenciar caderno</summary>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const t = new FormData(e.currentTarget).get("title");
                    try {
                      await api(`/notebooks/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({ title: t }),
                      });
                      await load();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <input
                    aria-label="Renomear caderno"
                    name="title"
                    defaultValue={data.notebook.title}
                    required
                    maxLength={120}
                  />
                  <button>Salvar nome</button>
                </form>
                <NotebookArtworkEditor
                  notebook={data.notebook}
                  onChanged={load}
                  onError={setError}
                />
                <button
                  className="secondary"
                  onClick={() => setRemove("notebook")}
                >
                  Excluir caderno
                </button>
              </details>
            </div>
            {!data.aiEnabled ? (
              <p className="feedback error">
                A IA ainda não está configurada. Você pode guardar documentos,
                links e textos enquanto isso.
              </p>
            ) : null}
            <div
              className="notebook-workspace notebook-chat-workspace"
              data-sources-open={sourcesOpen}
            >
              <aside className="notebook-sources">
                <h2>
                  Suas fontes <small>{data.sources.length}/20</small>
                </h2>
                <p className="muted">
                  Selecione até 10 fontes para a próxima geração.
                </p>
                <div className="source-tabs">
                  {[
                    ["FILE", "Arquivo"],
                    ["LINK", "Link"],
                    ["TEXT", "Texto"],
                  ].map(([value, label]) => (
                    <button
                      className="secondary"
                      key={value}
                      aria-pressed={sourceMode === value}
                      onClick={() => setSourceMode(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {sourceMode === "FILE" ? (
                  <label className="notebook-upload">
                    <Upload />
                    <strong>Adicionar documento ou imagem</strong>
                    <span>PDF, DOCX, TXT, MD, JPG, PNG ou WEBP · até 3 MB</span>
                    <input
                      aria-label="Arquivo de estudo"
                      type="file"
                      accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp"
                      disabled={busy}
                      onChange={(e) => {
                        void upload(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                ) : (
                  <form
                    className="source-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void addSource();
                    }}
                  >
                    <label>
                      Título da fonte
                      <input
                        value={sourceTitle}
                        onChange={(e) => setSourceTitle(e.target.value)}
                        maxLength={200}
                        placeholder="Título para identificar nas citações"
                      />
                    </label>
                    {sourceMode === "LINK" ? (
                      <label>
                        Link público HTTPS
                        <input
                          type="url"
                          required
                          value={url}
                          maxLength={2000}
                          placeholder="https://…"
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </label>
                    ) : (
                      <label>
                        Conteúdo para estudar
                        <textarea
                          value={text}
                          required
                          minLength={20}
                          maxLength={100000}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Cole suas anotações, um trecho de livro ou o conteúdo da aula…"
                        />
                      </label>
                    )}
                    <button disabled={busy}>Adicionar fonte</button>
                  </form>
                )}
                <p className="source-privacy">
                  Caderno privado. As fontes selecionadas são enviadas ao
                  provedor de IA para gerar seu estudo. Imagens são transcritas
                  pela IA; confira a leitura.
                </p>
                <div className="source-list">
                  {data.sources.map((s) => (
                    <article key={s.id}>
                      <label>
                        <input
                          type="checkbox"
                          aria-label={`Usar ${s.title}`}
                          checked={selected.some((x) => x.id === s.id)}
                          disabled={
                            s.status !== "READY" ||
                            (!selected.some((x) => x.id === s.id) &&
                              selected.length >= 10)
                          }
                          onChange={(e) =>
                            setExcluded((v) =>
                              e.target.checked
                                ? v.filter((x) => x !== s.id)
                                : [...v, s.id],
                            )
                          }
                        />
                        {s.kind === "LINK" ? (
                          <LinkIcon size={16} />
                        ) : (
                          <FileText size={16} />
                        )}
                        <strong>{s.title}</strong>
                      </label>
                      <small>
                        {s.status === "READY"
                          ? "Pronta para estudar"
                          : s.status === "FAILED"
                            ? s.error
                            : "Lendo sua fonte…"}
                      </small>
                      <div>
                        <button
                          className="text-button"
                          disabled={s.status !== "READY"}
                          onClick={async () => {
                            try {
                              const p = await api<Source>(
                                `/notebooks/${id}/sources/${s.id}`,
                              );
                              setPreview({
                                title: p.title,
                                content: p.content ?? "",
                              });
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          Ver conteúdo
                        </button>
                        <button
                          className="text-button"
                          aria-label={`Remover ${s.title}`}
                          onClick={() => setRemove(s.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </aside>
              <section className="notebook-studio">
                <div className="studio-heading">
                  <Sparkles />
                  <div>
                    <h2>
                      Enturma APP <small>Seu parceiro de estudo</small>
                    </h2>
                    <p>
                      {selected.length} fontes selecionadas · conversa privada e
                      salva
                    </p>
                  </div>
                </div>
                <details className="notebook-study-tools">
                  <summary>Ferramentas de estudo</summary>
                  <div className="notebook-smart-actions">
                    <button
                      className="secondary"
                      disabled={!canSend}
                      onClick={() => void persistFlashcards()}
                    >
                      <Sparkles size={16} /> Criar flashcards de revisão
                      espaçada
                    </button>
                  </div>
                  <div className="study-modes">
                    {modes.map((m) => (
                      <button
                        key={m.id}
                        className="secondary"
                        disabled={!canSend}
                        onClick={() => void generate(m.id)}
                      >
                        <strong>{m.title}</strong>
                        <small>{m.description}</small>
                      </button>
                    ))}
                  </div>
                  <section className="notebook-study-plan">
                    <h3>Um plano que cabe na sua rotina</h3>
                    <div>
                      <label>
                        Dias de estudo
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={planDays}
                          onChange={(e) =>
                            setPlanDays(
                              Math.max(1, Math.min(30, Number(e.target.value))),
                            )
                          }
                        />
                      </label>
                      <label>
                        Minutos por dia
                        <input
                          type="number"
                          min={10}
                          max={180}
                          step={5}
                          value={planMinutes}
                          onChange={(e) =>
                            setPlanMinutes(
                              Math.max(
                                10,
                                Math.min(180, Number(e.target.value)),
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      disabled={!canSend}
                      onClick={() => void generate("STUDY_PLAN")}
                    >
                      Criar meu plano de revisão
                    </button>
                    <small>
                      Baseado nas {selected.length} fontes selecionadas. A IA
                      prepara o plano; você escolhe quando estudar.
                    </small>
                  </section>
                </details>
                {data.generations.length ? (
                  <p className="notebook-history-label">
                    Conversa · {data.generations.length} respostas salvas
                  </p>
                ) : (
                  <div className="notebook-empty">
                    <BookOpen />
                    <h3>Seu próximo aprendizado começa aqui.</h3>
                    <p>
                      Adicione suas fontes e me diga o que quer entender.
                      Podemos explorar um conceito, resolver um exercício ou
                      continuar de onde você parou.
                    </p>
                  </div>
                )}
                <div
                  className="notebook-conversation"
                  aria-label="Conversa com Enturma APP"
                  ref={conversation}
                  onScroll={(event) => {
                    const node = event.currentTarget;
                    followConversation.current =
                      node.scrollHeight - node.scrollTop - node.clientHeight <
                      80;
                  }}
                >
                  {data.generations.map((current) => (
                    <article
                      key={current.id}
                      className="study-generation notebook-chat-turn"
                      id={`generation-${current.id}`}
                    >
                      <div className="notebook-user-message">
                        <small>Você</small>
                        <p>
                          {current.question ||
                            modes.find((m) => m.id === current.mode)?.title}
                        </p>
                      </div>
                      <div className="notebook-assistant-message">
                        <strong className="notebook-bot-label">
                          <BookOpen size={18} /> Enturma APP
                        </strong>
                        {current.status === "READY" ? (
                          <>
                            <header>
                              <h2>
                                {modes.find((m) => m.id === current.mode)
                                  ?.title ?? "Resposta"}
                              </h2>
                              <button
                                className="secondary"
                                aria-label="Baixar material de estudo"
                                onClick={() => download(current)}
                              >
                                <Download size={17} />
                              </button>
                            </header>
                            <StudyAnswer
                              content={current.answer}
                              onCitation={(n) => {
                                const c = current.citations.find(
                                  (c) => c.number === n,
                                );
                                if (c)
                                  setPreview({
                                    title: `[${n}] ${c.title}`,
                                    content: c.excerpt,
                                  });
                              }}
                            />
                            <details className="generation-sources">
                              <summary>
                                Conferir fontes utilizadas (
                                {current.citations.length})
                              </summary>
                              {current.citations.map((c) => (
                                <button
                                  className="secondary"
                                  key={c.number}
                                  onClick={() =>
                                    setPreview({
                                      title: `[${c.number}] ${c.title}`,
                                      content: c.excerpt,
                                    })
                                  }
                                >
                                  [{c.number}] {c.title}
                                </button>
                              ))}
                            </details>
                            {current.externalSources?.length ? (
                              <details className="generation-sources">
                                <summary>
                                  Pesquisa na web (
                                  {current.externalSources.length})
                                </summary>
                                {current.externalSources
                                  .filter((source) =>
                                    /^https?:\/\//i.test(source.url),
                                  )
                                  .map((source, index) => (
                                    <a
                                      key={index}
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {source.title || source.url} ↗
                                    </a>
                                  ))}
                              </details>
                            ) : null}
                            <p className="muted">
                              A IA pode cometer erros. Confira as citações e o
                              material original.
                            </p>
                          </>
                        ) : current.status === "FAILED" ? (
                          <div role="alert">
                            <p>{current.error}</p>
                            <button
                              disabled={busy || !selected.length}
                              onClick={() => setQuestion(current.question)}
                            >
                              Editar e reenviar
                            </button>
                          </div>
                        ) : (
                          <div className="generation-loading" role="status">
                            <LoaderCircle />
                            <h3>Preparando seu estudo…</h3>
                            <p>
                              Você pode sair desta página. O resultado ficará
                              salvo neste caderno.
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                <form
                  className="notebook-question"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void generate("QUESTION");
                  }}
                >
                  <label>
                    Mensagem para o Enturma APP
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      maxLength={2000}
                      placeholder="Pergunte, peça um exemplo ou continue a conversa…"
                    />
                  </label>
                  <label className="notebook-web-search">
                    <input
                      type="checkbox"
                      checked={webSearch}
                      disabled={!data.webSearchEnabled}
                      onChange={(event) => setWebSearch(event.target.checked)}
                    />
                    Pesquisar também na web
                    {!data.webSearchEnabled && (
                      <small>Indisponível neste momento</small>
                    )}
                  </label>
                  <button disabled={!canSend || !question.trim()}>
                    <Send size={16} />
                    Enviar mensagem
                  </button>
                </form>
              </section>
            </div>
          </>
        )}
        {preview ? (
          <StudyDialog
            title={preview.title}
            onClose={() => setPreview(undefined)}
          >
            <header>
              <h2>{preview.title}</h2>
              <button autoFocus onClick={() => setPreview(undefined)}>
                Fechar fonte
              </button>
            </header>
            <pre>{preview.content}</pre>
          </StudyDialog>
        ) : null}
        {remove ? (
          <StudyDialog
            title="Confirmar exclusão"
            onClose={() => setRemove(undefined)}
          >
            <h2>
              {remove === "notebook"
                ? "Excluir este caderno e todos os estudos?"
                : "Remover esta fonte?"}
            </h2>
            <p>
              {remove === "notebook"
                ? "Esta ação remove permanentemente as fontes e respostas deste caderno."
                : "Respostas já geradas mantêm os trechos citados. Exclua o caderno para apagar todo o histórico."}
            </p>
            <button
              autoFocus
              className="secondary"
              onClick={() => setRemove(undefined)}
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  await api(
                    `/notebooks/${id}${remove === "notebook" ? "" : `/sources/${remove}`}`,
                    { method: "DELETE" },
                  );
                  if (remove === "notebook") router.push("/notebooks");
                  else await load();
                  setRemove(undefined);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Confirmar exclusão
            </button>
          </StudyDialog>
        ) : null}
      </div>
    </Shell>
  );
}
function StudyAnswer({
  content,
  onCitation,
}: {
  content: string;
  onCitation: (n: number) => void;
}) {
  function inline(line: string) {
    return line.split(/(\[\d+\]|\*\*[^*]+\*\*)/g).map((part, i) =>
      /^\[\d+\]$/.test(part) ? (
        <button
          className="citation"
          key={i}
          onClick={() => onCitation(Number(part.slice(1, -1)))}
        >
          {part}
        </button>
      ) : part.startsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
  }
  return (
    <div className="study-answer">
      {content.split("```").map((block, i) =>
        i % 2 ? (
          <pre key={i}>
            <code>{block.replace(/^\w*\n/, "")}</code>
          </pre>
        ) : (
          block
            .split("\n")
            .map((line, j) =>
              line.startsWith("#") ? (
                <h3 key={`${i}:${j}`}>{inline(line.replace(/^#+\s*/, ""))}</h3>
              ) : line.trim() ? (
                <p key={`${i}:${j}`}>{inline(line)}</p>
              ) : null,
            )
        ),
      )}
    </div>
  );
}

function StudyDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="study-dialog"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div>{children}</div>
    </dialog>
  );
}
