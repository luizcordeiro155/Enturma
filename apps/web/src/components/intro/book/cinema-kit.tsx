import { useContext, type CSSProperties, type ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BookOpen } from "lucide-react";
import { BrandBook } from "../../motion/brand-book";
import { Quality } from "../comic/motion-state";

export const INK = "#080f15";
export const NEON = {
  lime: "#d9f577",
  green: "#51e69b",
  cyan: "#5ae7f0",
  pink: "#ff71c9",
  violet: "#aa94ff",
  orange: "#ffa466",
  white: "#f5f8ed",
};
export const INKS = Object.values(NEON).slice(0, 6);
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export const progress = (frame: number, start: number, length = 18) =>
  interpolate(frame, [start, start + length], [0, 1], clamp);
export function useCinema() {
  const frame = useCurrentFrame();
  const config = useVideoConfig();
  const reduced = useContext(Quality) === "low";
  return { ...config, frame: reduced ? 96 : frame, reduced };
}
export function Pop({
  children,
  delay = 0,
  style = {},
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
}) {
  const { frame, fps, reduced } = useCinema();
  const entrance = reduced
    ? 1
    : spring({
        frame: Math.max(0, frame - delay),
        fps,
        config: { damping: 13, stiffness: 145, mass: 0.7 },
      });
  return (
    <div
      style={{
        ...style,
        opacity: frame < delay && !reduced ? 0 : (style.opacity ?? 1),
        transform: `translateY(${(1 - entrance) * 45}px) scale(${0.78 + 0.22 * entrance}) ${style.transform ?? ""}`,
      }}
    >
      {children}
    </div>
  );
}
export function Paper({
  children,
  color = NEON.lime,
  style = {},
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        background: "#10212b",
        border: `3px solid ${color}`,
        borderRadius: 22,
        boxShadow: `7px 9px 0 ${INK},9px 11px 0 ${color}70,0 20px 40px #0005`,
        padding: 24,
        color: NEON.white,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
export function Label({
  children,
  color = NEON.lime,
  style = {},
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        background: color,
        color: INK,
        border: `3px solid ${INK}`,
        borderRadius: 8,
        padding: "10px 16px",
        fontWeight: 900,
        fontSize: 22,
        boxShadow: `4px 5px 0 ${INK}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
export function Confetti({
  at = 24,
  color = NEON.lime,
}: {
  at?: number;
  color?: string;
}) {
  const { frame, reduced } = useCinema();
  const age = frame - at;
  if (reduced || age < 0 || age > 37) return null;
  return (
    <AbsoluteFill
      data-book-confetti
      style={{ pointerEvents: "none", overflow: "visible" }}
    >
      {Array.from({ length: 32 }, (_, i) => {
        const angle = i * 2.39996;
        const distance = (30 + age * 9) * (0.6 + (i % 5) / 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "45%",
              width: 5 + (i % 4),
              height: 12 + (i % 7),
              background: i % 3 ? color : INKS[i % 6],
              opacity: Math.min(1, (37 - age) / 12),
              transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance + age * age * 0.13}px) rotate(${age * (i % 2 ? -11 : 9)}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}
export function ComicSky({
  color = NEON.lime,
  chapter = 0,
}: {
  color?: string;
  chapter?: number;
}) {
  const { frame, width, height, reduced } = useCinema();
  const beat = Math.max(0, 1 - ((((frame / 24) * 138) / 60) % 1) * 4);
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "-30%",
          background: `radial-gradient(ellipse at 62% 40%,${color}32,transparent 52%),radial-gradient(ellipse at 10% 100%,${NEON.violet}2c,transparent 45%)`,
          transform: `rotate(${chapter * 13}deg) translate(${Math.sin(frame / 75) * 14}px,0)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-6%",
          opacity: 0.17,
          backgroundImage: `radial-gradient(${color} 1.8px, transparent 2.5px)`,
          backgroundSize: "18px 18px",
          transform: `translate(${(-frame * 0.18) % 18}px,${(frame * 0.09) % 18}px)`,
        }}
      />
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, opacity: 0.16 }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M ${width * 0.5} ${height * 0.52} L ${width * (i / 7)} ${i % 2 ? height : 0}`}
            stroke={color}
            strokeWidth={1 + (i % 3)}
          />
        ))}
        <circle
          cx={width * 0.62}
          cy={height * 0.5}
          r={width * 0.28 + (reduced ? 0 : beat * 12)}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="5 18"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse,transparent 40%,#02080ba0)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}

/** Each chapter is a page in the same book, with a dedicated artwork and camera path. */
export function Chapter({
  number,
  title,
  subtitle,
  color,
  children,
  word,
}: {
  number: number;
  title: string;
  subtitle: string;
  color: string;
  children: ReactNode;
  word?: string;
}) {
  const { frame, width, height, fps, reduced } = useCinema();
  const portrait = width < height;
  const portraitArtTop = Math.max(
    246,
    100 + title.split("\n").length * 46 + 68,
  );
  const artScale = portrait
    ? Math.min((width - 44) / 700, (height - portraitArtTop - 212) / 460)
    : Math.min((width * 0.59) / 700, (height - 156) / 460);
  const artWidth = 700 * artScale,
    artHeight = 460 * artScale;
  const artLeft = portrait ? (width - artWidth) / 2 : width - artWidth - 34;
  const artTop = portrait
    ? portraitArtTop
    : Math.max(80, (height - artHeight - 50) / 2);
  const pageTurn = progress(frame, 0, 14);
  return (
    <AbsoluteFill
      data-book-chapter={number}
      style={{
        overflow: "hidden",
        color: NEON.white,
        fontFamily: "Arial,sans-serif",
      }}
    >
      <ComicSky color={color} chapter={number} />
      <div
        style={{
          position: "absolute",
          left: portrait ? 28 : 45,
          top: 24,
          display: "flex",
          alignItems: "center",
          gap: 9,
          fontWeight: 900,
          fontSize: portrait ? 24 : 28,
          letterSpacing: -1,
        }}
      >
        <BookOpen color={NEON.lime} size={29} />
        <span>
          enturma<span style={{ color: NEON.lime }}>.</span>
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          right: 30,
          top: 30,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 3,
          color,
        }}
      >
        CAPÍTULO {String(number).padStart(2, "0")}
      </div>
      <Pop
        style={{
          position: "absolute",
          left: portrait ? 30 : 48,
          top: portrait ? 83 : 108,
          width: portrait ? width - 60 : width * 0.33,
        }}
      >
        <div data-intro-title data-intro-safe>
          <h1
            style={{
              fontFamily: '"Comic Archivo",Arial,sans-serif',
              fontWeight: 900,
              fontSize: portrait ? 42 : width < 1050 ? 45 : 58,
              lineHeight: 1.04,
              letterSpacing: -2,
              margin: 0,
              textShadow: `3px 4px 0 ${INK}`,
              whiteSpace: "pre-line",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: portrait ? 21 : 22,
              lineHeight: 1.3,
              margin: "15px 0 0",
              color,
              fontWeight: 600,
              maxWidth: portrait ? "100%" : 310,
            }}
          >
            {subtitle}
          </p>
        </div>
      </Pop>
      <div
        data-intro-art
        data-intro-safe
        style={{
          position: "absolute",
          left: artLeft,
          top: artTop,
          width: artWidth,
          height: artHeight,
          perspective: 1800,
        }}
      >
        <div
          style={{
            width: 700,
            height: 460,
            transformOrigin: "top left",
            transform: `scale(${artScale})`,
          }}
        >
          <div
            style={{
              width: 700,
              height: 460,
              position: "relative",
              transformStyle: "preserve-3d",
              transform: `perspective(1600px) rotateY(${reduced ? 0 : (1 - pageTurn) * -13 + Math.sin(frame / 110 + number) * 1.6}deg) rotateX(${reduced ? 0 : Math.sin(frame / 90) * 1.2}deg)`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: portrait ? 32 : 62,
          top: portrait ? height - 190 : height - 235,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <BrandBook
          frame={frame + number * 7}
          size={portrait ? 106 : 190}
          color={color}
        />
        {portrait ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 1.2,
              color,
              width: 140,
            }}
          >
            VIRE A PÁGINA.
            <br />
            ENCONTRE SUA TURMA.
          </span>
        ) : null}
      </div>
      {word ? (
        <div
          style={{
            position: "absolute",
            right: portrait ? 30 : 40,
            bottom: portrait ? 142 : 105,
            transform: `rotate(-5deg) scale(${reduced ? 1 : spring({ frame: Math.max(0, frame - 22), fps, config: { damping: 11 } })})`,
            opacity: frame < 22 && !reduced ? 0 : 1,
            color,
            fontFamily: '"Comic Archivo",Arial,sans-serif',
            fontSize: portrait ? 36 : 44,
            fontStyle: "italic",
            textShadow: `4px 4px 0 ${INK}`,
          }}
        >
          {word}
        </div>
      ) : null}
      {!reduced && frame < 13 ? (
        <div
          style={{
            position: "absolute",
            inset: "-10%",
            background: `linear-gradient(100deg,${color},#f5f8ed)`,
            borderLeft: `8px solid ${INK}`,
            transformOrigin: "left center",
            transform: `perspective(1400px) rotateY(${-pageTurn * 110}deg) translateX(${-pageTurn * 120}%)`,
            opacity: 1 - pageTurn,
            boxShadow: "20px 0 80px #0005",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
