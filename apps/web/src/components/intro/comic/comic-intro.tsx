import {
  AbsoluteFill,
  Freeze,
  Html5Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ReactNode } from "react";
import type { IntroProps } from "../intro-model";
import storyboard from "../intro-storyboard.json";
import words from "./narration-words.json";
import { C, Quality } from "./comic-kit";
import { PresenterFrame } from "./motion-state";
import {
  HookScene,
  LonelyScene,
  ChaosScene,
  TurnScene,
  ProofScene,
  BuildupScene,
  CtaScene,
} from "./story-scenes";
import {
  RewardsScene,
  AiScene,
  FeedScene,
  ChatScene,
  RideScene,
  CallsScene,
  GamesScene,
  AttendanceScene,
  RoutineScene,
} from "./feature-scenes";

const cuts = storyboard.sceneFrames;
function ComicCadence({
  children,
  still,
}: {
  children: ReactNode;
  still: boolean;
}) {
  const frame = useCurrentFrame();
  return (
    <PresenterFrame.Provider value={frame}>
      <Freeze
        frame={still ? 110 : Math.floor(frame / 2) * 2}
        active={still || frame % 36 < 12}
      >
        {children}
      </Freeze>
    </PresenterFrame.Provider>
  );
}
function Karaoke() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const active = words.findIndex(
    (word) => word.startMs <= ms && word.endMs >= ms,
  );
  if (active < 0 || frame >= cuts[15]) return null;
  const from = Math.floor(active / 5) * 5;
  const group = words.slice(from, from + 5);
  const portrait = width < height;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: portrait ? 25 : 80,
        right: portrait ? 25 : 80,
        bottom: portrait ? 43 : 21,
        display: "flex",
        justifyContent: "center",
        gap: 7,
        flexWrap: "wrap",
        zIndex: 12,
        fontFamily: "Arial,sans-serif",
        fontSize: portrait ? 19 : 22,
        fontWeight: 800,
        lineHeight: 1.25,
        pointerEvents: "none",
      }}
    >
      {group.map((word, i) => (
        <span
          key={word.startMs}
          style={{
            color: from + i <= active ? C.yellow : C.white,
            background: "#0a0a0fdd",
            padding: "3px 5px",
            borderRadius: 3,
            textShadow: "2px 2px #000",
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
}
export function ComicIntro(props: IntroProps) {
  const frame = useCurrentFrame();
  const still = props.quality === "low";
  return (
    <Quality.Provider value={props.quality}>
      <AbsoluteFill
        data-intro-frame={frame}
        style={{
          background: C.ink,
          overflow: "hidden",
          fontFamily: "Arial,sans-serif",
        }}
      >
        <style>{`@font-face{font-family:'Comic Archivo';src:url('${staticFile("intro/comic/ArchivoBlack-Regular.ttf")}') format('truetype');font-weight:400 900;font-display:block;}`}</style>
        <Html5Audio src={staticFile(storyboard.audioFile)} pauseWhenBuffering />
        <Sequence
          name="01 - POW"
          from={cuts[0]}
          durationInFrames={cuts[1] - cuts[0]}
        >
          <Freeze frame={110} active={still}>
            <HookScene />
          </Freeze>
        </Sequence>
        <Sequence
          name="02 - A dúvida"
          from={cuts[1]}
          durationInFrames={cuts[2] - cuts[1]}
        >
          <Freeze frame={110} active={still}>
            <LonelyScene />
          </Freeze>
        </Sequence>
        <Sequence
          name="03 - O caos"
          from={cuts[2]}
          durationInFrames={cuts[3] - cuts[2]}
        >
          <Freeze frame={110} active={still}>
            <ChaosScene />
          </Freeze>
        </Sequence>
        <Sequence
          name="04 - BAM"
          from={cuts[3]}
          durationInFrames={cuts[4] - cuts[3]}
        >
          <Freeze frame={110} active={still}>
            <TurnScene />
          </Freeze>
        </Sequence>
        <Sequence
          name="05 - Recompensas"
          from={cuts[4]}
          durationInFrames={cuts[5] - cuts[4]}
        >
          <ComicCadence still={still}>
            <RewardsScene />
          </ComicCadence>
        </Sequence>
        <Sequence
          name="06 - Cadernos IA"
          from={cuts[5]}
          durationInFrames={cuts[6] - cuts[5]}
        >
          <ComicCadence still={still}>
            <AiScene />
          </ComicCadence>
        </Sequence>
        <Sequence
          name="07 - Feed"
          from={cuts[6]}
          durationInFrames={cuts[7] - cuts[6]}
        >
          <ComicCadence still={still}>
            <FeedScene />
          </ComicCadence>
        </Sequence>
        <Sequence
          name="08 - Salas e chats"
          from={cuts[7]}
          durationInFrames={cuts[8] - cuts[7]}
        >
          <ComicCadence still={still}>
            <ChatScene />
          </ComicCadence>
        </Sequence>
        <Sequence
          name="09 - Caronas"
          from={cuts[8]}
          durationInFrames={cuts[9] - cuts[8]}
        >
          <ComicCadence still={still}>
            <RideScene />
          </ComicCadence>
        </Sequence>
        <Sequence
          name="10 - Chamadas"
          from={cuts[9]}
          durationInFrames={cuts[10] - cuts[9]}
        >
          <ComicCadence still={still}>
            <CallsScene />
          </ComicCadence>
        </Sequence>
        <Sequence
          name="11 - Minigames"
          from={cuts[10]}
          durationInFrames={cuts[11] - cuts[10]}
        >
          <ComicCadence still={still}>
            <GamesScene />
          </ComicCadence>
        </Sequence>
        <Sequence
          name="12 - Frequência - Em breve"
          from={cuts[11]}
          durationInFrames={cuts[12] - cuts[11]}
        >
          <ComicCadence still={still}>
            <AttendanceScene />
          </ComicCadence>
        </Sequence>
        <Sequence
          name="13 - Rotina - Em breve"
          from={cuts[12]}
          durationInFrames={cuts[13] - cuts[12]}
        >
          <ComicCadence still={still}>
            <RoutineScene />
          </ComicCadence>
        </Sequence>
        <Sequence
          name="14 - A vida inteira"
          from={cuts[13]}
          durationInFrames={cuts[14] - cuts[13]}
        >
          <Freeze frame={110} active={still}>
            <ProofScene />
          </Freeze>
        </Sequence>
        <Sequence
          name="15 - Sua próxima conexão"
          from={cuts[14]}
          durationInFrames={cuts[15] - cuts[14]}
        >
          <Freeze frame={110} active={still}>
            <BuildupScene />
          </Freeze>
        </Sequence>
        <Sequence
          name="16 - Bora se enturmar"
          from={cuts[15]}
          durationInFrames={cuts[16] - cuts[15]}
        >
          <Freeze frame={110} active={still}>
            <CtaScene />
          </Freeze>
        </Sequence>
        <Karaoke />
      </AbsoluteFill>
    </Quality.Provider>
  );
}
