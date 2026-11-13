"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Heart,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { mediaUrl, socialWrite, type SocialPost as Post } from "@/lib/social";
import { useSocialStream } from "./social-stream";
import { SocialClipOverlay } from "./social-clip-overlay";
import { NavigationLink } from "../navigation-link";

function ClipVideo({
  item,
  active,
  near,
  autoplay,
  muted,
  change,
  progress,
}: {
  item: Post;
  active: boolean;
  near: boolean;
  autoplay: boolean;
  muted: boolean;
  change: (post: Post) => void;
  progress: (fraction: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null),
    lastTap = useRef<number | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualPause = useRef(false),
    manualStart = useRef(false),
    liking = useRef(false),
    watched = useRef(0);
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState("");
  const [burst, setBurst] = useState(0);
  const media = item.media[0];
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!active) {
      video.pause();
      manualStart.current = false;
      return;
    }
    const sync = () => {
      if (
        (!autoplay && !manualStart.current) ||
        manualPause.current ||
        document.hidden ||
        !document.hasFocus() ||
        document.querySelector("dialog[open]")
      )
        video.pause();
      else if (video.paused) void video.play().catch(() => {});
    };
    const pause = () => video.pause();
    sync();
    window.addEventListener("blur", pause);
    window.addEventListener("focus", sync);
    window.addEventListener("enturma-social-overlay-changed", sync);
    document.addEventListener("visibilitychange", sync);
    const observer = new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            (record.type === "attributes" &&
              record.target instanceof HTMLDialogElement) ||
            (record.type === "childList" &&
              [...record.addedNodes, ...record.removedNodes].some(
                (node) =>
                  node instanceof Element &&
                  (node.matches("dialog") || node.querySelector("dialog")),
              )),
        )
      )
        sync();
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    return () => {
      video.pause();
      observer.disconnect();
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = null;
      lastTap.current = null;
      window.removeEventListener("blur", pause);
      window.removeEventListener("focus", sync);
      window.removeEventListener("enturma-social-overlay-changed", sync);
      document.removeEventListener("visibilitychange", sync);
      if (watched.current > 0)
        void socialWrite(`/posts/${item.id}/view`, {
          watchedMs: Math.min(90000, Math.round(watched.current * 1000)),
          completed:
            !!video.duration && watched.current >= video.duration * 0.9,
        }).catch(() => {});
    };
  }, [active, autoplay, item.id]);
  function toggle() {
    const video = ref.current;
    if (!video || !active || document.querySelector("dialog[open]")) return;
    if (video.paused) {
      manualPause.current = false;
      manualStart.current = true;
      void video
        .play()
        .catch(() => setError("Toque novamente para reproduzir."));
    } else {
      manualPause.current = true;
      manualStart.current = false;
      video.pause();
    }
  }
  function tap(keyboard: boolean) {
    if (!active) return;
    if (keyboard) {
      toggle();
      return;
    }
    const now = performance.now();
    if (lastTap.current !== null && now - lastTap.current < 280) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = null;
      lastTap.current = null;
      setBurst((value) => value + 1);
      if (!item.mine.includes("LIKE") && !liking.current) {
        liking.current = true;
        void socialWrite<Post>(`/posts/${item.id}/reactions/LIKE`, {
          active: true,
        })
          .then(change)
          .catch((cause) => setError(cause.message))
          .finally(() => {
            liking.current = false;
          });
      }
      return;
    }
    lastTap.current = now;
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      lastTap.current = null;
      toggle();
    }, 280);
  }
  if (!media) return <p>Vídeo indisponível.</p>;
  return (
    <div className="social-clip-video">
      <video
        ref={ref}
        src={near ? mediaUrl(media.id) : undefined}
        poster={near ? mediaUrl(media.id, true) : undefined}
        playsInline
        draggable={false}
        muted={muted}
        preload={near ? "metadata" : "none"}
        loop
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          if (active && Number.isFinite(video.duration) && video.duration > 0)
            progress(video.currentTime / video.duration);
          if (active && !video.paused)
            watched.current = Math.max(watched.current, video.currentTime);
        }}
        onPlay={(event) => {
          if (
            !active ||
            document.hidden ||
            document.querySelector("dialog[open]")
          ) {
            event.currentTarget.pause();
            return;
          }
          document
            .querySelectorAll<HTMLVideoElement>(
              ".social-page video,.social-dialog video",
            )
            .forEach((video) => {
              if (video !== event.currentTarget) video.pause();
            });
          setPlaying(true);
          setError("");
        }}
        onPause={() => setPlaying(false)}
        onError={() => {
          if (near)
            setError(
              "Não foi possível carregar este Clip. Verifique a conexão.",
            );
        }}
      />
      <button
        type="button"
        className="social-video-toggle"
        aria-label={playing ? "Pausar Clip" : "Reproduzir Clip"}
        disabled={!active}
        onClick={(event) => tap(event.detail === 0)}
      >
        {!playing && <Play size={40} />}
      </button>
      {burst > 0 && (
        <Heart
          key={burst}
          className="social-clip-like-burst"
          size={96}
          fill="currentColor"
          aria-hidden="true"
        />
      )}
      {error && (
        <div role="alert" className="social-video-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setError("");
              ref.current?.load();
              manualPause.current = false;
              manualStart.current = true;
              void ref.current
                ?.play()
                .catch(() => setError("Toque novamente para reproduzir."));
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
function ClipPage({
  item,
  me,
  person,
  active,
  near,
  autoplay,
  muted,
  change,
}: {
  item: Post;
  me: string;
  person: (id: string) => void;
  active: boolean;
  near: boolean;
  autoplay: boolean;
  muted: boolean;
  change: (post: Post) => void;
}) {
  const [progress, setProgress] = useState(0);
  return (
    <>
      <ClipVideo
        item={item}
        active={active}
        near={near}
        autoplay={autoplay}
        muted={muted}
        change={change}
        progress={setProgress}
      />
      <SocialClipOverlay
        item={item}
        me={me}
        person={person}
        changed={change}
        progress={active ? progress : 0}
      />
    </>
  );
}
const MUTED_KEY = "enturma-social-clips-muted";
const TABS = [
  ["for-you", "Para você"],
  ["following", "Seguindo"],
] as const;
export function SocialClips({
  active,
  me,
  autoplay,
  person,
  initialClip,
}: {
  active: boolean;
  me: string;
  autoplay: boolean;
  person: (id: string) => void;
  initialClip?: Post;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("for-you"),
    [opened, setOpened] = useState<string[]>(["for-you"]);
  const [muted, setMuted] = useState(() => {
    try {
      return sessionStorage.getItem(MUTED_KEY) !== "0";
    } catch {
      return true;
    }
  });
  function toggleMuted() {
    setMuted((value) => {
      try {
        sessionStorage.setItem(MUTED_KEY, value ? "0" : "1");
      } catch {
        /* Storage may be unavailable. */
      }
      return !value;
    });
  }
  return (
    <div className="social-clips-tabbed">
      <NavigationLink
        href="/home"
        className="social-clips-exit"
        aria-label="Início do Enturma"
      >
        <ArrowLeft size={24} />
      </NavigationLink>
      <div
        className="social-tabs social-clips-tabs"
        role="tablist"
        aria-label="Clips"
      >
        {TABS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              setOpened((previous) =>
                previous.includes(key) ? previous : [...previous, key],
              );
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {TABS.map(
        ([key]) =>
          opened.includes(key) && (
            <div key={key} className="social-clips-feed" hidden={tab !== key}>
              <ClipsFeed
                query={`kind=CLIP&tab=${key}`}
                active={active && tab === key}
                me={me}
                autoplay={autoplay}
                person={person}
                muted={muted}
                toggleMuted={toggleMuted}
                initialClip={key === "for-you" ? initialClip : undefined}
              />
            </div>
          ),
      )}
    </div>
  );
}
function ClipsFeed({
  query,
  active,
  me,
  autoplay,
  person,
  muted,
  toggleMuted,
  initialClip,
}: {
  query: string;
  active: boolean;
  me: string;
  autoplay: boolean;
  person: (id: string) => void;
  muted: boolean;
  toggleMuted: () => void;
  initialClip?: Post;
}) {
  const stream = useSocialStream(
      query,
      active,
      undefined,
      initialClip ? [initialClip] : [],
    ),
    container = useRef<HTMLDivElement>(null),
    latestLoad = useRef(stream.load);
  const items = stream.items.filter(
    (item) => !item.mine.includes("HIDE") && item.media[0]?.kind === "VIDEO",
  );
  const [index, setIndex] = useState(0);
  const loopMarker = useRef<HTMLDivElement>(null),
    looping = useRef(false),
    preferred = useRef<string | undefined>(undefined);
  const restart = useRef(async () => {});
  useEffect(() => {
    restart.current = async () => {
      if (looping.current || stream.busy) return;
      looping.current = true;
      const loaded = await stream.load(true);
      if (loaded) {
        setIndex(0);
        container.current?.scrollTo({ top: 0, behavior: "instant" });
      }
      looping.current = false;
    };
  }, [stream.load, stream.busy]);
  useEffect(() => {
    const own = (event: Event) => {
      const post = (event as CustomEvent<{ id: string; kind: string }>).detail;
      if (post?.kind === "CLIP") preferred.current = post.id;
    };
    window.addEventListener("enturma-social-published", own);
    return () => window.removeEventListener("enturma-social-published", own);
  }, []);
  useEffect(() => {
    if (!active || !preferred.current) return;
    const position = items.findIndex((item) => item.id === preferred.current);
    if (position < 0) return;
    preferred.current = undefined;
    const timer = setTimeout(() => {
      setIndex(position);
      const page = container.current?.querySelector<HTMLElement>(
        `[data-clip-index="${position}"]`,
      );
      if (page)
        container.current?.scrollTo({
          top: page.offsetTop,
          behavior: "instant",
        });
    }, 0);
    return () => clearTimeout(timer);
  }, [active, items]);
  useEffect(() => {
    const marker = loopMarker.current;
    if (
      !active ||
      stream.cursor !== "" ||
      !marker ||
      stream.error ||
      !items.length
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some(
            (entry) => entry.isIntersecting && entry.intersectionRatio > 0.5,
          )
        )
          void restart.current();
      },
      { root: container.current, threshold: 0.55 },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [active, stream.cursor, stream.error, items.length]);
  const activeIndex = Math.max(0, Math.min(index, items.length - 1));
  const currentIndex = useRef(activeIndex);
  useEffect(() => {
    latestLoad.current = stream.load;
    currentIndex.current = activeIndex;
  }, [stream.load, activeIndex]);
  useEffect(() => {
    const viewport = container.current;
    if (!active || !viewport) return;
    const observer = new ResizeObserver(() => {
      const selected = viewport.querySelector<HTMLElement>(
        `[data-clip-index="${currentIndex.current}"]`,
      );
      if (selected)
        viewport.scrollTo({ top: selected.offsetTop, behavior: "instant" });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [active]);
  useEffect(() => {
    const viewport = container.current;
    if (!active || !viewport) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible)
          setIndex(Number((visible.target as HTMLElement).dataset.clipIndex));
      },
      { root: viewport, threshold: [0.55, 0.8] },
    );
    viewport
      .querySelectorAll("[data-clip-index]")
      .forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [active, items.length]);
  useEffect(() => {
    if (
      active &&
      activeIndex >= items.length - 3 &&
      stream.cursor &&
      !stream.error
    )
      void latestLoad.current();
  }, [active, activeIndex, items.length, stream.cursor, stream.error]);
  function move(delta: number) {
    if (delta > 0 && activeIndex >= items.length - 1) {
      if (stream.cursor === "") void restart.current();
      else void stream.load();
      return;
    }
    const viewport = container.current,
      selected = viewport?.querySelector<HTMLElement>(
        `[data-clip-index="${Math.max(0, Math.min(items.length - 1, activeIndex + delta))}"]`,
      );
    if (selected)
      viewport?.scrollTo({
        top: selected.offsetTop,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }
  return (
    <div className="social-clips-shell">
      <div
        className="social-clips"
        ref={container}
        tabIndex={0}
        aria-label="Enturma Clips"
        onKeyDown={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("button,input,textarea,dialog,a")
          )
            return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            move(event.key === "ArrowDown" ? 1 : -1);
          }
        }}
      >
        {items.map((item, i) => (
          <section
            key={item.id}
            data-clip-index={i}
            data-clip-id={item.id}
            className="social-clip-page"
          >
            <ClipPage
              item={item}
              me={me}
              person={person}
              active={active && i === activeIndex}
              near={active && Math.abs(i - activeIndex) <= 1}
              autoplay={autoplay}
              muted={muted}
              change={stream.change}
            />
          </section>
        ))}
        {!!items.length && stream.cursor === "" && (
          <div
            ref={loopMarker}
            className="social-clip-loop"
            aria-label="Continuar assistindo"
          >
            <p role="status">Preparando mais Clips...</p>
            <button
              className="secondary"
              disabled={stream.busy}
              onClick={() => void restart.current()}
            >
              Continuar assistindo
            </button>
          </div>
        )}
        {!items.length && (
          <div className="social-empty">
            <h2>Enturma Clips</h2>
            <p>
              {stream.busy
                ? "Buscando Clips…"
                : "Os Clips publicados aparecerão aqui."}
            </p>
          </div>
        )}
        {stream.error && (
          <div role="alert" className="social-error">
            <p>{stream.error}</p>
            <button type="button" onClick={() => void stream.load()}>
              Tentar novamente
            </button>
          </div>
        )}
        {stream.cursor !== "" && !stream.busy && !stream.error && (
          <button className="secondary" onClick={() => void stream.load()}>
            Carregar Clips
          </button>
        )}
      </div>
      <div className="social-clip-controls">
        <button
          className="icon-control"
          aria-label={muted ? "Ativar som dos Clips" : "Silenciar Clips"}
          onClick={toggleMuted}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
        <button
          className="icon-control"
          aria-label="Clip anterior"
          disabled={!activeIndex}
          onClick={() => move(-1)}
        >
          <ChevronUp />
        </button>
        <button
          className="icon-control"
          aria-label="Próximo Clip"
          disabled={!items.length || stream.busy}
          onClick={() => move(1)}
        >
          <ChevronDown />
        </button>
      </div>
    </div>
  );
}
