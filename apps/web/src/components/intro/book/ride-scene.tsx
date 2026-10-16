import { Car, Check, MapPin, MessageCircle } from "lucide-react";
import {
  Chapter,
  Confetti,
  INK,
  Label,
  NEON,
  Paper,
  Pop,
  progress,
  useCinema,
} from "./cinema-kit";

function routePoint(t: number) {
  const points =
    t < 0.5
      ? [
          [75, 338],
          [75, 170],
          [330, 350],
          [340, 210],
        ]
      : [
          [340, 210],
          [350, 70],
          [605, 280],
          [612, 72],
        ];
  const p = t < 0.5 ? t * 2 : (t - 0.5) * 2,
    q = 1 - p;
  return [0, 1].map(
    (axis) =>
      q ** 3 * points[0][axis] +
      3 * q * q * p * points[1][axis] +
      3 * q * p * p * points[2][axis] +
      p ** 3 * points[3][axis],
  );
}
export function RideChapter() {
  const { frame } = useCinema();
  const travel = progress(frame, 20, 78);
  const point = routePoint(travel);
  const ahead = routePoint(Math.min(1, travel + 0.01));
  const rotation =
    travel === 1
      ? -90
      : (Math.atan2(ahead[1] - point[1], ahead[0] - point[0]) * 180) / Math.PI;
  return (
    <Chapter
      number={5}
      title={"O CAMINHO\nCONECTA."}
      subtitle="Combine a carona. Encontre sua turma."
      color={NEON.green}
      word="VROOOM!"
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 10,
          width: 700,
          height: 425,
          transform: "perspective(1200px) rotateX(13deg) rotateZ(-4deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <svg
          viewBox="0 0 700 425"
          width="700"
          height="425"
          style={{
            border: `3px solid ${NEON.green}`,
            borderRadius: 26,
            background: "#112c2b",
            boxShadow: "0 12px 0 #081719,0 35px 45px #0006",
          }}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <g
              key={i}
              transform={`translate(${25 + (i % 6) * 115},${15 + Math.floor(i / 6) * 102})`}
            >
              <path
                d="M0 14 L20 0 L86 0 L86 65 L65 82 L0 82Z"
                fill={i % 4 === 0 ? "#1d5b3b" : "#244748"}
                stroke="#38605c"
                strokeWidth="2"
              />
              <path
                d="M12 25 L37 8 L73 8 L73 55 L49 72 L12 72Z"
                fill={i % 4 === 0 ? "#36845c" : "#3d6464"}
              />
            </g>
          ))}
          <path
            d="M75 338 C75 170 330 350 340 210 C350 70 605 280 612 72"
            fill="none"
            stroke={INK}
            strokeWidth="23"
            strokeLinecap="round"
          />
          <path
            d="M75 338 C75 170 330 350 340 210 C350 70 605 280 612 72"
            fill="none"
            stroke={NEON.green}
            strokeWidth="9"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - travel}
            strokeLinecap="round"
          />
          <circle
            cx="75"
            cy="338"
            r="11"
            fill={NEON.cyan}
            stroke={INK}
            strokeWidth="5"
          />
          <circle
            cx="612"
            cy="72"
            r={18 + Math.sin(frame / 5) * 3}
            fill="none"
            stroke={NEON.green}
            strokeWidth="3"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            left: point[0] - 25,
            top: point[1] - 20,
            transform: `rotate(${rotation}deg) translateZ(18px)`,
            background: NEON.lime,
            padding: "5px 8px",
            borderRadius: 12,
            border: `3px solid ${INK}`,
            boxShadow: "0 8px 10px #0007",
          }}
        >
          <Car size={32} color={INK} />
        </div>
        <div
          style={{
            position: "absolute",
            right: 38,
            top: 17,
            transform: "translateZ(25px)",
          }}
        >
          <MapPin size={46} color={NEON.lime} fill={INK} />
        </div>
      </div>
      <Pop delay={5} style={{ position: "absolute", left: 18, top: -4 }}>
        <Label color={NEON.cyan}>Indo para a faculdade</Label>
      </Pop>
      <Pop
        delay={75}
        style={{ position: "absolute", left: 85, top: 313, width: 536 }}
      >
        <Paper
          color={NEON.green}
          style={{
            padding: 18,
            display: "flex",
            gap: 18,
            alignItems: "center",
          }}
        >
          <Check size={39} color={NEON.green} />
          <div>
            <strong style={{ fontSize: 25 }}>Carona combinada!</strong>
            <div
              style={{
                fontSize: 18,
                marginTop: 7,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <MessageCircle size={18} /> Acerte o encontro pelo chat.
            </div>
          </div>
        </Paper>
      </Pop>
      <Confetti at={96} color={NEON.green} />
    </Chapter>
  );
}
