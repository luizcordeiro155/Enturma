"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  ArrowRight,
  BookOpen,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { INTRO_STORAGE_KEY } from "./intro-model";

/** Narrow screens (phones, the PWA and the mobile web) get the 9:16 cut; wider ones the 16:9 cut. */
export const INTRO_PORTRAIT_QUERY = "(max-width: 760px)";
export const INTRO_VIDEOS = {
  portrait: {
    src: "/intro/enturma-apresentacao-9x16.mp4",
    poster: "/intro/enturma-apresentacao-9x16.jpg",
  },
  landscape: {
    src: "/intro/enturma-apresentacao-16x9.mp4",
    poster: "/intro/enturma-apresentacao-16x9.jpg",
  },
} as const;
export type IntroLayout = keyof typeof INTRO_VIDEOS;
export const INTRO_VIDEO_DURATION_LABEL = "2 min 27 s";

export function introClock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function currentLayout(): IntroLayout {
  return typeof window !== "undefined" &&
    window.matchMedia(INTRO_PORTRAIT_QUERY).matches
    ? "portrait"
    : "landscape";
}

export function EnturmaIntroExperience() {
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState(0);
  const [layout, setLayout] = useState<IntroLayout>("landscape");
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(90);
  const container = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const resumeAt = useRef(0);
  const finishing = useRef(false);
  const exit = useRef<gsap.core.Tween | null>(null);
  const seen = useRef(false);

  const replay = useCallback(() => {
    finishing.current = false;
    exit.current?.kill();
    if (container.current)
      gsap.set(container.current, { clearProps: "opacity,transform" });
    resumeAt.current = 0;
    setPaused(false);
    setTime(0);
    setMuted(false);
    setAudioBlocked(false);
    setRun((value) => value + 1);
    setOpen(true);
  }, []);

  useEffect(() => {
    try {
      seen.current = localStorage.getItem(INTRO_STORAGE_KEY) === "seen";
    } catch {
      /* Session-only fallback when storage is unavailable. */
    }
    const frame = requestAnimationFrame(() => setOpen(!seen.current));
    window.addEventListener("enturma-intro-replay", replay);
    return () => {
      cancelAnimationFrame(frame);
      exit.current?.kill();
      window.removeEventListener("enturma-intro-replay", replay);
    };
  }, [replay]);

  // Pick the cut for this screen and follow rotations and window resizes.
  useEffect(() => {
    const media = window.matchMedia(INTRO_PORTRAIT_QUERY);
    const update = () => {
      const next = currentLayout();
      setLayout((previous) => {
        if (previous !== next && video.current)
          resumeAt.current = video.current.currentTime;
        return next;
      });
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open || !container.current) return;
    const el = container.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const visibility = () =>
      setVisible(inView && document.visibilityState === "visible");
    const intersection = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        visibility();
        if (inView && !seen.current) {
          seen.current = true;
          try {
            localStorage.setItem(INTRO_STORAGE_KEY, "seen");
          } catch {
            /* No persistent storage. */
          }
        }
      },
      { threshold: 0.35 },
    );
    intersection.observe(el);
    document.addEventListener("visibilitychange", visibility);
    const context = gsap.context(() => {
      if (
        !reduced.matches &&
        document.documentElement.dataset.reducedMotion !== "true"
      )
        gsap.from(el, {
          opacity: 0,
          y: 10,
          duration: 0.3,
          clearProps: "opacity,transform",
        });
    }, el);
    if (run > 0) {
      el.scrollIntoView({ block: "center", behavior: "auto" });
      el.querySelector<HTMLButtonElement>("button")?.focus({
        preventScroll: true,
      });
    }
    return () => {
      context.revert();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [open, run]);

  // Play while on screen; browsers that refuse sound get a muted start and a button to hear it.
  useEffect(() => {
    const el = video.current;
    if (!el || !open) return;
    if (!visible || paused) {
      el.pause();
      return;
    }
    let alive = true;
    el.muted = muted;
    el.play().catch((error: DOMException) => {
      if (!alive || error.name !== "NotAllowedError" || el.muted) return;
      el.muted = true;
      setMuted(true);
      setAudioBlocked(true);
      void el.play().catch(() => {
        if (alive) setPaused(true);
      });
    });
    return () => {
      alive = false;
    };
  }, [open, visible, paused, muted, layout, run]);

  const finish = useCallback((restoreFocus = false) => {
    if (finishing.current) return;
    finishing.current = true;
    video.current?.pause();
    setPaused(true);
    const complete = () => {
      if (container.current)
        gsap.set(container.current, { clearProps: "opacity,transform" });
      setOpen(false);
      const content = document.getElementById(
        window.matchMedia(INTRO_PORTRAIT_QUERY).matches
          ? "enturma-study-guide"
          : "minhas-materias",
      );
      if (restoreFocus) content?.focus({ preventScroll: true });
    };
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true";
    if (reduced || !container.current) complete();
    else
      exit.current = gsap.to(container.current, {
        opacity: 0,
        scale: 0.99,
        duration: 0.18,
        onComplete: complete,
      });
  }, []);

  const startWithSound = () => {
    const el = video.current;
    if (!el) return;
    el.muted = false;
    void el.play();
    setMuted(false);
    setAudioBlocked(false);
    setPaused(false);
  };

  if (!open)
    return (
      <section
        ref={container}
        className="enturma-intro intro-minimized"
        aria-label="Apresentação do Enturma"
        data-minimized="true"
      >
        <button
          type="button"
          className="intro-replay-tile"
          onClick={replay}
          aria-label="Assistir apresentação"
        >
          <span className="intro-poster">
            <span className="intro-poster-orbit" />
            <BookOpen size={36} />
            <span className="intro-poster-play">
              <Play size={16} fill="currentColor" />
            </span>
          </span>
          <span>
            <strong>Conheça o Enturma</strong>
            <small>
              Sua faculdade em companhia · {INTRO_VIDEO_DURATION_LABEL} · com
              narração
            </small>
          </span>
          <Play size={21} />
        </button>
      </section>
    );
  const source = INTRO_VIDEOS[layout];
  return (
    <section
      ref={container}
      className="enturma-intro"
      aria-label="Apresentação do Enturma"
      data-layout={layout}
    >
      <header>
        <span>Conheça o seu Enturma</span>
        <div>
          <button
            type="button"
            className="intro-control intro-sound"
            aria-label={muted ? "Ouvir narração" : "Silenciar narração"}
            aria-pressed={!muted}
            onClick={() => {
              if (muted) startWithSound();
              else {
                if (video.current) video.current.muted = true;
                setMuted(true);
              }
            }}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            <span>{muted ? "Ouvir narração" : "Som ligado"}</span>
          </button>
          <button
            type="button"
            className="intro-control"
            onClick={() => {
              if (paused) setAudioBlocked(false);
              setPaused((value) => !value);
            }}
            aria-label={
              paused ? "Reproduzir apresentação" : "Pausar apresentação"
            }
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button
            type="button"
            className="intro-control"
            onClick={() => finish(true)}
          >
            Pular <ArrowRight size={17} />
          </button>
        </div>
      </header>
      {audioBlocked && (
        <button
          type="button"
          className="intro-audio-start"
          onClick={startWithSound}
        >
          <Volume2 size={20} /> Reproduzir com som
        </button>
      )}
      <div className="intro-video-frame" data-layout={layout}>
        <video
          key={`${layout}-${run}`}
          ref={video}
          className="intro-video"
          src={source.src}
          poster={source.poster}
          preload="metadata"
          playsInline
          aria-label="Vídeo de apresentação do Enturma com narração e legendas"
          onLoadedMetadata={(event) => {
            const el = event.currentTarget;
            if (Number.isFinite(el.duration)) setDuration(el.duration);
            if (resumeAt.current > 0) {
              el.currentTime = Math.min(resumeAt.current, el.duration - 0.5);
              resumeAt.current = 0;
            }
          }}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          onEnded={() => finish(false)}
          onError={() => setPaused(true)}
        />
      </div>
      <footer className="intro-timeline">
        <span>{introClock(time)}</span>
        <input
          type="range"
          min="0"
          max={Math.floor(duration)}
          step="0.1"
          value={Math.min(time, duration)}
          aria-label="Posição da apresentação"
          onChange={(event) => {
            const next = Number(event.target.value);
            setTime(next);
            if (video.current) video.current.currentTime = next;
          }}
        />
        <span>{introClock(duration)}</span>
      </footer>
    </section>
  );
}
