// Pure JavaScript game rules. No eval or execution of arbitrary user code.
export const robotWalls = [
  [1, 5, 6],
  [5, 6, 9],
  [2, 6, 9, 11],
  [1, 5, 9, 10],
];
export const binaryTargets = [5, 10, 19, 42];
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
export function robotFrames(commands, level) {
  let x = 0,
    y = 0;
  const frames = [{ x, y, collision: false }];
  for (const c of commands) {
    const direction = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] }[c];
    if (!direction) return { frames, won: false };
    x += direction[0];
    y += direction[1];
    const collision =
      x < 0 ||
      x > 3 ||
      y < 0 ||
      y > 3 ||
      robotWalls[level - 1].includes(y * 4 + x);
    frames.push({ x, y, collision });
    if (collision) return { frames, won: false };
  }
  return { frames, won: x === 3 && y === 3 };
}
export function bitValue(bits) {
  return bits.reduce(
    (sum, bit, index) => sum + (bit ? 2 ** (bits.length - index - 1) : 0),
    0,
  );
}
