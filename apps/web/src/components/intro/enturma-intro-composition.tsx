import { useEffect, useRef, type ReactNode } from "react";
import {
  AbsoluteFill,
  Freeze,
  Html5Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { IntroProps } from "./intro-model";
import { BookShowcaseScene, PresenterClosingScene } from "./intro-book-finale";
import {
  INTRO_FRAMES,
  INTRO_SCENE_FRAMES,
  INTRO_NARRATION_FILE,
} from "./intro-model";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const palette = {
  lime: "#deef80",
  mint: "#73dcc4",
  coral: "#ffac8f",
  blue: "#91c7fc",
  paper: "#f3f6ed",
  quiet: "#abc4bd",
  line: "#3a645b",
  panel: "#173d35",
};
const titles = [
  "Sua próxima conexão",
  "Aprender nos aproxima",
  "Seu semestre ganha vida",
  "Você faz parte",
  "Ideias que encontram eco",
  "Estudar, juntos",
  "No mesmo caminho",
  "Mais perto, de verdade",
  "Seu próximo encontro",
];
const descriptions = [
  "Um lugar para conectar o que você aprende a quem aprende com você.",
  "Da primeira dúvida a uma nova descoberta. Este é o Enturma.",
  "Suas matérias organizadas. Um novo caminho para cada assunto.",
  "Pessoas, ideias e oportunidades ao redor do seu aprendizado.",
  "Converse, compartilhe e construa conhecimento na comunidade.",
  "Chat, materiais e IA. Tudo reunido na sua sala de estudo.",
  "Encontre companhia entre a faculdade e a próxima parada.",
  "Voz, vídeo e tela compartilhada. Uma conversa muda tudo.",
  "Começa aqui. Explore, converse e aprenda em companhia.",
];
const frames = INTRO_SCENE_FRAMES;
const cut = (s: string, length = 34) =>
  s.length > length ? s.slice(0, length - 1) + "…" : s;
function progress(frame: number, delay = 0, length = 35) {
  return interpolate(frame, [delay, delay + length], [0, 1], clamp);
}
function arrive(frame: number, delay = 0) {
  return spring({
    frame: Math.max(0, frame - delay),
    fps: 60,
    config: { damping: 20, stiffness: 105, mass: 0.8 },
  });
}

/** A single deterministic canvas layer: ribbons, orbiting dust and travelling light. */
function Atmosphere({ quality }: Pick<IntroProps, "quality">) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (quality === "low") return;
    const count = quality === "high" ? 72 : 26;
    for (let ribbon = 0; ribbon < 3; ribbon++) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 12) {
        const y =
          height * 0.65 +
          Math.sin((x / width) * 5 + f / 160 + ribbon * 0.3) * height * 0.17 +
          ribbon * 18;
        if (!x) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ["#73dcc419", "#deef8015", "#91c7fc12"][ribbon];
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    for (let i = 0; i < count; i++) {
      const x =
        ((i * 137.508 + f * (0.12 + (i % 4) * 0.06)) % (width + 30)) - 15;
      const y = ((i * 83.173) % height) + Math.sin(f / 85 + i) * 20;
      ctx.fillStyle = i % 3 ? palette.mint : palette.lime;
      ctx.globalAlpha = 0.15 + (1 + Math.sin(f / 70 + i)) * 0.12;
      ctx.beginPath();
      ctx.arc(x, y, i % 9 ? 1.2 : 2.8, 0, Math.PI * 2);
      ctx.fill();
      if (quality === "high" && i % 9 === 0) {
        ctx.globalAlpha = 0.09;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }, [f, width, height, quality]);
  if (quality === "low") return null;
  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    />
  );
}
function Book({
  x = 0,
  y = 0,
  size = 100,
  frame = 100,
}: {
  x?: number;
  y?: number;
  size?: number;
  frame?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size / 80})`}
      fill="none"
      stroke={palette.lime}
      strokeWidth="3.4"
      strokeLinejoin="round"
    >
      <path
        d="M40 64V23C29 15 17 14 7 17V58C20 55 30 57 40 64ZM40 64V23C51 15 63 14 73 17V58C60 55 50 57 40 64Z"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - progress(frame, 0, 45)}
      />
      <g opacity={progress(frame, 25, 25)} strokeWidth="1.2">
        <path d="M15 26Q26 25 33 30M15 35Q26 34 33 39M47 30Q57 25 66 26M47 39Q57 34 66 35" />
      </g>
    </g>
  );
}
function Person({
  x,
  y,
  r = 45,
  avatar,
  name,
}: {
  x: number;
  y: number;
  r?: number;
  avatar?: string;
  name?: string;
}) {
  const id = `avatar-${x}-${y}-${r}`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <circle cx={x} cy={y} r={r - 4} />
        </clipPath>
      </defs>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="#224d43"
        stroke={palette.mint}
        strokeWidth="2"
      />
      <circle cx={x} cy={y - 8} r={r * 0.25} fill={palette.paper} />
      <path
        d={`M${x - r * 0.48} ${y + r * 0.45}Q${x} ${y - r * 0.28} ${x + r * 0.48} ${y + r * 0.45}`}
        fill={palette.paper}
      />
      {avatar && (
        <image
          href={avatar}
          x={x - r}
          y={y - r}
          width={r * 2}
          height={r * 2}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${id})`}
        />
      )}
      {name && (
        <text
          x={x}
          y={y + r + 30}
          textAnchor="middle"
          fill={palette.paper}
          fontSize="20"
          fontWeight="650"
        >
          {cut(name, 26)}
        </text>
      )}
    </g>
  );
}
function Art({
  children,
  focus = false,
}: {
  children: ReactNode;
  focus?: boolean;
}) {
  const { width, height } = useVideoConfig();
  return (
    <svg
      data-intro-art
      viewBox={focus && width < height ? "185 0 530 500" : "0 0 900 500"}
      width="100%"
      height="100%"
      fill="none"
      style={{ overflow: "visible", display: "block" }}
    >
      {children}
    </svg>
  );
}
function Stage({
  index,
  children,
  ...props
}: IntroProps & { index: number; children: ReactNode }) {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const duration = frames[index + 1] - frames[index];
  const enter = props.quality === "low" ? 1 : arrive(f);
  const exit = props.quality === "low" ? 0 : progress(f, duration - 18, 18);
  return (
    <AbsoluteFill
      data-intro-scene={index}
      style={{
        opacity:
          props.quality === "low" ? 1 : Math.min(progress(f, 0, 12), 1 - exit),
        padding: portrait ? "44px 32px 48px" : "38px 48px 48px",
        display: "grid",
        gridTemplateColumns: portrait
          ? "1fr"
          : "minmax(0, .82fr) minmax(0, 1.3fr)",
        gridTemplateRows: portrait ? "310px minmax(0, 1fr)" : "1fr",
        gap: portrait ? 12 : 25,
        alignItems: "center",
        transform: `translateX(${exit * -24}px)`,
        boxSizing: "border-box",
      }}
    >
      <div data-intro-safe style={{ minWidth: 0, color: palette.paper }}>
        <div style={{ overflow: "hidden", marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              transform: `translateY(${(1 - enter) * 50}px)`,
              color: palette.mint,
              fontSize: 20,
              fontWeight: 650,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 80 80">
              <Book size={80} />
            </svg>{" "}
            enturma.
          </div>
        </div>
        <div
          style={{
            fontSize: portrait ? 51 : width > 1400 ? 70 : 54,
            fontWeight: 750,
            lineHeight: 1.04,
            letterSpacing: "-.035em",
            marginBottom: 20,
          }}
        >
          {titles[index].split(" ").map((word, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "top",
                marginRight: ".22em",
                paddingBottom: ".06em",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transform: `translateY(${(1 - (props.quality === "low" ? 1 : arrive(f, i * 5 + 6))) * 115}%)`,
                }}
              >
                {word}
              </span>
            </span>
          ))}
        </div>
        <p
          style={{
            margin: 0,
            maxWidth: 530,
            fontSize: portrait ? 23 : 22,
            lineHeight: 1.48,
            color: palette.quiet,
            opacity: props.quality === "low" ? 1 : progress(f, 22, 18),
            transform: `translateY(${(1 - enter) * 10}px)`,
          }}
        >
          {descriptions[index]}
        </p>
      </div>
      <div
        data-intro-safe
        style={{
          minWidth: 0,
          height: "100%",
          maxHeight: portrait ? 490 : 510,
          position: "relative",
          transform: `perspective(1100px) translateY(${(1 - enter) * 35}px) rotateY(${portrait ? 0 : (1 - enter) * -9}deg) scale(${0.94 + enter * 0.06})`,
          filter:
            props.quality === "high" ? `blur(${(1 - enter) * 3}px)` : undefined,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}
export function GitHubScannerScene(props: IntroProps) {
  const f = useCurrentFrame();
  return (
    <Stage {...props} index={0}>
      <Art>
        <rect
          x="60"
          y="58"
          width="780"
          height="368"
          rx="24"
          fill="#102e28"
          stroke={palette.line}
        />
        <path d="M60 114H840" stroke={palette.line} />
        <circle cx="91" cy="85" r="5" fill={palette.coral} />
        <circle cx="111" cy="85" r="5" fill={palette.lime} />
        <circle cx="131" cy="85" r="5" fill={palette.mint} />
        <text
          x="169"
          y="92"
          fill={palette.quiet}
          fontFamily="monospace"
          fontSize="19"
        >
          enturma / conexões
        </text>
        {props.features.map((feature, i) => {
          const a = arrive(f, i * 9);
          return (
            <g
              key={feature.id}
              opacity={a}
              transform={`translate(${(1 - a) * 35} 0)`}
            >
              <text
                x="96"
                y={157 + i * 42}
                fill={palette.mint}
                fontSize="18"
                fontFamily="monospace"
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              <path d={`M137 ${150 + i * 42}H177`} stroke={palette.line} />
              <text x="193" y={157 + i * 42} fill={palette.paper} fontSize="22">
                {feature.title}
              </text>
              <rect
                x="605"
                y={143 + i * 42}
                width={155 * progress(f, i * 9 + 8, 25)}
                height="5"
                rx="3"
                fill={[palette.lime, palette.mint, palette.blue][i % 3]}
              />
            </g>
          );
        })}
        <path
          d={`M78 ${124 + ((f * 3) % 286)}H825`}
          stroke={palette.mint}
          opacity=".35"
        />
        <g
          transform={`translate(${670 + Math.sin(f / 30) * 6} ${350 + Math.cos(f / 30) * 7})`}
        >
          <rect width="174" height="66" rx="16" fill={palette.lime} />
          <text
            x="87"
            y="39"
            textAnchor="middle"
            fill="#143a31"
            fontSize="21"
            fontWeight="750"
          >
            Tudo se conecta
          </text>
        </g>
      </Art>
    </Stage>
  );
}
export function EnturmaLogoScene(props: IntroProps) {
  const f = useCurrentFrame(),
    t = progress(f, 15, 65);
  return (
    <Stage {...props} index={1}>
      <Art focus>
        {[150, 190, 225].map((r, i) => (
          <circle
            key={r}
            cx="450"
            cy="245"
            r={r}
            stroke={i === 1 ? palette.mint : palette.line}
            opacity={0.7 - i * 0.16}
            strokeDasharray={i === 1 ? "6 12" : undefined}
            transform={`rotate(${f * (i % 2 ? -0.12 : 0.1)} 450 245)`}
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const r = 220 - t * 25;
          return (
            <g
              key={i}
              transform={`translate(${450 + Math.cos(angle) * r} ${245 + Math.sin(angle) * r}) rotate(${i * 30 + f / 4})`}
              opacity={1 - t * 0.65}
            >
              <rect
                x="-6"
                y="-6"
                width="12"
                height="12"
                rx="2"
                fill={i % 2 ? palette.lime : palette.mint}
              />
            </g>
          );
        })}
        <g
          transform={`translate(310 80) rotate(${(1 - arrive(f)) * -15} 140 140)`}
        >
          <Book size={280} frame={f} />
        </g>
        <text
          x="450"
          y="412"
          textAnchor="middle"
          fill={palette.paper}
          fontSize="82"
          fontWeight="750"
          letterSpacing="-3"
          opacity={progress(f, 35, 20)}
        >
          enturma<tspan fill={palette.lime}>.</tspan>
        </text>
      </Art>
    </Stage>
  );
}
export function AcademicScene(props: IntroProps) {
  const f = useCurrentFrame();
  const subjects = props.subjects.length
    ? props.subjects.slice(0, 3)
    : ["Escolha suas matérias", "Monte seu semestre", "Encontre sua turma"];
  return (
    <Stage {...props} index={2}>
      <Art>
        <path
          d="M65 394C220 494 650 28 850 202"
          stroke={palette.line}
          strokeWidth="2"
          strokeDasharray="6 12"
        />
        {subjects.map((title, i) => {
          const a = arrive(f, 12 + i * 17);
          const x = 66 + i * 257;
          return (
            <g
              key={i}
              transform={`translate(${x} ${95 + (i % 2) * 36 + (1 - a) * 140}) rotate(${(1 - a) * (i - 1) * 20} 115 160)`}
              opacity={a}
            >
              <rect
                width="235"
                height="304"
                rx="20"
                fill={i === 1 ? "#215248" : palette.panel}
                stroke={palette.line}
              />
              <rect
                x="20"
                y="22"
                width="64"
                height="64"
                rx="15"
                fill={[palette.lime, palette.mint, palette.blue][i]}
              />
              <path
                d="M33 49L52 39L71 49L52 59ZM40 55V67Q52 76 64 67V55"
                stroke="#183f35"
                strokeWidth="2"
              />
              <text x="20" y="124" fill={palette.quiet} fontSize="16">
                {props.semester ? cut(props.semester, 20) : "Seu aprendizado"}
              </text>
              <text
                x="20"
                y="166"
                fill={palette.paper}
                fontWeight="700"
                fontSize="24"
              >
                {cut(title, 17)}
              </text>
              <path
                d="M20 193H208M20 214H167"
                stroke={palette.line}
                strokeWidth="6"
                strokeLinecap="round"
              />
              <rect
                x="20"
                y="252"
                width={190 * progress(f, 45 + i * 15, 50)}
                height="6"
                rx="3"
                fill={[palette.lime, palette.mint, palette.blue][i]}
              />
            </g>
          );
        })}
        <g
          opacity={progress(f, 100, 20)}
          transform={`translate(560 ${408 + Math.sin(f / 22) * 4})`}
        >
          <rect width="260" height="51" rx="25" fill={palette.lime} />
          <text
            x="130"
            y="32"
            textAnchor="middle"
            fill="#12382f"
            fontSize="20"
            fontWeight="650"
          >
            Um assunto. Novas conexões.
          </text>
        </g>
      </Art>
    </Stage>
  );
}
export function StudentNetworkScene(props: IntroProps) {
  const f = useCurrentFrame();
  const points = [
    [160, 106],
    [738, 100],
    [145, 350],
    [750, 365],
    [450, 52],
    [450, 442],
  ];
  return (
    <Stage {...props} index={3}>
      <Art>
        {[115, 174, 224].map((r, i) => (
          <ellipse
            key={r}
            cx="450"
            cy="245"
            rx={r * 1.6}
            ry={r}
            stroke={palette.line}
            opacity={0.5 - i * 0.1}
          />
        ))}
        {props.features.slice(0, 6).map((feature, i) => {
          const [x, y] = points[i],
            p = progress(f, i * 10 + 15, 45),
            a = arrive(f, i * 10 + 20);
          return (
            <g key={feature.id}>
              <path
                d={`M450 245Q${x} 245 ${x} ${y}`}
                stroke={[palette.mint, palette.blue, palette.lime][i % 3]}
                strokeWidth="2"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - p}
              />
              <circle
                cx={450 + (x - 450) * (((f + i * 20) % 100) / 100)}
                cy={245 + (y - 245) * (((f + i * 20) % 100) / 100)}
                r="4"
                fill={palette.lime}
                opacity={p}
              />
              <g opacity={a} transform={`translate(${x} ${y}) scale(${a})`}>
                <rect
                  x="-94"
                  y="-26"
                  width="188"
                  height="52"
                  rx="26"
                  fill={palette.panel}
                  stroke={palette.line}
                />
                <text
                  y="7"
                  textAnchor="middle"
                  fill={palette.paper}
                  fontSize="20"
                >
                  {feature.title}
                </text>
              </g>
            </g>
          );
        })}
        <circle
          cx="450"
          cy="245"
          r={78 + Math.sin(f / 14) * 3}
          stroke={palette.lime}
          opacity=".55"
        />
        <Person
          x={450}
          y={245}
          r={67}
          avatar={props.user?.avatarUrl}
          name={props.user?.name.split(" ")[0] || "Sua próxima conexão"}
        />
      </Art>
    </Stage>
  );
}
export function CommunityScene(props: IntroProps) {
  const f = useCurrentFrame();
  return (
    <Stage {...props} index={4}>
      <Art>
        <g
          transform={`translate(98 ${65 + Math.sin(f / 45) * 5}) rotate(-3 330 180)`}
        >
          <rect
            width="650"
            height="335"
            rx="22"
            fill={palette.panel}
            stroke={palette.line}
          />
          <Person x={47} y={48} r={23} avatar={props.user?.avatarUrl} />
          <text
            x="86"
            y="53"
            fill={palette.paper}
            fontSize="23"
            fontWeight="650"
          >
            {cut(props.user?.name || "Sua comunidade", 30)}
          </text>
          <text
            x="29"
            y="120"
            fill={palette.paper}
            fontSize="34"
            fontWeight="700"
          >
            Uma boa ideia vai mais longe.
          </text>
          <text x="29" y="161" fill={palette.quiet} fontSize="23">
            Pergunte. Compartilhe. Descubra.
          </text>
          {[460, 530, 330].map((w, i) => (
            <rect
              key={i}
              x="29"
              y={194 + i * 24}
              width={w * progress(f, 20 + i * 7, 26)}
              height="7"
              rx="3"
              fill={palette.line}
            />
          ))}
          <path d="M29 284H620" stroke={palette.line} />
          <text x="30" y="315" fill={palette.mint} fontSize="19">
            Comunidade · Fórum · Conversas
          </text>
        </g>
        {["Conexões", "Reações", "Novas ideias"].map((s, i) => {
          const a = arrive(f, 55 + i * 22);
          return (
            <g
              key={s}
              opacity={a}
              transform={`translate(${410 + i * 46} ${322 + i * 45 + (1 - a) * 60}) rotate(${i * 3})`}
            >
              <rect
                width="284"
                height="59"
                rx="17"
                fill={[palette.lime, palette.mint, palette.blue][i]}
              />
              <path
                d="M19 26L25 32L38 19"
                stroke="#153f35"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <text x="55" y="37" fill="#153f35" fontSize="24" fontWeight="650">
                {s}
              </text>
            </g>
          );
        })}
      </Art>
    </Stage>
  );
}
export function StudyRoomScene(props: IntroProps) {
  const f = useCurrentFrame();
  return (
    <Stage {...props} index={5}>
      <Art>
        <rect
          x="40"
          y="45"
          width="820"
          height="408"
          rx="22"
          fill="#102f29"
          stroke={palette.line}
        />
        <path d="M40 111H860M256 111V453" stroke={palette.line} />
        <circle cx="75" cy="78" r="7" fill={palette.mint} />
        <text x="97" y="87" fontSize="24" fill={palette.paper} fontWeight="650">
          Sua sala de estudo
        </text>
        {["Conversa", "Materiais", "Enturma AI"].map((s, i) => (
          <g key={s} opacity={progress(f, i * 14, 22)}>
            <rect
              x="60"
              y={138 + i * 66}
              width="176"
              height="48"
              rx="10"
              fill={i === 0 ? palette.lime : palette.panel}
            />
            <text
              x="77"
              y={169 + i * 66}
              fill={i === 0 ? "#153f35" : palette.paper}
              fontSize="21"
            >
              {s}
            </text>
          </g>
        ))}
        <g opacity={progress(f, 15, 22)}>
          <Book x={310} y={126} size={92} frame={f} />
          <text
            x="425"
            y="174"
            fill={palette.paper}
            fontSize="27"
            fontWeight="650"
          >
            {cut(props.subjects[0] || "Aprender em companhia", 24)}
          </text>
          <text x="425" y="207" fill={palette.quiet} fontSize="19">
            Conecte suas dúvidas às descobertas.
          </text>
        </g>
        {[
          "Compartilhe seus materiais",
          "Explore explicações com IA",
          "Leve uma ideia para a conversa",
        ].map((s, i) => {
          const a = arrive(f, 40 + i * 20);
          return (
            <g key={s} opacity={a} transform={`translate(${(1 - a) * 55} 0)`}>
              <rect
                x={295 + (i % 2) * 65}
                y={243 + i * 60}
                width="446"
                height="46"
                rx="14"
                fill={i === 1 ? "#28534a" : palette.panel}
              />
              <circle
                cx={321 + (i % 2) * 65}
                cy={266 + i * 60}
                r="5"
                fill={[palette.mint, palette.lime, palette.blue][i]}
              />
              <text
                x={338 + (i % 2) * 65}
                y={273 + i * 60}
                fontSize="21"
                fill={palette.paper}
              >
                {s}
              </text>
            </g>
          );
        })}
      </Art>
    </Stage>
  );
}
export function RideScene(props: IntroProps) {
  const f = useCurrentFrame(),
    p = progress(f, 10, 115);
  const x = 140 + 600 * p,
    y = 330 - 180 * p + Math.sin(p * Math.PI * 2) * 65;
  return (
    <Stage {...props} index={6}>
      <Art>
        <rect
          x="55"
          y="35"
          width="790"
          height="426"
          rx="25"
          fill="#14382f"
          stroke={palette.line}
        />
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} opacity=".6">
            <path
              d={`M${80 + i * 119} 54L${156 + i * 98} 441M75 ${75 + i * 58}L825 ${107 + i * 48}`}
              stroke="#244b40"
              strokeWidth="13"
            />
          </g>
        ))}
        <path
          d="M140 330C260 470 340 200 440 240S620 58 740 150"
          stroke="#0d2821"
          strokeWidth="19"
          strokeLinecap="round"
        />
        <path
          d="M140 330C260 470 340 200 440 240S620 58 740 150"
          stroke={palette.mint}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - p}
        />
        <Person x={140} y={330} r={36} avatar={props.user?.avatarUrl} />
        <circle cx="740" cy="150" r="39" fill={palette.lime} />
        <path
          d="M715 145L740 131L765 145L740 159ZM724 151V165Q740 177 756 165V151"
          stroke="#153f35"
          strokeWidth="2.5"
        />
        <g transform={`translate(${x} ${y})`}>
          <circle r="28" fill={palette.lime} opacity=".15" />
          <rect
            x="-18"
            y="-12"
            width="36"
            height="24"
            rx="8"
            fill={palette.paper}
          />
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill="#28534a" />
        </g>
        <g
          opacity={progress(f, 90, 25)}
          transform={`translate(280 ${382 + (1 - arrive(f, 90)) * 30})`}
        >
          <rect width="344" height="56" rx="18" fill={palette.lime} />
          <text
            x="172"
            y="36"
            textAnchor="middle"
            fill="#153f35"
            fontSize="24"
            fontWeight="700"
          >
            Sua carona, uma nova conexão.
          </text>
        </g>
      </Art>
    </Stage>
  );
}
export function CallsScene(props: IntroProps) {
  const f = useCurrentFrame();
  return (
    <Stage {...props} index={7}>
      <Art>
        {[75, 112, 150, 190].map((r, i) => (
          <circle
            key={r}
            cx="450"
            cy="208"
            r={r + ((f % 60) / 60) * 22}
            stroke={i % 2 ? palette.line : palette.mint}
            opacity={(1 - (f % 60) / 60) * (0.65 - i * 0.1)}
          />
        ))}
        <Person
          x={450}
          y={208}
          r={64}
          avatar={props.user?.avatarUrl}
          name={props.user?.name.split(" ")[0] || "Sua próxima conversa"}
        />
        {Array.from({ length: 40 }, (_, i) => {
          const h = 8 + (Math.sin(f / 7 + i * 0.68) + 1) * 19;
          return (
            <rect
              key={i}
              x={155 + i * 15}
              y={358 - h / 2}
              width="5"
              height={h}
              rx="3"
              fill={i % 3 ? palette.mint : palette.lime}
              opacity={progress(f, 10, 25)}
            />
          );
        })}
        {["Voz", "Vídeo", "Compartilhar tela"].map((s, i) => {
          const a = arrive(f, 25 + i * 15);
          return (
            <g
              key={s}
              opacity={a}
              transform={`translate(${176 + i * 185} ${409 + (1 - a) * 40})`}
            >
              <rect
                width="175"
                height="47"
                rx="23"
                fill={palette.panel}
                stroke={palette.line}
              />
              <text
                x="87"
                y="30"
                textAnchor="middle"
                fontSize="20"
                fill={palette.paper}
              >
                {s}
              </text>
            </g>
          );
        })}
      </Art>
    </Stage>
  );
}
export function FinalScene(props: IntroProps) {
  return <PresenterClosingScene {...props} />;
}
const scenes = [
  GitHubScannerScene,
  EnturmaLogoScene,
  AcademicScene,
  StudentNetworkScene,
  CommunityScene,
  StudyRoomScene,
  RideScene,
  CallsScene,
  BookShowcaseScene,
  FinalScene,
];
function PageTurn({ quality }: Pick<IntroProps, "quality">) {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const boundary = frames
    .slice(1, -1)
    .find((value) => Math.abs(f - value) < 22);
  if (quality === "low" || boundary === undefined) return null;
  const p = progress(f, boundary - 22, 44);
  const x = interpolate(p, [0, 1], [-width * 1.8, width * 1.8]);
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <g transform={`translate(${x} 0)`}>
        <path
          d={`M0 0H${width * 0.85}Q${width * 1.3} ${height * 0.5} ${width * 0.85} ${height}H0Q${width * 0.3} ${height * 0.5} 0 0`}
          fill="#245346"
        />
        <path
          d={`M${width * 0.85} 0Q${width * 1.3} ${height * 0.5} ${width * 0.85} ${height}`}
          stroke={palette.lime}
          strokeWidth="4"
        />
        <path
          d={`M${width * 0.8} 0Q${width * 1.22} ${height * 0.5} ${width * 0.8} ${height}`}
          stroke={palette.mint}
          strokeWidth="1"
          opacity=".5"
        />
      </g>
    </svg>
  );
}
export function EnturmaIntroComposition(props: IntroProps) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      data-intro-frame={f}
      style={{
        background: "#0c2923",
        backgroundImage:
          props.quality === "high"
            ? `radial-gradient(ellipse at ${30 + Math.sin(f / 150) * 20}% 35%, #245b4655, transparent 65%)`
            : undefined,
        color: palette.paper,
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <Atmosphere quality={props.quality} />
      <Html5Audio src={staticFile(INTRO_NARRATION_FILE)} pauseWhenBuffering />
      {scenes.map((Scene, i) => (
        <Sequence
          key={i}
          name={Scene.name}
          from={frames[i]}
          durationInFrames={frames[i + 1] - frames[i]}
        >
          {props.quality === "low" && i !== 8 ? (
            <Freeze frame={i === 9 ? 260 : 75}>
              <Scene {...props} />
            </Freeze>
          ) : (
            <Scene {...props} />
          )}
        </Sequence>
      ))}
      <PageTurn quality={props.quality} />
      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: 32,
          right: 32,
          height: 2,
          background: "#3a645b",
          display: "flex",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${props.quality === "low" ? 100 : (f / INTRO_FRAMES) * 100}%`,
            background: palette.lime,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
