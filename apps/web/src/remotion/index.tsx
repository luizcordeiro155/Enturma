import { Composition, registerRoot } from "remotion";
import { EnturmaIntroComposition } from "../components/intro/enturma-intro-composition";
import { INTRO_FEATURES } from "../components/intro/intro-model";

/** Studio/Renderer entry. Marketing defaults contain no invented student profiles. */
function IntroRoot() {
  return (
    <>
      <Composition
        id="EnturmaDesktop"
        component={EnturmaIntroComposition}
        width={1200}
        height={620}
        fps={60}
        durationInFrames={900}
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
        height={700}
        fps={60}
        durationInFrames={900}
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
        fps={60}
        durationInFrames={900}
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
        fps={60}
        durationInFrames={900}
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
