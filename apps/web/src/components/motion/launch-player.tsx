"use client";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { LaunchComposition } from "./launch-composition";
import { isLightweightLaunchDevice } from "@/lib/launch-performance";
export default function LaunchPlayer({
  ride = false,
  onReady,
}: {
  ride?: boolean;
  onReady?: () => void;
}) {
  const player = useRef<PlayerRef>(null);
  const [reduced, setReduced] = useState(false);
  const didNotify = useRef(false);
  const [lightweight] = useState(() => {
    const device = navigator as Navigator & { deviceMemory?: number };
    return isLightweightLaunchDevice(device.deviceMemory, navigator.hardwareConcurrency);
  });
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
  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (didNotify.current) return;
        didNotify.current = true;
        onReady?.();
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [onReady]);
  return (
    <div data-launch-player="ready" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Player
      ref={player}
      component={LaunchComposition}
      inputProps={{ ride, reduced, lightweight }}
      compositionWidth={560}
      compositionHeight={400}
      fps={24}
      durationInFrames={ride ? 120 : 144}
      loop={!ride}
      autoPlay={!reduced}
      controls={false}
      clickToPlay={false}
      style={{ width: "100%", maxWidth: 440 }}
      />
    </div>
  );
}
