"use client";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { TransferComposition } from "./transfer-composition";
export default function TransferPlayer({
  mode,
  progress,
}: {
  mode: "download" | "update";
  progress?: number;
}) {
  const player = useRef<PlayerRef>(null);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const reduce =
        media.matches ||
        document.documentElement.dataset.reducedMotion === "true";
      setReduced(reduce);
      if (document.hidden || reduce) player.current?.pause();
      else void player.current?.play();
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion"],
    });
    sync();
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return (
    <div className="transfer-film" aria-hidden="true">
      <Player
        ref={player}
        component={TransferComposition}
        inputProps={{ mode, progress, reduced }}
        compositionWidth={600}
        compositionHeight={300}
        fps={30}
        durationInFrames={180}
        loop
        controls={false}
        clickToPlay={false}
        style={{ width: "100%", borderRadius: 18, overflow: "hidden" }}
      />
    </div>
  );
}
