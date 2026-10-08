import { useContext } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import words from "./narration-words.json";
import storyboard from "../intro-storyboard.json";
import { Quality } from "./motion-state";

export const CAPTION_PHRASES = storyboard.cues.flatMap((cue, scene) => {
  const from = (storyboard.sceneFrames[scene] / storyboard.fps) * 1000;
  const to = (storyboard.sceneFrames[scene + 1] / storyboard.fps) * 1000;
  const spoken = words.filter(
    (word) => word.startMs >= from && word.startMs < to,
  );
  const groups: (typeof words)[] = [];
  for (const word of spoken) {
    const last = groups[groups.length - 1];
    if (
      !last ||
      last.length >= 4 ||
      [...last, word].map((w) => w.text).join(" ").length > 29
    )
      groups.push([word]);
    else last.push(word);
  }
  return groups.map((group, i) => ({
    words: group,
    scene,
    transcript: cue.text,
    start: i === 0 ? from : group[0].startMs,
    end:
      groups[i + 1]?.[0].startMs ??
      Math.min(to, group[group.length - 1].endMs + 250),
  }));
});

export function AnimatedCaptions() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const still = useContext(Quality) === "low";
  const ms = (frame / fps) * 1000;
  const phrase = CAPTION_PHRASES.find(
    (group) => group.start <= ms && group.end > ms,
  );
  if (!phrase) return null;
  const portrait = width < height;
  const age = ((ms - phrase.start) / 1000) * fps;
  const active = Math.max(
    0,
    phrase.words.findLastIndex((word) => word.startMs <= ms),
  );
  const p = Math.max(
    0,
    Math.min(1, (ms - phrase.start) / (phrase.end - phrase.start)),
  );
  return (
    <div
      data-intro-caption
      data-transcript={phrase.transcript}
      aria-label="Legenda da narração"
      style={{
        position: "absolute",
        left: portrait ? 20 : width * 0.12,
        right: portrait ? 20 : width * 0.12,
        bottom: 17,
        zIndex: 15,
        minHeight: portrait ? 72 : 58,
        boxSizing: "border-box",
        padding: portrait ? "13px 15px 17px" : "10px 20px 14px",
        color: "#fff",
        background: "#111719f5",
        border: "2px solid #64ca8352",
        borderRadius: 14,
        boxShadow: "0 5px 0 #000,0 0 28px #64ca8324",
        fontFamily: "Arial,sans-serif",
        fontWeight: 800,
        fontSize: portrait ? 30 : 29,
        lineHeight: 1.22,
        letterSpacing: "-.025em",
        translate: still
          ? undefined
          : `0px ${interpolate(age, [0, 5], [7, 0], { extrapolateRight: "clamp" })}px`,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        }}
      >
        {phrase.transcript}
      </span>
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          gap: portrait ? 9 : 10,
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
        }}
      >
        {phrase.words.map((word, i) => {
          const wordAge = ((ms - word.startMs) / 1000) * fps;
          const scale =
            !still && i === active
              ? interpolate(wordAge, [0, 2, 6], [1, 1.07, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 1;
          return (
            <span
              key={word.startMs}
              style={{
                position: "relative",
                display: "inline-block",
                padding: "1px 4px",
                scale,
                color: i === active ? "#173f36" : "#fff",
                background: i === active ? "#d8ef79" : "transparent",
                borderRadius: 5,
                textShadow: i === active ? undefined : "1px 2px #000",
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 6,
          height: 3,
          borderRadius: 2,
          background: "#ffffff14",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${p * 100}%`,
            background: "linear-gradient(90deg,#64ca83,#d8ef79,#6fd8c5)",
          }}
        />
      </div>
    </div>
  );
}
