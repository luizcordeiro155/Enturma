"use client";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { AuthComposition } from "./auth-composition";

export default function AuthPlayer() {
  const player = useRef<PlayerRef>(null);
  const container = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let onscreen = false;
    const update = () => {
      const reduce =
        media.matches ||
        document.documentElement.dataset.reducedMotion === "true";
      setReduced(reduce);
      if (!onscreen || document.hidden || reduce) player.current?.pause();
      else void player.current?.play();
    };
    const settings = new MutationObserver(update);
    settings.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion"],
    });
    const visibility = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      update();
    });
    if (container.current) visibility.observe(container.current);
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      settings.disconnect();
      visibility.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div
      ref={container}
      className="auth-film"
      aria-hidden="true"
      style={{ aspectRatio: "640 / 380" }}
    >
      <Player
        ref={player}
        component={AuthComposition}
        inputProps={{ reduced }}
        compositionWidth={640}
        compositionHeight={380}
        fps={24}
        durationInFrames={288}
        controls={false}
        clickToPlay={false}
        loop
        autoPlay={false}
        style={{ width: "100%" }}
      />
    </div>
  );
}
