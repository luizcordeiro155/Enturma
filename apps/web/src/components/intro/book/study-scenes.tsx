import {
  BookOpen,
  Check,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Link2,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
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

export function RewardsChapter() {
  const { frame } = useCinema();
  const fill = progress(frame, 24, 56);
  const days = Math.round(1 + 29 * progress(frame, 8, 72));
  return (
    <Chapter
      number={1}
      title={"CADA PASSO\nCONTA."}
      subtitle="Missões, sequência e conquistas."
      color={NEON.lime}
      word="LEVEL UP!"
    >
      <div
        style={{
          position: "absolute",
          inset: "-20px 75px",
          border: `2px dashed ${NEON.lime}70`,
          borderRadius: "50%",
          transform: `rotate(${frame * 0.45}deg)`,
        }}
      />
      <Pop style={{ position: "absolute", left: 170, top: 34, width: 340 }}>
        <Paper style={{ textAlign: "center", transform: "rotate(-4deg)" }}>
          <Flame size={70} fill={NEON.orange} color={NEON.lime} />
          <div
            style={{
              fontSize: 106,
              lineHeight: 1,
              fontWeight: 900,
              color: NEON.lime,
            }}
          >
            {days}
          </div>
          <strong style={{ fontSize: 24 }}>DIAS DE SEQUÊNCIA</strong>
          <div
            style={{
              height: 20,
              borderRadius: 12,
              background: INK,
              marginTop: 22,
              padding: 4,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 8,
                width: `${fill * 100}%`,
                background: `linear-gradient(90deg,${NEON.lime},${NEON.orange})`,
              }}
            />
          </div>
          <p style={{ fontSize: 18, marginBottom: 0 }}>
            Seu esforço vira experiência.
          </p>
        </Paper>
      </Pop>
      <Pop
        delay={24}
        style={{
          position: "absolute",
          left: 20,
          top: 70,
          transform: `rotate(${-12 + Math.sin(frame / 30) * 2}deg)`,
        }}
      >
        <Label>
          <Star size={28} /> +120 XP
        </Label>
      </Pop>
      <Pop delay={74} style={{ position: "absolute", right: 8, top: 254 }}>
        <Paper
          color={NEON.orange}
          style={{
            padding: 18,
            transform: "rotate(7deg)",
            textAlign: "center",
          }}
        >
          <Trophy size={48} color={NEON.orange} />
          <div style={{ fontSize: 28, fontWeight: 900 }}>NÍVEL 7</div>
        </Paper>
      </Pop>
      <Pop delay={46} style={{ position: "absolute", left: 90, top: 382 }}>
        <Label color={NEON.green}>
          <Check /> Missão concluída
        </Label>
      </Pop>
      <Confetti at={74} />
    </Chapter>
  );
}

export function AiChapter() {
  const { frame } = useCinema();
  const processing = progress(frame, 32, 40);
  const outputs = frame >= 65;
  return (
    <Chapter
      number={2}
      title={"ENTENDA.\nNÃO DECORE."}
      subtitle="Seu material. Novas formas de aprender."
      color={NEON.cyan}
      word="CLAREOU!"
    >
      <div
        style={{
          position: "absolute",
          left: 210,
          top: 67,
          width: 285,
          height: 285,
          borderRadius: "50%",
          border: `14px solid ${NEON.cyan}`,
          boxShadow: `inset 0 0 44px ${NEON.violet},0 0 35px ${NEON.cyan}60`,
          transform: `rotateX(35deg) rotateZ(${frame * 1.4}deg)`,
          background: `repeating-conic-gradient(${NEON.cyan}24 0deg 8deg,transparent 8deg 24deg)`,
          outline: `2px dashed ${NEON.violet}`,
          outlineOffset: 18,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 163,
          transform: `scale(${1 + Math.sin(frame / 8) * 0.06})`,
        }}
      >
        <Sparkles size={94} color={NEON.white} />
      </div>
      {[
        { icon: FileText, label: "PDF", x: 30, y: 36 },
        { icon: Link2, label: "Links", x: 42, y: 205 },
        { icon: Layers, label: "Imagens", x: 540, y: 44 },
      ].map(({ icon: Icon, label, x, y }, i) => {
        const into = progress(frame, 13 + i * 8, 35);
        const exit = progress(frame, 68 + i * 8, 20);
        return (
          <Pop
            key={label}
            delay={i * 5}
            style={{
              position: "absolute",
              left: x + (350 - x) * into * (1 - exit),
              top: y + (210 - y) * into * (1 - exit),
              opacity: 1 - into * (1 - exit) * 0.95,
              scale: 1 - into * (1 - exit) * 0.75,
            }}
          >
            <Paper
              color={NEON.cyan}
              style={{
                width: 117,
                textAlign: "center",
                padding: 16,
                transform: `rotate(${i % 2 ? 8 : -8}deg)`,
              }}
            >
              <Icon size={32} />
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>
                {label}
              </div>
            </Paper>
          </Pop>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 246,
          top: 364,
          width: 220,
          height: 7,
          borderRadius: 5,
          background: "#ffffff20",
        }}
      >
        <div
          style={{
            width: `${processing * 100}%`,
            height: 7,
            background: NEON.cyan,
            borderRadius: 5,
          }}
        />
      </div>
      {outputs
        ? [
            { label: "RESUMO", color: NEON.cyan, body: "Conceitos → exemplos" },
            {
              label: "FLASHCARDS",
              color: NEON.violet,
              body: "Pergunta ↔ resposta",
            },
            { label: "EXPLICAÇÃO", color: NEON.lime, body: "No seu ritmo" },
          ].map((card, i) => (
            <Pop
              key={card.label}
              delay={65 + i * 8}
              style={{
                position: "absolute",
                left: 10 + i * 225,
                top: 287 - (i % 2) * 25,
                width: 215,
              }}
            >
              <Paper
                color={card.color}
                style={{
                  padding: 19,
                  transform: `perspective(700px) rotateY(${i === 1 ? Math.sin(progress(frame, 82, 26) * Math.PI) * 20 : 0}deg) rotate(${(i - 1) * 6}deg)`,
                }}
              >
                <BookOpen size={30} color={card.color} />
                <h3 style={{ fontSize: 21 }}>{card.label}</h3>
                <p style={{ fontSize: 17, margin: 0 }}>{card.body}</p>
              </Paper>
            </Pop>
          ))
        : null}
    </Chapter>
  );
}

export function GamesChapter() {
  const { frame } = useCinema();
  const answered = frame > 44;
  const flip = progress(frame, 74, 18);
  return (
    <Chapter
      number={7}
      title={"APRENDA\nJOGANDO."}
      subtitle="Pequenos desafios. Grandes descobertas."
      color={NEON.orange}
      word="COMBO!"
    >
      <Pop style={{ position: "absolute", left: 22, top: 20, width: 390 }}>
        <Paper color={NEON.orange}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Label color={NEON.orange}>DESAFIO DO DIA</Label>
            <span style={{ fontSize: 28, fontWeight: 900 }}>
              {Math.max(0, 15 - Math.floor(frame / 24))}s
            </span>
          </div>
          <h3 style={{ fontSize: 28, lineHeight: 1.2 }}>
            Qual estrutura segue a ordem FIFO?
          </h3>
          {["Pilha", "Fila", "Árvore"].map((name, i) => (
            <div
              key={name}
              style={{
                padding: 14,
                marginTop: 9,
                borderRadius: 12,
                border: `2px solid ${answered && i === 1 ? NEON.green : "#ffffff24"}`,
                background: answered && i === 1 ? NEON.green : INK,
                color: answered && i === 1 ? INK : NEON.white,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {String.fromCharCode(65 + i)} · {name}
              {answered && i === 1 ? " ✓" : ""}
            </div>
          ))}
        </Paper>
      </Pop>
      {[0, 1, 2, 3].map((i) => (
        <Pop
          key={i}
          delay={20 + i * 4}
          style={{
            position: "absolute",
            left: 443 + (i % 2) * 115,
            top: 45 + Math.floor(i / 2) * 144,
          }}
        >
          <div
            style={{
              width: 104,
              height: 130,
              transform: `perspective(600px) rotateY(${flip * 180}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <Paper
              color={NEON.orange}
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                padding: 10,
                backfaceVisibility: "hidden",
              }}
            >
              <BookOpen size={46} />
            </Paper>
            <Paper
              color={NEON.lime}
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                padding: 10,
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              {i % 2 ? (
                <Star size={42} color={NEON.lime} />
              ) : (
                <GraduationCap size={42} color={NEON.green} />
              )}
            </Paper>
          </div>
        </Pop>
      ))}
      <Pop delay={48} style={{ position: "absolute", left: 440, top: 355 }}>
        <Label color={NEON.green}>
          <Check /> CORRETO!
        </Label>
      </Pop>
      <Confetti at={48} color={NEON.orange} />
    </Chapter>
  );
}

export function SubjectsChapter() {
  const { frame } = useCinema();
  return (
    <Chapter
      number={9}
      title={"SUA MATÉRIA.\nSUA TURMA."}
      subtitle="Organize o semestre e encontre companhia."
      color={NEON.cyan}
      word="BORA ESTUDAR!"
    >
      <svg width="700" height="460" style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M ${90 + i * 230} 140 Q ${90 + i * 230} 260 350 310`}
            fill="none"
            stroke={INKS_LOCAL[i]}
            strokeWidth="4"
            strokeDasharray="8 12"
            strokeDashoffset={-frame * 0.9}
          />
        ))}
      </svg>
      {["Cálculo", "Programação", "Física"].map((name, i) => (
        <Pop
          key={name}
          delay={i * 8}
          style={{
            position: "absolute",
            left: 12 + i * 230,
            top: 24 + (i % 2) * 36,
            width: 214,
          }}
        >
          <Paper
            color={INKS_LOCAL[i]}
            style={{ transform: `rotate(${(i - 1) * 5}deg)` }}
          >
            <BookOpen size={35} color={INKS_LOCAL[i]} />
            <h3 style={{ fontSize: 25, marginBottom: 10 }}>{name}</h3>
            <div style={{ fontSize: 17, color: NEON.white }}>
              Matéria do semestre
            </div>
          </Paper>
        </Pop>
      ))}
      <Pop
        delay={32}
        style={{ position: "absolute", left: 143, top: 281, width: 426 }}
      >
        <Paper
          color={NEON.green}
          style={{ display: "flex", alignItems: "center", gap: 22 }}
        >
          <GraduationCap size={60} color={NEON.green} />
          <div>
            <strong style={{ fontSize: 28 }}>Encontrou sua turma!</strong>
            <p style={{ fontSize: 19, marginBottom: 0 }}>
              Mesma matéria. Novas conexões.
            </p>
          </div>
        </Paper>
      </Pop>
      <Confetti at={55} color={NEON.cyan} />
    </Chapter>
  );
}
const INKS_LOCAL = [NEON.cyan, NEON.lime, NEON.violet];
