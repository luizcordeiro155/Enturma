import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BookOpen, Check, Download, RefreshCw, Sparkles } from "lucide-react";
import { BrandBook } from "./brand-book";

/** Six-second seamless loops. Progress always comes from the native download, never from time. */
export function TransferComposition({
  mode = "download",
  progress,
  reduced = false,
}: {
  mode?: "download" | "update";
  progress?: number;
  reduced?: boolean;
}) {
  const raw = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = reduced ? 0 : raw;
  const phase = (frame / (6 * fps)) * Math.PI * 2;
  const update = mode === "update";
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 30% 40%,#285e45,#102d25 55%,#0b1e1c)",
        overflow: "hidden",
        color: "#e6f6b0",
        perspective: 1100,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          backgroundImage: "radial-gradient(#d9f183 1px,transparent 1px)",
          backgroundSize: "24px 24px",
          translate: `${Math.sin(phase) * 8}px ${Math.cos(phase) * 8}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 35,
          width: 410,
          height: 250,
          borderRadius: "50%",
          border: "1px solid #95be6950",
          transform: `rotateX(62deg) rotateZ(${Math.sin(phase) * 6 - 22}deg)`,
        }}
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 240 + i * 38,
            height: 240 + i * 38,
            right: 75 - i * 19,
            top: 8 - i * 19,
            border: "1px solid #c2e97b",
            opacity: 0.09 + i * 0.02,
            borderRadius: "50%",
            transform: `rotateX(55deg) rotateY(12deg) rotateZ(${frame * 0.35}deg)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: update ? 176 : 75,
          top: 76 + Math.sin(phase) * 5,
          transform: `rotateY(${update ? -15 : 18}deg) rotateZ(-8deg)`,
          filter: "drop-shadow(0 24px 18px #0005)",
        }}
      >
        <BrandBook
          size={190}
          frame={(1 - Math.cos(phase)) * 30}
          color="#dcef83"
        />
      </div>
      {update ? (
        <>
          {[0, 1, 2, 3].map((i) => {
            const angle = phase + (i * Math.PI) / 2;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 278 + Math.cos(angle) * 164,
                  top: 127 + Math.sin(angle) * 62,
                  width: 48,
                  height: 56,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#83c996,#204e3c)",
                  border: "1px solid #bce59580",
                  boxShadow: "0 8px 20px #0003",
                  transform: `rotate(${Math.sin(angle) * 12}deg) scale(${0.8 + Math.sin(angle) * 0.12})`,
                  opacity: 0.75 + Math.sin(angle) * 0.2,
                }}
              >
                <BookOpen size={24} />
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 259,
              top: 43,
              rotate: `${frame * 2}deg`,
              opacity: 0.8,
            }}
          >
            <RefreshCw size={30} strokeWidth={1.5} />
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              left: 345,
              top: 58,
              width: 180,
              height: 122,
              padding: 10,
              border: "2px solid #a7d69a",
              borderRadius: 15,
              background: "linear-gradient(145deg,#285c46,#102d26)",
              transform: "rotateY(-17deg) rotateZ(5deg)",
              boxShadow: "10px 18px 26px #0005",
            }}
          >
            <div
              style={{
                display: "grid",
                placeItems: "center",
                height: "100%",
                borderRadius: 8,
                background: "#102d26",
              }}
            >
              <BookOpen size={51} strokeWidth={1.5} color="#dcef83" />
            </div>
            <div
              style={{
                position: "absolute",
                width: 52,
                height: 27,
                background: "#38694e",
                left: 66,
                top: 123,
                clipPath: "polygon(30% 0,70% 0,90% 100%,10% 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 100,
                height: 7,
                background: "#9ec582",
                left: 42,
                top: 149,
                borderRadius: 6,
              }}
            />
          </div>
          {[0, 1, 2, 3].map((i) => {
            const t = (frame / (6 * fps) + i / 4) % 1;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: interpolate(t, [0, 1], [235, 365]),
                  top: 112 - Math.sin(t * Math.PI) * 51,
                  width: 25,
                  height: 32,
                  borderRadius: 5,
                  background: "#e6f6b0",
                  opacity: Math.sin(t * Math.PI) * 0.9,
                  transform: `rotate(${t * 45 - 20}deg) scale(${0.65 + Math.sin(t * Math.PI) * 0.3})`,
                  boxShadow: "0 4px 12px #0002",
                }}
              />
            );
          })}
        </>
      )}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 70 + i * 108,
            top: 38 + Math.sin(phase + i) * 12 + (i % 2) * 155,
            opacity: 0.25 + Math.sin(phase + i) * 0.15,
            scale: 0.4 + (i % 3) * 0.15,
          }}
        >
          <Sparkles size={22} />
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 32,
          right: 32,
          bottom: 23,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "system-ui,sans-serif",
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 37,
            height: 37,
            background: "#dcef83",
            color: "#163b30",
            borderRadius: 12,
          }}
        >
          {progress === 100 ? (
            <Check size={19} />
          ) : update ? (
            <RefreshCw size={19} />
          ) : (
            <Download size={19} />
          )}
        </span>
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              opacity: 0.65,
              marginBottom: 3,
            }}
          >
            ENTURMA
          </div>
          <strong style={{ fontSize: 18 }}>
            {update
              ? "Seu espaço, sempre evoluindo."
              : "Seu próximo capítulo começa aqui."}
          </strong>
        </div>
        {progress !== undefined && (
          <strong style={{ fontSize: 20, marginLeft: "auto" }}>
            {Math.round(progress)}%
          </strong>
        )}
      </div>
    </AbsoluteFill>
  );
}
