"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Play, Volume2, VolumeX } from "lucide-react";
import { mediaUrl, socialWrite, type SocialPost as Post } from "@/lib/social";
import { useSocialStream } from "./social-stream";
import { SocialPost } from "./social-post";

function ClipVideo({
  item,
  active,
  near,
  autoplay,
  muted,
  change,
}: {
  item: Post;
  active: boolean;
  near: boolean;
  autoplay: boolean;
  muted: boolean;
  change: (p: Post) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null),
    lastTap = useRef(0),
    liked = useRef(false),
    watched = useRef(0);
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const pause = () => {
      if (document.hidden || !document.hasFocus()) video.pause();
    };
    if (
      active &&
      autoplay &&
      !document.hidden &&
      !document.querySelector("dialog[open]")
    )
      void video.play().catch(() => {});
    else video.pause();
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", pause);
    return () => {
      video.pause();
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", pause);
      if (watched.current > 0)
        void socialWrite(`/posts/${item.id}/view`, {
          watchedMs: Math.min(90000, Math.round(watched.current * 1000)),
          completed:
            !!video.duration && watched.current >= video.duration * 0.9,
        }).catch(() => {});
    };
  }, [active, autoplay, item.id]);
  const m = item.media[0];
  if (!m) return <p>Vídeo indisponível.</p>;
  async function tap() {
    const video = ref.current;
    if (!video) return;
    const now = performance.now();
    if (
      now - lastTap.current < 300 &&
      !item.mine.includes("LIKE") &&
      !liked.current
    ) {
      liked.current = true;
      try {
        change(
          await socialWrite<Post>(`/posts/${item.id}/reactions/LIKE`, {
            active: true,
          }),
        );
      } catch (e) {
        setError((e as Error).message);
      } finally {
        liked.current = false;
      }
    } else if (video.paused)
      await video
        .play()
        .catch(() => setError("Toque novamente para reproduzir."));
    else video.pause();
    lastTap.current = now;
  }
  return (
    <div className="social-clip-video" data-social-gesture="ignore">
      <video
        ref={ref}
        src={near ? mediaUrl(m.id) : undefined}
        poster={mediaUrl(m.id, true)}
        playsInline
        muted={muted}
        preload={near ? "metadata" : "none"}
        loop
        onTimeUpdate={(e) => {
          if (active && !e.currentTarget.paused)
            watched.current = Math.max(
              watched.current,
              e.currentTarget.currentTime,
            );
        }}
        onPlay={(event) => {
          if (!active) {
            event.currentTarget.pause();
            return;
          }
          document
            .querySelectorAll<HTMLVideoElement>(".social-clip-video video")
            .forEach((video) => {
              if (video !== event.currentTarget) video.pause();
            });
          setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
        onError={() =>
          setError("Não foi possível carregar este Clip. Verifique a conexão.")
        }
      />
      <button
        className="social-video-toggle"
        aria-label={playing ? "Pausar Clip" : "Reproduzir Clip"}
        disabled={!active}
        onClick={() => void tap()}
      >
        {!playing && <Play size={38} />}
      </button>
      {error && (
        <p role="alert" className="social-video-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function SocialClips({
  active,
  me,
  autoplay,
  person,
}: {
  active: boolean;
  me: string;
  autoplay: boolean;
  person: (id: string) => void;
}) {
  const stream = useSocialStream("kind=CLIP&tab=for-you", active),
    container = useRef<HTMLDivElement>(null),
    latestLoad = useRef(stream.load);
  const [index, setIndex] = useState(0),
    [muted, setMuted] = useState(true);
  const currentIndex = useRef(index);
  useEffect(() => {
    latestLoad.current = stream.load;
  }, [stream.load]);
  useEffect(() => {
    currentIndex.current = index;
  }, [index]);
  useEffect(() => {
    const viewport = container.current;
    if (!active || !viewport) return;
    // Keep the selected Clip aligned after rotation, window resize or keyboard changes.
    // Scrolling only this surface avoids moving the application header/navigation.
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
    if (!active || !container.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible)
          setIndex(Number((visible.target as HTMLElement).dataset.clipIndex));
      },
      { root: container.current, threshold: [0.55, 0.8] },
    );
    container.current
      .querySelectorAll("[data-clip-index]")
      .forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [active, stream.items.length]);
  useEffect(() => {
    if (
      active &&
      index >= stream.items.length - 3 &&
      stream.cursor &&
      !stream.error
    )
      void latestLoad.current();
  }, [active, index, stream.items.length, stream.cursor, stream.error]);
  function move(delta: number) {
    const viewport = container.current;
    const selected = viewport?.querySelector<HTMLElement>(
      `[data-clip-index="${Math.max(0, Math.min(stream.items.length - 1, index + delta))}"]`,
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
        onKeyDown={(e) => {
          if (
            e.target instanceof HTMLElement &&
            e.target.closest("button,input,textarea,dialog")
          )
            return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            move(e.key === "ArrowDown" ? 1 : -1);
          }
        }}
      >
        {stream.items.map((item, i) => (
          <section
            key={item.id}
            data-clip-index={i}
            className="social-clip-page"
          >
            <SocialPost
              item={item}
              me={me}
              person={person}
              changed={stream.change}
              clip
            >
              <ClipVideo
                item={item}
                active={active && i === index}
                near={active && Math.abs(i - index) <= 1}
                autoplay={autoplay}
                muted={muted}
                change={stream.change}
              />
            </SocialPost>
          </section>
        ))}
        {!stream.items.length && (
          <div className="social-empty">
            <h2>Seu conhecimento em movimento.</h2>
            <p>
              {stream.busy
                ? "Buscando Clips…"
                : "Os Clips publicados aparecerão aqui."}
            </p>
          </div>
        )}
        {stream.error && <p role="alert">{stream.error}</p>}
        {stream.cursor !== "" && !stream.busy && (
          <button className="secondary" onClick={() => void stream.load()}>
            Carregar Clips
          </button>
        )}
      </div>
      <div className="social-clip-controls">
        <button
          className="icon-control"
          aria-label={muted ? "Ativar som dos Clips" : "Silenciar Clips"}
          onClick={() => setMuted((v) => !v)}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
        <button
          className="icon-control"
          aria-label="Clip anterior"
          disabled={!index}
          onClick={() => move(-1)}
        >
          <ChevronUp />
        </button>
        <button
          className="icon-control"
          aria-label="Próximo Clip"
          disabled={index >= stream.items.length - 1}
          onClick={() => move(1)}
        >
          <ChevronDown />
        </button>
      </div>
    </div>
  );
}
