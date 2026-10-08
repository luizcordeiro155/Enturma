"use client";
import { useEffect, useRef, type RefObject } from "react";
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
  playerRef,
  onMutedChange,
  onPlaybackBlocked,
}: {
  inputProps: IntroProps;
  width: number;
  height: number;
  playing: boolean;
  onEnd: () => void;
  onFrame: (frame: number) => void;
  seekFrame?: number;
  playerRef: RefObject<PlayerRef | null>;
  onMutedChange: (muted: boolean) => void;
  onPlaybackBlocked: () => void;
}) {
  const player = playerRef;
  const container = useRef<HTMLDivElement>(null);
  const reduced = inputProps.quality === "low";
  useEffect(() => {
    const instance = player.current;
    const update = (event: { detail: { frame: number } }) => {
      if (event.detail.frame % 6 === 0) onFrame(event.detail.frame);
    };
    instance?.addEventListener("frameupdate", update);
    return () => instance?.removeEventListener("frameupdate", update);
  }, [onFrame, player]);
  useEffect(() => {
    const instance = player.current;
    const update = (event: { detail: { isMuted: boolean } }) =>
      onMutedChange(event.detail.isMuted);
    instance?.addEventListener("mutechange", update);
    return () => instance?.removeEventListener("mutechange", update);
  }, [onMutedChange, player]);
  useEffect(() => {
    if (seekFrame !== undefined) player.current?.seekTo(seekFrame);
  }, [seekFrame, player]);
  useEffect(() => {
    const instance = player.current;
    if (!instance) return;
    instance.addEventListener("ended", onEnd);
    return () => {
      instance.pause();
      instance.removeEventListener("ended", onEnd);
    };
  }, [onEnd, player]);
  useEffect(() => {
    if (reduced) player.current?.seekTo(0);
  }, [reduced, player]);
  useEffect(() => {
    if (!playing) {
      player.current?.pause();
      return;
    }
    void player.current?.play();
    let alive = true;
    let readinessTimer: ReturnType<typeof setTimeout> | undefined;
    let narration: HTMLAudioElement | null = null;
    const checkPlayback = () => {
      clearTimeout(readinessTimer);
      const initialFrame = player.current?.getCurrentFrame();
      readinessTimer = setTimeout(() => {
        const instance = player.current;
        // AudioContext.resume() can stay pending without a NotAllowedError.
        // Once media is buffered, a stationary timeline needs a user gesture.
        if (
          alive &&
          narration &&
          !narration.muted &&
          narration.readyState >= 3 &&
          instance?.isPlaying() &&
          instance.getCurrentFrame() === initialFrame
        ) {
          onPlaybackBlocked();
        }
      }, 1500);
    };
    const checked = new WeakSet<HTMLAudioElement>();
    const startNarration = () => {
      const audio = container.current?.querySelector("audio");
      if (!audio || audio.muted || checked.has(audio)) return;
      checked.add(audio);
      narration?.removeEventListener("canplay", checkPlayback);
      narration = audio;
      audio.addEventListener("canplay", checkPlayback);
      if (audio.readyState >= 3) checkPlayback();
      void audio.play().catch((error: DOMException) => {
        if (alive && error.name === "NotAllowedError") onPlaybackBlocked();
      });
    };
    // Remotion may mount its audio after the Player effect has run.
    const observer = new MutationObserver(startNarration);
    if (container.current)
      observer.observe(container.current, { childList: true, subtree: true });
    startNarration();
    return () => {
      alive = false;
      observer.disconnect();
      clearTimeout(readinessTimer);
      narration?.removeEventListener("canplay", checkPlayback);
    };
  }, [playing, reduced, onEnd, player, onPlaybackBlocked]);
  return (
    <div ref={container}>
      <Player
        ref={player}
        component={EnturmaIntroComposition}
        inputProps={inputProps}
        fps={60}
        durationInFrames={INTRO_FRAMES}
        compositionWidth={width}
        compositionHeight={height}
        style={{ width: "100%" }}
        controls={false}
        clickToPlay={false}
        initiallyMuted={false}
        // One continuous audio track stays mounted for the full timeline.
        numberOfSharedAudioTags={0}
        moveToBeginningWhenEnded={false}
        errorFallback={() => (
          <div className="intro-fallback">
            Sua turma está pronta para você. Use Pular para continuar.
          </div>
        )}
      />
    </div>
  );
}
