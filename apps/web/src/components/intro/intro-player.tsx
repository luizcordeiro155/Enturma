"use client";
import { useEffect, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { EnturmaIntroComposition } from "./enturma-intro-composition";
import type { IntroProps } from "./intro-model";
import { INTRO_FRAMES } from "./intro-model";

export default function IntroPlayer({
  inputProps,
  width,
  height,
  playing,
  onEnd,
  onFrame,
  seekFrame,
}: {
  inputProps: IntroProps;
  width: number;
  height: number;
  playing: boolean;
  onEnd: () => void;
  onFrame: (frame: number) => void;
  seekFrame?: number;
}) {
  const player = useRef<PlayerRef>(null);
  const reduced = inputProps.quality === "low";
  useEffect(() => {
    const instance = player.current;
    const update = (event: { detail: { frame: number } }) => {
      if (event.detail.frame % 6 === 0) onFrame(event.detail.frame);
    };
    instance?.addEventListener("frameupdate", update);
    return () => instance?.removeEventListener("frameupdate", update);
  }, [onFrame]);
  useEffect(() => {
    if (seekFrame !== undefined) player.current?.seekTo(seekFrame);
  }, [seekFrame]);
  useEffect(() => {
    const instance = player.current;
    if (!instance) return;
    instance.addEventListener("ended", onEnd);
    return () => {
      instance.pause();
      instance.removeEventListener("ended", onEnd);
    };
  }, [onEnd]);
  useEffect(() => {
    if (reduced) player.current?.seekTo(0);
  }, [reduced]);
  useEffect(() => {
    if (playing) void player.current?.play();
    else player.current?.pause();
  }, [playing, reduced, onEnd]);
  return (
    <Player
      ref={player}
      component={EnturmaIntroComposition}
      inputProps={inputProps}
      fps={60}
      durationInFrames={inputProps.quality === "low" ? 180 : INTRO_FRAMES}
      compositionWidth={width}
      compositionHeight={height}
      style={{ width: "100%" }}
      controls={false}
      clickToPlay={false}
      numberOfSharedAudioTags={0}
      moveToBeginningWhenEnded={false}
      errorFallback={() => (
        <div className="intro-fallback">
          Sua turma está pronta para você. Use Pular para continuar.
        </div>
      )}
    />
  );
}
