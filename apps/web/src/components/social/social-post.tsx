"use client";
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
  postPerson,
  type SocialPerson,
  type SocialPost as Post,
} from "@/lib/social";
import { relativeTime } from "@/lib/social-media";
import { preparePrivateShare } from "@/lib/send-room-invitation";
import { Avatar } from "../user-identity";
import { ConfirmedLink } from "../forum-links";
import { SocialDialog } from "./social-dialog";
import { SocialText } from "./social-text";
import { SocialMediaCarousel } from "./social-media-carousel";
import { usePostActions } from "./use-post-actions";
import { SocialPostOptions } from "./social-post-options";

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
export function SocialComments({
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
  autoplay = true,
}: {
  item: Post;
  me: string;
  person: (id: string) => void;
  changed: (p: Post) => void;
  autoplay?: boolean;
}) {
  const [dialog, setDialog] = useState<"comments" | "share" | "more" | null>(
      null,
    ),
    [expanded, setExpanded] = useState(false),
    [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  const actions = usePostActions(item, changed),
    { busy, error, react } = actions;
  function tapMedia() {
    const now = performance.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      setBurst((count) => count + 1);
      void actions.like();
    } else lastTap.current = now;
  }
  if (item.mine.includes("HIDE")) return null;
  const hasMedia = item.media.length > 0,
    limit = hasMedia ? 125 : 280,
    long = item.body.length > limit;
  const copy = (
    <div className="social-post-copy">
      {!!item.body && (
        <p>
          {hasMedia && (
            <button
              type="button"
              className="social-caption-author"
              onClick={() => person(item.authorId)}
            >
              {item.username}
            </button>
          )}{" "}
          <SocialText
            text={
              expanded || !long ? item.body : `${item.body.slice(0, limit)}…`
            }
          />{" "}
          {long && (
            <button
              type="button"
              className="text-button social-caption-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "menos" : "mais"}
            </button>
          )}
        </p>
      )}
      {item.projectUrl && (
        <ConfirmedLink href={item.projectUrl} label="Conhecer o projeto ↗" />
      )}
    </div>
  );
  return (
    <article className="social-post" data-post={item.id}>
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
      {hasMedia ? (
        <div
          className="social-post-media"
          data-testid="post-media"
          onClick={tapMedia}
        >
          <SocialMediaCarousel
            media={item.media}
            authorName={item.name}
            autoplay={autoplay}
          />
          {burst > 0 && (
            <Heart
              key={burst}
              className="social-like-burst"
              size={96}
              fill="currentColor"
              aria-hidden="true"
            />
          )}
        </div>
      ) : (
        copy
      )}
      <div className="social-post-actions">
        <button
          className="icon-control"
          aria-pressed={item.mine.includes("LIKE")}
          aria-label={`Curtir · ${item.likes}`}
          disabled={busy}
          onClick={() => void react("LIKE")}
        >
          <Heart
            size={24}
            fill={item.mine.includes("LIKE") ? "currentColor" : "none"}
          />
        </button>
        <button
          className="icon-control"
          aria-label={`Comentários · ${item.comments}`}
          onClick={() => setDialog("comments")}
        >
          <MessageCircle size={24} />
        </button>
        <button
          className="icon-control"
          aria-pressed={item.mine.includes("REPOST")}
          aria-label={`Republicar · ${item.reposts}`}
          disabled={busy}
          onClick={() => void react("REPOST")}
        >
          <Repeat2 size={24} />
          {item.reposts > 0 && <span>{item.reposts}</span>}
        </button>
        <button
          className="icon-control"
          aria-label="Compartilhar publicação"
          onClick={() => setDialog("share")}
        >
          <Send size={23} />
        </button>
        <button
          className="icon-control social-save"
          aria-label="Salvar publicação"
          aria-pressed={item.mine.includes("SAVE")}
          disabled={busy}
          onClick={() => void react("SAVE")}
        >
          <Bookmark
            size={24}
            fill={item.mine.includes("SAVE") ? "currentColor" : "none"}
          />
        </button>
      </div>
      <div className="social-post-meta">
        {item.likes > 0 && (
          <p className="social-post-likes">
            {item.likes} {item.likes === 1 ? "curtida" : "curtidas"}
          </p>
        )}
        {hasMedia && copy}
        {item.comments > 0 && (
          <button
            type="button"
            className="text-button social-post-all-comments"
            onClick={() => setDialog("comments")}
          >
            {item.comments === 1
              ? "Ver 1 comentário"
              : `Ver todos os ${item.comments} comentários`}
          </button>
        )}
        <small>
          {item.pinned && "Fixado · "}
          <time dateTime={item.publishedAt}>
            {relativeTime(item.publishedAt, new Date())}
          </time>
        </small>
      </div>
      {error && (
        <p className="social-error" role="alert">
          {error}
        </p>
      )}
      {dialog === "comments" && (
        <SocialComments
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
        <SocialPostOptions
          item={item}
          me={me}
          changed={changed}
          close={() => setDialog(null)}
        />
      )}
    </article>
  );
}
