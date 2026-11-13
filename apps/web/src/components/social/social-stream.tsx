"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  mergeSocialPage,
  type SocialPage,
  type SocialPost as Post,
} from "@/lib/social";
import { pullRefreshes } from "@/lib/social-media";
import { SocialPost } from "./social-post";
import { useLiveRefresh } from "@/lib/live-updates";
import { mergeFreshPosts } from "@/lib/social-stream-state";

export function useSocialStream(
  query: string,
  active: boolean,
  prependFresh?: () => boolean,
) {
  const [items, setItems] = useState<Post[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const running = useRef(false),
    refreshing = useRef(false),
    mounted = useRef(true),
    dirty = useRef(false);
  const latest = useRef({ active, query, prependFresh }),
    requestVersion = useRef(0);
  useEffect(() => {
    latest.current = { active, query, prependFresh };
  }, [active, query, prependFresh]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestVersion.current++;
    };
  }, []);
  const load = useCallback(
    async (reset = false) => {
      if (running.current || (!reset && cursor === "")) return false;
      running.current = true;
      setBusy(true);
      setError("");
      const version = ++requestVersion.current;
      try {
        const result = await api<SocialPage>(
          `/social/feed?${query}${!reset && cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
          { cache: "no-store" },
        );
        if (mounted.current && version === requestVersion.current) {
          setItems((old) =>
            reset ? result.items : mergeSocialPage(old, result.items),
          );
          setCursor(result.nextCursor);
        }
        return true;
      } catch (cause) {
        if (mounted.current) setError((cause as Error).message);
        return false;
      } finally {
        running.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [query, cursor],
  );
  const refresh = useCallback(async () => {
    if (!latest.current.active || document.hidden || !navigator.onLine) {
      dirty.current = true;
      return;
    }
    if (running.current || refreshing.current) {
      dirty.current = true;
      return;
    }
    refreshing.current = true;
    const version = requestVersion.current;
    try {
      const result = await api<SocialPage>(
        `/social/feed?${latest.current.query}`,
        { cache: "no-store" },
      );
      if (mounted.current && version === requestVersion.current) {
        setItems((old) =>
          mergeFreshPosts(
            old,
            result.items,
            latest.current.prependFresh?.() ?? false,
          ),
        );
        setError("");
        dirty.current = false;
      }
    } catch (cause) {
      if (mounted.current) setError((cause as Error).message);
    } finally {
      refreshing.current = false;
    }
  }, []);
  useLiveRefresh("social_changed", refresh, 20000);
  useEffect(() => {
    if (!active || cursor !== null || error) return;
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [active, cursor, error, load]);
  useEffect(() => {
    const onPublish = () => {
      dirty.current = true;
      void refresh();
    };
    const onRemove = (event: Event) => {
      const id = (event as CustomEvent<{ id: string }>).detail?.id;
      if (id) setItems((old) => old.filter((post) => post.id !== id));
    };
    window.addEventListener("enturma-social-published", onPublish);
    window.addEventListener("enturma-social-post-removed", onRemove);
    window.addEventListener("online", onPublish);
    const timer = setInterval(() => void refresh(), 20000);
    const task = setTimeout(() => {
      if (active && dirty.current && !busy) void refresh();
    }, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(task);
      window.removeEventListener("enturma-social-published", onPublish);
      window.removeEventListener("enturma-social-post-removed", onRemove);
      window.removeEventListener("online", onPublish);
    };
  }, [refresh, active, busy]);
  const change = useCallback(
    (post: Post) =>
      setItems((old) => old.map((item) => (item.id === post.id ? post : item))),
    [],
  );
  return { items, cursor, busy, error, load, change, refresh };
}

export function SocialStream({
  query,
  active,
  me,
  person,
  refreshKey = 0,
  autoplay = true,
}: {
  query: string;
  active: boolean;
  me: string;
  person: (id: string) => void;
  refreshKey?: number;
  autoplay?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  // Stories and tabs scroll with the Feed; other lists own their scroll area.
  const scroller = () =>
    panel.current?.closest<HTMLElement>("[data-social-scroller]") ?? panel.current;
  const stream = useSocialStream(
      query,
      active,
      () => (scroller()?.scrollTop ?? 0) < 8,
    ),
    sentinel = useRef<HTMLDivElement>(null),
    latest = useRef(stream.load),
    pull = useRef<{ x: number; y: number } | null>(null);
  const [newContent, setNewContent] = useState(false);
  useEffect(() => {
    latest.current = stream.load;
  }, [stream.load]);
  useEffect(() => {
    if (!active || stream.cursor === "" || stream.error || !sentinel.current)
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void latest.current();
      },
      {
        root:
          panel.current?.closest<HTMLElement>("[data-social-scroller]") ??
          panel.current,
        rootMargin: "350px",
      },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [active, stream.cursor, stream.error]);
  useEffect(() => {
    const changed = () => setNewContent(true);
    window.addEventListener("enturma-social_changed", changed);
    window.addEventListener("enturma-live-resync", changed);
    return () => {
      window.removeEventListener("enturma-social_changed", changed);
      window.removeEventListener("enturma-live-resync", changed);
    };
  }, []);
  useEffect(() => {
    if (refreshKey) {
      void latest.current(true);
    }
  }, [refreshKey]);
  // An explicit refresh never moves a student in the middle of reading.
  return (
    <div
      className="social-stream"
      ref={panel}
      tabIndex={0}
      aria-label="Publicações"
      aria-busy={stream.busy}
      onTouchCancel={() => {
        pull.current = null;
      }}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        pull.current =
          event.touches.length === 1 && (scroller()?.scrollTop ?? 0) <= 0
            ? { x: touch.clientX, y: touch.clientY }
            : null;
      }}
      onTouchEnd={(event) => {
        const start = pull.current,
          touch = event.changedTouches[0];
        pull.current = null;
        if (
          start &&
          touch &&
          !stream.busy &&
          pullRefreshes(
            scroller()?.scrollTop ?? 0,
            touch.clientX - start.x,
            touch.clientY - start.y,
          )
        ) {
          setNewContent(false);
          void stream.load(true);
        }
      }}
    >
      <div className="social-stream-inner">
        {newContent && (
          <button
            className="social-fresh secondary"
            onClick={() => {
              setNewContent(false);
              scroller()?.scrollTo({ top: 0, behavior: "auto" });
              void stream.load(true);
            }}
          >
            Novas publicações · atualizar
          </button>
        )}
        {stream.items.map((item) => (
          <SocialPost
            key={item.id}
            item={item}
            me={me}
            person={person}
            changed={stream.change}
            autoplay={active && autoplay}
          />
        ))}
        {stream.busy &&
          !stream.items.length &&
          [0, 1, 2].map((key) => (
            <div key={key} className="social-post-skeleton" aria-hidden="true">
              <span />
              <div />
              <p />
            </div>
          ))}
        {!stream.busy && !stream.items.length && !stream.error && (
          <div className="social-empty">
            <h2>Uma ideia pode começar aqui.</h2>
            <p>
              Nenhuma publicação neste filtro. Siga estudantes ou compartilhe
              seu primeiro projeto.
            </p>
          </div>
        )}
        {stream.error && <p role="alert">{stream.error}</p>}
        <div ref={sentinel} className="social-load" aria-live="polite">
          {stream.busy
            ? "Buscando publicações…"
            : stream.cursor !== "" && (
                <button
                  className="secondary"
                  onClick={() => void stream.load()}
                >
                  Carregar mais
                </button>
              )}
          {stream.cursor === "" && !!stream.items.length && (
            <small>Acompanhando novas publicações…</small>
          )}
        </div>
      </div>
    </div>
  );
}
