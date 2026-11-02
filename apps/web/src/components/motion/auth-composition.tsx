import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BookOpen, MessageCircle, Sparkles, Users } from "lucide-react";
import { BrandBook } from "./brand-book";
import { EnturmaAppIcon } from "../enturma-app-icon";

/** A seamless entrance loop. Semantic colors follow the theme without restarting playback. */
export function AuthComposition({ reduced }: { reduced: boolean }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const phase = reduced ? 0 : (frame / durationInFrames) * Math.PI * 2;
  const float = Math.sin(phase);
  return (
    <AbsoluteFill
      style={{
        background: "var(--soft)",
        color: "var(--ink)",
        overflow: "hidden",
        perspective: 1000,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 440,
          height: 440,
          left: 100,
          top: -60,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent) 24%, transparent), transparent 68%)",
          transform: `scale(${1 + float * 0.08})`,
        }}
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 125 - i * 44,
            top: 62 - i * 20,
            width: 390 + i * 88,
            height: 220 + i * 40,
            border: "1px solid color-mix(in srgb, var(--ink) 10%, transparent)",
            borderRadius: "50%",
            transform: `rotate(${-18 + float * 3}deg)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 28,
          top: 24,
          display: "flex",
          alignItems: "center",
          gap: 9,
          fontSize: 18,
          fontWeight: 750,
        }}
      >
        <EnturmaAppIcon size={28} /> enturma.
      </div>
      <div
        style={{
          position: "absolute",
          left: 224,
          top: 110,
          transform: `translateY(${float * 9}px) rotateX(22deg) rotateZ(${-12 + float * 3}deg)`,
        }}
      >
        <BrandBook
          frame={reduced ? 22 : frame}
          size={248}
          color="var(--accent)"
        />
      </div>
      {[
        {
          Icon: Users,
          title: "Sua turma",
          detail: "Aprender em companhia",
          x: 28,
          y: 95,
          angle: -5,
        },
        {
          Icon: Sparkles,
          title: "Seu próximo passo",
          detail: "Uma ideia puxa outra",
          x: 352,
          y: 265,
          angle: 4,
        },
      ].map(({ Icon, title, detail, x, y, angle }, i) => (
        <div
          key={title}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 236,
            padding: 16,
            borderRadius: 18,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 12px 32px #00000016",
            transform: `translateY(${Math.sin(phase + i * Math.PI) * 7}px) rotate(${angle + float * 1.5}deg)`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 42,
              height: 42,
              flexShrink: 0,
              borderRadius: 13,
              background: "var(--accent)",
              color: "var(--on-accent, #183f36)",
            }}
          >
            <Icon size={24} />
          </span>
          <span>
            <strong style={{ display: "block", fontSize: 16 }}>{title}</strong>
            <span
              style={{
                display: "block",
                fontSize: 12,
                marginTop: 5,
                color: "var(--muted)",
              }}
            >
              {detail}
            </span>
          </span>
        </div>
      ))}
      {[MessageCircle, BookOpen].map((Icon, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i ? 118 : 532,
            top: i ? 254 : 86,
            width: 46,
            height: 46,
            display: "grid",
            placeItems: "center",
            borderRadius: 16,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--ink)",
            transform: `translateY(${Math.sin(phase + i) * 11}px) rotate(${float * 8}deg)`,
          }}
        >
          <Icon size={23} />
        </div>
      ))}
      <span
        style={{
          position: "absolute",
          bottom: 23,
          left: 28,
          fontSize: 12,
          color: "var(--muted)",
          letterSpacing: 2,
        }}
      >
        UMA MATÉRIA. VÁRIAS IDEIAS.
      </span>
    </AbsoluteFill>
  );
}
