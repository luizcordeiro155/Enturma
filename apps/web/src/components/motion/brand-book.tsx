import type { CSSProperties, ReactNode } from "react";

/** A real layered book: cover, paper stack, spine and independently turning leaves. */
export function BrandBook({
  frame = 0,
  size = 240,
  color = "#d8ef79",
  children,
  style,
}: {
  frame?: number;
  size?: number;
  color?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const cycle = (frame % 72) / 72;
  return (
    <div
      data-brand-book
      style={{
        width: size,
        height: size * 0.7,
        position: "relative",
        perspective: size * 5,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: `${size * 0.035}px`,
          background: color,
          boxShadow: `0 ${size * 0.04}px 0 #123d32,0 ${size * 0.08}px ${size * 0.14}px #0005`,
          transform: "rotateX(16deg)",
          border: `${Math.max(2, size * 0.015)}px solid #123d32`,
        }}
      />
      {[0, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            left: side ? "50%" : "4%",
            top: "6%",
            width: "46%",
            height: "85%",
            background: side
              ? "linear-gradient(90deg,#c8d3b7,#f7f9eb 16%)"
              : "linear-gradient(90deg,#f7f9eb 85%,#c8d3b7)",
            borderRadius: side ? "2px 8px 10px 2px" : "8px 2px 2px 10px",
            transformOrigin: side ? "left center" : "right center",
            transform: `rotateY(${side ? -10 : 10}deg)`,
            boxShadow: "0 3px 0 #c3cbb6,0 6px 0 #e2e8d5",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "16% 12%",
              background: `repeating-linear-gradient(0deg,transparent 0 ${size * 0.035}px,#183f3620 ${size * 0.035}px ${size * 0.043}px)`,
            }}
          />
          {side === 1 && children}
        </div>
      ))}
      {[0, 1, 2].map((i) => {
        const turn = Math.max(0, Math.min(1, (cycle - i * 0.11) * 1.7));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "6%",
              width: "45%",
              height: "84%",
              background: `linear-gradient(90deg,#cfdaba,${i % 2 ? "#ecf4d1" : "#f8faeb"} 20%)`,
              borderRadius: "2px 8px 8px 2px",
              borderBottom: "2px solid #aab99a",
              transformOrigin: "left center",
              transform: `rotateY(${-turn * 176}deg) translateZ(${5 + i * 2}px)`,
              backfaceVisibility: "visible",
              opacity: turn >= 1 ? 0 : 1,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "14%",
                top: "15%",
                width: "65%",
                height: "10%",
                background: color,
                borderRadius: 2,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "36% 16% 20%",
                background: `repeating-linear-gradient(0deg,transparent 0 ${size * 0.03}px,#183f3625 ${size * 0.03}px ${size * 0.04}px)`,
              }}
            />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: "49%",
          top: "5%",
          height: "88%",
          width: "2%",
          borderRadius: 5,
          background: "#315e45",
          boxShadow: "0 0 8px #0004",
        }}
      />
    </div>
  );
}
