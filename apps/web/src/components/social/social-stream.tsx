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

export function useSocialStream(query: string, active: boolean) {
  const [items, setItems] = useState<Post[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const running = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const load = useCallback(
    async (reset = false) => {
      if (running.current || (!reset && cursor === "")) return;
      running.current = true;
      setBusy(true);
      setError("");
      try {
        const result = await api<SocialPage>(
          `/social/feed?${query}${!reset && cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
          { cache: "no-store" },
        );
        if (mounted.current) {
          setItems((old) =>
            reset ? result.items : mergeSocialPage(old, result.items),
          );
          setCursor(result.nextCursor);
        }
      } catch (e) {
        if (mounted.current) setError((e as Error).message);
      } finally {
        running.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [query, cursor],
  );
  useEffect(() => {
    if (!active || cursor !== null || error) return;
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [active, cursor, error, load]);
  const change = useCallback(
    (p: Post) =>
      setItems((old) => old.map((item) => (item.id === p.id ? p : item))),
    [],
  );
  return { items, cursor, busy, error, load, change };
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
  const stream = useSocialStream(query, active),
    sentinel = useRef<HTMLDivElement>(null),
    panel = useRef<HTMLDivElement>(null),
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
      { root: panel.current, rootMargin: "350px" },
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
      onTouchStart={(event) => {
        const touch = event.touches[0];
        pull.current =
          event.touches.length === 1 && event.currentTarget.scrollTop <= 0
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
            event.currentTarget.scrollTop,
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
              panel.current?.scrollTo({ top: 0, behavior: "auto" });
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
            autoplay={autoplay}
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
            <small>Você chegou ao fim por enquanto.</small>
          )}
        </div>
      </div>
    </div>
  );
}
