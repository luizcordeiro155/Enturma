import { useContext, type CSSProperties } from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { Quality, PresenterFrame } from "./motion-state";

const acting = [
  ["poses", 0, "Boas-vindas", 1.1, 11],
  ["story", 0, "Dúvida", -0.8, 18],
  ["story", 1, "Preocupação", 1.4, 8],
  ["poses", 2, "Apresentando a solução", -0.9, 13],
  ["story", 2, "Orgulho pela conquista", 1.5, 9],
  ["story", 3, "Curiosidade", -0.7, 16],
  ["social", 0, "Compartilhando novidades", 1.3, 10],
  ["social", 1, "Escutando a turma", -0.6, 15],
  ["social", 2, "Indicando o caminho", 1, 14],
  ["social", 3, "Conversando em chamada", -0.8, 12],
  ["finale", 0, "Comemorando", 1.6, 7],
  ["finale", 1, "Acompanhando a frequência", -0.5, 17],
  ["finale", 2, "Organizando os estudos", 0.6, 19],
  ["poses", 3, "Celebrando as conexões", -1.2, 10],
  ["poses", 1, "Convidando a participar", 0.8, 15],
  ["finale", 3, "Convite final", -1, 13],
] as const;

/** Scene-specific illustrated acting with continuous 24 fps motion. */
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
  const [sheet, pose, expression, amplitude, tempo] = acting[scene];
  const sway = still ? 0 : Math.sin(frame / tempo) * amplitude;
  const breath = still
    ? 0
    : Math.sin(frame / (tempo * 0.8)) * Math.abs(amplitude) * 1.8;
  return (
    <div
      data-presenter={scene}
      data-presenter-expression={expression}
      style={{ ...style, overflow: "visible" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          clipPath: `inset(${pose > 1 ? 1 : 0}% 0 1% ${pose % 2 ? 4 : 0}%)`,
          transformOrigin: "50% 92%",
          transform: `translateY(${breath}px) rotate(${sway}deg) scale(${still ? 1 : 1 + Math.sin(frame / 17) * 0.008})`,
          filter: gray ? "grayscale(1) brightness(.68)" : undefined,
        }}
      >
        <Img
          src={staticFile(`intro/comic/presenter-${sheet}.webp`)}
          style={{
            position: "absolute",
            width: "200%",
            height: "200%",
            maxWidth: "none",
            left: `${-(pose % 2) * 100}%`,
            top: `${-Math.floor(pose / 2) * 100}%`,
          }}
        />
      </div>
      <div
        data-presenter-face
        style={{
          position: "absolute",
          left: "25%",
          top: "6%",
          width: "50%",
          height: "39%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
