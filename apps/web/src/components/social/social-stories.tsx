"use client";
/* eslint-disable @next/next/no-img-element -- authenticated media */
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Pause,
  Play,
  Plus,
  Send,
  Star,
  Eye,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  mediaUrl,
  postPerson,
  socialWrite,
  storyDuration,
  type SocialPage,
  type SocialPerson,
  type SocialPost,
} from "@/lib/social";
import { Avatar } from "../user-identity";
import { ForumLinks } from "../forum-links";
import { SocialDialog } from "./social-dialog";
import { SocialAuthor, SocialShare } from "./social-post";
import { StoryDecorations } from "./story-decorations";
import { ConfirmedLink } from "../forum-links";

export function StoryViewer({
  stories,
  start = 0,
  me,
  close,
  person,
  onDeleted,
}: {
  stories: SocialPost[];
  start?: number;
  me: string;
  close: () => void;
  person: (id: string) => void;
  onDeleted?: (id: string) => void;
}) {
  const [index, setIndex] = useState(start),
    [item, setItem] = useState<SocialPost>(),
    [paused, setPaused] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(""),
    [share, setShare] = useState(false),
    [viewers, setViewers] = useState<SocialPerson[] | null>(null),
    [viewersPage, setViewersPage] = useState(0),
    [moreViewers, setMoreViewers] = useState(false),
    [highlight, setHighlight] = useState(false),
    [title, setTitle] = useState("");
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    stage = useRef<HTMLDivElement>(null),
    elapsed = useRef(0),
    advancing = useRef<string | undefined>(undefined),
    next = useRef(() => {}),
    currentId = stories[index]?.id;
  useEffect(() => {
    next.current = () => {
      if (advancing.current === currentId) return;
      advancing.current = currentId;
      if (index + 1 >= stories.length) close();
      else {
        setIndex((i) => i + 1);
        setProgress(0);
        setViewers(null);
        setHighlight(false);
      }
    };
  }, [index, stories.length, close, currentId]);
  useEffect(() => {
    if (!currentId) return;
    let alive = true;
    api<SocialPost>(`/social/posts/${currentId}`, { cache: "no-store" })
      .then((r) => {
        if (alive) {
          setItem(r);
          elapsed.current = 0;
          advancing.current = undefined;
          setProgress(0);
          setError("");
        }
        return socialWrite(`/posts/${currentId}/view`, {
          watchedMs: 0,
          completed: false,
        });
      })
      .catch((e) => {
        if (alive) {
          setItem(undefined);
          setError(e.message);
        }
      });
    return () => {
      alive = false;
    };
  }, [currentId]);
  useEffect(() => {
    if (
      !item ||
      item.id !== currentId ||
      paused ||
      share ||
      viewers ||
      highlight
    ) {
      video.current?.pause();
      return;
    }
    const el = video.current;
    if (el) void el.play().catch(() => {});
    let last = performance.now();
    const duration = storyDuration(item.media[0]);
    const tick = setInterval(() => {
      const now = performance.now();
      const topDialog = Array.from(
        document.querySelectorAll("dialog[open]"),
      ).at(-1);
      if (
        !document.hidden &&
        document.hasFocus() &&
        stage.current?.closest("dialog") === topDialog &&
        (!el || !el.paused)
      )
        elapsed.current += now - last;
      last = now;
      const p = el
        ? (el.currentTime * 1000) / duration
        : elapsed.current / duration;
      setProgress(Math.min(1, p));
      if (p >= 1) next.current();
    }, 100);
    const pause = () => {
      if (document.hidden) {
        el?.pause();
        setPaused(true);
      }
    };
    const blur = () => {
      el?.pause();
      setPaused(true);
    };
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("blur", blur);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", pause);
      window.removeEventListener("blur", blur);
      el?.pause();
    };
  }, [item, currentId, paused, share, viewers, highlight]);
  async function showViewers(page = 0) {
    try {
      const rows = await api<SocialPerson[]>(
        `/social/posts/${currentId}/viewers?page=${page}`,
        { cache: "no-store" },
      );
      setViewers((old) => (page ? [...(old ?? []), ...rows] : rows));
      setViewersPage(page);
      setMoreViewers(rows.length === 30);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function deleteStory() {
    if (!item || item.authorId !== me || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await socialWrite(`/posts/${item.id}`, undefined, "DELETE");
      window.dispatchEvent(new Event("enturma-social_changed"));
      if (onDeleted) onDeleted(item.id);
      else close();
    } catch (cause) {
      setError((cause as Error).message);
      setConfirmDeletion(false);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <SocialDialog title="Stories da turma" close={close}>
      <div ref={stage} className="social-story-viewer">
        <div
          className="social-story-progress"
          aria-label={`Story ${index + 1} de ${stories.length}`}
        >
          {stories.map((s, i) => (
            <span key={s.id}>
              <i
                style={{
                  transform: `scaleX(${i < index ? 1 : i > index ? 0 : progress})`,
                }}
              />
            </span>
          ))}
        </div>
        {item?.id === currentId && (
          <>
            <SocialAuthor user={postPerson(item)} open={person} />
            <div
              className="social-story-stage"
              onPointerDown={(e) => {
                if (!(e.target as HTMLElement).closest("video,a,button"))
                  setPaused(true);
              }}
              onPointerUp={() => setPaused(false)}
              onPointerCancel={() => setPaused(false)}
            >
              {item.media[0]?.kind === "VIDEO" ? (
                <video
                  ref={video}
                  src={mediaUrl(item.media[0].id)}
                  playsInline
                  controls
                  preload="metadata"
                  onEnded={() => next.current()}
                />
              ) : (
                item.media[0] && (
                  <img
                    src={mediaUrl(item.media[0].id)}
                    alt={`Story de ${item.name}`}
                  />
                )
              )}
              <p
                className={
                  !item.media.length
                    ? "social-story-text"
                    : "social-story-caption"
                }
              >
                <ForumLinks text={item.body} />
              </p>
              <StoryDecorations items={item.storyOverlays ?? []} />
            </div>
            {item.projectUrl && (
              <ConfirmedLink
                href={item.projectUrl}
                label="Abrir link do Story"
              />
            )}
            <div className="social-row social-story-actions">
              <button
                className="icon-control"
                aria-label="Story anterior"
                disabled={!index}
                onClick={() => {
                  setIndex((i) => i - 1);
                  setProgress(0);
                }}
              >
                <ChevronLeft />
              </button>
              <button
                className="icon-control"
                aria-label={paused ? "Reproduzir Story" : "Pausar Story"}
                onClick={() => setPaused((v) => !v)}
              >
                {paused ? <Play /> : <Pause />}
              </button>
              <button
                className="icon-control"
                aria-label="Curtir Story"
                aria-pressed={item.mine.includes("LIKE")}
                onClick={() => {
                  void socialWrite<SocialPost>(
                    `/posts/${item.id}/reactions/LIKE`,
                    { active: !item.mine.includes("LIKE") },
                  )
                    .then(setItem)
                    .catch((e) => setError(e.message));
                }}
              >
                <Heart
                  fill={item.mine.includes("LIKE") ? "currentColor" : "none"}
                />
              </button>
              <button
                className="icon-control"
                aria-label="Responder ou compartilhar Story"
                onClick={() => setShare(true)}
              >
                <Send />
              </button>
              {item.authorId === me && (
                <>
                  <button
                    className="icon-control"
                    aria-label="Ver visualizações"
                    onClick={() => void showViewers()}
                  >
                    <Eye />
                  </button>
                  <button
                    className="icon-control"
                    aria-label="Salvar nos destaques"
                    onClick={() => {
                      setHighlight(true);
                      setTitle(item.highlightTitle ?? "");
                    }}
                  >
                    <Star />
                  </button>
                  <button
                    className="icon-control social-story-delete-trigger"
                    type="button"
                    aria-label="Excluir meu Story"
                    onClick={() => {
                      setPaused(true);
                      setConfirmDeletion(true);
                    }}
                  >
                    <Trash2 />
                  </button>
                </>
              )}
              <button
                className="icon-control"
                aria-label="Próximo Story"
                onClick={() => next.current()}
              >
                <ChevronRight />
              </button>
            </div>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        {viewers && (
          <section>
            <h3>Quem viu</h3>
            {viewers.map((u) => (
              <SocialAuthor key={u.id} user={u} open={person} />
            ))}
            {!viewers.length && <p>Ainda sem visualizações.</p>}
            {moreViewers && (
              <button
                className="secondary"
                onClick={() => void showViewers(viewersPage + 1)}
              >
                Carregar mais
              </button>
            )}
            <button className="secondary" onClick={() => setViewers(null)}>
              Voltar ao Story
            </button>
          </section>
        )}
        {highlight && (
          <section>
            <label>
              Nome do destaque
              <input
                value={title}
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <div className="social-row">
              <button
                disabled={!title.trim()}
                onClick={() => {
                  void socialWrite(`/posts/${currentId}/highlight`, { title })
                    .then(() => setHighlight(false))
                    .catch((e) => setError(e.message));
                }}
              >
                Salvar destaque
              </button>
              <button
                className="secondary"
                onClick={() => {
                  void socialWrite(`/posts/${currentId}/highlight`, {
                    title: null,
                  })
                    .then(() => setHighlight(false))
                    .catch((e) => setError(e.message));
                }}
              >
                Remover destaque
              </button>
              <button
                className="text-button"
                onClick={() => setHighlight(false)}
              >
                Cancelar
              </button>
            </div>
          </section>
        )}
      </div>
      {share && item && (
        <SocialShare
          item={item}
          reply={item.authorId !== me}
          close={() => setShare(false)}
        />
      )}
      {confirmDeletion && (
        <SocialDialog
          title="Excluir este Story?"
          close={() => { if (!deleting) setConfirmDeletion(false); }}
        >
          <div className="social-dialog-body">
            <p>Seu Story, suas visualizações e os arquivos associados serão removidos. Esta ação não pode ser desfeita.</p>
            <div className="social-row">
              <button className="secondary" type="button" disabled={deleting} onClick={() => setConfirmDeletion(false)}>Cancelar</button>
              <button className="social-danger-action" type="button" disabled={deleting} onClick={() => void deleteStory()}>
                <Trash2 size={18} /> {deleting ? "Excluindo…" : "Excluir Story"}
              </button>
            </div>
            {error && <p role="alert" className="social-error">{error}</p>}
          </div>
        </SocialDialog>
      )}
    </SocialDialog>
  );
}
export function SocialStories({
  me,
  create,
  person,
  refreshKey,
}: {
  me: SocialPerson;
  create: () => void;
  person: (id: string) => void;
  refreshKey: number;
}) {
  const [stories, setStories] = useState<SocialPost[]>([]),
    [cursor, setCursor] = useState(""),
    [opened, setOpened] = useState<number | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    api<SocialPage>("/social/feed?kind=STORY&tab=for-you", {
      cache: "no-store",
    })
      .then((r) => {
        if (alive) {
          setStories(r.items);
          setCursor(r.nextCursor);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);
  return (
    <>
      <div
        className="social-stories"
        data-social-gesture="ignore"
        aria-label="Stories"
      >
        <button className="social-story" onClick={create}>
          <span className="social-story-ring">
            <Avatar user={me} />
            <Plus size={17} />
          </span>
          <small>Seu Story</small>
        </button>
        {stories.map((s, index) => (
          <button
            className={`social-story ${s.seen ? "seen" : ""}`}
            key={s.id}
            onClick={() => setOpened(index)}
          >
            <span className="social-story-ring">
              <Avatar user={postPerson(s)} />
            </span>
            <small>{s.username}</small>
          </button>
        ))}
        {cursor && (
          <button
            className="icon-control"
            aria-label="Mais Stories"
            onClick={() => {
              void api<SocialPage>(
                `/social/feed?kind=STORY&tab=for-you&cursor=${encodeURIComponent(cursor)}`,
                { cache: "no-store" },
              )
                .then((r) => {
                  setStories((s) => [
                    ...s,
                    ...r.items.filter((i) => !s.some((p) => p.id === i.id)),
                  ]);
                  setCursor(r.nextCursor);
                })
                .catch((e) => setError(e.message));
            }}
          >
            <ChevronRight />
          </button>
        )}
      </div>
      {error && <small role="alert">{error}</small>}
      {opened !== null && (
        <StoryViewer
          stories={stories}
          start={opened}
          me={me.id}
          person={person}
          onDeleted={(id) => {
            setStories((current) => current.filter((entry) => entry.id !== id));
            setOpened(null);
          }}
          close={() => {
            setStories((s) =>
              s.map((p, i) => (i === opened ? { ...p, seen: true } : p)),
            );
            setOpened(null);
          }}
        />
      )}
    </>
  );
}
