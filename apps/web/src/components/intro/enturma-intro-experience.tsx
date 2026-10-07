"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Profile } from "@enturma/contracts";
import type { PlayerRef } from "@remotion/player";
import { gsap } from "gsap";
import {
  ArrowRight,
  BookOpen,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  introDimensions,
  introQuality,
  INTRO_FEATURES,
  INTRO_STORAGE_KEY,
  INTRO_FRAMES,
  introNarrationAt,
  type IntroProps,
} from "./intro-model";

const IntroPlayer = dynamic(() => import("./intro-player"), {
  ssr: false,
  loading: () => (
    <div className="intro-fallback" role="status">
      Preparando sua apresentação…
    </div>
  ),
});

export function EnturmaIntroExperience({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [frame, setFrame] = useState(0);
  const [muted, setMuted] = useState(true);
  const [heard, setHeard] = useState(false);
  const [seekFrame, setSeekFrame] = useState<number>();
  const [dimensions, setDimensions] = useState(introDimensions(900));
  const [theme, setTheme] = useState<IntroProps["theme"]>("light");
  const [quality, setQuality] = useState<IntroProps["quality"]>("optimized");
  const container = useRef<HTMLElement>(null);
  const player = useRef<PlayerRef>(null);
  const finishing = useRef(false);
  const exit = useRef<gsap.core.Tween | null>(null);
  const seen = useRef(false);
  const replay = useCallback(() => {
    finishing.current = false;
    exit.current?.kill();
    if (container.current)
      gsap.set(container.current, { clearProps: "opacity,transform" });
    setPaused(false);
    setFrame(0);
    setMuted(true);
    setHeard(false);
    setSeekFrame(undefined);
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

  useEffect(() => {
    if (!open || !container.current) return;
    const el = container.current;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const width = el.clientWidth;
      const memory = (navigator as Navigator & { deviceMemory?: number })
        .deviceMemory;
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      );
      setQuality(
        introQuality(
          media.matches ||
            document.documentElement.dataset.reducedMotion === "true",
          memory,
          navigator.hardwareConcurrency || 4,
          width,
        ),
      );
      setDimensions(introDimensions(width));
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(el);
    const themeObserver = new MutationObserver(update);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-reduced-motion"],
    });
    media.addEventListener("change", update);
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
      { threshold: 0.15 },
    );
    intersection.observe(el);
    document.addEventListener("visibilitychange", visibility);
    const context = gsap.context(() => {
      if (
        !media.matches &&
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
      resize.disconnect();
      themeObserver.disconnect();
      intersection.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [open, run]);

  const finish = useCallback(
    (restoreFocus = false) => {
      if (finishing.current) return;
      finishing.current = true;
      setPaused(true);
      const complete = () => {
        if (container.current)
          gsap.set(container.current, { clearProps: "opacity,transform" });
        setOpen(false);
        const content = document.getElementById(
          matchMedia("(max-width: 760px)").matches
            ? "enturma-study-guide"
            : "minhas-materias",
        );
        if (restoreFocus) content?.focus({ preventScroll: true });
      };
      if (quality === "low" || !container.current) complete();
      else
        exit.current = gsap.to(container.current, {
          opacity: 0,
          scale: 0.99,
          duration: 0.18,
          onComplete: complete,
        });
    },
    [quality],
  );
  const ended = useCallback(() => finish(false), [finish]);

  const inputProps = useMemo<IntroProps>(
    () => ({
      user: {
        name: profile.name,
        avatarUrl: profile.hasAvatar
          ? `/api/backend/users/${profile.id}/avatar`
          : undefined,
      },
      students: [], // There is no public-student directory consent contract; use feature nodes.
      subjects: profile.subjects.map((subject) => subject.name),
      semester: profile.enrollment?.periodName,
      features: INTRO_FEATURES,
      theme,
      quality,
    }),
    [profile, theme, quality],
  );
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
              Seu próximo encontro começa aqui · 30 s · com narração
            </small>
          </span>
          <Play size={21} />
        </button>
      </section>
    );
  return (
    <section
      ref={container}
      className="enturma-intro"
      aria-label="Apresentação do Enturma"
      data-layout={dimensions.layout}
    >
      <header>
        <span>Conheça o seu Enturma</span>
        <div>
          <button
            type="button"
            className="intro-control intro-sound"
            aria-label={muted ? "Ouvir narração" : "Silenciar narração"}
            aria-pressed={!muted}
            onClickCapture={(event) => {
              const instance = player.current;
              if (!instance) return;
              if (!muted) {
                instance.mute();
                setMuted(true);
                return;
              }
              // Start the mounted audio inside the gesture, including Mobile Safari.
              if (!heard) {
                instance.seekTo(0);
                setSeekFrame(0);
                setFrame(0);
              }
              instance.pause();
              instance.unmute();
              instance.play(event);
              setMuted(false);
              setHeard(true);
              setPaused(false);
            }}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            <span>{muted ? "Ouvir narração" : "Som ligado"}</span>
          </button>
          <button
            type="button"
            className="intro-control"
            onClickCapture={(event) => {
              if (paused) player.current?.play(event);
              else player.current?.pause();
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
      <IntroPlayer
        key={run}
        inputProps={inputProps}
        width={dimensions.width}
        height={dimensions.height}
        playing={visible && !paused}
        onEnd={ended}
        onFrame={setFrame}
        seekFrame={seekFrame}
        playerRef={player}
        onMutedChange={setMuted}
      />
      <p className="intro-caption" aria-label="Legenda da narração">
        {introNarrationAt(frame)}
      </p>
      <footer className="intro-timeline">
        <span>{String(Math.floor(frame / 60)).padStart(2, "0")} s</span>
        <input
          type="range"
          min="0"
          max={INTRO_FRAMES - 1}
          value={frame}
          aria-label="Posição da apresentação"
          onChange={(event) => {
            const next = Number(event.target.value);
            setFrame(next);
            setSeekFrame(next);
          }}
        />
        <span>30 s</span>
      </footer>
    </section>
  );
}
