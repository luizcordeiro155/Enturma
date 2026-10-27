"use client";
import dynamic from "next/dynamic";
import { BookOpen } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  launchRemainingMs,
  LAUNCH_FALLBACK_MS,
} from "@/lib/launch-performance";

type Scene = "app" | "ride";

const LaunchPlayer = dynamic(() => import("./motion/launch-player"), {
  ssr: false,
  loading: () => <BookOpen size={76} strokeWidth={1.5} />,
});

function reducedMotion() {
  return (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.reducedMotion === "true"
  );
}

export function LaunchSplash({
  ride = false,
  onReady,
  children,
}: {
  ride?: boolean;
  onReady?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="enturma-launch-scene" role="status">
      <LaunchPlayer ride={ride} onReady={onReady} />
      <strong>{ride ? "Seu próximo trajeto começa junto." : "enturma."}</strong>
      <span>
        {ride ? "Caronas da sua comunidade" : "Sua faculdade. Seu universo."}
      </span>
      {children}
    </div>
  );
}

export function AppLaunch() {
  const path = usePathname();
  const launched = useRef(false);
  const rideVisited = useRef(false);
  const activeScene = useRef<Scene | null>(null);
  const layer = useRef<HTMLDivElement>(null);
  const ready = useRef(false);
  const remaining = useRef(0);
  const visibleFrom = useRef<number | null>(null);
  const closing = useRef(false);
  const mounted = useRef(true);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const fade = useRef<Animation | undefined>(undefined);
  const [scene, setScene] = useState<Scene | null>(null);

  const finish = useCallback(() => {
    clearTimeout(closeTimer.current);
    clearTimeout(fallbackTimer.current);
    // Retain the final transparent frame until React removes the layer. Canceling
    // a forwards-filled animation first briefly repaints its opaque base style.
    if (layer.current) layer.current.style.opacity = "0";
    fade.current?.cancel();
    fade.current = undefined;
    activeScene.current = null;
    ready.current = false;
    visibleFrom.current = null;
    closing.current = false;
    if (mounted.current) setScene(null);
  }, []);

  const close = useCallback(() => {
    if (closing.current || activeScene.current === null) return;
    closing.current = true;
    clearTimeout(closeTimer.current);
    clearTimeout(fallbackTimer.current);
    const element = layer.current;
    if (!element?.animate || reducedMotion()) {
      finish();
      return;
    }
    fade.current = element.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(1.025)" },
      ],
      { duration: 340, easing: "ease-out", fill: "forwards" },
    );
    void fade.current.finished
      .then(() => {
        if (mounted.current) finish();
      })
      .catch(() => {});
  }, [finish]);

  const pauseClock = useCallback(() => {
    if (!ready.current || closing.current) return;
    if (visibleFrom.current !== null) {
      remaining.current = Math.max(
        0,
        remaining.current - (performance.now() - visibleFrom.current),
      );
      visibleFrom.current = null;
    }
    clearTimeout(closeTimer.current);
  }, []);

  const scheduleClose = useCallback(() => {
    if (
      !ready.current ||
      closing.current ||
      !activeScene.current ||
      document.hidden
    )
      return;
    clearTimeout(closeTimer.current);
    visibleFrom.current = performance.now();
    closeTimer.current = setTimeout(close, remaining.current);
  }, [close]);

  const playerReady = useCallback(() => {
    if (!activeScene.current || ready.current) return;
    ready.current = true;
    scheduleClose();
  }, [scheduleClose]);

  // Navigating between protected pages must never unmount an opening mid-frame.
  useEffect(() => {
    if (
      !/^\/(home|rooms|profile|settings|friends|notebooks|caronas|forum|portfolio|onboarding|admin|challenges)(\/|$)/.test(
        path,
      )
    )
      return;
    const timer = setTimeout(() => {
      if (activeScene.current) return;
      const start = (kind: Scene) => {
        activeScene.current = kind;
        closing.current = false;
        ready.current = false;
        remaining.current = launchRemainingMs(0, 0, kind, reducedMotion());
        setScene(kind);
        // The route remains usable even when a Remotion chunk cannot load.
        const watchdog = () => {
          if (document.hidden) {
            fallbackTimer.current = setTimeout(watchdog, LAUNCH_FALLBACK_MS);
          } else close();
        };
        fallbackTimer.current = setTimeout(watchdog, LAUNCH_FALLBACK_MS);
      };
      if (!launched.current) {
        launched.current = true;
        let recoveredOpening = false;
        try {
          recoveredOpening =
            sessionStorage.getItem("enturma:launch-recovery-shown") === "1";
          if (recoveredOpening) {
            sessionStorage.removeItem("enturma:launch-recovery-shown");
          }
        } catch {
          // A disabled storage API does not disable the opening animation.
        }
        if (!recoveredOpening) {
          if (path.startsWith("/caronas")) rideVisited.current = true;
          start("app");
          return;
        }
      }
      if (path.startsWith("/caronas") && !rideVisited.current) {
        rideVisited.current = true;
        start("ride");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [path, close]);

  useEffect(() => {
    mounted.current = true;
    const visibility = () => {
      if (document.hidden) pauseClock();
      else scheduleClose();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", visibility);
      clearTimeout(closeTimer.current);
      clearTimeout(fallbackTimer.current);
      fade.current?.cancel();
    };
  }, [pauseClock, scheduleClose]);

  if (!scene) return null;
  return (
    <div
      key={scene}
      ref={layer}
      className="enturma-launch-overlay"
      data-launch-scene={scene}
    >
      <LaunchSplash ride={scene === "ride"} onReady={playerReady} />
      <button type="button" className="enturma-launch-skip" onClick={close}>
        Continuar
      </button>
    </div>
  );
}
