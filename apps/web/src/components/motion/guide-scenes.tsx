"use client";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandBook } from "./brand-book";

const titles = [
  "Cada estudo conta",
  "Organize suas matérias",
  "Encontre sua turma",
  "Aprendam juntos",
  "Uma ideia vira conversa",
  "Fontes viram conhecimento",
  "Colegas por perto",
  "Tudo em tempo real",
  "Seu jeito de estudar",
];
const descriptions = [
  "Pratique • avance • acompanhe",
  "Instituição, período e assuntos",
  "Escolha uma sala e participe",
  "Mensagens, voz e Monitor Enturma",
  "Pergunte, responda e compartilhe",
  "Converse com o Enturma APP",
  "Amizades e conversas privadas",
  "Novidades sem atualizar a página",
  "Tema, conforto e acessibilidade",
];
const green = "#d9f38d",
  mint = "#65d7ae",
  paper = "#eaf8d4",
  line = "#48735f";
function Card({
  x,
  y,
  width = 110,
  height = 60,
  children,
  fill = "#204c3d",
  rotate = 0,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  children?: React.ReactNode;
  fill?: string;
  rotate?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect
        x="3"
        y="8"
        width={width}
        height={height}
        rx="12"
        fill="#00190f66"
      />
      <rect
        width={width}
        height={height}
        rx="12"
        fill={fill}
        stroke="#6eaa8455"
      />
      {children}
    </g>
  );
}
export function GuideComposition({
  step,
  reduced,
}: {
  step: number;
  reduced: boolean;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const phase = (reduced ? 0.28 : frame / durationInFrames) * Math.PI * 2;
  const float = (offset = 0) => Math.sin(phase + offset);
  const progress = (1 - Math.cos(phase)) / 2;
  const s = Math.max(0, Math.min(8, step));
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 25% 15%,#205d43,#0c251c 72%)",
        perspective: 900,
        overflow: "hidden",
        fontFamily: "system-ui",
        color: paper,
      }}
    >
      <svg
        width="600"
        height="270"
        viewBox="0 0 600 270"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id="guide-ink">
            <stop stopColor={green} />
            <stop offset="1" stopColor={mint} />
          </linearGradient>
        </defs>
        <ellipse
          cx="315"
          cy="127"
          rx="258"
          ry="103"
          fill="none"
          stroke="#6dba8120"
          transform={`rotate(${float() * 3} 315 127)`}
        />
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <circle
            key={n}
            cx={50 + n * 93}
            cy={60 + Math.sin(n * 2 + phase) * 15}
            r={2 + (n % 2)}
            fill={mint}
            opacity=".28"
          />
        ))}
        {s === 0 && (
          <g>
            <circle
              cx="340"
              cy="105"
              r="61"
              fill="#204737"
              stroke={line}
              strokeWidth="12"
            />
            <circle
              cx="340"
              cy="105"
              r="61"
              fill="none"
              stroke="url(#guide-ink)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${180 + progress * 185} 384`}
              transform="rotate(-90 340 105)"
            />
            <path
              d="M322 79h36v26q0 19-18 22-18-3-18-22z M322 85h-13v10q0 16 16 16 M358 85h13v10q0 16-16 16 M340 127v13m-15 0h30"
              fill="none"
              stroke={green}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <Card x={438} y={63 + float() * 6} width={112} height={62}>
              <text x="15" y="26" fill={paper} fontSize="12">
                SEU PROGRESSO
              </text>
              <text x="15" y="48" fill={green} fontSize="20" fontWeight="700">
                + {Math.round(20 + progress * 80)} XP
              </text>
            </Card>
            <Card x={421} y={137 - float() * 6} width={130} height={40}>
              <text x="15" y="26" fill={paper} fontSize="13">
                🔥 Sequência ativa
              </text>
            </Card>
          </g>
        )}
        {s === 1 && (
          <g>
            {[0, 1, 2].map((n) => (
              <Card
                key={n}
                x={262 + n * 92}
                y={58 + float(n) * 8}
                width={85}
                height={115}
                rotate={(n - 1) * 5}
              >
                <rect
                  x="12"
                  y="14"
                  width="60"
                  height="10"
                  rx="5"
                  fill={[green, mint, "#a2c4f7"][n]}
                />
                <text x="12" y="52" fill={paper} fontSize="12">
                  {["Cálculo", "História", "Código"][n]}
                </text>
                {[0, 1, 2].map((r) => (
                  <rect
                    key={r}
                    x="12"
                    y={64 + r * 13}
                    width={50 - r * 10}
                    height="4"
                    rx="2"
                    fill={line}
                  />
                ))}
              </Card>
            ))}
            <path
              d="M278 193h247"
              stroke={mint}
              strokeWidth="3"
              strokeDasharray="5 9"
              strokeDashoffset={-float() * 10}
            />
          </g>
        )}
        {s === 2 && (
          <g>
            <Card x={269} y={38 + float() * 4} width={250} height={151}>
              <rect width="250" height="55" rx="12" fill="#448963" />
              <path d="M0 50l80-30 70 19 100-28v44H0" fill="#93bd6b" />
              <text x="20" y="83" fill={paper} fontSize="17" fontWeight="700">
                Turma de Cálculo
              </text>
              <text x="20" y="105" fill="#b3cfbc" fontSize="12">
                Estudando em companhia
              </text>
              {[0, 1, 2, 3].map((n) => (
                <circle
                  key={n}
                  cx={28 + n * 28}
                  cy="130"
                  r="10"
                  fill={[green, mint, "#aeaff5", "#f6bf80"][n]}
                />
              ))}
              <circle cx="211" cy="130" r="5" fill={mint} />
              <text x="222" y="134" fill={paper} fontSize="10">
                ao vivo
              </text>
            </Card>
            <circle
              cx={525 + float() * 8}
              cy={167 + float() * 5}
              r="21"
              fill={green}
            />
            <path
              d="M517 167h16m-7-7 7 7-7 7"
              stroke="#133b2b"
              strokeWidth="3"
              fill="none"
            />
          </g>
        )}
        {s === 3 && (
          <g>
            <Card x={265} y={44 + float() * 4} width={220} height={42}>
              <circle cx="23" cy="21" r="12" fill={mint} />
              <text x="46" y="26" fill={paper} fontSize="13">
                Como resolvemos este passo?
              </text>
            </Card>
            <Card
              x={305}
              y={97 - float() * 4}
              width={240}
              height={42}
              fill="#45673a"
            >
              <text x="15" y="26" fill={paper} fontSize="13">
                Vamos entender juntos. ✦
              </text>
            </Card>
            {Array.from({ length: 25 }, (_, n) => (
              <rect
                key={n}
                x={276 + n * 10}
                y={172 - Math.abs(float(n * 0.7)) * 13}
                width="5"
                height={8 + Math.abs(float(n * 0.7)) * 26}
                rx="3"
                fill={n % 3 ? mint : green}
              />
            ))}
          </g>
        )}
        {s === 4 && (
          <g>
            <Card x={265} y={43 + float() * 5} width={268} height={95}>
              <text x="18" y="27" fill={green} fontSize="12">
                FÓRUM · APRENDER E COMPARTILHAR
              </text>
              <text x="18" y="52" fill={paper} fontSize="17" fontWeight="700">
                E se tentarmos outro caminho?
              </text>
              <rect x="18" y="68" width="175" height="5" rx="3" fill={line} />
            </Card>
            {[0, 1, 2].map((n) => (
              <Card
                key={n}
                x={286 + n * 77}
                y={151 + float(n) * 6}
                width={68}
                height={37}
              >
                <text x="12" y="24" fill={mint} fontSize="13">
                  {["↗ ideia", "♡ apoio", "↩ troca"][n]}
                </text>
              </Card>
            ))}
          </g>
        )}
        {s === 5 && (
          <g>
            {[0, 1, 2].map((n) => (
              <Card
                key={n}
                x={247 + n * 21}
                y={45 + n * 15 + float(n) * 3}
                width={77}
                height={95}
                fill={["#526d49", "#b4d190", paper][n]}
                rotate={n * 5 - 10}
              >
                <text
                  x="12"
                  y="35"
                  fill="#173e2c"
                  fontSize="13"
                  fontWeight="700"
                >
                  {["PDF", "LINK", "NOTAS"][n]}
                </text>
                <path
                  d="M12 49h47m-47 10h40m-40 10h46"
                  stroke="#79966e"
                  strokeWidth="3"
                />
              </Card>
            ))}
            <path
              d="M370 100h40"
              stroke={mint}
              strokeWidth="3"
              strokeDasharray="4 6"
              strokeDashoffset={float() * 14}
            />
            <Card x={419} y={45 - float() * 5} width={145} height={135}>
              <text x="12" y="25" fill={green} fontSize="12" fontWeight="700">
                ENTURMA APP ✦
              </text>
              <text x="12" y="55" fill={paper} fontSize="12">
                Vamos conectar
              </text>
              <text x="12" y="72" fill={paper} fontSize="12">
                essas ideias? [1]
              </text>
              <rect
                x="12"
                y="90"
                width={70 + progress * 40}
                height="5"
                rx="2"
                fill={mint}
              />
              <text x="12" y="120" fill="#adccb6" fontSize="10">
                Pergunte • explore • revise
              </text>
            </Card>
          </g>
        )}
        {s === 6 && (
          <g>
            <path
              d="M410 117 285 66m125 51 115-54m-115 54-109 60m109-60 103 56"
              stroke={line}
              strokeWidth="2"
              strokeDasharray="5 7"
              strokeDashoffset={float() * 12}
            />
            {[
              [285, 66],
              [525, 63],
              [301, 177],
              [513, 173],
              [410, 117],
            ].map(([x, y], n) => (
              <g key={n} transform={`translate(${x} ${y + float(n) * 5})`}>
                <circle
                  r={n === 4 ? 31 : 24}
                  fill={[mint, "#adb1f3", green, "#f3c38e", paper][n]}
                />
                <circle cy="-5" r="7" fill="#28513b" />
                <path d="M-13 14q0-17 13-17t13 17" fill="#28513b" />
                <circle
                  cx="19"
                  cy="17"
                  r="5"
                  fill="#52e7a1"
                  stroke="#143327"
                  strokeWidth="2"
                />
              </g>
            ))}
          </g>
        )}
        {s === 7 && (
          <g>
            <path d="M288 98h240" stroke={line} strokeWidth="2" />
            {[0, 1, 2].map((n) => (
              <g key={n} transform={`translate(${290 + n * 113} 98)`}>
                <circle r="24" fill="#28523f" stroke={mint} />
                <circle
                  r={24 + (1 + float(n)) * 13}
                  fill="none"
                  stroke={mint}
                  opacity={(1 - float(n)) * 0.2}
                />
                <text x="-9" y="6" fill={paper} fontSize="20">
                  {["✓", "↻", "✓"][n]}
                </text>
              </g>
            ))}
            <Card x={302} y={149 + float() * 3} width={215} height={38}>
              <circle cx="18" cy="19" r="4" fill={mint} />
              <text x="32" y="24" fill={paper} fontSize="12">
                Nova mensagem · agora mesmo
              </text>
            </Card>
          </g>
        )}
        {s === 8 && (
          <g>
            <Card
              x={259}
              y={42 + float() * 4}
              width={288}
              height={150}
              fill="#173e31"
            >
              <rect
                x="18"
                y="16"
                width="252"
                height="28"
                rx="14"
                fill="#31513c"
              />
              <rect
                x={20 + progress * 168}
                y="18"
                width="80"
                height="24"
                rx="12"
                fill={green}
              />
              {["☀", "☾", "▣"].map((text, n) => (
                <text
                  key={n}
                  x={52 + n * 84}
                  y="37"
                  fill={n === Math.round(progress * 2) ? "#183c2d" : paper}
                  fontSize="19"
                >
                  {text}
                </text>
              ))}
              <text x="20" y="76" fill={paper} fontSize="14">
                Conforto para aprender
              </text>
              {[0, 1, 2].map((n) => (
                <g key={n}>
                  <rect
                    x="20"
                    y={89 + n * 17}
                    width={150 - n * 26}
                    height="5"
                    rx="3"
                    fill={line}
                  />
                  <circle
                    cx={225 + float(n) * 10}
                    cy={92 + n * 17}
                    r="5"
                    fill={mint}
                  />
                </g>
              ))}
            </Card>
          </g>
        )}
      </svg>
      <div
        style={{
          position: "absolute",
          top: 40 + float() * 5,
          left: 36,
          transform: `rotateY(${-12 + float() * 6}deg) rotateZ(${-6 + float(1) * 3}deg)`,
          filter: "drop-shadow(0 18px 14px #001a1580)",
        }}
      >
        <BrandBook size={156} frame={reduced ? 20 : progress * 52} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 15,
          left: 28,
          right: 22,
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 750 }}>{titles[s]}</div>
          <div style={{ color: "#b4d4c0", fontSize: 11, marginTop: 3 }}>
            {descriptions[s]}
          </div>
        </div>
        <span style={{ fontSize: 10, letterSpacing: 2, color: green }}>
          ENTURMA · 0{s + 1}
        </span>
      </div>
    </AbsoluteFill>
  );
}
