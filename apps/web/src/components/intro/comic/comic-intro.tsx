import {
  AbsoluteFill,
  Html5Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { IntroProps } from "../intro-model";
import storyboard from "../intro-storyboard.json";
import { AnimatedCaptions } from "./animated-captions";
import { Quality } from "./motion-state";
import {
  BookOpening,
  LostQuestion,
  CampusChaos,
  BookConnection,
  ConnectedLife,
  NextConnection,
  BookFinale,
} from "../book/story-scenes";
import {
  RewardsChapter,
  AiChapter,
  GamesChapter,
  SubjectsChapter,
} from "../book/study-scenes";
import {
  FeedChapter,
  ChatChapter,
  CallsChapter,
  FriendsChapter,
} from "../book/social-scenes";
import { RideChapter } from "../book/ride-scene";

const cuts = storyboard.sceneFrames;
/** The book is the presenter. All movement is deterministic and seekable at 24fps. */
export function ComicIntro(props: IntroProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Quality.Provider value={props.quality}>
      <AbsoluteFill
        data-intro-frame={frame}
        data-intro-scene={cuts.findLastIndex(
          (cut, index) => index < cuts.length - 1 && frame >= cut,
        )}
        data-intro-edition="book-cinema"
        style={{
          background: "#080f15",
          overflow: "hidden",
          fontFamily: "Arial,sans-serif",
        }}
      >
        <style>{`@font-face{font-family:'Comic Archivo';src:url('${staticFile("intro/comic/ArchivoBlack-Regular.ttf")}') format('truetype');font-weight:400 900;font-display:block;}`}</style>
        <Html5Audio src={staticFile(storyboard.audioFile)} pauseWhenBuffering />
        <Sequence
          name="01 · O livro abre seu universo"
          from={cuts[0]}
          durationInFrames={cuts[1] - cuts[0]}
          premountFor={fps}
        >
          <BookOpening />
        </Sequence>
        <Sequence
          name="02 · Uma pergunta sem resposta"
          from={cuts[1]}
          durationInFrames={cuts[2] - cuts[1]}
          premountFor={fps}
        >
          <LostQuestion />
        </Sequence>
        <Sequence
          name="03 · A vida corre"
          from={cuts[2]}
          durationInFrames={cuts[3] - cuts[2]}
          premountFor={fps}
        >
          <CampusChaos />
        </Sequence>
        <Sequence
          name="04 · As páginas conectam"
          from={cuts[3]}
          durationInFrames={cuts[4] - cuts[3]}
          premountFor={fps}
        >
          <BookConnection />
        </Sequence>
        <Sequence
          name="05 · Recompensas e sequência"
          from={cuts[4]}
          durationInFrames={cuts[5] - cuts[4]}
          premountFor={fps}
        >
          <RewardsChapter />
        </Sequence>
        <Sequence
          name="06 · Cadernos com inteligência artificial"
          from={cuts[5]}
          durationInFrames={cuts[6] - cuts[5]}
          premountFor={fps}
        >
          <AiChapter />
        </Sequence>
        <Sequence
          name="07 · O campus tem voz"
          from={cuts[6]}
          durationInFrames={cuts[7] - cuts[6]}
          premountFor={fps}
        >
          <FeedChapter />
        </Sequence>
        <Sequence
          name="08 · Salas e conversas"
          from={cuts[7]}
          durationInFrames={cuts[8] - cuts[7]}
          premountFor={fps}
        >
          <ChatChapter />
        </Sequence>
        <Sequence
          name="09 · Caronas em movimento"
          from={cuts[8]}
          durationInFrames={cuts[9] - cuts[8]}
          premountFor={fps}
        >
          <RideChapter />
        </Sequence>
        <Sequence
          name="10 · Voz, vídeo e tela"
          from={cuts[9]}
          durationInFrames={cuts[10] - cuts[9]}
          premountFor={fps}
        >
          <CallsChapter />
        </Sequence>
        <Sequence
          name="11 · Aprenda jogando"
          from={cuts[10]}
          durationInFrames={cuts[11] - cuts[10]}
          premountFor={fps}
        >
          <GamesChapter />
        </Sequence>
        <Sequence
          name="12 · Amigos e perfil"
          from={cuts[11]}
          durationInFrames={cuts[12] - cuts[11]}
          premountFor={fps}
        >
          <FriendsChapter />
        </Sequence>
        <Sequence
          name="13 · Matérias do semestre"
          from={cuts[12]}
          durationInFrames={cuts[13] - cuts[12]}
          premountFor={fps}
        >
          <SubjectsChapter />
        </Sequence>
        <Sequence
          name="14 · A vida inteira conectada"
          from={cuts[13]}
          durationInFrames={cuts[14] - cuts[13]}
          premountFor={fps}
        >
          <ConnectedLife />
        </Sequence>
        <Sequence
          name="15 · Sua próxima página"
          from={cuts[14]}
          durationInFrames={cuts[15] - cuts[14]}
          premountFor={fps}
        >
          <NextConnection />
        </Sequence>
        <Sequence
          name="16 · Se enturme"
          from={cuts[15]}
          durationInFrames={cuts[16] - cuts[15]}
          premountFor={fps}
        >
          <BookFinale />
        </Sequence>
        <AnimatedCaptions />
      </AbsoluteFill>
    </Quality.Provider>
  );
}
