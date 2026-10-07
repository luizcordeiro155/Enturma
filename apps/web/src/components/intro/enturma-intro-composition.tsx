import { useEffect, useRef, type ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BookOpen,
  Car,
  Code2,
  GraduationCap,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import type { IntroProps } from "./intro-model";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const icons = {
  subjects: GraduationCap,
  community: MessageCircle,
  rooms: Users,
  notebooks: BookOpen,
  rides: Car,
  calls: Phone,
};
function colors(theme: IntroProps["theme"]) {
  return theme === "dark"
    ? {
        bg: "#111719",
        panel: "#1c292b",
        ink: "#f2f6f4",
        muted: "#adbfba",
        line: "#3b534d",
        accent: "#d8ef79",
      }
    : {
        bg: "#f1f5f2",
        panel: "#ffffff",
        ink: "#183f36",
        muted: "#50675e",
        line: "#b8ccc1",
        accent: "#376149",
      };
}

function Particles({ quality, theme }: Pick<IntroProps, "quality" | "theme">) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (quality === "low") return;
    const count = quality === "high" ? 36 : 12;
    ctx.fillStyle = colors(theme).accent;
    ctx.strokeStyle = colors(theme).line;
    for (let i = 0; i < count; i++) {
      const x = ((i * 137.51) % width) + Math.sin(frame / 130 + i) * 14;
      const y = ((i * 83.17) % height) + Math.cos(frame / 160 + i) * 12;
      ctx.globalAlpha = 0.12 + Math.sin(i + frame / 90) * 0.05;
      ctx.beginPath();
      ctx.arc(x, y, i % 3 === 0 ? 2 : 1, 0, Math.PI * 2);
      ctx.fill();
      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 52, y + 24);
        ctx.stroke();
      }
    }
  }, [frame, width, height, quality, theme]);
  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    />
  );
}

function Scene({
  children,
  duration,
  quality,
}: {
  children: ReactNode;
  duration: number;
  quality: IntroProps["quality"];
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const progress =
    quality === "low"
      ? 1
      : spring({ frame, fps, config: { damping: 24, stiffness: 120 } });
  return (
    <AbsoluteFill
      data-intro-frame={frame}
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: width < height ? 38 : 50,
        gap: 24,
        opacity:
          quality === "low"
            ? 1
            : interpolate(
                frame,
                [0, 12, duration - 12, duration - 1],
                [0, 1, 1, 0],
                clamp,
              ),
        translate: `0 ${(1 - progress) * 24}px`,
        scale: 0.985 + progress * 0.015,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  return (
    <div style={{ textAlign: "center", maxWidth: 1000 }}>
      <div
        style={{
          fontSize: 17,
          letterSpacing: 3,
          textTransform: "uppercase",
          opacity: 0.7,
          marginBottom: 16,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: portrait ? 42 : 48,
          fontWeight: 750,
          lineHeight: 1.08,
          letterSpacing: -1.5,
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: 23,
            lineHeight: 1.4,
            marginTop: 16,
            opacity: 0.78,
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}
export function GitHubScannerScene(props: IntroProps) {
  const frame = useCurrentFrame();
  const c = colors(props.theme);
  return (
    <Scene duration={90} quality={props.quality}>
      <Heading
        eyebrow="Da ideia à companhia"
        title="Um espaço. Muitas conexões."
      />
      <div
        style={{
          background: c.panel,
          border: `1px solid ${c.line}`,
          borderRadius: 18,
          padding: 24,
          width: "90%",
          maxWidth: 640,
          fontFamily: "monospace",
          fontSize: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Code2 size={22} /> enturma / plataforma
        </div>
        {props.features.slice(0, 4).map((feature, index) => (
          <div
            key={feature.id}
            style={{
              paddingBlock: 4,
              opacity: interpolate(
                frame,
                [index * 8, index * 8 + 10],
                [0, 1],
                clamp,
              ),
            }}
          >
            <span style={{ color: c.accent }}>↳ </span>
            {feature.title}
          </div>
        ))}
      </div>
    </Scene>
  );
}
export function EnturmaLogoScene(props: IntroProps) {
  const frame = useCurrentFrame();
  return (
    <Scene duration={90} quality={props.quality}>
      <svg
        width={150}
        height={150}
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M40 62V22C30 14 17 15 8 17V58C20 55 31 56 40 62ZM40 62V22C50 14 63 15 72 17V58C60 55 49 56 40 62Z"
          stroke={colors(props.theme).accent}
          strokeWidth={4}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={interpolate(frame, [0, 55], [1, 0], {
            ...clamp,
            easing: Easing.inOut(Easing.cubic),
          })}
        />
      </svg>
      <Heading eyebrow="ENTURMA" title="Aprender começa com um encontro." />
    </Scene>
  );
}
export function AcademicScene(props: IntroProps) {
  const c = colors(props.theme);
  const subjects = props.subjects.length
    ? props.subjects.slice(0, 3)
    : ["Escolha suas matérias", "Organize seus estudos", "Encontre sua turma"];
  return (
    <Scene duration={120} quality={props.quality}>
      <Heading
        eyebrow={props.semester || "Seu próximo semestre"}
        title="Seu conhecimento, conectado."
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
        }}
      >
        {subjects.map((subject, index) => (
          <div
            key={subject}
            style={{
              background: c.panel,
              border: `1px solid ${c.line}`,
              borderRadius: 18,
              padding: 24,
              maxWidth: 320,
              fontSize: 23,
            }}
          >
            <GraduationCap
              size={32}
              style={{ marginBottom: 16, color: c.accent }}
            />
            <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 8 }}>
              0{index + 1}
            </div>
            {subject}
          </div>
        ))}
      </div>
    </Scene>
  );
}
export function StudentNetworkScene(props: IntroProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const c = colors(props.theme);
  const portrait = width < height;
  const nodes = props.students.length
    ? props.students
        .slice(0, 4)
        .map((person) => ({ title: person.name, avatarUrl: person.avatarUrl }))
    : props.features
        .slice(0, 4)
        .map((feature) => ({ title: feature.title, avatarUrl: undefined }));
  const networkWidth = portrait ? 510 : 770;
  return (
    <Scene duration={150} quality={props.quality}>
      <Heading
        eyebrow="Você no centro"
        title={
          props.user
            ? `Vamos juntos, ${props.user.name.split(" ")[0]}?`
            : "Conhecimento aproxima."
        }
      />
      <div style={{ position: "relative", width: networkWidth, height: 285 }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${networkWidth} 285`}
          style={{ position: "absolute" }}
        >
          {nodes.map((node, i) => (
            <path
              key={node.title}
              d={`M ${networkWidth / 2} 142 L ${i % 2 ? networkWidth - 85 : 85} ${i < 2 ? 48 : 237}`}
              stroke={c.line}
              strokeWidth={2}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={interpolate(
                frame,
                [18 + i * 8, 50 + i * 8],
                [1, 0],
                clamp,
              )}
            />
          ))}
        </svg>
        {nodes.map((node, i) => (
          <div
            key={node.title}
            style={{
              position: "absolute",
              left: i % 2 ? networkWidth - 165 : 5,
              top: i < 2 ? 16 : 205,
              width: 160,
              minHeight: 60,
              padding: 12,
              borderRadius: 16,
              background: c.panel,
              border: `1px solid ${c.line}`,
              textAlign: "center",
              fontSize: 19,
            }}
          >
            {node.avatarUrl && (
              <Img
                src={node.avatarUrl}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
            {node.title}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: networkWidth / 2 - 57,
            top: 85,
            width: 114,
            height: 114,
            borderRadius: "50%",
            border: `3px solid ${c.accent}`,
            background: c.panel,
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          <Users size={48} />
          {props.user?.avatarUrl && (
            <Img
              src={props.user.avatarUrl}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>
      </div>
    </Scene>
  );
}
function FeatureScene({
  featureId,
  ...props
}: IntroProps & { featureId: string }) {
  const feature = props.features.find((item) => item.id === featureId);
  if (!feature) return null;
  const Icon = icons[feature.id as keyof typeof icons] || BookOpen;
  const c = colors(props.theme);
  return (
    <Scene
      duration={featureId === "community" ? 150 : 80}
      quality={props.quality}
    >
      <div
        style={{
          width: 116,
          height: 116,
          background: c.panel,
          border: `1px solid ${c.line}`,
          borderRadius: 28,
          display: "grid",
          placeItems: "center",
          color: c.accent,
        }}
      >
        <Icon size={56} strokeWidth={1.5} />
      </div>
      <Heading
        eyebrow={feature.title}
        title={feature.description}
        description={
          featureId === "rooms"
            ? "Conversa, materiais e Enturma AI no mesmo lugar."
            : featureId === "calls"
              ? "Voz, câmera e tela para aprender junto."
              : featureId === "community"
                ? "Ideias viram conversas. Conversas viram descobertas."
                : "Da faculdade para casa, com a sua comunidade."
        }
      />
    </Scene>
  );
}
export function CommunityScene(props: IntroProps) {
  return <FeatureScene {...props} featureId="community" />;
}
export function StudyRoomScene(props: IntroProps) {
  return <FeatureScene {...props} featureId="rooms" />;
}
export function RideScene(props: IntroProps) {
  return <FeatureScene {...props} featureId="rides" />;
}
export function CallsScene(props: IntroProps) {
  return <FeatureScene {...props} featureId="calls" />;
}
export function FinalScene(props: IntroProps) {
  return (
    <Scene
      duration={props.quality === "low" ? 180 : 60}
      quality={props.quality}
    >
      <BookOpen size={86} strokeWidth={1.5} />
      <Heading
        eyebrow="Enturma"
        title="Seu próximo estudo começa aqui."
        description="Matérias · Comunidade · Cadernos IA · Salas · Caronas"
      />
    </Scene>
  );
}

/** Pure, deterministic composition shared by the embedded Player and Remotion Renderer. */
export function EnturmaIntroComposition(props: IntroProps) {
  const c = colors(props.theme);
  return (
    <AbsoluteFill
      style={{
        background: c.bg,
        color: c.ink,
        fontFamily: "Arial, Helvetica, sans-serif",
        overflow: "hidden",
      }}
    >
      <Particles quality={props.quality} theme={props.theme} />
      {props.quality === "low" ? (
        <FinalScene {...props} />
      ) : (
        <>
          <Sequence name="GitHubScannerScene" from={0} durationInFrames={90}>
            <GitHubScannerScene {...props} />
          </Sequence>
          <Sequence name="EnturmaLogoScene" from={90} durationInFrames={90}>
            <EnturmaLogoScene {...props} />
          </Sequence>
          <Sequence name="AcademicScene" from={180} durationInFrames={120}>
            <AcademicScene {...props} />
          </Sequence>
          <Sequence
            name="StudentNetworkScene"
            from={300}
            durationInFrames={150}
          >
            <StudentNetworkScene {...props} />
          </Sequence>
          <Sequence name="CommunityScene" from={450} durationInFrames={150}>
            <CommunityScene {...props} />
          </Sequence>
          <Sequence name="StudyRoomScene" from={600} durationInFrames={80}>
            <StudyRoomScene {...props} />
          </Sequence>
          <Sequence name="RideScene" from={680} durationInFrames={80}>
            <RideScene {...props} />
          </Sequence>
          <Sequence name="CallsScene" from={760} durationInFrames={80}>
            <CallsScene {...props} />
          </Sequence>
          <Sequence name="FinalScene" from={840} durationInFrames={60}>
            <FinalScene {...props} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
}
