"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  mergeSocialPage,
  type SocialPage,
  type SocialPost as Post,
} from "@/lib/social";
import { pullRefreshes } from "@/lib/social-media";
import { SocialPullRefresh } from "./social-pull-refresh";
import { SocialPost } from "./social-post";
import { useLiveRefresh } from "@/lib/live-updates";
import { mergeFreshPosts } from "@/lib/social-stream-state";

export function useSocialStream(
  query: string,
  active: boolean,
  prependFresh?: () => boolean,
  initialItems: Post[] = [],
  // True while the student is already where new publications land.
  caughtUp?: () => boolean,
) {
  const [items, setItems] = useState<Post[]>(initialItems),
    [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  // Publications that arrived below while the student was reading further up.
  const [fresh, setFresh] = useState(0);
  const known = useRef(new Set<string>());
  useEffect(() => {
    known.current = new Set(items.map((post) => post.id));
  }, [items]);
  const running = useRef(false),
    refreshing = useRef(false),
    mounted = useRef(true),
    dirty = useRef(false);
  const latest = useRef({ active, query, prependFresh, caughtUp }),
    requestVersion = useRef(0);
  useEffect(() => {
    latest.current = { active, query, prependFresh, caughtUp };
  }, [active, query, prependFresh, caughtUp]);
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
          if (reset) setFresh(0);
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
      return 0;
    }
    if (running.current || refreshing.current) {
      dirty.current = true;
      return 0;
    }
    refreshing.current = true;
    const version = requestVersion.current;
    try {
      const result = await api<SocialPage>(
        `/social/feed?${latest.current.query}`,
        { cache: "no-store" },
      );
      if (mounted.current && version === requestVersion.current) {
        const prepend = latest.current.prependFresh?.() ?? false;
        const added = result.items.filter(
          (post) => !known.current.has(post.id),
        ).length;
        setItems((old) => mergeFreshPosts(old, result.items, prepend));
        if (
          added &&
          !prepend &&
          latest.current.prependFresh &&
          !latest.current.caughtUp?.()
        )
          setFresh((count) => count + added);
        setError("");
        dirty.current = false;
        return added;
      }
    } catch (cause) {
      if (mounted.current) setError((cause as Error).message);
    } finally {
      refreshing.current = false;
    }
    return 0;
  }, []);
  const seen = useCallback(() => setFresh(0), []);
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
  return { items, cursor, busy, error, load, change, refresh, fresh, seen };
}

/** When Seguindo or Minha Faculdade run out, the Feed continues with Para Você. */
function suggestionQuery(query: string) {
  const params = new URLSearchParams(query);
  const tab = params.get("tab");
  if (params.get("q") || (tab !== "following" && tab !== "campus")) return "";
  params.set("tab", "for-you");
  return params.toString();
}
/** Shortest wait between two "anything new?" checks at the end of the Feed. */
const END_CHECK_MS = 5000;

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
    panel.current?.closest<HTMLElement>("[data-social-scroller]") ??
    panel.current;
  const atEnd = useRef(false);
  const stream = useSocialStream(
      query,
      active,
      () => (scroller()?.scrollTop ?? 0) < 8,
      [],
      // At the end, what arrives is already in front of the student: no notice.
      () => atEnd.current,
    ),
    sentinel = useRef<HTMLDivElement>(null),
    latest = useRef(stream.load),
    pull = useRef<{ x: number; y: number } | null>(null);
  const ended = stream.cursor === "" && !stream.error;
  const suggestQuery = suggestionQuery(query);
  const suggested = useSocialStream(
    suggestQuery || query,
    active && !!suggestQuery && ended && stream.items.length > 0,
  );
  const continues = !!suggestQuery && ended && stream.items.length > 0;
  // The list being paged at the bottom: the tab itself, then its suggestions.
  const tail = continues ? suggested : stream;
  const shown = new Set(stream.items.map((post) => post.id));
  const suggestions = continues
    ? suggested.items.filter((post) => !shown.has(post.id))
    : [];
  const more = useRef(tail.load),
    recheck = useRef({ stream, suggested, continues }),
    lastCheck = useRef(0);
  const [checking, setChecking] = useState(false);
  const [pulled, setPulled] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshNow = useCallback(() => {
    setRefreshing(true);
    void latest.current(true).finally(() => setRefreshing(false));
  }, []);
  useEffect(() => {
    latest.current = stream.load;
    more.current = tail.load;
    recheck.current = { stream, suggested, continues };
  });
  useEffect(() => {
    if (!active || tail.error || !sentinel.current) return;
    const paging = tail.cursor !== "";
    const observer = new IntersectionObserver(
      (entries) => {
        atEnd.current = entries.some((e) => e.isIntersecting);
        if (!atEnd.current) return;
        if (paging) return void more.current();
        // The end of everything: look for new publications right away, like a
        // feed that never runs dry, instead of asking the student to refresh.
        const now = recheck.current;
        now.stream.seen();
        if (Date.now() - lastCheck.current < END_CHECK_MS) return;
        lastCheck.current = Date.now();
        setChecking(true);
        void Promise.all([
          now.stream.refresh(),
          now.continues ? now.suggested.refresh() : 0,
        ]).finally(() => setChecking(false));
      },
      {
        root:
          panel.current?.closest<HTMLElement>("[data-social-scroller]") ??
          panel.current,
        rootMargin: "350px",
      },
    );
    observer.observe(sentinel.current);
    return () => {
      atEnd.current = false;
      observer.disconnect();
    };
  }, [active, tail.cursor, tail.error]);
  useEffect(() => {
    if (!refreshKey) return;
    // Tapping "Enturma": back to the top, then fresh posts with the spinner.
    panel.current
      ?.closest<HTMLElement>("[data-social-scroller]")
      ?.scrollTo?.({ top: 0, behavior: "smooth" });
    const frame = requestAnimationFrame(refreshNow);
    return () => cancelAnimationFrame(frame);
  }, [refreshKey, refreshNow]);
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
        setPulled(0);
      }}
      onTouchMove={(event) => {
        const start = pull.current,
          touch = event.touches[0];
        if (!start || !touch || refreshing) return;
        const dy = touch.clientY - start.y;
        // Resistance, like Instagram: the ring follows at half the finger's speed.
        setPulled(
          dy > 0 && dy > Math.abs(touch.clientX - start.x) ? dy * 0.5 : 0,
        );
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
        setPulled(0);
        if (
          start &&
          touch &&
          !stream.busy &&
          !refreshing &&
          pullRefreshes(
            scroller()?.scrollTop ?? 0,
            touch.clientX - start.x,
            touch.clientY - start.y,
          )
        )
          refreshNow();
      }}
    >
      <SocialPullRefresh distance={pulled} refreshing={refreshing} />
      <div className="social-stream-inner">
        {stream.fresh > 0 && (
          <button
            className="social-fresh secondary"
            onClick={() => {
              scroller()?.scrollTo?.({ top: 0, behavior: "smooth" });
              refreshNow();
            }}
          >
            Novas publicações
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
        {suggestions.length > 0 && (
          <>
            <div className="social-caught-up" role="separator">
              <strong>Você está em dia</strong>
              <span>Sugestões para você</span>
            </div>
            {suggestions.map((item) => (
              <SocialPost
                key={item.id}
                item={item}
                me={me}
                person={person}
                changed={suggested.change}
                autoplay={active && autoplay}
              />
            ))}
          </>
        )}
        {continues && suggested.error && <p role="alert">{suggested.error}</p>}
        <div ref={sentinel} className="social-load" aria-live="polite">
          {tail.busy
            ? "Buscando publicações…"
            : tail.cursor !== "" && (
                <button className="secondary" onClick={() => void tail.load()}>
                  Carregar mais
                </button>
              )}
          {tail.cursor === "" && !tail.busy && !!stream.items.length && (
            <small>
              {checking
                ? "Buscando novidades…"
                : "Você está em dia. As novas publicações aparecem aqui."}
            </small>
          )}
        </div>
      </div>
    </div>
  );
}
