import { interpolate } from "remotion";
import {
  C,
  INKS,
  Stage,
  Panel,
  Label,
  Avatar,
  Check,
  pop,
  prog,
  useInkTime,
  clamp,
} from "./comic-kit";

export function RewardsScene() {
  const { f, raw, still } = useInkTime();
  const phase = still ? 3 : Math.min(3, Math.floor(raw / 36));
  const days = [1, 7, 14, 30][phase];
  return (
    <Stage
      scene={4}
      number="01"
      title={["Seu esforço.", "Seu próximo", "nível."]}
      kicker="RECOMPENSAS"
      color={C.yellow}
      shout="LEVEL UP!"
    >
      <Panel x={45} y={40} w={790} h={495} fill={C.yellow} rotate={-2}>
        <Label x={45} y={64} size={25} color={C.ink}>
          CADA DIA CONTA
        </Label>
        <g
          transform={`translate(128 185) scale(${1 + Math.sin(f / 6) * 0.035})`}
        >
          <path
            d="M0 105C-95 34-10-6-17-106C44-55 86-10 69 48C94 25 95 5 94-12C154 84 59 140 0 105Z"
            fill={C.orange}
            stroke="#000"
            strokeWidth="6"
          />
          <path
            d="M15 88C-22 59 9 40 19 7C56 49 65 85 15 88Z"
            fill={C.magenta}
          />
        </g>
        <Label x={535} y={265} size={176} color={C.ink} anchor="middle">
          {days}
        </Label>
        <Label x={535} y={318} size={36} color={C.ink} anchor="middle">
          DIAS DE SEQUÊNCIA
        </Label>
        <rect x="40" y="384" width="710" height="48" rx="24" fill="#000" />
        <rect
          x="46"
          y="390"
          width={698 * prog(f, 12, 58)}
          height="36"
          rx="18"
          fill={C.orange}
        />
        <Label x={48} y={471} size={24} color={C.ink}>
          + XP A CADA CONQUISTA
        </Label>
      </Panel>
      <g transform={`translate(620 456) rotate(7) scale(${pop(f, 55)})`}>
        <path
          d="M-55-67H165L191 1L165 66H-55L-81 1Z"
          fill={C.magenta}
          stroke="#000"
          strokeWidth="6"
        />
        <Label x={54} y={-13} size={26} anchor="middle">
          NÍVEL
        </Label>
        <Label x={54} y={49} size={66} color={C.yellow} anchor="middle">
          7
        </Label>
      </g>
    </Stage>
  );
}

export function AiScene() {
  const { f, raw, still } = useInkTime();
  const phase = still ? 3 : Math.min(3, Math.floor(raw / 36));
  const portal = prog(f, 12, 35);
  return (
    <Stage
      scene={5}
      number="02"
      title={["Seus materiais.", "Outras formas", "de aprender."]}
      kicker="CADERNOS IA"
      color={C.cyan}
      shout="VOILÀ!"
    >
      <g transform={`translate(442 245) rotate(${still ? 0 : f * 2})`}>
        {[140, 178, 216].map((r, i) => (
          <circle
            key={r}
            r={r}
            fill={i === 0 ? "#16082c" : "none"}
            stroke={i % 2 ? C.violet : C.cyan}
            strokeWidth={i === 0 ? 9 : 3}
            strokeDasharray={i === 1 ? "18 14" : i === 2 ? "3 12" : undefined}
            opacity={0.95 - i * 0.2}
          />
        ))}
      </g>
      <Label
        x={442}
        y={245}
        size={phase < 2 ? 50 : 42}
        color={C.cyan}
        anchor="middle"
      >
        {phase < 2 ? "IA" : "ENTENDA"}
      </Label>
      <Label x={442} y={285} size={23} color={C.violet} anchor="middle">
        {phase < 2 ? "CONECTANDO IDEIAS" : "PASSO A PASSO"}
      </Label>
      {["PDF", "LINK", "IMAGEM"].map((label, i) => {
        const p = phase < 2 ? portal : 1;
        return (
          <g
            key={label}
            opacity={phase < 2 ? 1 - p * 0.72 : 0}
            transform={`translate(${100 + (442 - 100) * p + i * 35 * (1 - p)} ${80 + i * 138 + (190 - 80 - i * 138) * p}) rotate(${-15 + p * 25}) scale(${1 - p * 0.6})`}
          >
            <rect
              width="164"
              height="119"
              rx="10"
              fill={i % 2 ? C.violet : C.cyan}
              stroke="#000"
              strokeWidth="5"
            />
            <Label x={18} y={62} size={28} color="#000">
              {label}
            </Label>
            <path d="M18 82H135M18 96H93" stroke="#000" strokeWidth="4" />
          </g>
        );
      })}
      {["RESUMO", "FLASHCARDS", "QUIZ"].map((label, i) => {
        const a = pop(f, 45 + i * 7);
        const flip =
          label === "FLASHCARDS"
            ? Math.abs(Math.cos(prog(f, 75, 24) * Math.PI))
            : 1;
        return (
          <g
            key={label}
            transform={`translate(${74 + i * 250} ${385 + (1 - a) * 170}) rotate(${(i - 1) * 6}) scale(${a})`}
          >
            <Panel w={230} h={170} fill={INKS[i]}>
              <Label x={115} y={54} size={23} color="#000" anchor="middle">
                {label}
              </Label>
              <g
                transform={`translate(115 104) scale(${Math.max(0.05, flip)} 1)`}
              >
                <path
                  d="M-70-20H70M-70 0H44M-70 20H60"
                  stroke="#000"
                  strokeWidth="5"
                />
              </g>
            </Panel>
          </g>
        );
      })}
    </Stage>
  );
}

export function FeedScene() {
  const { f, raw, still } = useInkTime();
  const phase = still ? 3 : Math.min(3, Math.floor(raw / 36));
  return (
    <Stage
      scene={6}
      number="03"
      title={["O campus", "tem assunto."]}
      kicker="FEED UNIVERSITÁRIO"
      color={C.magenta}
      shout="UP!"
    >
      <g transform={`translate(0 ${-Math.max(0, f - 50) * 0.25})`}>
        {[
          ["Alguém tem as anotações", "da P1 de Física?", C.magenta],
          ["Revisão em grupo?", "A sala já está aberta.", C.cyan],
          ["Quem vai pro campus?", "Bora combinar uma carona.", C.violet],
        ].map(([a, b, color], i) => (
          <g
            key={a}
            transform={`translate(0 ${(1 - pop(f, i * 6)) * 200})`}
            opacity={prog(f, i * 6, 8)}
          >
            <Panel
              x={60 + i * 12}
              y={35 + i * 162}
              w={750}
              h={143}
              fill="#1c1426"
              rotate={i % 2 ? 1 : -1}
            >
              <Avatar x={18} y={18} size={58} color={color} index={i} />
              <Label x={94} y={47} size={27}>
                {a}
              </Label>
              <Label x={94} y={81} size={27}>
                {b}
              </Label>
              <Label x={95} y={120} size={19} color={color}>
                ↑ {8 + i * 14 + Math.floor(prog(f, 36, 55) * 73)} ♥ COMENTAR
              </Label>
            </Panel>
          </g>
        ))}
      </g>
      <g transform={`translate(285 ${470 + (1 - pop(f, 64)) * 150})`}>
        <Panel w={540} h={110} fill={C.magenta}>
          <Label x={25} y={46} color="#000" size={27}>
            {phase < 2 ? "digitando..." : "3 pessoas responderam"}
          </Label>
          <Label x={25} y={84} color="#000" size={23}>
            Sua pergunta encontrou companhia.
          </Label>
        </Panel>
      </g>
    </Stage>
  );
}

export function ChatScene() {
  const { f, raw, still } = useInkTime();
  const phase = still ? 3 : Math.min(3, Math.floor(raw / 36));
  const lines = [
    "Bora revisar Cálculo III?",
    "Tenho uma dúvida nessa parte.",
    "Manda aqui. A gente resolve!",
    "Valeu, turma!",
    "Próxima sessão combinada.",
  ];
  return (
    <Stage
      scene={7}
      number="04"
      title={["Sua dúvida", "ganha uma", "turma."]}
      kicker="SALAS + CONVERSAS"
      color={C.magenta}
      shout="BIP BIP"
    >
      <Panel x={85} y={28} w={720} h={540} fill="#171222" rotate={-1}>
        <rect width="720" height="78" rx="16" fill={C.magenta} />
        <Label x={27} y={50} size={32} color="#000">
          # CÁLCULO III
        </Label>
        <Label x={685} y={50} size={22} color="#000" anchor="end">
          5 ONLINE
        </Label>
        {lines.map((line, i) => {
          const p = pop(f, 8 + i * 7);
          return (
            <g
              key={line}
              transform={`translate(${i % 2 ? 120 : 25} ${96 + i * 73 + (1 - p) * 45})`}
              opacity={prog(f, i * 7, 6)}
            >
              <rect
                width={i % 2 ? 550 : 562}
                height="58"
                rx="15"
                fill={i % 2 ? C.cyan : "#372a45"}
                stroke="#000"
                strokeWidth="3"
              />
              <Label x={19} y={37} size={24} color={i % 2 ? C.ink : C.white}>
                {line}
              </Label>
            </g>
          );
        })}
        <Label x={28} y={518} size={22} color={C.cyan}>
          {phase < 3
            ? `Maria está digitando${".".repeat(1 + (Math.floor(f / 6) % 3))}`
            : "CONEXÃO FEITA. CONVERSA ABERTA."}
        </Label>
      </Panel>
      <g transform={`translate(666 25) scale(${pop(f, 56)})`}>
        <circle r="65" fill={C.cyan} stroke="#000" strokeWidth="5" />
        <text y="25" textAnchor="middle" fontSize="75">
          ✦
        </text>
      </g>
    </Stage>
  );
}

export function RideScene() {
  const { f } = useInkTime();
  const p = interpolate(
    f,
    [0, 8, 20, 38, 65, 85],
    [0, 0.03, 0.08, 0.5, 0.92, 1],
    clamp,
  );
  const x = 140 + p * 585;
  const y = 385 - p * 220 + Math.sin(p * Math.PI) * -80;
  return (
    <Stage
      scene={8}
      number="05"
      title={["Mesmo destino.", "Novas", "conexões."]}
      kicker="CARONAS"
      color={C.green}
      shout="VROOOM"
    >
      <Panel x={32} y={30} w={818} h={465} fill="#14241e" rotate={-2}>
        <defs>
          <clipPath id="ride-streets">
            <rect x="4" y="4" width="810" height="457" rx="16" />
          </clipPath>
        </defs>
        <g clipPath="url(#ride-streets)">
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M${i * 110 - 150} 0L${i * 110 + 100} 470M0 ${i * 75}L830 ${i * 75 - 230}`}
              stroke="#254936"
              strokeWidth="18"
            />
          ))}
        </g>
        <path
          d="M110 355C255 355 265 180 410 160S555 90 696 135"
          stroke="#000"
          strokeWidth="32"
          fill="none"
        />
        <path
          d="M110 355C255 355 265 180 410 160S555 90 696 135"
          stroke={C.green}
          strokeWidth="17"
          fill="none"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - p}
        />
        <circle
          cx="110"
          cy="355"
          r="23"
          fill={C.cyan}
          stroke="#000"
          strokeWidth="5"
        />
        <path
          d="M696 145L674 105A31 31 0 1 1 718 105Z"
          fill={C.green}
          stroke="#000"
          strokeWidth="5"
        />
        <Label x={24} y={43} size={27} color={C.green}>
          ROTA PARA O CAMPUS
        </Label>
      </Panel>
      <g transform={`translate(${x} ${y}) rotate(-12)`}>
        <path
          d="M-68 0L-43-37H37L64 0L75 5V43H-79V6Z"
          fill={C.green}
          stroke="#000"
          strokeWidth="6"
        />
        <path
          d="M-35-27H28L45 0H-51Z"
          fill={C.cyan}
          stroke="#000"
          strokeWidth="4"
        />
        <circle cx="-47" cy="40" r="14" />
        <circle cx="43" cy="40" r="14" />
        <path d="M-125 12H-85M-146 29H-91" stroke={C.green} strokeWidth="8" />
      </g>
      <g transform={`translate(105 ${445 + (1 - pop(f, 42)) * 140})`}>
        <Panel w={670} h={127} fill={C.green}>
          <Label x={24} y={43} size={29} color="#000">
            3 PRA ENGENHARIA · SAI 7H
          </Label>
          {[0, 1, 2].map((i) => (
            <Avatar
              key={i}
              x={25 + i * 54}
              y={64}
              size={44}
              index={i}
              color={C.cyan}
            />
          ))}
          <Label x={220} y={102} size={28} color="#000">
            {f > 70 ? "CONFIRMADO!" : "ENCONTRE SUA CARONA"}
          </Label>
          <Check x={616} y={89} color={C.white} scale={pop(f, 70)} />
        </Panel>
      </g>
    </Stage>
  );
}

export function CallsScene() {
  const { f, raw, still } = useInkTime();
  const share = still || raw > 65;
  return (
    <Stage
      scene={9}
      number="06"
      title={["Abre a câmera.", "Compartilha", "a ideia."]}
      kicker="VOZ · VÍDEO · TELA"
      color={C.violet}
      shout="TALK!"
    >
      {[0, 1, 2, 3].map((i) => {
        const p = pop(f, i * 3);
        return (
          <g
            key={i}
            transform={`translate(${55 + (i % 2) * 410 + (1 - p) * (i % 2 ? 400 : -400)} ${35 + Math.floor(i / 2) * 245})`}
            opacity={prog(f, i * 3, 6)}
          >
            <Panel
              w={380}
              h={225}
              fill={["#3b1853", "#123a3e", "#3c281d", "#252047"][i]}
            >
              <Avatar x={135} y={23} size={127} index={i} color={INKS[i]} />
              <Label x={24} y={197} size={24}>
                {["João", "Maria", "Lia", "Você"][i]}
              </Label>
              {Array.from({ length: 5 }, (_, j) => (
                <rect
                  key={j}
                  x={298 + j * 11}
                  y={185 - Math.sin(f / 3 + j + i) * 10}
                  width="6"
                  height={12 + Math.abs(Math.sin(f / 3 + j)) * 17}
                  rx="3"
                  fill={C.green}
                />
              ))}
            </Panel>
          </g>
        );
      })}
      {share && (
        <g transform={`translate(155 202) scale(${pop(f, 65)})`}>
          <Panel w={590} h={252} fill="#f0e6fa" rotate={2}>
            <rect width="590" height="47" rx="16" fill={C.violet} />
            <Label x={22} y={32} size={20} color="#000">
              TELA COMPARTILHADA
            </Label>
            <Label x={31} y={113} size={40} color="#20112b">
              ∫ f(x) dx = F(x) + C
            </Label>
            <path
              d="M30 143H550"
              stroke={C.magenta}
              strokeWidth="7"
              strokeDasharray="520"
              strokeDashoffset={520 * (1 - prog(f, 76, 18))}
            />
            <Label x={32} y={201} size={28} color="#20112b">
              Anotei aqui. Vamos juntos?
            </Label>
          </Panel>
        </g>
      )}
      <rect
        x="299"
        y="536"
        width="306"
        height="56"
        rx="28"
        fill="#23152c"
        stroke={C.violet}
        strokeWidth="3"
      />
      {["◉", "▣", "↗"].map((v, i) => (
        <Label
          key={v}
          x={355 + i * 85}
          y={575}
          size={34}
          color={C.white}
          anchor="middle"
        >
          {v}
        </Label>
      ))}
    </Stage>
  );
}

export function GamesScene() {
  const { f, raw, still } = useInkTime();
  const phase = still ? 3 : Math.min(3, Math.floor(raw / 36));
  return (
    <Stage
      scene={10}
      number="07"
      title={["Aprenda.", "Jogue.", "Evolua."]}
      kicker="MISSÕES DIÁRIAS"
      color={C.orange}
      shout="CLIC!"
    >
      <Panel x={80} y={25} w={720} h={520} fill="#231610" rotate={1}>
        <Label x={28} y={48} size={27} color={C.orange}>
          TERMO DEV · DESAFIO DO DIA
        </Label>
        {["L", "O", "G", "I", "C"].map((letter, i) => (
          <g
            key={i}
            transform={`translate(${43 + i * 131} 91) scale(${pop(f, i * 4)})`}
          >
            <rect
              width="109"
              height="114"
              rx="9"
              fill={f > 42 ? C.green : C.orange}
              stroke="#000"
              strokeWidth="5"
            />
            <Label x={54} y={81} size={71} color="#000" anchor="middle">
              {f > i * 6 ? letter : ""}
            </Label>
          </g>
        ))}
        <Label
          x={360}
          y={266}
          size={44}
          color={phase > 1 ? C.green : C.white}
          anchor="middle"
        >
          {phase > 1 ? "CORRETO! COMBO ×3" : "QUAL É A PALAVRA?"}
        </Label>
        <rect x="42" y="303" width="636" height="22" rx="11" fill="#080808" />
        <rect
          x="42"
          y="303"
          width={636 * (1 - prog(f, 0, 70))}
          height="22"
          rx="11"
          fill={C.orange}
        />
        <Label x={45} y={379} size={26}>
          5 MISSÕES. UM PASSO POR DIA.
        </Label>
        {[0, 1, 2, 3, 4].map((i) => (
          <Check
            key={i}
            x={83 + i * 130}
            y={456}
            color={i < 4 ? C.green : C.yellow}
            scale={pop(f, 43 + i * 5)}
          />
        ))}
      </Panel>
      <g transform={`translate(742 486) rotate(8) scale(${pop(f, 88)})`}>
        <path
          d="M-52-49H56V2Q56 55 0 59Q-52 55-52 2Z"
          fill={C.yellow}
          stroke="#000"
          strokeWidth="6"
        />
        <path
          d="M-52-30H-80V0Q-80 30-42 30M56-30H83V0Q83 30 46 30M0 58V86M-37 88H37"
          stroke={C.yellow}
          fill="none"
          strokeWidth="12"
        />
        <Label x={2} y={29} size={51} color="#000" anchor="middle">
          ★
        </Label>
      </g>
    </Stage>
  );
}
