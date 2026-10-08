import {
  useContext,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BookOpen } from "lucide-react";
import { Quality } from "./motion-state";
import { Presenter } from "./presenter";
export { Quality } from "./motion-state";

export const C = {
  ink: "#0a0a0f",
  purple: "#1a0a2f",
  night: "#1a1a2e",
  yellow: "#ffe600",
  cyan: "#00f0ff",
  magenta: "#ff00aa",
  green: "#39ff14",
  violet: "#a855f7",
  orange: "#ff6b35",
  pink: "#ff1493",
  white: "#ffffff",
};
export const INKS = [C.cyan, C.magenta, C.yellow, C.green, C.violet, C.orange];
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export const prog = (f: number, from = 0, duration = 12) =>
  interpolate(f, [from, from + duration], [0, 1], clamp);
export const pop = (f: number, delay = 0) =>
  spring({
    frame: Math.max(0, f - delay),
    fps: 24,
    config: { damping: 10, stiffness: 160, mass: 0.65 },
  });
export const display: CSSProperties = {
  fontFamily: '"Comic Archivo",Arial,sans-serif',
  fontWeight: 900,
  fontStyle: "italic",
  letterSpacing: "-.05em",
  lineHeight: 0.96,
  textShadow: "4px 4px 0 #000",
};
export function useInkTime() {
  const raw = useCurrentFrame();
  const q = useContext(Quality);
  const held = raw % 36 < 12;
  return {
    raw,
    f: q === "low" ? 110 : held ? Math.floor(raw / 2) * 2 : raw,
    still: q === "low",
    held,
  };
}
export function Brand({
  size = 42,
  color = C.white,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.18,
        color,
        fontFamily: '"Comic Archivo",Arial,sans-serif',
        fontSize: size,
        letterSpacing: "-.065em",
        whiteSpace: "nowrap",
      }}
    >
      <BookOpen size={size * 0.9} strokeWidth={3} />
      <span>
        enturma<span style={{ color: C.yellow }}>.</span>
      </span>
    </div>
  );
}
export function Burst({
  color = C.yellow,
  frame = 40,
}: {
  color?: string;
  frame?: number;
}) {
  const points = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    const r = i % 2 ? 145 : 235;
    return `${250 + Math.cos(a) * r},${250 + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <svg
      viewBox="0 0 500 500"
      width="100%"
      height="100%"
      style={{
        overflow: "visible",
        transform: `rotate(${Math.sin(frame / 16) * 3}deg)`,
      }}
    >
      <polygon points={points} fill={color} stroke="#000" strokeWidth="7" />
      <polygon points={points} fill="url(#burst-dots)" opacity=".24" />
      <defs>
        <pattern
          id="burst-dots"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="3" r="2.5" fill="#000" />
        </pattern>
      </defs>
    </svg>
  );
}
export function Shout({
  text,
  color = C.yellow,
  frame = 30,
  size = 80,
  style,
}: {
  text: string;
  color?: string;
  frame?: number;
  size?: number;
  style?: CSSProperties;
}) {
  const still = useContext(Quality) === "low";
  const f = still ? 40 : frame;
  return (
    <div
      style={{
        ...display,
        fontSize: size,
        color,
        WebkitTextStroke: "1px #000",
        transform: `scale(${pop(f)}) rotate(-5deg) translateX(${!still && f < 5 ? Math.sin(f * 4) * 8 : 0}px)`,
        filter:
          f < 6
            ? `drop-shadow(3px 0 ${C.magenta}) drop-shadow(-3px 0 ${C.cyan})`
            : undefined,
        ...style,
      }}
    >
      {text}
    </div>
  );
}
export function Backdrop({
  color = C.cyan,
  dark = false,
}: {
  color?: string;
  dark?: boolean;
}) {
  const { f, still } = useInkTime();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{ background: dark ? C.night : C.ink, overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          background: `radial-gradient(ellipse at 65% 38%,${color}35,transparent 56%),radial-gradient(ellipse at 0% 90%,${C.violet}35,transparent 55%)`,
          transform: `translate(${still ? 0 : Math.sin(f / 80) * 15}px,${still ? 0 : Math.cos(f / 70) * 10}px)`,
        }}
      />
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, opacity: 0.18 }}
      >
        <defs>
          <pattern
            id={`dots-${color.slice(1)}`}
            width="13"
            height="13"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${still ? 0 : -f * 0.24},${still ? 0 : f * 0.12})`}
          >
            <circle cx="3" cy="3" r="2" fill={color} />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#dots-${color.slice(1)})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          width: width * 0.8,
          height: height * 1.5,
          left: "40%",
          top: "-10%",
          transform: `rotate(-22deg) translateX(${still ? 0 : Math.sin(f / 100) * 18}px)`,
          background: `linear-gradient(90deg,transparent,${color}12,transparent)`,
          borderLeft: `2px solid ${color}44`,
        }}
      />
      {!dark && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, opacity: 0.1 }}
        >
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={width * 0.55 + Math.cos(a) * width * 0.22}
                y1={height * 0.55 + Math.sin(a) * height * 0.25}
                x2={width * 0.55 + Math.cos(a) * width * 1.1}
                y2={height * 0.55 + Math.sin(a) * height * 1.1}
                stroke={color}
                strokeWidth={i % 3 ? 2 : 5}
              />
            );
          })}
        </svg>
      )}
    </AbsoluteFill>
  );
}
export function Particles({
  color = C.yellow,
  burstAt = 72,
}: {
  color?: string;
  burstAt?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const raw = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const q = useContext(Quality);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (q === "low" || raw < burstAt || raw >= burstAt + 100) return;
    const t = Math.max(0, raw - burstAt);
    const count = q === "high" ? 42 : 24;
    for (let i = 0; i < count; i++) {
      const a = i * 2.399;
      const speed = 2 + (i % 7) * 0.75;
      const radius = t * speed;
      const x = width * 0.56 + Math.cos(a) * radius;
      const y = height * 0.5 + Math.sin(a) * radius + t * t * 0.017;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + t * 0.06);
      ctx.globalAlpha = Math.max(0, 1 - t / 100);
      ctx.fillStyle = i % 3 ? INKS[i % INKS.length] : color;
      ctx.fillRect(-3, -3, 6 + (i % 5), 4 + (i % 7));
      ctx.restore();
    }
  }, [raw, width, height, q, burstAt, color]);
  return q === "low" ? null : (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    />
  );
}
export function PageTear({ color = C.pink }: { color?: string }) {
  const { raw, still } = useInkTime();
  const { width, height } = useVideoConfig();
  if (still || raw > 10) return null;
  const p = prog(raw, 0, 10);
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <g
        transform={`translate(${interpolate(p, [0, 0.25, 1], [-width * 0.1, width * 0.1, width * 1.5])} 0)`}
      >
        <path
          d={`M${-width} 0H${width * 0.7}L${width * 0.55} ${height * 0.2}L${width * 0.66} ${height * 0.35}L${width * 0.35} ${height * 0.52}L${width * 0.44} ${height * 0.72}L0 ${height}H${-width}Z`}
          fill={color}
          stroke="#000"
          strokeWidth="5"
        />
        <path
          d={`M${width * 0.7} 0L${width * 0.55} ${height * 0.2}L${width * 0.66} ${height * 0.35}L${width * 0.35} ${height * 0.52}L${width * 0.44} ${height * 0.72}L0 ${height}`}
          fill="none"
          stroke="#fff"
          strokeWidth="10"
        />
      </g>
    </svg>
  );
}
export function Stage({
  scene,
  number,
  title,
  kicker,
  color,
  shout,
  children,
}: {
  scene: number;
  number: string;
  title: string[];
  kicker: string;
  color: string;
  shout: string;
  children: ReactNode;
}) {
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const { f, raw, still } = useInkTime();
  const shake = !still && raw % 36 < 3 ? Math.sin(raw * 3) * 2 : 0;
  // Direction, height and scale belong to the scene's acting, not a shared loop.
  const placements = [
    { left: false, size: 200, top: 89, edge: 12, desktopX: 0.1 },
    { left: true, size: 210, top: 83, edge: 10, desktopX: 0.18 },
    { left: false, size: 220, top: 77, edge: 5, desktopX: 0.04 },
    { left: true, size: 195, top: 99, edge: 5, desktopX: 0.15 },
    { left: false, size: 185, top: 105, edge: 15, desktopX: 0.08 },
    { left: true, size: 215, top: 81, edge: 15, desktopX: 0.19 },
    { left: true, size: 225, top: 75, edge: 7, desktopX: 0.03 },
    { left: false, size: 200, top: 92, edge: 25, desktopX: 0.13 },
    { left: true, size: 185, top: 88, edge: 12, desktopX: 0.2 },
  ][scene - 4];
  const titleLeft = placements.left
    ? placements.edge + placements.size + 12
    : 30;
  const titleWidth = placements.left
    ? width - titleLeft - 30
    : width - placements.size - placements.edge - 54;
  const actorSize = portrait ? placements.size : Math.min(240, height * 0.36);
  return (
    <AbsoluteFill
      data-intro-scene={scene}
      style={{
        overflow: "hidden",
        color: C.white,
        fontFamily: "Arial,sans-serif",
      }}
    >
      <Backdrop color={color} />
      <div
        data-intro-safe
        style={{
          position: "absolute",
          left: portrait ? 30 : 44,
          top: portrait ? 31 : 28,
          right: portrait ? 30 : 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Brand size={portrait ? 24 : 25} />
        <span
          style={{
            fontWeight: 800,
            fontSize: portrait ? 13 : 14,
            letterSpacing: ".13em",
            color,
          }}
        >
          {`${number} / 09 · ${kicker}`}
        </span>
      </div>
      <div
        data-intro-safe
        data-intro-title
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? titleLeft : 46,
          top: portrait ? 100 : 120,
          width: portrait ? titleWidth : width * 0.4,
          transform: `translateY(${(1 - pop(f, 4)) * 28}px)`,
          opacity: prog(f, 4, 7),
        }}
      >
        <div
          style={{
            ...display,
            fontSize: portrait
              ? Math.min(
                  52,
                  titleWidth /
                    (Math.max(...title.map((line) => line.length)) * 0.61),
                )
              : Math.min(
                  72,
                  width * 0.06,
                  (width * 0.4) /
                    (Math.max(...title.map((line) => line.length)) * 0.61),
                ),
            color: C.white,
          }}
        >
          {title.map((line, i) => (
            <div
              key={line}
              style={{ color: i === title.length - 1 ? color : C.white }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
      <div
        data-intro-safe
        data-intro-art
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 20 : width * 0.42,
          top: portrait ? 300 : height * 0.14,
          width: portrait ? width - 40 : width * 0.55,
          height: portrait ? height - 465 : height * 0.66,
          transform: `translateX(${shake}px) rotate(${still ? 0 : Math.sin(Math.floor(raw / 2) / 30) * 0.35}deg)`,
        }}
      >
        <svg
          viewBox="0 0 900 630"
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
        >
          {children}
        </svg>
      </div>
      <Presenter
        scene={scene}
        style={{
          position: "absolute",
          width: actorSize,
          height: actorSize,
          left: portrait
            ? placements.left
              ? placements.edge
              : width - placements.edge - actorSize
            : width * placements.desktopX,
          top: portrait ? placements.top : height - actorSize - 105,
        }}
      />
      {!portrait && (
        <Shout
          text={shout}
          color={color}
          frame={still ? 40 : f - 24}
          size={36}
          style={{ position: "absolute", right: 50, top: 65 }}
        />
      )}
      {portrait && (
        <div
          style={{
            position: "absolute",
            bottom: 139,
            left: 36,
            right: 36,
            textAlign: "right",
          }}
        >
          <Shout
            text={shout}
            color={color}
            frame={still ? 40 : f - 24}
            size={52}
          />
        </div>
      )}
      {portrait && (
        <div
          style={{
            position: "absolute",
            bottom: 108,
            left: portrait ? 30 : 44,
            right: portrait ? 30 : 44,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              style={{
                height: 4,
                flex: 1,
                background: i === Number(number) - 1 ? color : "#ffffff20",
                transform: `scaleY(${i === Number(number) - 1 ? 2 : 1})`,
              }}
            />
          ))}
        </div>
      )}
      <Particles color={color} />
      <PageTear color={color} />
    </AbsoluteFill>
  );
}
export function Panel({
  x = 0,
  y = 0,
  w = 900,
  h = 600,
  fill = "#161622",
  children,
  rotate = 0,
}: {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  fill?: string;
  children?: ReactNode;
  rotate?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})`}>
      <rect x="9" y="11" width={w} height={h} rx="16" fill="#000" />
      <rect
        width={w}
        height={h}
        rx="16"
        fill={fill}
        stroke="#000"
        strokeWidth="6"
      />
      {children}
    </g>
  );
}
export function Label({
  x,
  y,
  children,
  size = 32,
  color = C.white,
  anchor = "start",
  bold = true,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  bold?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize={size}
      fontFamily={
        bold ? '"Comic Archivo",Arial,sans-serif' : "Arial,sans-serif"
      }
      fontWeight={bold ? 900 : 500}
      textAnchor={anchor}
      style={{ letterSpacing: bold ? "-.03em" : undefined }}
    >
      {children}
    </text>
  );
}
export function Avatar({
  x,
  y,
  size = 64,
  index = 0,
  color = C.magenta,
}: {
  x: number;
  y: number;
  size?: number;
  index?: number;
  color?: string;
}) {
  const skins = ["#b96f40", "#e9b895", "#724838", "#d49b69"];
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 80})`}>
      <circle
        cx="40"
        cy="40"
        r="38"
        fill={color}
        stroke="#000"
        strokeWidth="4"
      />
      <path
        d="M10 73Q15 48 40 53Q67 50 72 73"
        fill={INKS[(index + 2) % 6]}
        stroke="#000"
        strokeWidth="3"
      />
      <ellipse
        cx="40"
        cy="33"
        rx="20"
        ry="24"
        fill={skins[index % 4]}
        stroke="#000"
        strokeWidth="3"
      />
      <path
        d={
          index % 2
            ? "M19 32Q9 3 39 9Q70 2 63 40L56 20L34 26Z"
            : "M18 26Q16 0 43 8Q70 4 62 31L47 17L27 24Z"
        }
        fill="#17121f"
        stroke="#000"
        strokeWidth="4"
      />
      <circle cx="33" cy="34" r="2.2" />
      <circle cx="49" cy="34" r="2.2" />
      <path d="M33 45Q41 52 48 44" fill="white" stroke="#000" strokeWidth="2" />
    </g>
  );
}
export function Check({
  x,
  y,
  color = C.green,
  scale = 1,
}: {
  x: number;
  y: number;
  color?: string;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r="25" fill={color} stroke="#000" strokeWidth="4" />
      <path
        d="M-12 0L-3 10L14-12"
        fill="none"
        stroke="#000"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
