"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Plus, SquarePen, UserRoundPen } from "lucide-react";
import { api } from "@/lib/api";
import {
  postPerson,
  type SocialPage,
  type SocialPerson,
  type SocialPost,
} from "@/lib/social";
import { groupStories } from "@/lib/social-media";
import { Avatar } from "../user-identity";
import { StoryViewer } from "./social-story-viewer";
import { SocialLiveTray } from "./social-live-context";
import { NavigationLink } from "../navigation-link";
import { useLongPress } from "./use-long-press";
export { StoryViewer } from "./social-story-viewer";

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
    [cursor, setCursor] = useState("");
  const [opened, setOpened] = useState<string | null>(null),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const generation = useRef(0),
    loading = useRef(false);
  const groups = useMemo(() => groupStories(stories), [stories]);
  const own = groups.find((group) => group.authorId === me.id);
  const others = groups.filter((group) => group.authorId !== me.id);
  const [menu, setMenu] = useState<DOMRect | null>(null);
  const ownButton = useRef<HTMLButtonElement>(null);
  // The rail scrolls sideways and would clip the menu, so it is fixed to the screen.
  const press = useLongPress(() =>
    setMenu(ownButton.current?.getBoundingClientRect() ?? null),
  );
  useEffect(() => {
    const request = ++generation.current;
    void api<SocialPage>("/social/feed?kind=STORY&tab=for-you", {
      cache: "no-store",
    })
      .then((result) => {
        if (request === generation.current) {
          setStories(result.items);
          setCursor(result.nextCursor);
          setError("");
        }
      })
      .catch((cause) => {
        if (request === generation.current) setError(cause.message);
      });
    return () => {
      generation.current++;
    };
  }, [refreshKey, retry]);
  async function more() {
    if (!cursor || loading.current) return;
    loading.current = true;
    setBusy(true);
    setError("");
    const request = generation.current;
    try {
      const result = await api<SocialPage>(
        `/social/feed?kind=STORY&tab=for-you&cursor=${encodeURIComponent(cursor)}`,
        { cache: "no-store" },
      );
      if (request !== generation.current) return;
      setStories((previous) => [
        ...previous,
        ...result.items.filter(
          (item) => !previous.some((old) => old.id === item.id),
        ),
      ]);
      setCursor(result.nextCursor);
    } catch (cause) {
      if (request === generation.current) setError((cause as Error).message);
    } finally {
      loading.current = false;
      setBusy(false);
    }
  }
  const start = stories.findIndex((story) => story.id === opened);
  return (
    <>
      <div
        className="social-stories"
        data-social-gesture="ignore"
        aria-label="Stories"
      >
        <div className="social-story-own">
          <button
            ref={ownButton}
            type="button"
            className={`social-story social-story-create ${own ? "has-story" : ""} ${own?.items.every((story) => story.seen) ? "seen" : ""}`}
            aria-label={own ? "Ver seus Stories" : "Criar seu Story"}
            onClick={() => {
              if (!own) return create();
              setOpened(
                (own.items.find((story) => !story.seen) ?? own.items[0]).id,
              );
            }}
            {...press}
          >
            <span className="social-story-ring">
              <Avatar user={me} />
              {!own && <Plus size={17} />}
            </span>
            <small>Seu Story</small>
          </button>
          {menu && (
            <OwnStoryMenu
              anchor={menu}
              close={() => setMenu(null)}
              create={() => {
                setMenu(null);
                create();
              }}
            />
          )}
        </div>
        <SocialLiveTray />
        {others.map((group) => {
          const first =
            group.items.find((story) => !story.seen) ?? group.items[0];
          return (
            <button
              type="button"
              key={group.authorId}
              className={`social-story ${group.items.every((story) => story.seen) ? "seen" : ""}`}
              aria-label={
                group.authorId === me.id
                  ? "Ver seus Stories"
                  : `Ver Stories de ${first.username}`
              }
              onClick={() => setOpened(first.id)}
            >
              <span className="social-story-ring">
                <Avatar user={postPerson(first)} />
              </span>
              <small>{first.username}</small>
            </button>
          );
        })}
        {cursor && (
          <button
            type="button"
            className="icon-control"
            aria-label="Mais Stories"
            disabled={busy}
            onClick={() => void more()}
          >
            <ChevronRight />
          </button>
        )}
      </div>
      {error && (
        <div role="alert" className="social-stories-error">
          <small>{error}</small>
          <button
            className="text-button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {opened !== null && start >= 0 && (
        <StoryViewer
          stories={stories}
          start={start}
          me={me.id}
          person={person}
          onViewed={(id) =>
            setStories((previous) =>
              previous.map((story) =>
                story.id === id && !story.seen
                  ? { ...story, seen: true }
                  : story,
              ),
            )
          }
          onDeleted={(id) => {
            setStories((previous) =>
              previous.filter((story) => story.id !== id),
            );
            setOpened(null);
          }}
          close={() => setOpened(null)}
        />
      )}
    </>
  );
}

/** Press-and-hold (or right-click) on your own Story: add another or edit your profile. */
function OwnStoryMenu({
  anchor,
  close,
  create,
}: {
  anchor: DOMRect;
  close: () => void;
  create: () => void;
}) {
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [close]);
  // A portal: the Social pager moves with a transform, which would carry a fixed
  // menu along with it (off screen on the Feed page).
  return createPortal(
    <div
      ref={menu}
      role="menu"
      aria-label="Opções do seu Story"
      className="social-story-menu"
      style={{
        top: anchor.bottom + 6,
        left: Math.max(8, Math.min(anchor.left, window.innerWidth - 208)),
      }}
    >
      <button type="button" role="menuitem" onClick={create}>
        <SquarePen size={18} aria-hidden="true" /> Novo Story
      </button>
      <NavigationLink href="/profile" role="menuitem" onClick={close}>
        <UserRoundPen size={18} aria-hidden="true" /> Editar perfil
      </NavigationLink>
    </div>,
    document.body,
  );
}
