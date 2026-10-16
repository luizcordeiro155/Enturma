"use client";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { LaunchComposition } from "./launch-composition";
export default function LaunchPlayer({ ride = false }: { ride?: boolean }) {
  const player = useRef<PlayerRef>(null);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const instance = player.current;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const reduce =
        media.matches ||
        document.documentElement.dataset.reducedMotion === "true";
      setReduced(reduce);
      if (document.hidden || reduce) player.current?.pause();
      else void player.current?.play();
    };
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      instance?.pause();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <Player
      ref={player}
      component={LaunchComposition}
      inputProps={{ ride, reduced }}
      compositionWidth={560}
      compositionHeight={400}
      fps={24}
      durationInFrames={ride ? 72 : 144}
      loop={!ride}
      autoPlay={!reduced}
      controls={false}
      clickToPlay={false}
      style={{ width: "100%", maxWidth: 440 }}
    />
  );
}
