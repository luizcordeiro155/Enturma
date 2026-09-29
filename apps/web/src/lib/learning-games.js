// Pure JavaScript game rules. No eval or execution of arbitrary user code.
export const robotBoards = [
  { size: 5, walls: [1, 6, 11, 13, 18], goal: 24, maxOps: 12 },
  { size: 5, walls: [5, 6, 8, 11, 13, 16, 18], goal: 24, maxOps: 10 },
  { size: 6, walls: [1, 7, 8, 10, 14, 16, 20, 22, 26, 28], goal: 35, maxOps: 12 },
  { size: 6, walls: [1, 7, 8, 10, 14, 16, 19, 20, 22, 25, 28, 31], goal: 35, maxOps: 10 },
];

export const codeWordChallenges = [
  { mode: "solo", words: ["ARRAY"], length: 5, attempts: 6 },
  { mode: "dueto", words: ["CACHE", "STACK"], length: 5, attempts: 7 },
  { mode: "dueto", words: ["THREAD", "KERNEL"], length: 6, attempts: 8 },
  { mode: "quarteto", words: ["BOOLEAN", "COMPILE", "RUNTIME", "POINTER"], length: 7, attempts: 10 },
];

export const programmerDictionary = [
  "ARRAY", "CACHE", "STACK", "THREAD", "KERNEL", "BOOLEAN", "COMPILE", "RUNTIME", "POINTER",
  "STRING", "OBJECT", "METHOD", "MEMORY", "BINARY", "CLIENT", "SERVER", "SCRIPT", "SOURCE",
  "BRANCH", "COMMIT", "PARSER", "SOCKET", "PACKAGE", "VARIABLE", "FUNCTION", "INTEGER",
].map((word) => word.toUpperCase());

export const traceChallenges = [
  {
    code: "let total = 0;\nfor (let i = 1; i <= 4; i++) {\n  total += i * 2;\n}\nconsole.log(total);",
    frames: ["total = 0", "i=1 → 2", "i=2 → 6", "i=3 → 12", "i=4 → 20"],
    hint: "A multiplicação acontece antes da soma.",
    answer: "20",
  },
  {
    code: "const n = [3, 5, 8, 13];\nconst r = n.filter(x => x % 2).map(x => x * 2);\nconsole.log(r[1]);",
    frames: ["ímpares → [3,5,13]", "dobro → [6,10,26]", "índice 1 → 10"],
    hint: "filter vem antes de map; arrays começam no índice 0.",
    answer: "10",
  },
  {
    code: "let x = 1;\nfor (let i = 0; i < 3; i++) {\n  x = (x + i) * 2;\n}\nconsole.log(x);",
    frames: ["x=1", "i=0 → 2", "i=1 → 6", "i=2 → 16"],
    hint: "Atualize x por completo antes da próxima iteração.",
    answer: "16",
  },
  {
    code: "const a = [2,3,4];\nconst r = a.reduce((acc,n,i) => acc + n*i, 1);\nconsole.log(r);",
    frames: ["acc=1", "i=0 → 1", "i=1 → 4", "i=2 → 12"],
    hint: "O índice participa da multiplicação.",
    answer: "12",
  },
];

export function parseRobotProgram(program) {
  const ops = [];
  const lines = String(program || "")
    .toUpperCase()
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    const repeat = line.match(/^REPEAT\s+([1-9])\s+(UP|DOWN|LEFT|RIGHT)$/);
    if (repeat) {
      for (let i = 0; i < Number(repeat[1]); i++) ops.push(repeat[2]);
      continue;
    }
    if (/^(UP|DOWN|LEFT|RIGHT)$/.test(line)) {
      ops.push(line);
      continue;
    }
    return { ops, valid: false, error: "Use UP, DOWN, LEFT, RIGHT ou REPEAT N DIRECAO." };
  }
  return { ops, valid: true, error: "" };
}

export function robotFrames(program, level) {
  const board = robotBoards[level - 1];
  const parsed = parseRobotProgram(program);
  let x = 0;
  let y = 0;
  const frames = [{ x, y, collision: false }];
  if (!board || !parsed.valid || parsed.ops.length > board.maxOps)
    return { frames, won: false, valid: parsed.valid, operations: parsed.ops.length };

  for (const op of parsed.ops) {
    const direction = {
      RIGHT: [1, 0],
      LEFT: [-1, 0],
      UP: [0, -1],
      DOWN: [0, 1],
    }[op];
    x += direction[0];
    y += direction[1];
    const collision =
      x < 0 ||
      x >= board.size ||
      y < 0 ||
      y >= board.size ||
      board.walls.includes(y * board.size + x);
    frames.push({ x, y, collision });
    if (collision) return { frames, won: false, valid: true, operations: parsed.ops.length };
  }
  return {
    frames,
    won: y * board.size + x === board.goal,
    valid: true,
    operations: parsed.ops.length,
  };
}

export function evaluateWordGuess(target, guess) {
  const t = target.toUpperCase();
  const g = guess.toUpperCase();
  const result = Array.from({ length: t.length }, () => "absent");
  const remaining = {};
  for (let i = 0; i < t.length; i++) {
    if (g[i] === t[i]) result[i] = "correct";
    else remaining[t[i]] = (remaining[t[i]] || 0) + 1;
  }
  for (let i = 0; i < t.length; i++) {
    if (result[i] === "correct") continue;
    if ((remaining[g[i]] || 0) > 0) {
      result[i] = "present";
      remaining[g[i]]--;
    }
  }
  return result;
}

export function normalizedCodewordAnswer(words) {
  return words.map((word) => word.toUpperCase()).join(",");
}
