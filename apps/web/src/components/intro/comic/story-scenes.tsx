import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import {
  Car,
  MessagesSquare,
  Sparkles,
  Monitor,
  Smartphone,
} from "lucide-react";
import {
  Avatar,
  Backdrop,
  Brand,
  Burst,
  C,
  display,
  INKS,
  Label,
  PageTear,
  Panel,
  Particles,
  pop,
  prog,
  Shout,
  useInkTime,
} from "./comic-kit";
import { Presenter } from "./presenter";

const previewFeatures = [
  { Icon: MessagesSquare, label: "SUA TURMA", color: C.magenta },
  { Icon: Sparkles, label: "ESTUDOS + IA", color: C.cyan },
  { Icon: Car, label: "CARONAS", color: C.green },
];

export function HookScene() {
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const { f, raw, still } = useInkTime();
  return (
    <AbsoluteFill
      data-intro-scene="0"
      style={{ background: C.ink, overflow: "hidden" }}
    >
      <Backdrop color={C.yellow} />
      <div
        style={{
          position: "absolute",
          left: portrait ? 120 : width * 0.48,
          top: portrait ? 230 : -50,
          width: portrait ? 500 : height * 1.2,
          height: portrait ? 500 : height * 1.2,
          opacity: 0.8,
          transform: `rotate(${still ? 0 : raw * 0.5}deg)`,
        }}
      >
        <Burst color={C.yellow} frame={f + 24} />
      </div>
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 30 : 48,
          top: portrait ? 30 : 42,
          width: portrait ? width - 60 : width * 0.47,
        }}
      >
        <Brand size={portrait ? 35 : 45} />
        <div
          style={{
            ...display,
            color: C.white,
            fontSize: portrait ? 58 : Math.min(77, width * 0.06),
            marginTop: 27,
            transform: `translateX(${still ? 0 : Math.sin((Math.min(raw, 12) / 12) * Math.PI) * -12}px)`,
          }}
        >
          A VIDA
          <br />
          UNIVERSITÁRIA
          <br />
          <span style={{ color: C.yellow }}>GANHOU</span>
          <br />
          <span style={{ color: C.cyan }}>SUPERPODER.</span>
        </div>
      </div>
      <Presenter
        style={{
          position: "absolute",
          width: portrait ? 410 : height * 0.8,
          height: portrait ? 410 : height * 0.8,
          right: portrait ? 8 : width * 0.025,
          top: portrait ? 325 : 54,
        }}
      />
      <div
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 32 : width * 0.51,
          top: portrait ? 440 : height * 0.64,
          transform: `rotate(-8deg) scale(${0.92 + pop(f + 5) * 0.08})`,
        }}
      >
        <Shout
          text="POW!"
          color={C.yellow}
          size={portrait ? 83 : 85}
          frame={raw + 10}
        />
      </div>
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 30 : 48,
          right: portrait ? 30 : width * 0.53,
          bottom: portrait ? 90 : 83,
          display: "flex",
          gap: 9,
        }}
      >
        {previewFeatures.map(({ Icon, label, color }, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              minWidth: 0,
              border: "3px solid #000",
              boxShadow: `4px 4px ${color}`,
              background: C.ink,
              padding: portrait ? "12px 8px" : "14px 8px",
              color,
              transform: `translateY(${still ? 0 : (1 - pop(f, i * 3)) * 18}px)`,
            }}
          >
            <Icon size={portrait ? 26 : 30} strokeWidth={2.5} />
            <div
              style={{
                fontSize: portrait ? 13 : 14,
                fontWeight: 900,
                marginTop: 8,
                color: C.white,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 30,
          bottom: 25,
          color: C.yellow,
          font: "800 12px Arial",
          letterSpacing: ".2em",
        }}
      >
        SUA FACULDADE. SEU UNIVERSO.
      </div>
      <Particles burstAt={3} />
    </AbsoluteFill>
  );
}

export function LonelyScene() {
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const { f, raw, still } = useInkTime();
  const second = still || raw > 40;
  return (
    <AbsoluteFill data-intro-scene="1" style={{ overflow: "hidden" }}>
      <Backdrop dark color="#9393af" />
      <Presenter
        scene={1}
        gray
        style={{
          position: "absolute",
          width: portrait ? 370 : height * 0.78,
          height: portrait ? 370 : height * 0.78,
          left: portrait ? 20 : undefined,
          right: portrait ? undefined : 0,
          top: portrait ? 220 : 92,
        }}
      />
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 30 : 50,
          top: portrait ? 40 : 62,
          width: portrait ? width - 60 : width * 0.48,
        }}
      >
        <Brand size={26} />
        <div
          style={{
            ...display,
            fontSize: portrait ? 54 : 64,
            color: C.white,
            marginTop: 24,
          }}
        >
          TANTA GENTE.
          <br />
          <span style={{ color: C.magenta }}>CADÊ A TURMA?</span>
        </div>
      </div>
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 30 : 50,
          top: portrait ? 598 : 286,
          width: portrait ? width - 60 : width * 0.44,
          boxSizing: "border-box",
          border: "4px solid #000",
          background: "#d5d2d9",
          color: C.ink,
          padding: portrait ? "17px 20px" : 23,
          boxShadow: "7px 7px #000",
          transform: `rotate(-2deg) scale(${0.97 + pop(f, 7) * 0.03})`,
          fontSize: portrait ? 25 : 31,
          fontWeight: 800,
          lineHeight: 1.2,
        }}
      >
        {second
          ? "Quem tá estudando Cálculo III?"
          : "Sua pergunta ficou sem resposta?"}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 14,
            fontSize: 16,
            color: "#555063",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#777183",
                transform: `translateY(${still ? 0 : Math.sin(raw / 5 - i) * 4}px)`,
              }}
            />
          ))}
          aguardando a turma…
        </div>
      </div>
      <Shout
        text="UHHH…"
        color="#9393af"
        size={portrait ? 45 : 63}
        frame={40}
        style={{
          position: "absolute",
          top: portrait ? 326 : 474,
          left: portrait ? 385 : 65,
        }}
      />
      <PageTear color="#9795ad" />
    </AbsoluteFill>
  );
}

export function ChaosScene() {
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const { f, raw, still } = useInkTime();
  const late = still || raw > 55;
  const ramp = interpolate(f, [0, 20, 55, 82, 110], [0, 20, 27, 80, 160]);
  return (
    <AbsoluteFill data-intro-scene="2" style={{ overflow: "hidden" }}>
      <Backdrop color={C.magenta} dark />
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 34 : 55,
          top: portrait ? 62 : 85,
          right: portrait ? 34 : 55,
        }}
      >
        <div
          style={{ ...display, fontSize: portrait ? 48 : 62, color: C.white }}
        >
          ALGUÉM VAI
          <br />
          <span style={{ color: C.magenta }}>PRA AULA AMANHÃ?</span>
        </div>
      </div>
      <div
        style={{
          ...display,
          fontSize: portrait ? 310 : 380,
          color: C.magenta,
          position: "absolute",
          left: portrait ? 65 : width * 0.5,
          top: portrait ? 230 : 100,
          transform: `rotate(${Math.sin(f * 2) * 2}deg)`,
          opacity: late ? 0.15 : 1,
        }}
      >
        ???
      </div>
      <svg
        viewBox="0 0 900 600"
        style={{
          position: "absolute",
          left: portrait ? 20 : width * 0.3,
          top: portrait ? 400 : 170,
          width: portrait ? width - 40 : width * 0.62,
          height: portrait ? height * 0.36 : height * 0.69,
        }}
      >
        <g transform={`translate(300 230) rotate(${ramp / 8})`}>
          <circle r="154" fill="#dad6e5" stroke="#000" strokeWidth="10" />
          <circle r="129" fill="none" stroke="#838095" strokeWidth="3" />
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d="M0-105V-122"
              stroke="#242031"
              strokeWidth="8"
              transform={`rotate(${i * 30})`}
            />
          ))}
          <g transform={`rotate(${ramp * 7})`}>
            <path
              d="M0 18V-110"
              stroke="#000"
              strokeWidth="11"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M0 0L64 45"
            stroke={C.magenta}
            strokeWidth="13"
            strokeLinecap="round"
          />
        </g>
        {[0, 1, 2, 3].map((i) => (
          <g
            key={i}
            transform={`translate(${455 + i * 15} ${180 + i * 62 + (late ? Math.min(160, ramp) * (i + 1) * 0.18 : 0)}) rotate(${late ? (ramp - 40) * (i - 1) * 0.1 : -5})`}
          >
            <rect
              width="280"
              height="56"
              rx="5"
              fill={INKS[i]}
              stroke="#000"
              strokeWidth="6"
            />
            <path
              d="M20 12H259M20 23H259M20 34H259"
              stroke="#ffffff88"
              strokeWidth="3"
            />
          </g>
        ))}
      </svg>
      <Presenter
        scene={2}
        style={{
          position: "absolute",
          width: portrait ? 255 : 260,
          height: portrait ? 255 : 260,
          left: portrait ? 315 : 52,
          top: portrait ? 220 : 278,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 ${prog(f, 65, 25) * 65}px ${C.magenta}88`,
          pointerEvents: "none",
        }}
      />
      <PageTear color={C.magenta} />
    </AbsoluteFill>
  );
}

export function TurnScene() {
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const { f, raw, still } = useInkTime();
  return (
    <AbsoluteFill data-intro-scene="3" style={{ overflow: "hidden" }}>
      <Backdrop color={C.magenta} />
      <div
        style={{
          position: "absolute",
          inset: "-40%",
          background: `conic-gradient(from ${still ? 15 : f * 2}deg,${C.cyan},${C.violet},${C.magenta},${C.yellow},${C.cyan})`,
          opacity: 0.4,
          transform: `scale(${0.6 + prog(f, 0, 12) * 0.4})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse,transparent 15%,#0a0a0fbb 70%)",
        }}
      />
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 30 : 50,
          top: portrait ? 40 : 73,
          width: portrait ? width - 60 : width * 0.48,
        }}
      >
        <Shout
          text="BAM!"
          frame={f + 10}
          size={portrait ? 88 : 110}
          color={C.yellow}
        />
        <div
          style={{
            ...display,
            fontSize: portrait ? 46 : 60,
            color: C.white,
            marginTop: 22,
          }}
        >
          SUA FACULDADE.
          <br />
          <span style={{ color: C.cyan }}>TODA CONECTADA.</span>
        </div>
      </div>
      <Presenter
        scene={3}
        style={{
          position: "absolute",
          width: portrait ? 410 : height * 0.85,
          height: portrait ? 410 : height * 0.85,
          right: portrait ? 15 : 22,
          top: portrait ? 280 : 60,
          transform: `translateY(${(1 - pop(raw, 2)) * 25}px)`,
        }}
      />
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 35 : 55,
          top: portrait ? 690 : 370,
          width: portrait ? width - 70 : width * 0.43,
          boxSizing: "border-box",
          background: C.ink,
          padding: portrait ? "16px 20px" : 22,
          border: `4px solid ${C.yellow}`,
          boxShadow: `7px 7px ${C.magenta}`,
          transform: `rotate(-2deg) scale(${0.95 + pop(f, 15) * 0.05})`,
        }}
      >
        <Brand size={portrait ? 59 : 67} />
      </div>
      <Particles color={C.magenta} burstAt={4} />
      <PageTear color={C.cyan} />
    </AbsoluteFill>
  );
}

export function ProofScene() {
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const { f } = useInkTime();
  const tiles = [
    { x: 0, y: 0, w: 530, h: 292, c: C.violet, t: "A DÚVIDA VIRA CONVERSA" },
    { x: 550, y: 0, w: 350, h: 292, c: C.green, t: "O CAMINHO CONECTA" },
    { x: 0, y: 312, w: 370, h: 250, c: C.yellow, t: "30 DIAS DE EVOLUÇÃO" },
    { x: 390, y: 312, w: 510, h: 250, c: C.magenta, t: "IDEIAS GANHAM VIDA" },
  ];
  return (
    <AbsoluteFill data-intro-scene="13" style={{ overflow: "hidden" }}>
      <Backdrop color={C.magenta} />
      <Presenter
        scene={13}
        style={{
          position: "absolute",
          width: portrait ? 160 : 205,
          height: portrait ? 160 : 205,
          left: portrait ? width - 187 : 20,
          top: portrait ? 0 : 175,
        }}
      />
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 30 : 45,
          top: portrait ? 45 : 35,
        }}
      >
        <Brand size={portrait ? 29 : 32} />
      </div>
      <svg
        viewBox="0 0 900 562"
        style={{
          position: "absolute",
          left: portrait ? 22 : width * 0.22,
          top: portrait ? 155 : 70,
          width: portrait ? width - 44 : width * 0.67,
          height: portrait ? height * 0.53 : height * 0.73,
          overflow: "visible",
        }}
      >
        {tiles.map((tile, i) => (
          <g
            key={tile.t}
            transform={`translate(${tile.x + (1 - pop(f, i * 4)) * (i % 2 ? 500 : -500)} ${tile.y + (1 - pop(f, i * 4)) * 70})`}
          >
            <Panel w={tile.w} h={tile.h} fill={tile.c} rotate={i % 2 ? 1 : -1}>
              <Label x={18} y={38} size={i === 0 ? 22 : 19} color="#000">
                {tile.t}
              </Label>
              {i < 2 ? (
                <g>
                  {[0, 1, 2].map((j) => (
                    <Avatar
                      key={j}
                      x={25 + (j * (tile.w - 65)) / 3}
                      y={73}
                      size={i ? 75 : 118}
                      color={INKS[(j + 3) % 6]}
                      index={j}
                    />
                  ))}
                  <Label
                    x={tile.w / 2}
                    y={tile.h - 30}
                    size={25}
                    color="#000"
                    anchor="middle"
                  >
                    {i ? "CHEGAMOS JUNTOS!" : "UMA TURMA QUE SOMA"}
                  </Label>
                </g>
              ) : (
                <>
                  <Label
                    x={tile.w / 2}
                    y={151}
                    size={i === 2 ? 102 : 87}
                    color="#000"
                    anchor="middle"
                  >
                    {i === 2 ? "30" : "↑ 500+"}
                  </Label>
                  <Label
                    x={tile.w / 2}
                    y={207}
                    size={22}
                    color="#000"
                    anchor="middle"
                  >
                    {i === 2 ? "SEQUÊNCIA DE ESTUDO" : "A CONVERSA CONTINUA"}
                  </Label>
                </>
              )}
            </Panel>
          </g>
        ))}
      </svg>
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          ...display,
          position: "absolute",
          left: portrait ? 30 : 48,
          right: portrait ? 30 : 48,
          bottom: portrait ? 83 : 43,
          fontSize: portrait ? 48 : 55,
          color: C.white,
          transform: `scale(${pop(f, 40)})`,
          textAlign: portrait ? "left" : "center",
        }}
      >
        Não é só estudar.
        <br />
        <span style={{ color: C.yellow }}>É a vida inteira.</span>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 25,
          right: 30,
          fontSize: 12,
          color: "#ddd",
          fontFamily: "Arial",
        }}
      >
        Cenas ilustrativas do universo Enturma
      </div>
      <PageTear color={C.violet} />
    </AbsoluteFill>
  );
}

export function BuildupScene() {
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const { f, raw, still } = useInkTime();
  const shrink = 1 - prog(f, 0, 30) * 0.75;
  return (
    <AbsoluteFill data-intro-scene="14" style={{ overflow: "hidden" }}>
      <Backdrop color={C.cyan} />
      <Presenter
        scene={14}
        style={{
          position: "absolute",
          width: portrait ? 220 : 240,
          height: portrait ? 220 : 240,
          left: portrait ? (width - 220) / 2 : 65,
          top: portrait ? 55 : 70,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: portrait ? 340 : 420,
            height: portrait ? 340 : 420,
            transform: `scale(${still ? 1 : shrink}) rotate(${still ? 0 : raw * 0.6}deg)`,
            filter:
              !still && raw < 18
                ? `blur(${(1 - prog(raw, 0, 18)) * 3}px)`
                : undefined,
          }}
        >
          {INKS.slice(0, 4).map((c, i) => (
            <div
              key={c}
              style={{
                position: "absolute",
                width: "47%",
                height: "47%",
                left: i % 2 ? "53%" : 0,
                top: i < 2 ? 0 : "53%",
                background: c,
                border: "5px solid #000",
                boxShadow: `0 0 35px ${c}55`,
              }}
            />
          ))}
        </div>
      </div>
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          ...display,
          color: C.white,
          fontSize: portrait ? 56 : 84,
          position: "absolute",
          left: 40,
          right: 40,
          bottom: portrait ? 120 : 75,
          textAlign: "center",
          opacity: prog(f, 12, 14),
        }}
      >
        SUA PRÓXIMA
        <br />
        <span style={{ color: C.cyan }}>CONEXÃO COMEÇA AQUI.</span>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `${still ? 4 : 3 + Math.sin(f) * 1}px solid ${C.magenta}`,
          opacity: prog(f, 40, 20),
        }}
      />
    </AbsoluteFill>
  );
}

export function CtaScene() {
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const { f, raw, still } = useInkTime();
  const final = raw > 124 && !still;
  return (
    <AbsoluteFill data-intro-scene="15" style={{ overflow: "hidden" }}>
      <Backdrop color={C.yellow} />
      <div
        style={{
          position: "absolute",
          left: portrait ? "-30%" : "3%",
          top: "-50%",
          width: portrait ? width * 1.6 : width * 0.9,
          height: height * 1.7,
          opacity: Math.max(0.16, 1 - prog(f, 6, 22) * 0.82),
        }}
      >
        <Burst color={C.magenta} frame={f} />
      </div>
      <Presenter
        scene={15}
        style={{
          position: "absolute",
          width: portrait ? 180 : 240,
          height: portrait ? 180 : 240,
          left: portrait ? 0 : width * 0.4,
          top: portrait ? 427 : height - 290,
        }}
      />
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 35 : 55,
          right: portrait ? 35 : 55,
          top: portrait ? 62 : 58,
          display: "flex",
          flexDirection: "column",
          alignItems: portrait ? "center" : "flex-start",
          transform: `scale(${pop(f, 4)})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            ...display,
            fontSize: portrait ? 43 : 42,
            color: C.yellow,
            marginBottom: 12,
          }}
        >
          BORA SE ENTURMAR?
        </div>
        <Brand size={portrait ? 80 : 112} />
        <div
          style={{
            fontSize: portrait ? 25 : 28,
            lineHeight: 1.25,
            color: C.white,
            maxWidth: portrait ? 470 : 580,
            fontWeight: 750,
            marginTop: 22,
            textAlign: portrait ? "center" : "left",
          }}
        >
          Fique por dentro da sua
          <br />
          faculdade conosco.
        </div>
      </div>
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? (width - 245) / 2 : width * 0.67,
          top: portrait ? 353 : 78,
          width: portrait ? 245 : 255,
          transform: `rotate(2deg) scale(${pop(f, 24)})`,
          background: "#fff",
          padding: 13,
          border: "6px solid #000",
          boxShadow: `11px 11px ${C.yellow}`,
          boxSizing: "border-box",
        }}
      >
        <Img
          src={staticFile("intro/comic/download-qr.svg")}
          style={{ width: "100%", display: "block" }}
        />
        <div
          style={{
            fontFamily: '"Comic Archivo",Arial',
            fontSize: 18,
            textAlign: "center",
            color: "#000",
            marginTop: 6,
          }}
        >
          ESCANEIE E VEM
        </div>
      </div>
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: portrait ? 30 : 56,
          right: portrait ? 30 : 55,
          bottom: portrait ? 108 : 110,
          display: "flex",
          gap: 14,
          justifyContent: portrait ? "center" : "flex-start",
          transform: `translateY(${(1 - pop(f, 36)) * 35}px)`,
          opacity: prog(f, 36, 10),
        }}
      >
        {[
          [Smartphone, "Android"],
          [Monitor, "Windows"],
        ].map(([Icon, label]) => {
          const PlatformIcon = Icon as typeof Monitor;
          return (
            <div
              key={String(label)}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                background: C.white,
                border: "4px solid #000",
                boxShadow: `5px 5px ${C.cyan}`,
                padding: "12px 18px",
                fontSize: portrait ? 22 : 25,
                fontWeight: 800,
                fontFamily: "Arial",
                color: "#000",
              }}
            >
              <PlatformIcon size={28} />
              {String(label)}
            </div>
          );
        })}
      </div>
      <div
        data-intro-safe
        data-presenter-copy
        style={{
          position: "absolute",
          left: 30,
          right: 30,
          bottom: 37,
          textAlign: "center",
          fontFamily: "Arial",
          color: C.white,
          fontSize: portrait ? 18 : 23,
          fontWeight: 700,
        }}
      >
        enturma-flax.vercel.app <span style={{ color: C.yellow }}>· 2026</span>
      </div>
      <Particles color={C.yellow} burstAt={2} />
      <PageTear color={C.yellow} />
      {final && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(ellipse,transparent 50%,${C.ink}44)`,
            opacity: prog(raw, 124, 18),
          }}
        />
      )}
    </AbsoluteFill>
  );
}
