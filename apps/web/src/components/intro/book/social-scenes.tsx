import {
  ArrowUp,
  BookOpen,
  Heart,
  MessageCircle,
  Mic,
  MonitorUp,
  Phone,
  Send,
  Smile,
  UserRound,
  Users,
  Video,
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

export function FeedChapter() {
  const { frame } = useCinema();
  const scroll = progress(frame, 48, 45) * 96;
  return (
    <Chapter
      number={3}
      title={"O CAMPUS\nTEM VOZ."}
      subtitle="Ideias, dúvidas e descobertas no feed."
      color={NEON.pink}
      word="UP!"
    >
      <div
        style={{
          position: "absolute",
          inset: "0 80px",
          transform: `perspective(1100px) rotateY(-10deg) rotateZ(-3deg) translateY(${-scroll}px)`,
        }}
      >
        {[
          "Alguém tem as anotações da aula?",
          "Grupo de revisão hoje, às 18h!",
          "Qual matéria você quer entender melhor?",
        ].map((text, i) => (
          <Pop
            key={text}
            delay={i * 9}
            style={{ position: "relative", marginTop: 16 }}
          >
            <Paper
              color={i === 1 ? NEON.violet : NEON.pink}
              style={{ padding: 20, display: "flex", gap: 20 }}
            >
              <div
                style={{
                  color: NEON.pink,
                  textAlign: "center",
                  fontWeight: 900,
                  fontSize: 24,
                }}
              >
                <ArrowUp size={30} />
                {Math.round(12 + i * 7 + progress(frame, 24 + i * 10, 50) * 22)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 2,
                    color: NEON.pink,
                  }}
                >
                  NA SUA FACULDADE
                </div>
                <p
                  style={{
                    fontSize: 25,
                    fontWeight: 700,
                    lineHeight: 1.24,
                    margin: "10px 0",
                  }}
                >
                  {text}
                </p>
                <span
                  style={{
                    display: "flex",
                    gap: 9,
                    alignItems: "center",
                    fontSize: 17,
                  }}
                >
                  <MessageCircle size={18} /> Conversar · Compartilhar
                </span>
              </div>
            </Paper>
          </Pop>
        ))}
      </div>
      <Pop delay={73} style={{ position: "absolute", right: 0, top: 306 }}>
        <Label color={NEON.cyan}>
          <MessageCircle /> A conversa começou
        </Label>
      </Pop>
      <Confetti at={48} color={NEON.pink} />
    </Chapter>
  );
}

export function ChatChapter() {
  const { frame } = useCinema();
  const typing = frame < 90;
  return (
    <Chapter
      number={4}
      title={"NINGUÉM\nESTUDA SÓ."}
      subtitle="Salas por matéria. Conversas que ajudam."
      color={NEON.green}
      word="BIP BIP!"
    >
      <Pop style={{ position: "absolute", left: 40, top: 15, width: 610 }}>
        <Paper color={NEON.green} style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              paddingBottom: 16,
              borderBottom: "1px solid #ffffff30",
            }}
          >
            <BookOpen size={32} color={NEON.green} />
            <div>
              <strong style={{ fontSize: 25 }}>Revisão de Cálculo</strong>
              <div style={{ fontSize: 16, marginTop: 4, color: NEON.green }}>
                A turma está aqui
              </div>
            </div>
            <Users size={28} style={{ marginLeft: "auto" }} />
          </div>
          {[
            "Como resolvo essa derivada?",
            "Vamos por partes. Olha este exemplo.",
            "Agora fez sentido! 🙌",
          ].map((text, i) => (
            <Pop
              key={text}
              delay={14 + i * 28}
              style={{
                display: "flex",
                justifyContent: i % 2 ? "flex-end" : "flex-start",
                marginTop: 17,
              }}
            >
              <div
                style={{
                  fontSize: 23,
                  fontWeight: 600,
                  maxWidth: "83%",
                  padding: "15px 18px",
                  borderRadius:
                    i % 2 ? "17px 17px 3px 17px" : "17px 17px 17px 3px",
                  background: i % 2 ? NEON.green : "#273844",
                  color: i % 2 ? INK : NEON.white,
                  boxShadow: "3px 4px 0 #0007",
                }}
              >
                {text}
              </div>
            </Pop>
          ))}
          <div
            style={{
              height: 24,
              marginTop: 15,
              color: NEON.green,
              fontSize: 16,
            }}
          >
            {typing ? (
              <span>
                A turma está digitando
                {Array.from({ length: 3 }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      opacity: 0.3 + 0.7 * Math.max(0, Math.sin(frame / 4 - i)),
                    }}
                  >
                    {" "}
                    ·
                  </span>
                ))}
              </span>
            ) : (
              <span>Uma dúvida, várias descobertas.</span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: INK,
              borderRadius: 30,
              padding: "12px 17px",
              marginTop: 8,
              fontSize: 20,
            }}
          >
            <Smile />
            <span style={{ flex: 1, color: "#b9ceca" }}>Mensagem</span>
            <Send color={NEON.green} />
          </div>
        </Paper>
      </Pop>
      <Pop
        delay={85}
        style={{
          position: "absolute",
          left: 6,
          top: 324,
          transform: "rotate(-10deg)",
        }}
      >
        <Label color={NEON.pink}>
          <Heart fill={NEON.pink} /> +1 conexão
        </Label>
      </Pop>
    </Chapter>
  );
}

export function CallsChapter() {
  const { frame } = useCinema();
  const shared = progress(frame, 54, 20);
  return (
    <Chapter
      number={6}
      title={"MOSTRE.\nCONVERSE.\nENTENDA."}
      subtitle="Voz, vídeo e sua tela em companhia."
      color={NEON.violet}
      word="CONECTOU!"
    >
      {[NEON.violet, NEON.cyan, NEON.pink, NEON.green].map((color, i) => {
        const x = 26 + (i % 2) * 328;
        const y = 12 + Math.floor(i / 2) * 190;
        return (
          <Pop
            key={color}
            delay={i * 6}
            style={{
              position: "absolute",
              left: x + shared * (i % 2 ? 208 : 0),
              top: y - shared * Math.floor(i / 2) * 35,
              width: 302 * (1 - shared * 0.6),
              height: 172 * (1 - shared * 0.4),
            }}
          >
            <Paper
              color={color}
              style={{
                height: "100%",
                padding: 14,
                display: "grid",
                placeItems: "center",
                background: `linear-gradient(140deg,${color}38,#11202e)`,
              }}
            >
              <div
                style={{
                  borderRadius: "50%",
                  padding: 10,
                  border: `3px solid ${i === Math.floor(frame / 20) % 4 ? color : "transparent"}`,
                  transform: `scale(${1 + Math.sin(frame / 7 + i) * 0.025})`,
                }}
              >
                <UserRound size={shared > 0.5 ? 32 : 55} color={color} />
              </div>
              <span
                style={{ fontSize: shared > 0.5 ? 13 : 19, fontWeight: 800 }}
              >
                {["Você", "Sua turma", "Estudando", "Em companhia"][i]}
              </span>
              <Mic
                size={16}
                style={{ position: "absolute", left: 12, bottom: 12 }}
              />
            </Paper>
          </Pop>
        );
      })}
      {frame >= 54 ? (
        <Pop
          delay={54}
          style={{
            position: "absolute",
            left: 180,
            top: 30,
            width: 374,
            height: 320,
          }}
        >
          <Paper
            color={NEON.violet}
            style={{ height: "100%", background: NEON.white, color: INK }}
          >
            <Label
              color={NEON.violet}
              style={{
                position: "absolute",
                left: 18,
                top: 18,
                fontSize: 18,
                padding: 9,
              }}
            >
              <MonitorUp size={22} /> Tela compartilhada
            </Label>
            <h3
              style={{
                position: "absolute",
                left: 23,
                right: 23,
                top: 90,
                fontSize: 25,
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              Aprender junto,
              <br />
              na mesma tela.
            </h3>
            <svg
              width="300"
              height="80"
              viewBox="0 0 300 90"
              style={{ position: "absolute", left: 26, top: 175 }}
            >
              <path
                d="M15 70 Q70 15 130 55 T280 25"
                stroke={NEON.violet}
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - progress(frame, 80, 34)}
              />
            </svg>
            <p
              style={{
                position: "absolute",
                left: 23,
                bottom: 20,
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Anotei aqui. Vamos juntos?
            </p>
          </Paper>
        </Pop>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 215,
          top: 391,
          display: "flex",
          gap: 15,
        }}
      >
        {[Mic, Video, MonitorUp, Phone].map((Icon, i) => (
          <div
            key={i}
            style={{
              width: 55,
              height: 55,
              borderRadius: "50%",
              background: i === 3 ? NEON.pink : "#293746",
              display: "grid",
              placeItems: "center",
              color: i === 3 ? INK : NEON.white,
            }}
          >
            <Icon size={27} />
          </div>
        ))}
      </div>
      <Confetti at={108} color={NEON.violet} />
    </Chapter>
  );
}

export function FriendsChapter() {
  const { frame } = useCinema();
  const changed = frame > 44;
  return (
    <Chapter
      number={8}
      title={"DO SEU\nJEITO."}
      subtitle="Seu perfil, seu mural e suas conexões."
      color={NEON.pink}
      word="SE ENTURME!"
    >
      <Pop style={{ position: "absolute", left: 30, top: 22, width: 284 }}>
        <Paper
          color={NEON.pink}
          style={{ padding: 0, overflow: "hidden", transform: "rotate(-4deg)" }}
        >
          <div
            style={{
              height: 86,
              background: "linear-gradient(140deg,#0d8989,#52d6c3)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <BookOpen size={43} />
          </div>
          <div
            style={{
              padding: 22,
              background: changed
                ? "linear-gradient(155deg,#b51038,#240758)"
                : "#184f40",
              minHeight: 239,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: INK,
                border: `4px solid ${NEON.pink}`,
                display: "grid",
                placeItems: "center",
                marginTop: -49,
              }}
            >
              <UserRound size={38} />
            </div>
            <h3 style={{ fontSize: 30, marginBottom: 5 }}>Seu perfil</h3>
            <div style={{ fontSize: 17 }}>Estudando em companhia.</div>
            <div style={{ marginTop: 20, fontSize: 19, lineHeight: 1.4 }}>
              Projetos · Interesses
              <br />
              Conquistas · Seu mural
            </div>
          </div>
        </Paper>
      </Pop>
      <Pop
        delay={24}
        style={{ position: "absolute", left: 345, top: 32, width: 310 }}
      >
        <Paper color={NEON.violet}>
          <Label color={NEON.violet}>SEU MURAL</Label>
          <div style={{ display: "flex", gap: 11, marginTop: 23 }}>
            {[NEON.pink, NEON.cyan, NEON.green, NEON.violet].map((color, i) => (
              <div
                key={color}
                style={{
                  background: color,
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  border:
                    changed && i === 0
                      ? "4px solid white"
                      : "4px solid transparent",
                  transform: `translateY(${Math.sin(frame / 24 + i) * 3}px)`,
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 22, lineHeight: 1.4 }}>
            Cores, widgets e uma história que é sua.
          </p>
        </Paper>
      </Pop>
      <Pop
        delay={68}
        style={{ position: "absolute", left: 330, top: 278, width: 344 }}
      >
        <Paper color={NEON.green} style={{ padding: 22 }}>
          <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
            <Users color={NEON.green} size={39} />
            <strong style={{ fontSize: 24 }}>Amizade confirmada</strong>
          </div>
          <div
            style={{
              fontSize: 19,
              marginTop: 16,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <MessageCircle /> A conversa continua.
          </div>
        </Paper>
      </Pop>
      <Confetti at={71} color={NEON.pink} />
    </Chapter>
  );
}
