import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";

export type StaticPresenterAtlas = "poses" | "story" | "social" | "finale";

export function StaticPresenter({
  atlas,
  cell = 0,
  style,
  gray = false,
}: {
  atlas: StaticPresenterAtlas;
  cell?: number;
  style?: CSSProperties;
  gray?: boolean;
}) {
  const safeCell = Math.max(0, Math.min(3, Math.floor(cell)));
  const column = safeCell % 2;
  const row = Math.floor(safeCell / 2);

  return (
    <div
      data-static-presenter={atlas}
      data-static-presenter-cell={safeCell}
      style={{
        ...style,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Img
        src={staticFile(`intro/comic/presenter-${atlas}.webp`)}
        style={{
          position: "absolute",
          width: "200%",
          height: "200%",
          maxWidth: "none",
          left: `-${column * 100}%`,
          top: `-${row * 100}%`,
          filter: gray ? "grayscale(1) brightness(.76)" : undefined,
        }}
      />
    </div>
  );
}
