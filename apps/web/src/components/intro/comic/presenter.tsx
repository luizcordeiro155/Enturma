import { useContext, type CSSProperties } from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { Quality, PresenterFrame } from "./motion-state";
import { faceAt, performanceAt, PERFORMANCES } from "./presenter-performance";
import { armAt, HAND_ANCHORS } from "./presenter-rig";

type Box = readonly [number, number, number, number];
const BODY: readonly Box[] = [
  [54, 27, 370, 410],
  [452, 13, 432, 427],
  [971, 17, 208, 410],
  [1474, 16, 204, 413],
  [114, 485, 190, 382],
  [586, 478, 198, 389],
];
const HANDS: readonly Box[] = [
  [81, 15, 344, 410],
  [484, 117, 393, 307],
  [1025, 24, 208, 401],
  [1467, 58, 221, 367],
  [103, 502, 248, 347],
  [558, 454, 253, 396],
  [928, 455, 390, 395],
  [1432, 467, 310, 383],
];
function Sprite({
  atlas,
  box,
  x,
  y,
  w,
  h,
  style,
}: {
  atlas: string;
  box: Box;
  x: number;
  y: number;
  w: number;
  h: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        overflow: "hidden",
        ...style,
      }}
    >
      <Img
        src={staticFile(`intro/comic/presenter-${atlas}.webp`)}
        style={{
          position: "absolute",
          maxWidth: "none",
          width: (1774 / box[2]) * w,
          height: (887 / box[3]) * h,
          left: (-box[0] / box[2]) * w,
          top: (-box[1] / box[3]) * h,
        }}
      />
    </div>
  );
}
function HeadLayer({ cell, clip }: { cell: number; clip?: string }) {
  return (
    <Sprite
      atlas="faces"
      box={[
        (cell % 4) * 443.5 + 3,
        Math.floor(cell / 4) * 443.5 + 3,
        437.5,
        437.5,
      ]}
      x={-160}
      y={-231}
      w={250}
      h={250}
      style={{ clipPath: clip }}
    />
  );
}

/** Layered illustrated character evaluated at every 24 fps frame. */
export function Presenter({
  style,
  gray = false,
  scene = 0,
}: {
  style?: CSSProperties;
  gray?: boolean;
  scene?: number;
}) {
  const localFrame = useCurrentFrame();
  const fullFrame = useContext(PresenterFrame);
  const frame = fullFrame ?? localFrame;
  const still = useContext(Quality) === "low";
  const pose = performanceAt(scene, frame, still);
  const face = faceAt(scene, frame, still);
  const acting = PERFORMANCES[scene];
  const arms = [
    {
      side: 0,
      x: 165,
      a: pose.leftShoulder,
      b: pose.leftElbow,
      wrist: pose.leftWrist,
      hand: acting.hands[0],
    },
    {
      side: 1,
      x: 338,
      a: pose.rightShoulder,
      b: pose.rightElbow,
      wrist: pose.rightWrist,
      hand: acting.hands[1],
    },
  ].map((arm) => {
    return {
      ...arm,
      ...armAt(arm.side, arm.a, arm.b, arm.wrist),
    };
  });
  const size = Number(style?.width ?? 250);
  return (
    <div
      data-presenter={scene}
      data-presenter-expression={acting.name}
      data-presenter-frame={Math.floor(frame)}
      data-presenter-joints={JSON.stringify([
        pose.leftShoulder,
        pose.leftElbow,
        pose.rightShoulder,
        pose.rightElbow,
      ])}
      style={{ ...style, overflow: "visible" }}
    >
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          scale: size / 500,
          filter: gray ? "grayscale(1) brightness(.72)" : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: "inset(0 0 49px 0)",
          }}
        >
          {arms.map((arm) => (
            <div
              key={arm.side}
              data-presenter-joint={`shoulder-${arm.side}`}
              style={{
                position: "absolute",
                left: arm.x,
                top: 274,
                rotate: `${arm.a}deg`,
                transformOrigin: "0 0",
              }}
            >
              <Sprite
                atlas="body"
                box={BODY[arm.side ? 3 : 2]}
                x={arm.side ? -16 : -65}
                y={-12}
                w={84}
                h={139}
              />
            </div>
          ))}
          <Sprite
            atlas="body"
            box={BODY[0]}
            x={145}
            y={218}
            w={210}
            h={237}
            style={{
              transformOrigin: "50% 100%",
              scale: `1 ${1 + pose.breath * 0.002}`,
            }}
          />
          {arms.map((arm) => (
            <div
              key={arm.side}
              data-presenter-joint={`elbow-${arm.side}`}
              style={{
                position: "absolute",
                left: arm.ex,
                top: arm.ey,
                rotate: `${arm.a + arm.b}deg`,
                transformOrigin: "0 0",
              }}
            >
              <Sprite
                atlas="body"
                box={BODY[arm.side ? 5 : 4]}
                x={arm.side ? -33 : -43}
                y={-13}
                w={77}
                h={118}
              />
            </div>
          ))}
          {arms.map((arm) => {
            const h = arm.hand === 6 ? 106 : arm.hand === 5 ? 100 : 78;
            const w = (h * HANDS[arm.hand][2]) / HANDS[arm.hand][3];
            return (
              <div
                key={arm.side}
                data-presenter-joint={`wrist-${arm.side}`}
                style={{
                  position: "absolute",
                  left: arm.wx,
                  top: arm.wy,
                  rotate: `${arm.handAngle}deg`,
                  transformOrigin: "0 0",
                }}
              >
                <Sprite
                  atlas="hands"
                  box={HANDS[arm.hand]}
                  x={-w * HAND_ANCHORS[arm.hand]}
                  y={-h * 0.98 + 4}
                  w={w}
                  h={h}
                  style={{
                    scale: arm.side ? "-1 1" : "1 1",
                    transformOrigin: `${HAND_ANCHORS[arm.hand] * 100}% 98%`,
                  }}
                />
              </div>
            );
          })}
          <div
            data-presenter-joint="head"
            style={{
              position: "absolute",
              left: 250,
              top: 255 + pose.lift * 0.4,
              rotate: `${pose.head}deg`,
              transformOrigin: "0 0",
            }}
          >
            <HeadLayer cell={0} />
            <HeadLayer cell={face.eyes} clip="inset(41% 18% 29% 28%)" />
            <HeadLayer cell={face.mouth} clip="inset(66% 30% 15% 40%)" />
          </div>
        </div>
        <div
          data-presenter-ground
          style={{
            position: "absolute",
            left: 48,
            right: 36,
            top: 448,
            height: 34,
            background: "#111723",
            border: "4px solid #000",
            borderTop: `5px solid ${["#ffe600", "#9393af", "#ff00aa", "#00f0ff"][scene % 4]}`,
            borderRadius: "4px 4px 12px 12px",
            boxShadow: "7px 7px 0 #000",
            transform: "skewX(-4deg)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 10,
              width: 70,
              height: 4,
              background: "#ffffff30",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 18,
              top: 8,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: ["#ffe600", "#00f0ff", "#ff00aa"][scene % 3],
            }}
          />
        </div>
      </div>
      <div
        data-presenter-face
        style={{
          position: "absolute",
          left: "26%",
          top: "7%",
          width: "45%",
          height: "43%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
