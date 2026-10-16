import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  BookOpen,
  Car,
  Check,
  Clock3,
  GraduationCap,
  MessageCircle,
  Monitor,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { BrandBook } from "../../motion/brand-book";
import {
  Chapter,
  ComicSky,
  Confetti,
  INK,
  INKS,
  Label,
  NEON,
  Paper,
  Pop,
  progress,
  useCinema,
} from "./cinema-kit";

export function BookOpening() {
  const { frame, width, height } = useCinema();
  const portrait = width < height;
  const size = portrait ? width * 0.61 : height * 0.53;
  return (
    <AbsoluteFill
      data-book-opening
      style={{ background: INK, color: NEON.white, overflow: "hidden" }}
    >
      <ComicSky color={NEON.lime} />
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          transform: `rotate(${frame * 0.16}deg)`,
          background: `repeating-conic-gradient(from 12deg at 50% 54%,transparent 0 25deg,${NEON.lime}18 25deg 28deg,transparent 28deg 45deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: portrait ? 32 : 60,
          top: portrait ? 55 : 82,
          right: portrait ? 32 : width * 0.5,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 24,
            fontWeight: 900,
            color: NEON.lime,
          }}
        >
          <BookOpen /> ENTURMA
        </div>
        <h1
          style={{
            fontFamily: '"Comic Archivo",Arial',
            fontSize: portrait ? 58 : 70,
            lineHeight: 1.03,
            letterSpacing: -2,
            margin: "22px 0 10px",
            textShadow: `4px 5px 0 ${INK}`,
          }}
        >
          SUA FACULDADE.
          <br />
          <span style={{ color: NEON.lime }}>OUTRO UNIVERSO.</span>
        </h1>
        <p style={{ fontSize: portrait ? 24 : 27, fontWeight: 700 }}>
          Abre o livro. Entra na turma.
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          left: portrait ? (width - size) / 2 : width * 0.57,
          top: portrait ? 340 : 155,
          transform: `perspective(1000px) rotateZ(${-9 + progress(frame, 0, 25) * 12}deg) scale(${0.88 + progress(frame, 0, 24) * 0.12})`,
        }}
      >
        <BrandBook size={size} frame={frame + 18} color={NEON.lime} />
      </div>
      {[
        { Icon: Users, label: "SUA TURMA", color: NEON.pink },
        { Icon: Sparkles, label: "ESTUDOS + IA", color: NEON.cyan },
        { Icon: Car, label: "CARONAS", color: NEON.green },
      ].map(({ Icon, label, color }, i) => (
        <Pop
          key={label}
          delay={5 + i * 4}
          style={{
            position: "absolute",
            left: portrait
              ? 24 + (i * (width - 48)) / 3
              : width * 0.48 + i * width * 0.16,
            top: portrait ? 620 : height - 182,
            width: portrait ? (width - 66) / 3 : width * 0.15,
          }}
        >
          <Paper
            color={color}
            style={{ padding: 13, transform: `rotate(${(i - 1) * 4}deg)` }}
          >
            <Icon size={26} color={color} />
            <div
              style={{
                fontSize: portrait ? 14 : 18,
                fontWeight: 900,
                marginTop: 9,
              }}
            >
              {label}
            </div>
          </Paper>
        </Pop>
      ))}
      <Confetti at={7} />
    </AbsoluteFill>
  );
}

export function LostQuestion() {
  const { frame } = useCinema();
  return (
    <Chapter
      number={0}
      title={"UMA DÚVIDA\nSEM RESPOSTA?"}
      subtitle="A vida acadêmica não precisa ser solitária."
      color={NEON.cyan}
    >
      <Pop style={{ position: "absolute", left: 95, top: 30, width: 490 }}>
        <Paper
          color={NEON.cyan}
          style={{ transform: "rotate(-4deg)", background: "#142430" }}
        >
          <div style={{ fontSize: 18, color: "#a5b8c6" }}>SUA PERGUNTA</div>
          <h2 style={{ fontSize: 37, lineHeight: 1.2 }}>
            Alguém entendeu
            <br />a matéria de hoje?
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 19,
              color: "#adc0c9",
            }}
          >
            <MessageCircle /> Aguardando uma resposta
          </div>
        </Paper>
      </Pop>
      {["Grupo da turma", "Avisos da aula", "Anotações"].map((label, i) => (
        <Pop
          key={label}
          delay={12 + i * 9}
          style={{
            position: "absolute",
            left: 26 + i * 220,
            top: 300 + (i % 2) * 25,
          }}
        >
          <Paper
            color="#577b8c"
            style={{
              padding: 16,
              width: 203,
              transform: `rotate(${Math.sin(frame / 25 + i) * 3}deg)`,
            }}
          >
            <MessageCircle color="#7796a8" />
            <p style={{ fontSize: 19, fontWeight: 700 }}>{label}</p>
            <span style={{ letterSpacing: 8, fontSize: 30 }}>···</span>
          </Paper>
        </Pop>
      ))}
    </Chapter>
  );
}

export function CampusChaos() {
  const { frame } = useCinema();
  return (
    <Chapter
      number={0}
      title={"TANTA COISA.\nTÃO POUCO\nTEMPO."}
      subtitle="Prova, trabalho, aula… e o caminho até lá."
      color={NEON.orange}
    >
      <div
        style={{
          position: "absolute",
          left: 210,
          top: 90,
          width: 260,
          height: 260,
          border: `8px solid ${NEON.orange}`,
          borderRadius: "50%",
          background: INK,
          boxShadow: `0 0 0 18px ${NEON.orange}20`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            height: 91,
            width: 7,
            background: NEON.orange,
            transformOrigin: "center top",
            transform: `rotate(${frame * 6}deg)`,
            borderRadius: 6,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            height: 58,
            width: 9,
            background: NEON.white,
            transformOrigin: "center top",
            transform: `rotate(${frame * 0.8 + 90}deg)`,
            borderRadius: 6,
          }}
        />
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 5,
              height: 13,
              background: NEON.orange,
              transform: `rotate(${i * 30}deg) translateY(-108px)`,
            }}
          />
        ))}
      </div>
      {[
        { label: "PROVA", Icon: Clock3, x: 36, y: 22 },
        { label: "TRABALHO", Icon: BookOpen, x: 410, y: 10 },
        { label: "VAI PRA AULA?", Icon: Car, x: 366, y: 306 },
        { label: "REVISÃO", Icon: GraduationCap, x: 12, y: 283 },
      ].map(({ label, Icon, x, y }, i) => (
        <Pop
          key={label}
          delay={i * 6}
          style={{
            position: "absolute",
            left: x,
            top: y + Math.sin(frame / 20 + i) * 8,
            transform: `rotate(${(i - 1) * 7}deg)`,
          }}
        >
          <Paper color={INKS[i]} style={{ padding: 20 }}>
            <Icon size={31} color={INKS[i]} />
            <div style={{ fontSize: 23, fontWeight: 900, marginTop: 10 }}>
              {label}
            </div>
          </Paper>
        </Pop>
      ))}
    </Chapter>
  );
}

export function BookConnection() {
  const { frame } = useCinema();
  return (
    <Chapter
      number={0}
      title={"TUDO\nSE CONECTA."}
      subtitle="Sua faculdade inteira, em um só lugar."
      color={NEON.lime}
      word="ENTURMA!"
    >
      <svg width="700" height="460" style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i * Math.PI) / 3;
          return (
            <path
              key={i}
              d={`M350 230 L${350 + Math.cos(angle) * 280} ${230 + Math.sin(angle) * 175}`}
              stroke={INKS[i]}
              strokeWidth="3"
              strokeDasharray="7 10"
              strokeDashoffset={-frame * 2}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 137,
          transform: `scale(${0.9 + progress(frame, 0, 22) * 0.1})`,
        }}
      >
        <BrandBook size={260} frame={frame} color={NEON.lime} />
      </div>
      {[BookOpen, Users, Car, MessageCircle, Sparkles, Video].map((Icon, i) => {
        const angle = (i * Math.PI) / 3;
        return (
          <Pop
            key={i}
            delay={i * 5}
            style={{
              position: "absolute",
              left: 300 + Math.cos(angle) * 275,
              top: 180 + Math.sin(angle) * 172,
            }}
          >
            <Paper
              color={INKS[i]}
              style={{
                width: 100,
                height: 100,
                padding: 20,
                transform: `rotate(${(i % 2 ? -1 : 1) * 6}deg)`,
              }}
            >
              <Icon size={54} color={INKS[i]} />
            </Paper>
          </Pop>
        );
      })}
      <Confetti at={24} />
    </Chapter>
  );
}

export function ConnectedLife() {
  const { frame } = useCinema();
  return (
    <Chapter
      number={10}
      title={"É A VIDA\nINTEIRA\nCONECTADA."}
      subtitle="Uma conexão puxa a próxima."
      color={NEON.green}
    >
      <Pop
        style={{
          position: "absolute",
          left: 10,
          top: 12,
          width: 402,
          height: 258,
        }}
      >
        <Paper
          color={NEON.violet}
          style={{ height: "100%", background: "#2f254e" }}
        >
          <Video size={41} color={NEON.violet} />
          <h2 style={{ fontSize: 36, margin: "15px 0" }}>Em companhia.</h2>
          <div style={{ display: "flex", gap: 14 }}>
            {[NEON.pink, NEON.cyan, NEON.lime].map((color, i) => (
              <div
                key={color}
                style={{
                  width: 65,
                  height: 65,
                  borderRadius: 22,
                  background: color,
                  display: "grid",
                  placeItems: "center",
                  transform: `translateY(${Math.sin(frame / 16 + i) * 4}px)`,
                }}
              >
                <Users color={INK} size={35} />
              </div>
            ))}
          </div>
        </Paper>
      </Pop>
      <Pop
        delay={7}
        style={{
          position: "absolute",
          left: 435,
          top: 12,
          width: 251,
          height: 258,
        }}
      >
        <Paper color={NEON.green} style={{ height: "100%" }}>
          <Car size={65} color={NEON.green} />
          <h3 style={{ fontSize: 26 }}>
            O caminho
            <br />
            vira amizade.
          </h3>
          <Check color={NEON.green} />
        </Paper>
      </Pop>
      <Pop
        delay={14}
        style={{
          position: "absolute",
          left: 10,
          top: 292,
          width: 300,
          height: 150,
        }}
      >
        <Paper
          color={NEON.lime}
          style={{
            height: "100%",
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          <Trophy size={61} color={NEON.lime} />
          <strong style={{ fontSize: 26 }}>
            Cada conquista
            <br />é sua.
          </strong>
        </Paper>
      </Pop>
      <Pop
        delay={21}
        style={{
          position: "absolute",
          left: 333,
          top: 292,
          width: 353,
          height: 150,
        }}
      >
        <Paper
          color={NEON.pink}
          style={{
            height: "100%",
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          <MessageCircle size={54} color={NEON.pink} />
          <strong style={{ fontSize: 26 }}>
            A conversa
            <br />
            continua.
          </strong>
        </Paper>
      </Pop>
      <Confetti at={36} color={NEON.green} />
    </Chapter>
  );
}

export function NextConnection() {
  const { frame } = useCinema();
  const collapse = progress(frame, 0, 68);
  return (
    <Chapter
      number={11}
      title={"SUA PRÓXIMA\nCONEXÃO\nCOMEÇA AQUI."}
      subtitle="Bora fazer parte?"
      color={NEON.cyan}
    >
      {[BookOpen, Users, Car, MessageCircle, Sparkles, Video].map((Icon, i) => {
        const angle = (i * Math.PI) / 3 + frame * 0.012,
          radius = 225 * (1 - collapse * 0.7);
        return (
          <Pop
            key={i}
            delay={i * 2}
            style={{
              position: "absolute",
              left: 300 + Math.cos(angle) * radius,
              top: 170 + Math.sin(angle) * radius * 0.65,
              opacity: 1 - collapse * 0.85,
              transform: `rotate(${frame * 0.25 * (i % 2 ? -1 : 1)}deg) scale(${1 - collapse * 0.5})`,
            }}
          >
            <Paper
              color={INKS[i]}
              style={{ width: 100, height: 100, padding: 21 }}
            >
              <Icon size={52} color={INKS[i]} />
            </Paper>
          </Pop>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 210,
          top: 135,
          transform: `scale(${0.75 + collapse * 0.45})`,
        }}
      >
        <BrandBook size={280} frame={frame + 36} color={NEON.lime} />
      </div>
      <div style={{ position: "absolute", left: 190, top: 373 }}>
        <Label color={NEON.cyan}>Uma nova página começa.</Label>
      </div>
    </Chapter>
  );
}

export function BookFinale() {
  const { frame, width, height } = useCinema();
  const portrait = width < height;
  return (
    <AbsoluteFill
      style={{ background: INK, color: NEON.white, overflow: "hidden" }}
    >
      <ComicSky color={NEON.lime} chapter={12} />
      <Pop
        style={{
          position: "absolute",
          left: portrait ? 30 : 65,
          top: portrait ? 50 : 88,
          width: portrait ? width - 60 : width * 0.52,
          textAlign: portrait ? "center" : "left",
        }}
      >
        <div
          style={{
            fontFamily: '"Comic Archivo",Arial',
            fontSize: portrait ? 33 : 36,
            color: NEON.lime,
          }}
        >
          SE ENTURME COM O
        </div>
        <div
          style={{
            fontFamily: '"Comic Archivo",Arial',
            fontSize: portrait ? 90 : 112,
            letterSpacing: -6,
            lineHeight: 1.2,
            marginTop: 12,
          }}
        >
          enturma<span style={{ color: NEON.lime }}>.</span>
        </div>
        <p
          style={{
            fontSize: portrait ? 25 : 28,
            lineHeight: 1.35,
            fontWeight: 700,
          }}
        >
          Fique por dentro da sua
          <br />
          faculdade conosco.
        </p>
      </Pop>
      <div
        style={{
          position: "absolute",
          left: portrait ? 25 : 70,
          top: portrait ? 348 : 370,
          transform: "rotate(-8deg)",
        }}
      >
        <BrandBook
          size={portrait ? 175 : 190}
          frame={frame}
          color={NEON.lime}
        />
      </div>
      <Pop
        delay={14}
        style={{
          position: "absolute",
          left: portrait ? 246 : width * 0.67,
          top: portrait ? 335 : 85,
          width: portrait ? 238 : 248,
        }}
      >
        <div
          style={{
            background: NEON.white,
            color: INK,
            padding: 14,
            border: `5px solid ${INK}`,
            boxShadow: `10px 11px 0 ${NEON.lime}`,
            transform: "rotate(3deg)",
            borderRadius: 14,
          }}
        >
          <Img
            src={staticFile("intro/comic/download-qr.svg")}
            style={{ width: "100%", display: "block" }}
          />
          <strong
            style={{
              fontSize: 18,
              display: "block",
              textAlign: "center",
              marginTop: 9,
            }}
          >
            ESCANEIE E VEM
          </strong>
        </div>
      </Pop>
      <Pop
        delay={30}
        style={{
          position: "absolute",
          left: portrait ? 26 : width * 0.64,
          top: portrait ? 633 : 400,
          right: portrait ? 26 : 25,
          display: "flex",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <Label color={NEON.cyan} style={{ fontSize: 20 }}>
          <Smartphone size={25} /> Android
        </Label>
        <Label color={NEON.violet} style={{ fontSize: 20 }}>
          <Monitor size={25} /> Windows
        </Label>
      </Pop>
      <div
        style={{
          position: "absolute",
          bottom: portrait ? 110 : 105,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: portrait ? 21 : 24,
          fontWeight: 800,
          color: NEON.lime,
        }}
      >
        enturma-flax.vercel.app{" "}
        <span style={{ color: NEON.white }}>· 2026</span>
      </div>
      <Confetti at={8} />
    </AbsoluteFill>
  );
}
