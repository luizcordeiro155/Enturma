"use client";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { reducedMotion } from "@/lib/motion";
import { SocialOpeningComposition } from "./social-opening-composition";

export default function SocialOpeningPlayer({
  ready,
  ended,
}: {
  ready: () => void;
  ended: () => void;
}) {
  const ref = useRef<PlayerRef>(null);
  useEffect(() => {
    const player = ref.current;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (reducedMotion()) {
        player?.pause();
        ended();
      } else if (document.hidden) player?.pause();
      else {
        ready();
        void player?.play();
      }
    };
    player?.addEventListener("ended", ended);
    const settings = new MutationObserver(update);
    settings.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion"],
    });
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      player?.pause();
      player?.removeEventListener("ended", ended);
      settings.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [ready, ended]);
  return (
    <Player
      ref={ref}
      component={SocialOpeningComposition}
      durationInFrames={84}
      fps={30}
      compositionWidth={560}
      compositionHeight={360}
      controls={false}
      clickToPlay={false}
      style={{ width: "100%" }}
    />
  );
}
