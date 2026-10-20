"use client";
import { Player, type PlayerRef } from "@remotion/player";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Car,
  GraduationCap,
  MessageCircle,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { BrandBook } from "./brand-book";
const icons = [
  Trophy,
  GraduationCap,
  Users,
  MessageCircle,
  MessageCircle,
  Sparkles,
  Car,
  BookOpen,
  Sparkles,
];
const labels = [
  "Seu progresso",
  "Suas matérias",
  "Sua turma",
  "Estudo em grupo",
  "Voz do campus",
  "Suas fontes",
  "Conexões",
  "Seu universo",
  "Do seu jeito",
];
function GuideComposition({
  step,
  reduced,
}: {
  step: number;
  reduced: boolean;
}) {
  const raw = useCurrentFrame(),
    { fps } = useVideoConfig();
  const frame = reduced ? 105 : raw;
  const Icon = icons[step % icons.length];
  const enter = spring({ frame, fps, config: { damping: 19, stiffness: 110 } });
  const reveal = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: { damping: 20 },
  });
  const turn = interpolate(frame, [8, 52], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: "linear-gradient(145deg,#123d34,#10241e)",
        borderRadius: 24,
        perspective: 1000,
        color: "#efffe0",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 350,
          height: 350,
          left: 125,
          top: -100,
          borderRadius: "50%",
          border: "1px solid #c8e77622",
          transform: `rotateX(60deg) rotateZ(${frame * 0.3}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 30,
          top: 38,
          transform: `translateY(${(1 - enter) * 45}px) rotateY(${-12 + turn}deg) rotateZ(-6deg)`,
          transformStyle: "preserve-3d",
          opacity: enter,
        }}
      >
        <BrandBook frame={frame} size={180} />
      </div>
      {[2, 1, 0].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 270 + i * 10,
            top: 25 + i * 10,
            width: 235,
            height: 165,
            borderRadius: 18,
            background: i === 0 ? "#e5f7c4" : "#2b6851",
            border: "1px solid #9bdd8e66",
            boxShadow: "0 14px 24px #0004",
            transform: `translateX(${(1 - reveal) * 100}px) rotateY(${-turn}deg) rotateZ(${i * 5 - 3}deg)`,
            opacity: reveal,
            transformOrigin: "left center",
            padding: 24,
            boxSizing: "border-box",
            color: "#143e32",
          }}
        >
          {i === 0 && (
            <>
              <Icon size={34} />
              <div
                style={{
                  fontFamily: "system-ui",
                  fontWeight: 800,
                  fontSize: 20,
                  marginTop: 12,
                }}
              >
                {labels[step % labels.length]}
              </div>
              <div
                style={{
                  height: 5,
                  width: 160,
                  marginTop: 14,
                  borderRadius: 8,
                  background: "#a0c27b",
                }}
              />
            </>
          )}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 32,
          fontFamily: "system-ui",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#cce998",
        }}
      >
        ENTURMA · {String(step + 1).padStart(2, "0")}
      </div>
    </AbsoluteFill>
  );
}
export default function GuidePlayer({ step }: { step: number }) {
  const player = useRef<PlayerRef>(null);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const reduce =
        media.matches ||
        document.documentElement.dataset.reducedMotion === "true";
      setReduced(reduce);
      if (document.hidden || reduce) player.current?.pause();
      else if ((player.current?.getCurrentFrame() ?? 0) < 119)
        void player.current?.play();
    };
    const settings = new MutationObserver(update);
    settings.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion"],
    });
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      settings.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [step]);
  return (
    <div className="guide-film" aria-hidden="true">
      <Player
        key={step}
        ref={player}
        component={GuideComposition}
        inputProps={{ step, reduced }}
        compositionWidth={600}
        compositionHeight={240}
        fps={24}
        durationInFrames={120}
        controls={false}
        clickToPlay={false}
        autoPlay={!reduced}
        style={{ width: "100%" }}
      />
    </div>
  );
}
