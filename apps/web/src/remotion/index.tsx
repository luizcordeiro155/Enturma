import { Composition, registerRoot } from "remotion";
import { EnturmaIntroComposition } from "../components/intro/enturma-intro-composition";
import {
  INTRO_FEATURES,
  INTRO_FRAMES,
  INTRO_FPS,
} from "../components/intro/intro-model";

/** Studio/Renderer entry. Marketing defaults contain no invented student profiles. */
function IntroRoot() {
  return (
    <>
      <Composition
        id="EnturmaDesktop"
        component={EnturmaIntroComposition}
        width={1200}
        height={675}
        fps={INTRO_FPS}
        durationInFrames={INTRO_FRAMES}
        defaultProps={{
          user: null,
          students: [],
          subjects: [],
          features: INTRO_FEATURES,
          theme: "dark",
          quality: "high",
        }}
      />
      <Composition
        id="EnturmaPortrait"
        component={EnturmaIntroComposition}
        width={600}
        height={860}
        fps={INTRO_FPS}
        durationInFrames={INTRO_FRAMES}
        defaultProps={{
          user: null,
          students: [],
          subjects: [],
          features: INTRO_FEATURES,
          theme: "dark",
          quality: "optimized",
        }}
      />
      <Composition
        id="EnturmaLandscape"
        component={EnturmaIntroComposition}
        width={960}
        height={600}
        fps={INTRO_FPS}
        durationInFrames={INTRO_FRAMES}
        defaultProps={{
          user: null,
          students: [],
          subjects: [],
          features: INTRO_FEATURES,
          theme: "light",
          quality: "high",
        }}
      />
      <Composition
        id="EnturmaUltrawide"
        component={EnturmaIntroComposition}
        width={1600}
        height={640}
        fps={INTRO_FPS}
        durationInFrames={INTRO_FRAMES}
        defaultProps={{
          user: null,
          students: [],
          subjects: [],
          features: INTRO_FEATURES,
          theme: "dark",
          quality: "high",
        }}
      />
    </>
  );
}
registerRoot(IntroRoot);
