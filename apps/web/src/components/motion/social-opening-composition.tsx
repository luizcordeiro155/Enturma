import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrandBook } from "./brand-book";

/** Turning leaves fold into the six blades of the Social aperture. Theme colors
 * are inherited live, so changing the palette never restarts the timeline. */
export function SocialOpeningComposition() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [22, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const arrive = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 110 },
  });
  const ring = spring({
    frame: Math.max(0, frame - 45),
    fps,
    config: { damping: 17, stiffness: 100 },
  });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        color: "var(--ink)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 330,
          height: 330,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent), transparent 70%)",
          transform: `scale(${arrive})`,
        }}
      />
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 275 + i * 130,
            height: 180 + i * 100,
            border: "1px solid var(--border)",
            borderRadius: "50%",
            opacity: 0.7,
            transform: `rotate(${i * -32 + frame * 0.2}deg) scale(${arrive})`,
          }}
        />
      ))}
      <BrandBook
        frame={frame}
        size={240}
        style={{
          opacity: 1 - progress,
          transform: `perspective(800px) rotateX(${progress * 60}deg) rotateZ(${-8 + progress * 60}deg) scale(${arrive * (1 - progress * 0.35)})`,
        }}
      />
      <svg
        viewBox="0 0 560 360"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <g transform={`translate(280 180) scale(${0.6 + 0.4 * arrive})`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g
              key={i}
              opacity={progress}
              transform={`rotate(${i * 60 - (1 - progress) * 80}) translate(${(1 - progress) * 90} ${(1 - progress) * -30})`}
            >
              <path
                d="M-47-82 H47 L0 0 H-47 Z"
                fill={i % 2 ? "var(--surface)" : "var(--accent)"}
                stroke="var(--ink)"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </g>
          ))}
          <circle
            r={109 + (1 - ring) * 20}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.5"
            opacity={ring * 0.25}
          />
          <path
            d="M-13-20 L22 0 L-13 20 Z"
            fill="var(--ink)"
            opacity={ring}
            transform={`scale(${ring})`}
          />
        </g>
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2 + 0.45;
          return (
            <circle
              key={i}
              cx={280 + Math.cos(angle) * (130 + ring * 40)}
              cy={180 + Math.sin(angle) * (85 + ring * 25)}
              r={i % 2 ? 5 : 8}
              fill={i % 2 ? "var(--ink)" : "var(--accent)"}
              opacity={ring * 0.8}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}
