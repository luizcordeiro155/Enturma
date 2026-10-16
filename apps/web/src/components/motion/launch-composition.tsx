import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrandBook } from "./brand-book";

export function LaunchComposition({
  ride = false,
  reduced = false,
  lightweight = false,
}: {
  ride?: boolean;
  reduced?: boolean;
  lightweight?: boolean;
}) {
  const raw = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = reduced ? (ride ? 65 : 24) : raw;
  const morph = ride
    ? interpolate(frame, [0.8 * fps, 1.8 * fps], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const arrive = spring({
    frame,
    fps,
    config: { damping: 17, stiffness: 105 },
  });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        color: "#183f36",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 390,
          height: 390,
          borderRadius: "50%",
          background: "radial-gradient(circle,#b9dc6328,transparent 70%)",
          scale: 1 + Math.sin(frame / 20) * 0.04,
        }}
      />
      {(lightweight ? [0] : [0, 1, 2]).map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 240 + i * 76,
            height: 240 + i * 76,
            border: "1px solid #5db78030",
            borderRadius: "50%",
            rotate: `${frame * 0.4}deg`,
            scale: arrive,
            opacity: 0.8 - i * 0.2,
          }}
        />
      ))}
      <div
        style={{
          position: "relative",
          width: 320,
          height: 250,
          scale: arrive,
          translate: `0 ${interpolate(morph, [0, 1], [0, 12])}px`,
        }}
      >
        <BrandBook
          frame={frame}
          size={264}
          style={{
            position: "absolute",
            left: 28,
            top: 30,
            opacity: 1 - morph,
            transform: `rotateX(${morph * 60}deg) scale(${1 - morph * 0.2})`,
          }}
        />
        <svg
          viewBox="0 0 320 250"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            opacity: morph,
            transform: `translateX(${interpolate(morph, [0, 1], [-50, 0])}px)`,
          }}
        >
          <path
            d="M38 154L54 117L106 107L136 63H222L256 111L282 126L290 165H36Z"
            fill="#d8ef79"
            stroke="#183f36"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <path
            d="M121 107L146 77H211L237 107Z"
            fill="#5bbd8d"
            stroke="#183f36"
            strokeWidth="5"
          />
          <path
            d="M179 78V108M186 126H200"
            stroke="#183f36"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {[90, 240].map((x) => (
            <g key={x} transform={`translate(${x} 165) rotate(${frame * 7})`}>
              <circle r="25" fill="#183f36" />
              <circle r="14" fill="#f1f6dd" />
              <path d="M-10 0H10M0-10V10" stroke="#5bbd8d" strokeWidth="4" />
            </g>
          ))}
          <path
            d={`M${38 - (frame % 12)} 132H${8 - (frame % 12)}M20 148H0M56 100H30`}
            stroke="#5bbd8d"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
}
