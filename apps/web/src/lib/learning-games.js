// Pure JavaScript game rules. No eval and no execution of arbitrary user code.

export const robotLevels = [
  {
    size: 5,
    goal: [4, 4],
    walls: [1, 2, 6, 7, 11, 12, 17],
    requirement: "Use funções de movimento para chegar ao objetivo.",
    starter: 'down();\ndown();\n// continue seu programa',
  },
  {
    size: 5,
    goal: [4, 4],
    walls: [1, 2, 3, 6, 8, 11, 13, 16, 18],
    requirement: "Seu código precisa usar repeat(n) para reduzir repetição.",
    starter: 'repeat(2) {\n  down();\n}\n',
  },
  {
    size: 6,
    goal: [5, 5],
    walls: [1, 7, 13, 19, 20, 21, 22, 23, 28, 29],
    requirement: 'Use if(canMove("D")) ou while(canMove("D")) para tomar decisões.',
    starter: 'while (canMove("D")) {\n  down();\n}\n',
  },
  {
    size: 6,
    goal: [5, 5],
    walls: [1, 7, 18, 19, 24, 25, 26, 27, 28],
    requirement:
      "Combine repeat(n) com if/while. O nível final exige abstração e decisão.",
    starter:
      'repeat(2) {\n  down();\n}\n\nif (canMove("R")) {\n  right();\n}\n',
  },
];

export const traceChallenges = [
  {
    code: "let total = 0;\nfor (let i = 1; i <= 3; i++) {\n  total += i;\n}\nconsole.log(total);",
    frames: [
      "total = 0",
      "i = 1 → total = 1",
      "i = 2 → total = 3",
      "i = 3 → total = 6",
    ],
    hint: "O operador += soma o valor atual de i ao total.",
  },
  {
    code: "const valores = [2, 4, 6];\nconst dobro = valores.map(n => n * 2);\nconsole.log(dobro[2]);",
    frames: [
      "valores = [2, 4, 6]",
      "2 × 2 → 4",
      "4 × 2 → 8",
      "6 × 2 → 12",
      "dobro = [4, 8, 12]",
    ],
    hint: "Arrays começam no índice 0. O índice 2 é o terceiro elemento.",
  },
  {
    code: "let passos = 0;\nlet energia = 10;\nwhile (energia > 2) {\n  energia -= 3;\n  passos++;\n}\nconsole.log(passos);",
    frames: [
      "energia = 10, passos = 0",
      "energia = 7, passos = 1",
      "energia = 4, passos = 2",
      "energia = 1, passos = 3",
      "1 > 2 é falso → sair do laço",
    ],
    hint: "Teste a condição antes de cada repetição, inclusive a última.",
  },
  {
    code: "const valores = [1, 2, 3, 4];\nconst soma = valores.reduce(\n  (acumulador, n) => acumulador + n, 0\n);\nconsole.log(soma);",
    frames: [
      "acumulador = 0",
      "0 + 1 = 1",
      "1 + 2 = 3",
      "3 + 3 = 6",
      "6 + 4 = 10",
    ],
    hint: "reduce percorre o array acumulando um resultado a partir de 0.",
  },
];

function tokenize(source) {
  const clean = source.replace(/\/\/.*$/gm, "");
  const pattern =
    /\s*(repeat|while|if|else|canMove|right|left|up|down|\d+|"[RDLU]"|[(){};])\s*/gy;
  const tokens = [];
  let at = 0;
  while (at < clean.length) {
    pattern.lastIndex = at;
    const match = pattern.exec(clean);
    if (!match || match.index !== at)
      throw new Error("Sintaxe inválida. Use apenas a linguagem permitida neste desafio.");
    tokens.push(match[1]);
    at = pattern.lastIndex;
  }
  return tokens;
}

function parseProgram(source) {
  const tokens = tokenize(source);
  let at = 0;
  const take = (expected) => {
    const value = tokens[at++];
    if (expected && value !== expected)
      throw new Error(`Esperado "${expected}", encontrado "${value ?? "fim"}".`);
    return value;
  };
  const direction = () => {
    const raw = take();
    if (!/^"[RDLU]"$/.test(raw ?? ""))
      throw new Error('Use uma direção como "R", "D", "L" ou "U".');
    return raw[1];
  };
  const block = () => {
    take("{");
    const nodes = statements("}");
    take("}");
    return nodes;
  };
  const statements = (until) => {
    const nodes = [];
    while (at < tokens.length && tokens[at] !== until) {
      const token = take();
      if (["right", "left", "up", "down"].includes(token)) {
        take("(");
        take(")");
        take(";");
        nodes.push({ type: "move", dir: { right: "R", left: "L", up: "U", down: "D" }[token] });
      } else if (token === "repeat") {
        take("(");
        const count = Number(take());
        if (!Number.isInteger(count) || count < 1 || count > 12)
          throw new Error("repeat aceita valores de 1 a 12.");
        take(")");
        nodes.push({ type: "repeat", count, body: block() });
      } else if (token === "if") {
        take("(");
        take("canMove");
        take("(");
        const dir = direction();
        take(")");
        take(")");
        const yes = block();
        let no = [];
        if (tokens[at] === "else") {
          take("else");
          no = block();
        }
        nodes.push({ type: "if", dir, yes, no });
      } else if (token === "while") {
        take("(");
        take("canMove");
        take("(");
        const dir = direction();
        take(")");
        take(")");
        nodes.push({ type: "while", dir, body: block() });
      } else {
        throw new Error(`Comando "${token}" não é permitido.`);
      }
    }
    return nodes;
  };
  const nodes = statements();
  if (at !== tokens.length) throw new Error("Bloco não foi encerrado corretamente.");
  return nodes;
}

function hasNode(nodes, type) {
  return nodes.some(
    (node) =>
      node.type === type ||
      hasNode(node.body ?? [], type) ||
      hasNode(node.yes ?? [], type) ||
      hasNode(node.no ?? [], type),
  );
}

export function robotFrames(source, level) {
  const config = robotLevels[level - 1];
  if (!config) return { frames: [{ x: 0, y: 0, collision: false }], won: false, error: "Nível inválido." };
  try {
    if (source.length > 2500) throw new Error("Seu programa ultrapassou 2.500 caracteres.");
    const nodes = parseProgram(source);
    if (level >= 2 && !hasNode(nodes, "repeat"))
      throw new Error("Este nível exige pelo menos um repeat(n).");
    if (level >= 3 && !hasNode(nodes, "if") && !hasNode(nodes, "while"))
      throw new Error("Este nível exige uma decisão com if ou while.");
    if (level >= 4 && (!hasNode(nodes, "repeat") || (!hasNode(nodes, "if") && !hasNode(nodes, "while"))))
      throw new Error("O nível final exige repeat e também if/while.");

    const [goalX, goalY] = config.goal;
    const state = { x: 0, y: 0, collision: false, steps: 0 };
    const frames = [{ ...state }];
    const delta = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };
    const canMove = (dir) => {
      const [dx, dy] = delta[dir];
      const x = state.x + dx;
      const y = state.y + dy;
      return (
        x >= 0 &&
        x < config.size &&
        y >= 0 &&
        y < config.size &&
        !config.walls.includes(y * config.size + x)
      );
    };
    const move = (dir) => {
      state.steps++;
      if (state.steps > 80) throw new Error("Seu programa excedeu 80 movimentos executados.");
      if (!canMove(dir)) {
        state.collision = true;
        frames.push({ ...state });
        return false;
      }
      const [dx, dy] = delta[dir];
      state.x += dx;
      state.y += dy;
      frames.push({ ...state });
      return true;
    };
    const execute = (list) => {
      for (const node of list) {
        if (state.collision) return;
        if (node.type === "move") {
          if (!move(node.dir)) return;
        } else if (node.type === "repeat") {
          for (let i = 0; i < node.count && !state.collision; i++) execute(node.body);
        } else if (node.type === "if") {
          execute(canMove(node.dir) ? node.yes : node.no);
        } else if (node.type === "while") {
          let guard = 0;
          while (canMove(node.dir) && !state.collision) {
            if (++guard > 40) throw new Error("Loop interrompido: limite de segurança atingido.");
            const before = state.steps;
            execute(node.body);
            if (state.steps === before)
              throw new Error("O while precisa executar ao menos um movimento.");
          }
        }
      }
    };
    execute(nodes);
    return {
      frames,
      won: !state.collision && state.x === goalX && state.y === goalY,
      error: null,
    };
  } catch (error) {
    return {
      frames: [{ x: 0, y: 0, collision: false }],
      won: false,
      error: error instanceof Error ? error.message : "Programa inválido.",
    };
  }
}

export function wordFeedback(guess, target) {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();
  const result = Array.from(g, (letter) => ({ letter, state: "absent" }));
  const remaining = {};
  for (let i = 0; i < t.length; i++) {
    if (g[i] === t[i]) result[i].state = "exact";
    else remaining[t[i]] = (remaining[t[i]] ?? 0) + 1;
  }
  for (let i = 0; i < g.length; i++) {
    if (result[i].state === "exact") continue;
    if ((remaining[g[i]] ?? 0) > 0) {
      result[i].state = "present";
      remaining[g[i]]--;
    }
  }
  return result;
}

export const wordGameLevels = [
  { mode: "Solo", boards: 1, length: 5, maxGuesses: 6 },
  { mode: "Solo+", boards: 1, length: 6, maxGuesses: 6 },
  { mode: "Dueto", boards: 2, length: 6, maxGuesses: 7 },
  { mode: "Quarteto", boards: 4, length: 7, maxGuesses: 9 },
];
