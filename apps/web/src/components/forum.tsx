"use client";
import { ForumLinks } from "./forum-links";
import { useLiveRefresh } from "@/lib/live-updates";
import { useNotificationTarget, focusMessage } from "./notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Search,
  Plus,
  ArrowLeft,
  Bookmark,
  Flag,
  Pencil,
  Trash2,
} from "lucide-react";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { UserIdentity, type PublicProfile } from "./user-identity";
import { Feedback } from "./feedback";
const categories: Record<string, string> = {
  GENERAL: "Conversa geral",
  PROGRAMMING: "Programação",
  ACADEMIC: "Estudos e matérias",
  CAREER: "Carreira e estágio",
  CAMPUS: "Vida no campus",
};
const emojis = ["👍", "❤️", "💡", "🎉", "🤔"];
type Entry = PublicProfile & {
  authorId: string;
  rootId: string | null;
  parentId: string | null;
  title: string;
  body: string;
  category: string;
  depth: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  score: number;
  myVote: number;
  commentsCount: number;
  reactions: { emoji: string; count: number; mine: boolean }[];
  acceptedAnswerId?: string | null;
  accepted?: boolean;
  reputation?: number;
};
type PageData = { items: Entry[]; hasMore: boolean };
type Me = { id: string; role: string };
export function Forum({
  id,
  initialCategory = "",
}: {
  id?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  useNotificationTarget();
  const [me, setMe] = useState<Me>();
  const [items, setItems] = useState<Entry[]>([]);
  const [current, setCurrent] = useState<Entry>();
  const [comments, setComments] = useState<Entry[]>([]);
  const [related, setRelated] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("new");
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [compose, setCompose] = useState(false);
  const [editing, setEditing] = useState<Entry>();
  const [reply, setReply] = useState<Entry>();
  const [body, setBody] = useState("");
  const [report, setReport] = useState<Entry>();
  const commentInput = useRef<HTMLTextAreaElement>(null);
  const sequence = useRef(0);
  useEffect(() => {
    if (!id) return;
    let active = true;
    const jump = async () => {
      const target = location.hash.match(/^#entry-([a-f0-9-]+)$/)?.[1];
      if (!target || target === id) return;
      try {
        const e = await api<Entry>(`/forum/${id}/target/${target}`);
        if (active) {
          setComments((old) =>
            old.some((c) => c.id === e.id) ? old : [...old, e],
          );
          focusMessage(`entry-${target}`);
        }
      } catch {}
    };
    const timer = setTimeout(() => void jump(), 500);
    window.addEventListener("hashchange", jump);
    window.addEventListener("enturma-notification-open", jump);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("hashchange", jump);
      window.removeEventListener("enturma-notification-open", jump);
    };
  }, [id]);
  const load = useCallback(
    async (pageNumber = 0, refresh = false) => {
      const version = ++sequence.current;
      try {
        if (id) {
          const [p, c, r] = await Promise.all([
            api<Entry>(`/forum/${id}`),
            Promise.all(
              Array.from({ length: refresh ? pageNumber + 1 : 1 }, (_, i) =>
                api<PageData>(
                  `/forum/${id}/comments?page=${refresh ? i : pageNumber}`,
                ),
              ),
            ).then((pages) => ({
              items: pages.flatMap((p) => p.items),
              hasMore: pages.at(-1)!.hasMore,
            })),
            api<Entry[]>(`/forum/${id}/related`),
          ]);
          if (version !== sequence.current) return;
          setCurrent(p);
          setRelated(r);
          setComments((old) =>
            pageNumber && !refresh
              ? [
                  ...old,
                  ...c.items.filter(
                    (item) => !old.some((e) => e.id === item.id),
                  ),
                ]
              : c.items,
          );
          setMore(c.hasMore);
        } else {
          const pages = await Promise.all(
            Array.from({ length: refresh ? pageNumber + 1 : 1 }, (_, i) =>
              api<PageData>(
                `/forum?${new URLSearchParams({ q: search, category, sort, mine: String(mine), page: String(refresh ? i : pageNumber) })}`,
              ),
            ),
          );
          const data = {
            items: pages.flatMap((p) => p.items),
            hasMore: pages.at(-1)!.hasMore,
          };
          if (version !== sequence.current) return;
          setItems((old) =>
            pageNumber && !refresh ? [...old, ...data.items] : data.items,
          );
          setMore(data.hasMore);
        }
        setPage(pageNumber);
        setError("");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (version === sequence.current) setLoading(false);
      }
    },
    [id, search, category, sort, mine],
  );
  useLiveRefresh("forum_changed", () => load(page, true));
  useEffect(() => {
    const counter = sequence;
    const timer = setTimeout(() => void load(), 0);
    return () => {
      clearTimeout(timer);
      counter.current++;
    };
  }, [load]);
  useEffect(() => {
    void api<Me>("/users/me")
      .then(setMe)
      .catch((e) => setError(e.message));
  }, []);
  async function mutate(path: string, method: string, data?: unknown) {
    setBusy(true);
    setError("");
    try {
      await api(path, {
        method,
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(entry: Entry) {
    if (
      !confirm(
        entry.rootId
          ? "Excluir seu comentário? As respostas dos colegas serão preservadas."
          : "Excluir esta publicação e todos os seus comentários? Não é possível desfazer.",
      )
    )
      return;
    setBusy(true);
    try {
      await api(`/forum/${entry.id}`, { method: "DELETE" });
      if (!entry.rootId && id) router.push("/forum");
      else await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const actions = (entry: Entry) => (
    <div className="forum-entry-actions">
      <div className="forum-votes" aria-label="Votos">
        <button
          className="icon-control"
          disabled={busy}
          aria-label="Votar a favor"
          aria-pressed={entry.myVote === 1}
          onClick={() =>
            mutate(`/forum/${entry.id}/vote`, "PUT", {
              value: entry.myVote === 1 ? 0 : 1,
            })
          }
        >
          <ArrowUp size={17} />
        </button>
        <span aria-label="Pontuação">{entry.score}</span>
        <button
          className="icon-control"
          disabled={busy}
          aria-label="Votar contra"
          aria-pressed={entry.myVote === -1}
          onClick={() =>
            mutate(`/forum/${entry.id}/vote`, "PUT", {
              value: entry.myVote === -1 ? 0 : -1,
            })
          }
        >
          <ArrowDown size={17} />
        </button>
      </div>
      {!entry.rootId ? (
        <Link href={`/forum/${entry.id}`}>
          <MessageCircle size={16} />
          {entry.commentsCount} comentários
        </Link>
      ) : (
        <button
          className="text-button"
          disabled={entry.depth >= 4}
          onClick={() => {
            setReply(entry);
            commentInput.current?.focus();
            commentInput.current?.scrollIntoView({
              block: "center",
              behavior:
                document.documentElement.dataset.reducedMotion === "true"
                  ? "instant"
                  : "smooth",
            });
          }}
        >
          Responder
        </button>
      )}
      {entry.rootId && current?.authorId === me?.id ? (
        <button
          className="text-button"
          disabled={busy}
          onClick={() => mutate(`/forum/${current.id}/accept/${entry.id}`, "POST")}
        >
          {entry.accepted ? "Remover solução" : "Aceitar resposta"}
        </button>
      ) : null}
      {me?.id === entry.authorId ? (
        <button
          className="text-button"
          onClick={() => setEditing(entry)}
          aria-label="Editar publicação ou comentário"
        >
          <Pencil size={15} /> Editar
        </button>
      ) : null}
      {me?.id === entry.authorId ||
      me?.role === "ADMIN" ||
      me?.role === "SUPER_ADMIN" ? (
        <button
          className="text-button"
          disabled={busy}
          onClick={() => remove(entry)}
          aria-label="Excluir publicação ou comentário"
        >
          <Trash2 size={15} /> Excluir
        </button>
      ) : null}
      <button
        className="text-button"
        onClick={() => setReport(entry)}
        aria-label="Denunciar conteúdo"
      >
        <Flag size={14} />
      </button>
    </div>
  );
  const reactions = (entry: Entry) => (
    <div className="forum-reactions" aria-label="Reações">
      {emojis.map((emoji) => {
        const reaction = entry.reactions.find((r) => r.emoji === emoji);
        return (
          <button
            key={emoji}
            disabled={busy}
            aria-label={`Reagir com ${emoji}`}
            aria-pressed={!!reaction?.mine}
            onClick={() =>
              mutate(`/forum/${entry.id}/reaction`, "PUT", {
                emoji: reaction?.mine ? "" : emoji,
              })
            }
          >
            {emoji}
            <span>{reaction?.count ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
  function card(entry: Entry, detail = false) {
    return (
      <article
        className={`forum-card ${entry.rootId ? "forum-comment" : ""}`}
        id={`entry-${entry.id}`}
        key={entry.id}
      >
        <header>
          <UserIdentity user={{ ...entry, id: entry.authorId }} />
          <span className="forum-date">
            {new Date(entry.createdAt).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
            {entry.updatedAt !== entry.createdAt ? " · editado" : ""}
          </span>
          <span className="forum-reputation">{entry.reputation ?? 0} reputação</span>
          {entry.accepted ? <span className="forum-accepted-badge">✓ Resposta aceita</span> : null}
          {!entry.rootId ? (
            <Link
              className="forum-category"
              href={`/forum?category=${entry.category}`}
            >
              {categories[entry.category]}
            </Link>
          ) : null}
        </header>
        {entry.deleted ? (
          <p className="muted">
            Comentário excluído pelo autor ou pela moderação.
          </p>
        ) : (
          <>
            {entry.title ? (
              detail ? (
                <h1>{entry.title}</h1>
              ) : (
                <h2>
                  <Link href={`/forum/${entry.id}`}>{entry.title}</Link>
                </h2>
              )
            ) : null}
            <ForumBody
              text={
                detail || entry.rootId
                  ? entry.body
                  : entry.body.slice(0, 400) +
                    (entry.body.length > 400 ? "…" : "")
              }
            />
            {actions(entry)}
            {reactions(entry)}
          </>
        )}
      </article>
    );
  }
  function commentTree(parent: string, depth = 0): React.ReactNode {
    return comments
      .filter(
        (c) =>
          c.parentId === parent ||
          (parent === id && !comments.some((p) => p.id === c.parentId)),
      )
      .map((c) => (
        <div key={c.id} className={depth ? "forum-replies" : ""}>
          {c.parentId !== id && depth === 0 ? (
            <small className="muted">Resposta em uma conversa</small>
          ) : null}
          {card(c, true)}
          {depth < 4 ? commentTree(c.id, depth + 1) : null}
        </div>
      ));
  }
  return (
    <Shell>
      <div className="forum-page">
        <header className="forum-heading">
          <div>
            <span className="eyebrow">Comunidade Enturma</span>
            <h1>
              {id
                ? "Uma boa conversa continua aqui."
                : "Pergunte. Compartilhe. Aprenda junto."}
            </h1>
            <p>Ideias, dúvidas e descobertas de quem estuda com você.</p>
          </div>
          {id ? (
            <Link className="button secondary" href="/forum">
              <ArrowLeft size={17} /> Voltar ao fórum
            </Link>
          ) : (
            <button onClick={() => setCompose(true)}>
              <Plus size={18} /> Nova publicação
            </button>
          )}
        </header>
        <Feedback error={error} success={success} />
        <div className="forum-layout">
          <section className="forum-feed" aria-label="Publicações do fórum">
            {!id ? (
              <>
                <form
                  className="forum-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSearch(query);
                  }}
                >
                  <label>
                    Buscar publicações
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      maxLength={160}
                      placeholder="Assunto, dúvida ou palavra-chave"
                    />
                  </label>
                  <button aria-label="Buscar no fórum">
                    <Search size={18} /> Buscar
                  </button>
                </form>
                <div className="forum-filters">
                  <label>
                    Assunto
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Todos os assuntos</option>
                      {Object.entries(categories).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Ordenar
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="new">Mais recentes</option>
                      <option value="top">Mais votados</option>
                      <option value="relevance">Relevância da busca</option>
                    </select>
                  </label>
                  <label className="forum-mine">
                    <input
                      type="checkbox"
                      checked={mine}
                      onChange={(e) => setMine(e.target.checked)}
                    />
                    Minhas publicações
                  </label>
                </div>
                {loading ? (
                  <p role="status">Carregando publicações…</p>
                ) : items.length ? (
                  items.map((e) => card(e))
                ) : (
                  <div className="empty">
                    <MessageCircle size={30} />
                    <h2>Nenhuma publicação por aqui.</h2>
                    <p>
                      {search
                        ? "Experimente outro termo ou compartilhe sua dúvida."
                        : "Comece uma conversa com a comunidade."}
                    </p>
                    <button onClick={() => setCompose(true)}>
                      Criar publicação
                    </button>
                  </div>
                )}
              </>
            ) : current ? (
              <>
                {card(current, true)}
                <section className="forum-discussion" aria-label="Comentários">
                  <h2>Comentários · {current.commentsCount}</h2>
                  <form
                    className="forum-comment-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      try {
                        await post(`/forum/${id}/comments`, {
                          body,
                          parentId: reply?.id ?? null,
                        });
                        setBody("");
                        setReply(undefined);
                        await load();
                        setSuccess("Comentário publicado.");
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {reply ? (
                      <p>
                        Respondendo a {reply.name}{" "}
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setReply(undefined)}
                        >
                          Cancelar resposta
                        </button>
                      </p>
                    ) : null}
                    <label>
                      Seu comentário
                      <textarea
                        ref={commentInput}
                        required
                        maxLength={4000}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Compartilhe uma explicação ou mencione @usuario…"
                      />
                    </label>
                    <button disabled={busy || !body.trim()}>
                      {busy ? "Enviando…" : "Comentar"}
                    </button>
                  </form>
                  {comments.length ? (
                    commentTree(id!)
                  ) : (
                    <p>
                      Nenhum comentário ainda. Seja o primeiro a participar.
                    </p>
                  )}
                </section>
              </>
            ) : loading ? (
              <p role="status">Carregando conversa…</p>
            ) : (
              <p>
                A publicação não está disponível.{" "}
                <Link href="/forum">Voltar ao fórum</Link>
              </p>
            )}
            {more ? (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void load(page + 1).finally(() => setBusy(false));
                }}
              >
                Carregar mais
              </button>
            ) : null}
          </section>
          <aside className="forum-aside">
            <section>
              <Bookmark size={24} />
              <h2>Um espaço para trocar conhecimento.</h2>
              <p>
                Explique sua dúvida, conte o que já tentou e compartilhe fontes
                que ajudem os colegas.
              </p>
              <ul>
                <li>Vote no que contribui para a conversa.</li>
                <li>Respeite opiniões e experiências diferentes.</li>
                <li>Evite publicar dados pessoais.</li>
              </ul>
            </section>
            {id && related.length ? (
              <section>
                <h2>Publicações semelhantes</h2>
                {related.map((r) => (
                  <Link
                    className="forum-related"
                    href={`/forum/${r.id}`}
                    key={r.id}
                  >
                    <strong>{r.title}</strong>
                    <small>
                      {categories[r.category]} · {r.commentsCount} comentários
                    </small>
                  </Link>
                ))}
              </section>
            ) : null}
          </aside>
        </div>
        {compose || editing ? (
          <ForumEditor
            key={editing?.id ?? "new"}
            entry={editing}
            onClose={() => {
              setCompose(false);
              setEditing(undefined);
            }}
            onSave={async (values) => {
              if (editing) {
                await api(`/forum/${editing.id}`, {
                  method: "PUT",
                  body: JSON.stringify(values),
                });
                setEditing(undefined);
                await load();
              } else {
                const result = await post<{ id: string }>("/forum", values);
                setCompose(false);
                router.push(`/forum/${result.id}`);
              }
            }}
          />
        ) : null}
        {report ? (
          <ForumDialog
            title="Denunciar conteúdo"
            onClose={() => setReport(undefined)}
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const reason = new FormData(e.currentTarget).get("reason");
                setBusy(true);
                try {
                  await post("/reports", { targetId: report.id, reason });
                  setReport(undefined);
                  setSuccess("Denúncia enviada à moderação.");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Motivo
                <textarea name="reason" required maxLength={2000} />
              </label>
              <Feedback error={error} />
              <button disabled={busy}>Enviar denúncia</button>
            </form>
          </ForumDialog>
        ) : null}
      </div>
    </Shell>
  );
}
function ForumBody({ text }: { text: string }) {
  return (
    <div className="forum-body">
      {text.split(/(```[\s\S]*?```)/g).map((part, i) =>
        part.startsWith("```") ? (
          <pre key={i}>
            <code>{part.slice(3, -3).replace(/^\w*\n/, "")}</code>
          </pre>
        ) : (
          <p key={i}>
            <ForumLinks text={part} />
          </p>
        ),
      )}
    </div>
  );
}
function ForumDialog({
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
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current!;
    el.showModal();
    return () => {
      el.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="forum-dialog"
      aria-label={title}
      onCancel={onClose}
    >
      <header>
        <h2>{title}</h2>
        <button
          className="icon-control"
          aria-label="Fechar editor"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
function ForumEditor({
  entry,
  onClose,
  onSave,
}: {
  entry?: Entry;
  onClose: () => void;
  onSave: (v: {
    title: string;
    body: string;
    category: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [category, setCategory] = useState(entry?.category ?? "GENERAL");
  const [similar, setSimilar] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (entry || title.trim().length < 6) return;
    let active = true;
    const timer = setTimeout(() => {
      void api<PageData>(`/forum?q=${encodeURIComponent(title)}&sort=relevance`)
        .then((r) => {
          if (active) setSimilar(r.items.slice(0, 3));
        })
        .catch(() => {});
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [title, entry]);
  return (
    <ForumDialog
      title={entry ? "Editar conteúdo" : "Nova publicação"}
      onClose={onClose}
    >
      <Feedback error={error} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave({ title, body, category });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {!entry?.rootId ? (
          <>
            <label>
              Título
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={5}
                maxLength={180}
                placeholder="Qual é a sua dúvida ou descoberta?"
              />
            </label>
            <label>
              Assunto da publicação
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        {!entry && title.trim().length >= 6 && similar.length ? (
          <aside className="forum-suggestions">
            <strong>Talvez esta conversa já ajude:</strong>
            {similar.map((e) => (
              <Link key={e.id} href={`/forum/${e.id}`}>
                {e.title}
              </Link>
            ))}
          </aside>
        ) : null}
        <label>
          {entry?.rootId ? "Texto do comentário" : "Conteúdo da publicação"}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={entry?.rootId ? 4000 : 12000}
            rows={8}
            placeholder="Dê contexto. Use @usuario para mencionar alguém e três crases para compartilhar código."
          />
        </label>
        <div className="actions">
          <button disabled={busy}>
            {busy ? "Salvando…" : entry ? "Salvar alterações" : "Publicar"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </form>
    </ForumDialog>
  );
}
