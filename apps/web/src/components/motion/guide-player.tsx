"use client";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { GuideComposition } from "./guide-scenes";
export default function GuidePlayer({ step }: { step: number }) {
  const player = useRef<PlayerRef>(null);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const reduce =
        media.matches ||
        document.documentElement.dataset.reducedMotion === "true";
      setReduced(reduce);
      if (document.hidden || reduce) player.current?.pause();
      else void player.current?.play();
    };
    const settings = new MutationObserver(update);
    settings.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion"],
    });
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      settings.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [step]);
  return (
    <div className="guide-film" aria-hidden="true">
      <Player
        key={step}
        ref={player}
        component={GuideComposition}
        inputProps={{ step, reduced }}
        compositionWidth={600}
        compositionHeight={270}
        fps={30}
        durationInFrames={180}
        controls={false}
        clickToPlay={false}
        loop
        autoPlay={!reduced}
        style={{ width: "100%" }}
      />
    </div>
  );
}
