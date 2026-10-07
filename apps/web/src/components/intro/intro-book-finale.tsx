import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BookOpen,
  Car,
  Check,
  FileText,
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import {
  INTRO_BOOK_PAGES,
  INTRO_SCENE_FRAMES,
  type IntroProps,
} from "./intro-model";

const colors = ["#b4d76f", "#8adbc6", "#98c8ec", "#d4b8ef"];
const labels = [
  "Feed da faculdade",
  "Salas de estudo",
  "Caronas",
  "Cadernos com IA",
];
const icons = [MessageCircle, Users, Car, Sparkles];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const ramp = (f: number, start: number, duration = 30) =>
  interpolate(f, [start, start + duration], [0, 1], { ...clamp, easing: ease });
const rise = (f: number, delay = 0) =>
  spring({
    frame: Math.max(0, f - delay),
    fps: 60,
    config: { damping: 19, stiffness: 115, mass: 0.8 },
  });

function Mockup({
  page,
  frame,
  portrait,
}: {
  page: number;
  frame: number;
  portrait: boolean;
}) {
  const Icon = icons[page];
  const route = ramp(frame, 24, 90);
  const t = route < 0.5 ? route * 2 : (route - 0.5) * 2;
  const cubic = (a: number, b: number, c: number, d: number) =>
    (1 - t) ** 3 * a +
    3 * (1 - t) ** 2 * t * b +
    3 * (1 - t) * t * t * c +
    t ** 3 * d;
  const carX =
    route < 0.5 ? cubic(70, 140, 147, 175) : cubic(175, 203, 263, 393);
  const carY = route < 0.5 ? cubic(204, 202, 170, 130) : cubic(130, 90, 55, 57);
  const card = {
    borderRadius: 16,
    background: "#fff",
    padding: portrait ? 16 : 18,
    border: "1px solid #dae1d4",
  };
  const item = (delay: number) => ({
    opacity: ramp(frame, delay, 15),
    transform: `translateY(${(1 - rise(frame, delay)) * 24}px)`,
  });
  return (
    <div
      style={{
        height: "100%",
        padding: portrait ? 20 : 24,
        color: "#173b31",
        fontSize: portrait ? 21 : 22,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          fontWeight: 750,
          fontSize: portrait ? 24 : 27,
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 46,
            height: 46,
            borderRadius: 14,
            background: colors[page],
            flexShrink: 0,
          }}
        >
          <Icon size={26} />
        </span>
        <span>{labels[page]}</span>
      </div>
      {page === 0 && (
        <>
          <div style={{ ...card, ...item(10) }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 650,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#d9ead1",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Users size={19} />
              </span>
              Sua comunidade
            </div>
            <strong style={{ display: "block", fontSize: 25, lineHeight: 1.2 }}>
              O campus tem assunto.
            </strong>
            <p
              style={{
                margin: "9px 0 15px",
                color: "#53695d",
                lineHeight: 1.35,
              }}
            >
              Ideias, descobertas e boas conversas.
            </p>
            <div
              style={{
                height: portrait ? 65 : 56,
                borderRadius: 10,
                background: "#e7efcd",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: i * 44 - 15,
                    bottom: -8,
                    height: 25 + (i % 3) * 20,
                    width: 28,
                    background: i % 2 ? "#87af83" : "#b2ce85",
                    borderRadius: "14px 14px 0 0",
                    transform: `translateY(${(1 - rise(frame, 20 + i * 3)) * 65}px)`,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 14,
                color: "#52694e",
              }}
            >
              <Heart
                size={23}
                fill={frame > 55 ? "#e9958b" : "none"}
                style={{
                  transform: `scale(${1 + Math.sin(Math.min(1, Math.max(0, (frame - 55) / 22)) * Math.PI) * 0.3})`,
                }}
              />
              <MessageCircle size={23} />
              <Send size={23} style={{ marginLeft: "auto" }} />
            </div>
          </div>
          <div
            style={{
              ...card,
              ...item(62),
              marginTop: 13,
              fontSize: 19,
              background: "#eef5e2",
              display: "flex",
              gap: 9,
            }}
          >
            <MessageCircle size={22} /> Sua ideia pode começar uma conversa.
          </div>
        </>
      )}
      {page === 1 && (
        <>
          <div style={{ ...card, ...item(8), background: "#e3f3ec" }}>
            <span style={{ color: "#337362", fontSize: 17, fontWeight: 700 }}>
              APRENDA EM COMPANHIA
            </span>
            <h3 style={{ margin: "8px 0 14px", fontSize: 26 }}>
              Sua sala de estudo
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: ["#bddfc9", "#d7cfe8", "#e7d6ba", "#bbd5e6"][i],
                    display: "grid",
                    placeItems: "center",
                    ...item(15 + i * 7),
                  }}
                >
                  <Users size={22} />
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              ...card,
              ...item(40),
              marginTop: 14,
              borderRadius: "16px 16px 16px 4px",
              fontSize: 20,
            }}
          >
            Vamos resolver essa dúvida juntos?
          </div>
          <div
            style={{
              ...card,
              ...item(66),
              marginTop: 10,
              background: "#d4eed9",
              marginLeft: 20,
              borderRadius: "16px 16px 4px 16px",
              fontSize: 20,
            }}
          >
            Bora! Compartilhe o material.
          </div>
          <div
            style={{
              ...item(92),
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 16,
              color: "#4b7463",
              fontSize: 18,
            }}
          >
            <FileText size={23} /> Chat · chamada · materiais
          </div>
        </>
      )}
      {page === 2 && (
        <>
          <div
            style={{
              ...card,
              ...item(8),
              padding: 0,
              position: "relative",
              overflow: "hidden",
              height: portrait ? 245 : 195,
              background: "#e1eee6",
            }}
          >
            <svg
              viewBox="0 0 480 265"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern
                  id="finale-map"
                  width="85"
                  height="66"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    x="8"
                    y="8"
                    width="66"
                    height="46"
                    rx="9"
                    fill="#cdddce"
                  />
                  <path d="M0 62H85M80 0V66" stroke="#f9fbf5" strokeWidth="8" />
                </pattern>
              </defs>
              <rect width="480" height="265" fill="url(#finale-map)" />
              <path
                d="M70 204C140 202 147 170 175 130S263 55 393 57"
                fill="none"
                stroke="#426eaa"
                strokeWidth="9"
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - ramp(frame, 22, 90)}
              />
              <circle
                cx="70"
                cy="204"
                r="12"
                fill="#153f35"
                stroke="white"
                strokeWidth="5"
              />
              <circle
                cx="393"
                cy="57"
                r="16"
                fill="#deef80"
                stroke="#153f35"
                strokeWidth="4"
              />
              <g transform={`translate(${carX} ${carY})`}>
                <circle r="23" fill="#173d35" />
                <path
                  d="M-12 5V-3L-7-10H7L12-3V5ZM-12-2H12M-8 7V10M8 7V10"
                  stroke="#f3f6ed"
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            </svg>
          </div>
          <div
            style={{
              ...card,
              ...item(60),
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 13,
            }}
          >
            <Car size={32} />
            <div>
              <strong>Mesmo caminho.</strong>
              <p style={{ margin: "5px 0 0", fontSize: 19, color: "#53695d" }}>
                Boa companhia.
              </p>
            </div>
            <span
              style={{
                marginLeft: "auto",
                borderRadius: "50%",
                background: colors[2],
                padding: 7,
                display: "flex",
              }}
            >
              <Check size={24} />
            </span>
          </div>
          <div
            style={{
              ...item(100),
              color: "#567362",
              fontSize: 18,
              marginTop: 14,
            }}
          >
            Combine os detalhes pelo chat.
          </div>
        </>
      )}
      {page === 3 && (
        <>
          <div
            style={{
              ...card,
              ...item(8),
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 19,
            }}
          >
            <FileText size={27} color="#795b9d" />
            <span>Seus materiais de estudo</span>
            <Check
              size={22}
              style={{ marginLeft: "auto", opacity: ramp(frame, 34, 12) }}
            />
          </div>
          <div
            style={{
              ...card,
              ...item(36),
              marginTop: 14,
              background: "#f0eaf8",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#684f80",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              <Sparkles size={24} /> Entenda, passo a passo.
            </div>
            {[
              "Conceitos explicados",
              "Exemplos para praticar",
              "Revisão do assunto",
            ].map((text, i) => (
              <div
                key={text}
                style={{
                  ...item(47 + i * 22),
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  fontSize: 20,
                  marginBottom: 13,
                }}
              >
                <span
                  style={{
                    width: 27,
                    height: 27,
                    borderRadius: "50%",
                    background: "#dfd1ef",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    fontSize: 17,
                  }}
                >
                  {i + 1}
                </span>
                {text}
              </div>
            ))}
            <div
              style={{
                height: 5,
                background: "#ddd1e8",
                borderRadius: 5,
                overflow: "hidden",
                marginTop: 18,
              }}
            >
              <div
                style={{
                  background: "#8b6fac",
                  width: `${ramp(frame, 45, 120) * 100}%`,
                  height: "100%",
                }}
              />
            </div>
          </div>
          <div
            style={{
              ...item(110),
              fontSize: 18,
              color: "#665b72",
              marginTop: 14,
            }}
          >
            Documentos, links e imagens.
          </div>
        </>
      )}
    </div>
  );
}

export function BookShowcaseScene({ quality }: IntroProps) {
  const raw = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const start = INTRO_SCENE_FRAMES[8];
  const page = Math.max(
    0,
    INTRO_BOOK_PAGES.findIndex(
      (cue, i) =>
        raw >= cue.fromFrame - start &&
        (i === 3 || raw < INTRO_BOOK_PAGES[i + 1].fromFrame - start),
    ),
  );
  const local = raw - (INTRO_BOOK_PAGES[page].fromFrame - start);
  const still = quality === "low";
  const f = still ? 180 : local;
  const turn = still || page === 0 ? 1 : ramp(local, 0, 40);
  const open = still ? 1 : rise(raw, 5);
  const bookWidth = portrait ? 536 : Math.min(950, width - 130);
  const bookHeight = portrait ? 490 : Math.min(420, height - 215);
  const spine = portrait ? 126 : 265;
  const Icon = icons[page];
  return (
    <AbsoluteFill
      data-intro-scene="8"
      data-book-page={page}
      style={{
        padding: portrait ? "36px 24px 28px" : "28px 50px 26px",
        display: "grid",
        gridTemplateRows: portrait
          ? "160px minmax(0,1fr) 74px"
          : "100px minmax(0,1fr) 38px",
        gap: 12,
        boxSizing: "border-box",
        color: "#f3f6ed",
      }}
    >
      <div data-intro-safe style={{ textAlign: "center", alignSelf: "center" }}>
        <div
          style={{
            fontSize: 16,
            letterSpacing: ".2em",
            color: "#99c9b8",
            marginBottom: 12,
          }}
        >
          UM LIVRO. MUITAS CONEXÕES.
        </div>
        <div
          style={{
            fontSize: portrait ? 47 : 43,
            fontWeight: 750,
            letterSpacing: "-.045em",
            lineHeight: 1.06,
          }}
        >
          Sua faculdade,
          <br style={{ display: portrait ? "block" : "none" }} /> página por
          página.
        </div>
      </div>
      <div
        data-intro-safe
        style={{
          position: "relative",
          display: "grid",
          placeItems: "center",
          minHeight: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: bookWidth * 0.9,
            height: bookHeight * 0.8,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${colors[page]}28, transparent 68%)`,
            transform: `scale(${still ? 1 : 1.1 + Math.sin(raw / 65) * 0.08})`,
          }}
        />
        <div
          style={{
            width: bookWidth,
            height: bookHeight,
            position: "relative",
            perspective: 1300,
            transform: `translateY(${(1 - open) * 60}px) rotateX(${still ? 0 : (1 - open) * 14}deg) rotateZ(${still ? 0 : Math.sin(raw / 150) * 0.5}deg)`,
            opacity: Math.min(1, open),
          }}
        >
          {[3, 2, 1].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: `${i * -3}px ${i * -2}px ${i * -6}px`,
                borderRadius: 16,
                background: i === 3 ? "#80aa71" : "#d2d9be",
                border: "1px solid #b8c7a7",
                boxShadow: i === 3 ? "0 26px 45px #0006" : undefined,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 13,
              overflow: "hidden",
              background: "#f4f6eb",
              display: "grid",
              gridTemplateColumns: `${spine}px 1fr`,
            }}
          >
            <div
              style={{
                background: "linear-gradient(105deg,#244b3e,#1a392f)",
                padding: portrait ? "28px 17px" : "30px 26px",
                position: "relative",
                boxSizing: "border-box",
                borderRight: "2px solid #10271f",
              }}
            >
              <BookOpen
                size={portrait ? 54 : 58}
                color="#deef80"
                strokeWidth={1.4}
              />
              <div
                style={{
                  fontWeight: 750,
                  fontSize: portrait ? 20 : 32,
                  marginTop: 14,
                }}
              >
                enturma<span style={{ color: "#deef80" }}>.</span>
              </div>
              <div
                style={{
                  width: 28,
                  height: 3,
                  background: "#deef80",
                  margin: "24px 0",
                }}
              />
              {labels.map((label, i) => {
                const ItemIcon = icons[i];
                return (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: portrait ? 27 : 21,
                      opacity: page === i ? 1 : 0.42,
                      color: page === i ? colors[i] : "#dce9de",
                      fontSize: 18,
                    }}
                  >
                    <ItemIcon size={23} />
                    {!portrait && <span>{label}</span>}
                  </div>
                );
              })}
              <span
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: portrait ? 17 : 26,
                  fontSize: 15,
                  letterSpacing: ".14em",
                  color: "#a8c4b3",
                }}
              >
                0{page + 1} / 04
              </span>
            </div>
            <div
              style={{
                position: "relative",
                background:
                  "linear-gradient(90deg,#dce2d2 0%,#f5f7ef 5%,#f5f7ef 97%,#e3e8d8)",
              }}
            >
              <Mockup page={page} frame={f} portrait={portrait} />
            </div>
            {!still && page > 0 && turn < 1 && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: spine,
                  bottom: 0,
                  width: bookWidth - spine,
                  transformOrigin: "0 50%",
                  transformStyle: "preserve-3d",
                  transform: `rotateY(${-180 * turn}deg)`,
                  zIndex: 3,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    background: "#f5f7ef",
                    boxShadow: "-10px 4px 25px #18332744",
                  }}
                >
                  <Mockup page={page - 1} frame={180} portrait={portrait} />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(90deg,#162f2344,transparent 38%,#fff9)`,
                      opacity: Math.sin(turn * Math.PI),
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background:
                      "linear-gradient(90deg,#dee5d1,#f1f4e8 20%,#d0dbc0)",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "10px 4px 25px #18332744",
                  }}
                >
                  <BookOpen size={100} color="#8da57f" strokeWidth={1} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        data-intro-safe
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 13,
          fontSize: portrait ? 22 : 20,
        }}
      >
        <Icon size={25} color={colors[page]} />
        <span>{labels[page]}</span>
        <div style={{ display: "flex", gap: 7, marginLeft: 14 }}>
          {labels.map((label, i) => (
            <span
              key={label}
              style={{
                width: i === page ? 26 : 6,
                height: 6,
                borderRadius: 9,
                background: i === page ? colors[page] : "#456559",
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function PresenterClosingScene({ quality }: IntroProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = width < height;
  const f = quality === "low" ? 260 : frame;
  const arrival = rise(f, 10);
  return (
    <AbsoluteFill
      data-intro-scene="9"
      style={{
        padding: portrait ? "48px 32px" : "26px 56px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#f3f6ed",
        textAlign: "center",
        gap: portrait ? 22 : 14,
      }}
    >
      <div
        data-intro-safe
        style={{
          position: "relative",
          width: portrait ? 260 : 235,
          height: portrait ? 215 : 178,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -48,
            borderRadius: "50%",
            border: "1px solid #4a7355",
            transform: `scale(${0.65 + ramp(f, 15, 70) * 0.35})`,
            opacity: ramp(f, 15) * 0.5,
          }}
        />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 150,
              height: 142,
              left: "50%",
              top: "50%",
              marginLeft: -75,
              marginTop: -71,
              borderRadius: 12,
              background: colors[i],
              border: "1px solid #edf5d488",
              opacity: 1 - ramp(f, 38 + i * 8, 30),
              transform: `perspective(700px) translate(${(i - 1.5) * (1 - ramp(f, 0, 75)) * 42}px,${-i * 7}px) rotateZ(${(i - 1.5) * (1 - ramp(f, 0, 75)) * 13}deg) rotateY(${ramp(f, 20 + i * 8, 45) * -90}deg)`,
            }}
          />
        ))}
        <svg
          viewBox="0 0 260 215"
          width="100%"
          height="100%"
          style={{
            position: "relative",
            opacity: ramp(f, 45, 20),
            transform: `scale(${0.75 + arrival * 0.25})`,
          }}
        >
          <defs>
            <linearGradient id="closing-book-glow" x1="0" x2="1">
              <stop stopColor="#ebf6b7" />
              <stop offset="1" stopColor="#b9db7e" />
            </linearGradient>
          </defs>
          <path
            d="M130 169C103 143 61 144 29 154V45C65 31 104 39 130 62C156 39 195 31 231 45V154C199 144 157 143 130 169Z"
            fill="#264e3b"
            stroke="url(#closing-book-glow)"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M130 62V169M48 69C76 59 98 68 112 78M48 92C73 86 95 92 112 100M148 78C169 63 191 64 212 69M148 100C174 87 193 89 212 92"
            fill="none"
            stroke="#deef80"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - ramp(f, 50, 70)}
          />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={39 + i * 91}
              cy={22 + (i % 2) * 176}
              r={3 + Math.sin(f / 20 + i) * (quality === "low" ? 0 : 1.5)}
              fill={colors[i]}
              opacity={ramp(f, 70 + i * 5)}
            />
          ))}
        </svg>
      </div>
      <div data-intro-safe style={{ maxWidth: 880 }}>
        <div
          style={{
            fontSize: portrait ? 25 : 23,
            color: "#c4dfb7",
            letterSpacing: ".13em",
            fontWeight: 600,
            opacity: ramp(f, 55),
            transform: `translateY(${(1 - rise(f, 55)) * 22}px)`,
          }}
        >
          SE ENTURME COM O
        </div>
        <div
          style={{
            fontSize: portrait ? 108 : 126,
            fontWeight: 800,
            letterSpacing: "-.065em",
            lineHeight: 1.05,
            margin: "8px 0 18px",
            opacity: ramp(f, 70),
            transform: `translateY(${(1 - rise(f, 70)) * 32}px)`,
          }}
        >
          enturma<span style={{ color: "#deef80" }}>.</span>
        </div>
        <div
          style={{
            fontSize: portrait ? 33 : 30,
            maxWidth: 760,
            lineHeight: 1.24,
            color: "#cee0d4",
            textWrap: "balance",
            opacity: ramp(f, 108, 35),
          }}
        >
          Fique por dentro da sua faculdade conosco.
        </div>
      </div>
      <div
        data-intro-safe
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: portrait ? 12 : 22,
          maxWidth: portrait ? 490 : 950,
          marginTop: 16,
        }}
      >
        {["Feed", "Salas", "Caronas", "Estudos com IA"].map((label, i) => {
          const Icon = icons[i];
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: colors[i],
                fontSize: 19,
                opacity: ramp(f, 140 + i * 13),
                transform: `translateY(${(1 - rise(f, 140 + i * 13)) * 15}px)`,
              }}
            >
              <Icon size={22} />
              {label}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
