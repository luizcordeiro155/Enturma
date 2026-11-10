"use client";
/* eslint-disable @next/next/no-img-element -- private authenticated social media */
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  Check,
  Copy,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
  Share2,
} from "lucide-react";
import { api, post } from "@/lib/api";
import {
  socialWrite,
  socialLink,
  mediaUrl,
  postPerson,
  type SocialPerson,
  type SocialPost as Post,
} from "@/lib/social";
import { preparePrivateShare } from "@/lib/send-room-invitation";
import { Avatar } from "../user-identity";
import { ConfirmedLink } from "../forum-links";
import { SocialDialog } from "./social-dialog";
import { SocialText } from "./social-text";

export function SocialAuthor({
  user,
  open,
}: {
  user: SocialPerson;
  open: (id: string) => void;
}) {
  return (
    <button className="social-author" onClick={() => open(user.id)}>
      <Avatar user={user} />
      <span>
        <strong>
          {user.name}
          {user.verified && (
            <BadgeCheck size={16} aria-label="Conta social verificada" />
          )}
        </strong>
        <small>@{user.username}</small>
      </span>
    </button>
  );
}
export function FollowButton({
  id,
  me,
  changed,
}: {
  id: string;
  me: string;
  changed?: () => void;
}) {
  const [relation, setRelation] = useState<{
      status: string;
      followsYou: boolean;
    }>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    if (id === me) return;
    api<{ relationship: NonNullable<typeof relation> }>(
      `/social/people/${id}`,
      { cache: "no-store" },
    )
      .then((r) => {
        if (active) setRelation(r.relationship);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, me]);
  if (id === me) return null;
  return (
    <span className="social-follow">
      <button
        className="secondary"
        disabled={!relation || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            setRelation(
              await socialWrite(`/people/${id}/follow`, {
                active: relation?.status === "NONE",
              }),
            );
            changed?.();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {relation?.status === "ACCEPTED"
          ? "Seguindo"
          : relation?.status === "PENDING"
            ? "Solicitado"
            : relation?.followsYou
              ? "Seguir de volta"
              : "Seguir"}
      </button>
      {relation?.followsYou && <small>Te segue</small>}
      {error && <small role="alert">{error}</small>}
    </span>
  );
}
export function SocialShare({
  item,
  close,
  reply = false,
}: {
  item: Post;
  close: () => void;
  reply?: boolean;
}) {
  const [friends, setFriends] = useState<
      (SocialPerson & { userId: string; status: string })[]
    >([]),
    [query, setQuery] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [sent, setSent] = useState<string[]>([]),
    [busy, setBusy] = useState("");
  const pending = useRef(
    new Map<string, Awaited<ReturnType<typeof preparePrivateShare>>>(),
  );
  useEffect(() => {
    let active = true;
    api<typeof friends>("/friends", { cache: "no-store" })
      .then((r) => {
        if (active)
          setFriends(
            r.filter(
              (f) =>
                f.status === "ACCEPTED" &&
                (!reply || f.userId === item.authorId),
            ),
          );
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [item.authorId, reply]);
  const url = socialLink("post", item.id);
  async function send(friend: string) {
    setBusy(friend);
    setError("");
    try {
      await api(`/social/posts/${item.id}`, { cache: "no-store" });
      let body = pending.current.get(friend);
      if (!body) {
        body = await preparePrivateShare(
          friend,
          `${note.trim()}${note.trim() ? "\n" : ""}${url}`,
          crypto.randomUUID(),
        );
        pending.current.set(friend, body);
      }
      await post(`/friends/${friend}/messages`, body);
      pending.current.delete(friend);
      setSent((s) => [...s, friend]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <SocialDialog
      title={reply ? "Responder ao Story" : "Compartilhar com a turma"}
      close={close}
    >
      <div className="social-dialog-body">
        <p>
          A privacidade da publicação continua valendo para quem receber o link.
        </p>
        <label>
          Mensagem opcional
          <input
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <label>
          Buscar amigos
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {friends
          .filter((f) =>
            `${f.name} ${f.username}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((f) => (
            <div className="social-person-row" key={f.id}>
              <Avatar user={{ ...f, id: f.userId }} />
              <strong>{f.name}</strong>
              <button
                className="secondary"
                disabled={!!busy || sent.includes(f.id)}
                onClick={() => void send(f.id)}
              >
                {sent.includes(f.id) ? (
                  <>
                    <Check size={16} /> Enviado
                  </>
                ) : (
                  "Enviar"
                )}
              </button>
            </div>
          ))}
        {!friends.length && (
          <p>
            As amizades aceitas aparecerão aqui.
            {reply && " Para responder, vocês precisam ser amigos no Enturma."}
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="social-row">
          <button
            className="secondary"
            onClick={() => {
              void navigator.clipboard
                .writeText(url)
                .then(() => setError("Link copiado."))
                .catch(() => setError("Não foi possível copiar o link."));
            }}
          >
            <Copy size={16} /> Copiar link
          </button>
          {typeof navigator !== "undefined" &&
            typeof navigator.share === "function" && (
              <button
                className="secondary"
                onClick={() => {
                  void navigator
                    .share({ title: "Enturma Social", url })
                    .catch((e) => {
                      if (e.name !== "AbortError")
                        setError("Não foi possível compartilhar.");
                    });
                }}
              >
                <Share2 size={16} /> Compartilhar
              </button>
            )}
        </div>
      </div>
    </SocialDialog>
  );
}
type Comment = SocialPerson & {
  authorId: string;
  body: string;
  parentId?: string;
  createdAt: string;
};
function Comments({
  item,
  me,
  close,
  changed,
  person,
}: {
  item: Post;
  me: string;
  close: () => void;
  changed: (p: Post) => void;
  person: (id: string) => void;
}) {
  const [rows, setRows] = useState<Comment[]>([]),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false),
    [text, setText] = useState(""),
    [parent, setParent] = useState<Comment>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const clientId = useRef(crypto.randomUUID());
  useEffect(() => {
    let active = true;
    api<Comment[]>(`/social/posts/${item.id}/comments?page=${page}`, {
      cache: "no-store",
    })
      .then((r) => {
        if (active) {
          setRows((old) =>
            page
              ? [...old, ...r.filter((c) => !old.some((v) => v.id === c.id))]
              : r,
          );
          setMore(r.length === 30);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [item.id, page]);
  async function submit() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await socialWrite(
        `/posts/${item.id}/comments`,
        {
          id: clientId.current,
          body: text,
          parentId: parent?.parentId ?? parent?.id ?? null,
        },
        "POST",
      );
      clientId.current = crypto.randomUUID();
      setText("");
      setParent(undefined);
      const fresh = await api<Comment[]>(
        `/social/posts/${item.id}/comments?page=0`,
        { cache: "no-store" },
      );
      setRows(fresh);
      setPage(0);
      setMore(fresh.length === 30);
      changed(
        await api<Post>(`/social/posts/${item.id}`, { cache: "no-store" }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <SocialDialog title="Conversa da publicação" close={close}>
      <div className="social-dialog-body">
        <div className="social-comment-list">
          {rows.map((c) => (
            <article
              key={c.id}
              className={c.parentId ? "social-comment-reply" : ""}
            >
              <SocialAuthor user={{ ...c, id: c.authorId }} open={person} />
              <p>
                <SocialText text={c.body} />
              </p>
              <div className="social-row">
                <small>{new Date(c.createdAt).toLocaleString("pt-BR")}</small>
                <button className="text-button" onClick={() => setParent(c)}>
                  Responder
                </button>
                {(me === c.authorId || me === item.authorId) && (
                  <button
                    className="text-button"
                    onClick={() => {
                      void socialWrite(
                        `/posts/${item.id}/comments/${c.id}`,
                        undefined,
                        "DELETE",
                      )
                        .then(() =>
                          setRows((r) => r.filter((v) => v.id !== c.id)),
                        )
                        .catch((e) => setError(e.message));
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            </article>
          ))}
          {more && (
            <button className="secondary" onClick={() => setPage((p) => p + 1)}>
              Mais comentários
            </button>
          )}
          {!rows.length && (
            <p>Comece a conversa com uma pergunta ou uma ideia.</p>
          )}
        </div>
        {parent && (
          <p>
            Respondendo a @{parent.username}{" "}
            <button
              className="text-button"
              onClick={() => setParent(undefined)}
            >
              Cancelar
            </button>
          </p>
        )}
        <form
          noValidate
          className="social-comment-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="sr-only" htmlFor="social-comment">
            Seu comentário
          </label>
          <textarea
            className="resize-none"
            id="social-comment"
            rows={2}
            maxLength={1500}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contribua com a conversa…"
          />
          <button
            disabled={busy || !text.trim()}
            aria-label="Enviar comentário"
          >
            <Send size={20} />
          </button>
        </form>
        {error && <p role="alert">{error}</p>}
      </div>
    </SocialDialog>
  );
}
export function SocialPost({
  item,
  me,
  person,
  changed,
  clip = false,
  children,
}: {
  item: Post;
  me: string;
  person: (id: string) => void;
  changed: (p: Post) => void;
  clip?: boolean;
  children?: React.ReactNode;
}) {
  const [dialog, setDialog] = useState<"comments" | "share" | "more" | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reason, setReason] = useState(""),
    [expanded, setExpanded] = useState(false),
    [removing, setRemoving] = useState(false);
  async function react(kind: string) {
    if (busy) return;
    setBusy(true);
    try {
      changed(
        await socialWrite<Post>(`/posts/${item.id}/reactions/${kind}`, {
          active: !item.mine.includes(kind),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function act(path: string, body?: unknown, method = "PUT") {
    setBusy(true);
    try {
      await socialWrite(path, body, method);
      setDialog(null);
      if (method === "DELETE" || path.endsWith("/mute"))
        changed({ ...item, mine: [...item.mine, "HIDE"] });
      else
        changed(
          await api<Post>(`/social/posts/${item.id}`, { cache: "no-store" }),
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (item.mine.includes("HIDE")) return null;
  return (
    <article
      className={`social-post ${clip ? "social-post-clip" : ""}`}
      data-post={item.id}
    >
      <header>
        <SocialAuthor user={postPerson(item)} open={person} />
        <button
          className="icon-control"
          aria-label="Opções da publicação"
          onClick={() => setDialog("more")}
        >
          <MoreHorizontal size={20} />
        </button>
      </header>
      {children ??
        (!!item.media.length && (
          <div
            className="social-carousel"
            data-social-gesture="ignore"
            aria-label="Mídias da publicação"
            tabIndex={0}
          >
            {item.media.map((m, i) => (
              <figure key={m.id}>
                {m.kind === "VIDEO" ? (
                  <video
                    controls
                    playsInline
                    preload="none"
                    src={mediaUrl(m.id)}
                    poster={mediaUrl(m.id, true)}
                    onPlay={(e) => {
                      document
                        .querySelectorAll<HTMLVideoElement>(
                          ".social-page video",
                        )
                        .forEach((v) => {
                          if (v !== e.currentTarget) v.pause();
                        });
                    }}
                  />
                ) : (
                  <img
                    src={mediaUrl(m.id)}
                    alt={`Imagem ${i + 1} da publicação de ${item.name}`}
                    loading="lazy"
                  />
                )}
                {item.media.length > 1 && (
                  <figcaption>
                    {i + 1} / {item.media.length}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        ))}
      <div className="social-post-copy">
        <p>
          <SocialText
            text={
              expanded || item.body.length <= 240
                ? item.body
                : `${item.body.slice(0, 240)}…`
            }
          />
        </p>
        {item.body.length > 240 && (
          <button
            className="text-button"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Mostrar menos" : "Ler mais"}
          </button>
        )}
        {item.projectUrl && (
          <ConfirmedLink href={item.projectUrl} label="Conhecer o projeto ↗" />
        )}
        <small>
          {item.pinned && "Fixado · "}
          {new Date(item.publishedAt).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "short",
          })}
        </small>
      </div>
      <div className="social-post-actions">
        <button
          className="icon-control"
          aria-pressed={item.mine.includes("LIKE")}
          aria-label={`Curtir · ${item.likes}`}
          disabled={busy}
          onClick={() => void react("LIKE")}
        >
          <Heart
            size={21}
            fill={item.mine.includes("LIKE") ? "currentColor" : "none"}
          />
          <span>{item.likes}</span>
        </button>
        <button
          className="icon-control"
          aria-label={`Comentários · ${item.comments}`}
          onClick={() => setDialog("comments")}
        >
          <MessageCircle size={21} />
          <span>{item.comments}</span>
        </button>
        <button
          className="icon-control"
          aria-pressed={item.mine.includes("REPOST")}
          aria-label={`Republicar · ${item.reposts}`}
          disabled={busy}
          onClick={() => void react("REPOST")}
        >
          <Repeat2 size={21} />
          <span>{item.reposts}</span>
        </button>
        <button
          className="icon-control"
          aria-label="Compartilhar publicação"
          onClick={() => setDialog("share")}
        >
          <Send size={21} />
        </button>
        <button
          className="icon-control social-save"
          aria-label="Salvar publicação"
          aria-pressed={item.mine.includes("SAVE")}
          disabled={busy}
          onClick={() => void react("SAVE")}
        >
          <Bookmark
            size={21}
            fill={item.mine.includes("SAVE") ? "currentColor" : "none"}
          />
        </button>
      </div>
      {error && (
        <p className="social-error" role="alert">
          {error}
        </p>
      )}
      {dialog === "comments" && (
        <Comments
          item={item}
          me={me}
          close={() => setDialog(null)}
          changed={changed}
          person={person}
        />
      )}
      {dialog === "share" && (
        <SocialShare item={item} close={() => setDialog(null)} />
      )}
      {dialog === "more" && (
        <SocialDialog title="Esta publicação" close={() => setDialog(null)}>
          <div className="social-dialog-body social-options">
            <FollowButton id={item.authorId} me={me} />
            {me !== item.authorId ? (
              <>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => void react("HIDE")}
                >
                  Não tenho interesse
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void act(`/people/${item.authorId}/mute`, { active: true })
                  }
                >
                  Ver menos deste criador
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => {
                    void api(`/blocks/${item.authorId}`, { method: "POST" })
                      .then(() => changed({ ...item, mine: ["HIDE"] }))
                      .catch((e) => setError(e.message));
                  }}
                >
                  Bloquear usuário
                </button>
                <label>
                  Motivo da denúncia
                  <textarea
                    className="resize-none"
                    value={reason}
                    maxLength={1500}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <button
                  disabled={busy || !reason.trim()}
                  onClick={() =>
                    void act(`/posts/${item.id}/report`, { reason }, "POST")
                  }
                >
                  Enviar denúncia
                </button>
              </>
            ) : (
              <>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void act(`/posts/${item.id}/pin`, { active: !item.pinned })
                  }
                >
                  {item.pinned ? "Desafixar" : "Fixar publicação"}
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => setRemoving(true)}
                >
                  Remover publicação
                </button>
              </>
            )}
            {error && <p role="alert">{error}</p>}
          </div>
        </SocialDialog>
      )}
      {removing && (
        <SocialDialog
          title="Remover esta publicação?"
          close={() => setRemoving(false)}
        >
          <div className="social-dialog-body">
            <p>
              O conteúdo e suas mídias deixarão de estar disponíveis. Esta ação
              não pode ser desfeita.
            </p>
            <div className="social-row">
              <button
                className="secondary"
                onClick={() => setRemoving(false)}
                disabled={busy}
              >
                Manter publicação
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void act(`/posts/${item.id}`, undefined, "DELETE")
                }
              >
                Remover definitivamente
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </div>
        </SocialDialog>
      )}
    </article>
  );
}
