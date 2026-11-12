"use client";
/* eslint-disable @next/next/no-img-element -- private bounded media and local previews */
import { useEffect, useId, useRef, useState } from "react";
import { Heart, Send, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  socialWrite,
  type SocialPerson,
  type SocialPost as Post,
} from "@/lib/social";
import { SocialDialog } from "./social-dialog";
import { SocialAuthor } from "./social-post";
import { SocialText } from "./social-text";
import { providerMessageUrl } from "@/lib/klipy";
import { ComposerMedia } from "../composer-media";
const QUICK = [
  "\u2764\ufe0f",
  "\ud83d\ude4c",
  "\ud83d\udd25",
  "\ud83d\udc4f",
  "\ud83d\ude22",
  "\ud83d\ude0d",
  "\ud83d\ude2e",
  "\ud83d\ude02",
];
function CommentBody({ item, post }: { item: Comment; post: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      {!!item.body && (
        <div className="social-comment-copy">
          {item.body.split("\n").map((line, index) => {
            const gif = providerMessageUrl(line.trim());
            return gif ? (
              <img
                key={index}
                className="social-comment-media"
                src={gif}
                alt="GIF"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <p key={index}>
                <SocialText text={line} />
              </p>
            );
          })}
        </div>
      )}
      {item.mediaId && !failed && (
        <img
          className="social-comment-media"
          src={`/api/backend/social/posts/${post}/comments/${item.id}/media`}
          alt="Imagem ou figurinha"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      {failed && <small>Anexo indispon&iacute;vel.</small>}
    </>
  );
}
type Comment = SocialPerson & {
  authorId: string;
  body: string;
  parentId?: string;
  createdAt: string;
  mediaId?: string;
  likes?: number;
  liked?: boolean;
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
  changed: (post: Post) => void;
  person: (id: string) => void;
}) {
  const [rows, setRows] = useState<Comment[]>([]),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false);
  const [text, setText] = useState(""),
    [parent, setParent] = useState<Comment>(),
    [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const [attachment, setAttachment] = useState<File>(),
    [attachmentUrl, setAttachmentUrl] = useState("");
  const [liking, setLiking] = useState<string[]>([]);
  const uploaded = useRef<string | undefined>(undefined),
    likeLock = useRef(new Set<string>());
  const clientId = useRef(crypto.randomUUID()),
    writing = useRef(false),
    generation = useRef(0);
  const field = useRef<HTMLTextAreaElement>(null),
    id = useId();
  useEffect(() => {
    const request = ++generation.current;
    void api<Comment[]>(`/social/posts/${item.id}/comments?page=${page}`, {
      cache: "no-store",
    })
      .then((result) => {
        if (request !== generation.current) return;
        setRows((previous) =>
          page
            ? [
                ...previous,
                ...result.filter(
                  (comment) => !previous.some((row) => row.id === comment.id),
                ),
              ]
            : result,
        );
        setMore(result.length === 30);
        setError("");
      })
      .catch((cause) => {
        if (request === generation.current) setError(cause.message);
      })
      .finally(() => {
        if (request === generation.current) setLoading(false);
      });
    return () => {
      generation.current++;
    };
  }, [item.id, page, revision]);
  useEffect(() => {
    const source = attachment ? URL.createObjectURL(attachment) : "";
    const timer = setTimeout(() => setAttachmentUrl(source), 0);
    return () => {
      clearTimeout(timer);
      if (source) URL.revokeObjectURL(source);
    };
  }, [attachment]);
  function discardAttachment() {
    const pending = uploaded.current;
    uploaded.current = undefined;
    setAttachment(undefined);
    if (pending)
      void socialWrite(
        `/posts/${item.id}/comment-media/${pending}`,
        undefined,
        "DELETE",
      ).catch(() => {});
  }
  function choose(file: File) {
    if (
      !/^image\/(jpeg|png|gif|webp)$/.test(file.type) ||
      file.size > 1400 * 1024
    ) {
      setError("Use uma imagem ou GIF de at\u00e9 1,4 MB.");
      return;
    }
    discardAttachment();
    setError("");
    setAttachment(file);
  }
  function insert(value: string) {
    const control = field.current,
      start = control?.selectionStart ?? text.length,
      end = control?.selectionEnd ?? start;
    const result = `${text.slice(0, start)}${value}${text.slice(end)}`;
    if (result.length > 1500) {
      setError("O coment\u00e1rio pode ter at\u00e9 1500 caracteres.");
      return;
    }
    setText(result);
    requestAnimationFrame(() => {
      control?.focus({ preventScroll: true });
      control?.setSelectionRange(start + value.length, start + value.length);
    });
  }
  async function like(comment: Comment) {
    if (likeLock.current.has(comment.id)) return;
    likeLock.current.add(comment.id);
    setLiking([...likeLock.current]);
    try {
      const result = await socialWrite<{ likes: number; liked: boolean }>(
        `/posts/${item.id}/comments/${comment.id}/like`,
        { active: !comment.liked },
      );
      setRows((previous) =>
        previous.map((row) =>
          row.id === comment.id ? { ...row, ...result } : row,
        ),
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      likeLock.current.delete(comment.id);
      setLiking([...likeLock.current]);
    }
  }
  async function refreshPost() {
    try {
      changed(
        await api<Post>(`/social/posts/${item.id}`, { cache: "no-store" }),
      );
    } catch {
      window.dispatchEvent(new Event("enturma-social_changed"));
    }
  }
  async function submit() {
    if ((!text.trim() && !attachment) || writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      if (attachment && !uploaded.current) {
        const body = new FormData();
        body.append("file", attachment);
        uploaded.current = (
          await api<{ id: string }>(`/social/posts/${item.id}/comment-media`, {
            method: "POST",
            body,
          })
        ).id;
      }
      await socialWrite(
        `/posts/${item.id}/comments`,
        {
          id: clientId.current,
          body: text,
          parentId: parent?.parentId ?? parent?.id ?? null,
          mediaId: uploaded.current ?? null,
        },
        "POST",
      );
      uploaded.current = undefined;
      setAttachment(undefined);
      clientId.current = crypto.randomUUID();
      setText("");
      setParent(undefined);
      setLoading(true);
      setPage(0);
      setRevision((value) => value + 1);
      await refreshPost();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  async function remove(comment: Comment) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await socialWrite(
        `/posts/${item.id}/comments/${comment.id}`,
        undefined,
        "DELETE",
      );
      setRows((previous) => previous.filter((row) => row.id !== comment.id));
      if (parent?.id === comment.id) setParent(undefined);
      await refreshPost();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <SocialDialog
      title={"Conversa da publica\u00e7\u00e3o"}
      close={close}
      variant="panel"
    >
      <div className="social-dialog-body social-comments-body">
        <div className="social-comment-list" aria-busy={loading}>
          {loading && !rows.length && (
            <p role="status">{"Carregando coment\u00e1rios\u2026"}</p>
          )}
          {rows.map((comment) => (
            <article
              key={comment.id}
              className={comment.parentId ? "social-comment-reply" : ""}
            >
              <SocialAuthor
                user={{ ...comment, id: comment.authorId }}
                open={person}
              />
              <button
                className="icon-control social-comment-like"
                aria-label={`Curtir coment\u00e1rio \u00b7 ${comment.likes ?? 0}`}
                aria-pressed={comment.liked === true}
                disabled={liking.includes(comment.id)}
                onClick={() => void like(comment)}
              >
                <Heart
                  size={18}
                  fill={comment.liked ? "currentColor" : "none"}
                />
                {(comment.likes ?? 0) > 0 && <small>{comment.likes}</small>}
              </button>
              <CommentBody item={comment} post={item.id} />
              <div className="social-row">
                <time dateTime={comment.createdAt}>
                  {new Date(comment.createdAt).toLocaleString("pt-BR")}
                </time>
                <button
                  className="text-button"
                  onClick={() => {
                    setParent(comment);
                    field.current?.focus({ preventScroll: true });
                  }}
                >
                  Responder
                </button>
                {(me === comment.authorId || me === item.authorId) && (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => void remove(comment)}
                  >
                    Remover
                  </button>
                )}
              </div>
            </article>
          ))}
          {more && (
            <button
              className="secondary"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                setPage((value) => value + 1);
              }}
            >
              {"Mais coment\u00e1rios"}
            </button>
          )}
          {!loading && !rows.length && !error && (
            <p>Comece a conversa com uma pergunta ou uma ideia.</p>
          )}
        </div>
        <div className="social-comment-composer">
          <div className="social-comment-reactions" aria-label="Emojis">
            {QUICK.map((emoji) => (
              <button
                type="button"
                key={emoji}
                disabled={busy}
                aria-label={`Inserir emoji ${emoji}`}
                onClick={() => insert(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          {attachment && (
            <div className="social-comment-attachment">
              {attachmentUrl && (
                <img src={attachmentUrl} alt="Anexo selecionado" />
              )}
              <span>{attachment.name}</span>
              <button
                type="button"
                className="icon-control"
                aria-label="Remover anexo"
                disabled={busy}
                onClick={discardAttachment}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {parent && (
            <div className="social-comment-replying">
              <span>Respondendo a @{parent.username}</span>
              <button
                type="button"
                className="icon-control"
                aria-label="Cancelar resposta"
                onClick={() => setParent(undefined)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <form
            noValidate
            className="social-comment-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label className="sr-only" htmlFor={id}>
              {"Seu coment\u00e1rio"}
            </label>
            <textarea
              id={id}
              ref={field}
              className="resize-none"
              rows={1}
              maxLength={1500}
              value={text}
              disabled={busy}
              onChange={(event) => setText(event.target.value)}
              placeholder={"Adicione um coment\u00e1rio\u2026"}
            />
            <ComposerMedia
              disabled={busy}
              onEmoji={insert}
              onFile={choose}
              onMedia={async (file) => choose(file)}
              onKlipy={async (gif) => {
                const url = providerMessageUrl(gif.url);
                if (url) insert(`${text.trim() ? "\n" : ""}${url}`);
              }}
            />
            <button
              disabled={busy || (!text.trim() && !attachment)}
              aria-label={"Enviar coment\u00e1rio"}
            >
              <Send size={22} />
            </button>
          </form>
          {error && (
            <div role="alert" className="social-error">
              <p>{error}</p>
              <button
                type="button"
                className="text-button"
                disabled={loading || busy}
                onClick={() => {
                  setLoading(true);
                  setRevision((value) => value + 1);
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </SocialDialog>
  );
}
