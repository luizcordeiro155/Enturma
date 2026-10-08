import {
  Avatar,
  C,
  Check,
  INKS,
  Label,
  Panel,
  Stage,
  pop,
  prog,
  useInkTime,
} from "./comic-kit";
export function FriendsScene() {
  const { f } = useInkTime();
  return (
    <Stage
      scene={11}
      number="08"
      title={["Sua turma.", "Seu jeito."]}
      kicker="AMIGOS E PERFIL"
      color={C.magenta}
      shout="CONECTA!"
    >
      <Panel x={55} y={35} w={370} h={490} fill="#29162b" rotate={-2}>
        <rect x="12" y="12" width="346" height="116" rx="10" fill={C.violet} />
        <Avatar x={127} y={60} size={112} color={C.magenta} index={0} />
        <Label x={185} y={224} size={38} anchor="middle">
          SEU PERFIL
        </Label>
        <Label x={185} y={271} size={22} anchor="middle" color="#dccbe4">
          SUA IDENTIDADE NA TURMA
        </Label>
        {[C.cyan, C.yellow, C.magenta].map((color, i) => (
          <g
            key={color}
            transform={`translate(${93 + i * 90} 350) scale(${pop(f, 12 + i * 6)})`}
          >
            <circle r="30" fill={color} stroke="#000" strokeWidth="5" />
            <path
              d="M-10 0L-2 8L13-10"
              fill="none"
              stroke="#000"
              strokeWidth="5"
            />
          </g>
        ))}
        <Label x={185} y={446} size={23} anchor="middle" color={C.cyan}>
          FOTO · BIO · CONQUISTAS
        </Label>
      </Panel>
      <g transform={`translate(${452 + (1 - pop(f, 10)) * 140} 64)`}>
        <Panel w={394} h={417} fill="#20152c">
          <Label x={25} y={52} size={29} color={C.magenta}>
            AMIGOS POR PERTO
          </Label>
          {["Bia", "João", "Lia"].map((name, i) => (
            <g
              key={name}
              transform={`translate(22 ${85 + i * 92}) scale(${pop(f, 18 + i * 9)})`}
            >
              <Avatar x={0} y={0} size={62} index={i + 1} color={INKS[i]} />
              <Label x={83} y={28} size={27}>
                {name}
              </Label>
              <Label x={83} y={55} size={18} color="#d5c4e5">
                Conversa privada
              </Label>
              <Check x={320} y={30} scale={0.7} />
            </g>
          ))}
        </Panel>
      </g>
      <g transform={`translate(348 ${505 + (1 - pop(f, 62)) * 120})`}>
        <Panel w={463} h={74} fill={C.cyan}>
          <Label x={232} y={46} size={28} color="#000" anchor="middle">
            A CONEXÃO CONTINUA
          </Label>
        </Panel>
      </g>
    </Stage>
  );
}

export function SubjectsScene() {
  const { f } = useInkTime();
  return (
    <Stage
      scene={12}
      number="09"
      title={["Suas matérias.", "Sua próxima", "turma."]}
      kicker="SEU SEMESTRE"
      color={C.cyan}
      shout="PARTIU!"
    >
      <Panel x={45} y={36} w={788} h={481} fill="#102832" rotate={-1}>
        <Label x={32} y={60} size={34} color={C.cyan}>
          MINHAS MATÉRIAS
        </Label>
        <Label x={32} y={105} size={23} color="#b6d4e1">
          Escolha o que faz parte do seu semestre.
        </Label>
        {["Cálculo", "Física", "Programação"].map((name, i) => (
          <g
            key={name}
            transform={`translate(${32 + (1 - pop(f, 8 + i * 8)) * 140} ${137 + i * 91})`}
            opacity={prog(f, 8 + i * 8, 9)}
          >
            <rect
              width="724"
              height="73"
              rx="12"
              fill={["#163544", "#292339", "#253923"][i]}
              stroke={INKS[i]}
              strokeWidth="3"
            />
            <Label x={22} y={47} size={32}>
              {name}
            </Label>
            <Check x={678} y={36} color={INKS[i]} scale={0.82} />
          </g>
        ))}
        <Label x={32} y={451} size={23} color="#e5eef4">
          Encontre estudantes das mesmas disciplinas.
        </Label>
      </Panel>
      <g transform={`translate(334 ${497 + (1 - pop(f, 64)) * 100})`}>
        <Panel w={472} h={86} fill={C.yellow}>
          <Label x={236} y={54} size={26} color="#000" anchor="middle">
            VAMOS ESTUDAR JUNTOS →
          </Label>
        </Panel>
      </g>
    </Stage>
  );
}
