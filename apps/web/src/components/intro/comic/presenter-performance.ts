import storyboard from "../intro-storyboard.json";
import words from "./narration-words.json";

// Each scene has its own shoulder/elbow/head/body key poses. Articulated
// movement is sampled at 24 fps, independently of comic panel frame holds.
const directions = [
  [
    "Boas-vindas",
    [0, 5],
    "18,112,-10,-142,-5,0;31,145,-13,-149,4,-3;24,126,-9,-145,-3,1;28,141,-15,-139,3,-2;15,112,-8,-132,0,0",
  ],
  [
    "Dúvida",
    [1, 5],
    "8,68,-8,-120,-7,-2;32,97,-18,-140,-12,-4;18,110,-3,-132,5,0;38,87,-11,-149,-5,2;16,82,-8,-125,-3,0",
  ],
  [
    "Preocupação",
    [1, 1],
    "10,72,-10,-72,3,0;33,118,-29,-111,-8,-4;22,95,-18,-94,6,1;35,126,-32,-120,-5,-3;12,90,-13,-90,0,0",
  ],
  [
    "Apresentando a solução",
    [2, 1],
    "5,80,-8,-90,-4,2;25,152,-29,-97,5,-3;18,141,-38,-99,1,0;24,155,-25,-111,-4,-2;17,122,-16,-89,2,0",
  ],
  [
    "Orgulho pela conquista",
    [4, 3],
    "12,89,-14,-91,0,0;24,145,-28,-142,-5,-4;19,130,-20,-136,4,1;27,151,-22,-147,-3,-3;12,106,-20,-126,2,0",
  ],
  [
    "Curiosidade",
    [2, 6],
    "7,98,-4,-134,-6,2;30,135,-11,-145,5,-2;16,148,-7,-139,-4,1;36,118,-13,-148,3,-2;12,103,-5,-132,0,0",
  ],
  [
    "Compartilhando novidades",
    [1, 5],
    "12,92,-8,-135,4,0;32,112,-19,-148,-4,-2;18,145,-9,-135,5,2;38,100,-24,-140,0,-3;14,93,-8,-133,-2,0",
  ],
  [
    "Escutando a turma",
    [1, 0],
    "13,99,-10,-104,-4,0;31,119,-20,-148,6,-2;20,103,-15,-142,-3,2;36,114,-28,-130,4,-2;14,90,-10,-106,0,0",
  ],
  [
    "Indicando o caminho",
    [2, 7],
    "12,101,-10,-119,-2,0;42,105,-24,-145,5,-3;30,123,-15,-135,-4,1;39,109,-28,-140,3,-2;15,99,-12,-117,0,0",
  ],
  [
    "Conversando em chamada",
    [0, 5],
    "14,109,-9,-133,3,0;32,141,-17,-149,-4,-2;22,128,-8,-139,5,1;28,148,-18,-143,-2,-3;13,105,-9,-132,0,0",
  ],
  [
    "Comemorando",
    [4, 4],
    "12,87,-15,-94,-3,0;31,146,-33,-139,4,-6;20,111,-19,-122,-5,2;28,153,-29,-152,3,-5;17,102,-18,-108,0,0",
  ],
  [
    "Conectando amigos",
    [3, 5],
    "9,103,-8,-128,2,0;23,148,-19,-146,-4,-2;17,127,-9,-137,5,1;32,138,-18,-143,-2,-3;13,108,-8,-125,0,0",
  ],
  [
    "Escolhendo as matérias",
    [2, 6],
    "10,88,-8,-131,-5,0;28,127,-14,-144,4,-2;18,144,-6,-137,-3,1;34,113,-19,-142,5,-2;14,101,-8,-132,0,0",
  ],
  [
    "Celebrando as conexões",
    [3, 1],
    "12,108,-14,-102,3,0;28,144,-33,-122,-4,-3;20,132,-20,-106,4,1;33,145,-29,-129,-2,-2;13,115,-16,-96,0,0",
  ],
  [
    "Convidando a participar",
    [1, 1],
    "11,92,-12,-96,-3,0;34,114,-34,-116,4,-3;23,124,-22,-123,-2,1;39,106,-36,-107,3,-2;20,107,-20,-110,0,0",
  ],
  [
    "Convite final",
    [0, 3],
    "14,102,-12,-112,2,0;29,149,-28,-143,-4,-3;22,133,-21,-134,4,1;31,145,-24,-149,-2,-2;18,123,-16,-124,0,0",
  ],
] as const;
export const PERFORMANCES = directions.map(([name, hands, poses]) => ({
  name,
  hands,
  poses: poses.split(";").map((row) => row.split(",").map(Number)),
}));
const TIMING = [
  [0, 0.18, 0.42, 0.71, 1],
  [0, 0.24, 0.48, 0.79, 1],
  [0, 0.2, 0.54, 0.82, 1],
  [0, 0.16, 0.43, 0.7, 1],
  [0, 0.22, 0.49, 0.73, 1],
  [0, 0.19, 0.53, 0.81, 1],
  [0, 0.27, 0.56, 0.77, 1],
  [0, 0.23, 0.5, 0.84, 1],
  [0, 0.17, 0.41, 0.76, 1],
  [0, 0.2, 0.55, 0.78, 1],
  [0, 0.18, 0.44, 0.72, 1],
  [0, 0.28, 0.5, 0.79, 1],
  [0, 0.21, 0.47, 0.82, 1],
  [0, 0.24, 0.54, 0.8, 1],
  [0, 0.15, 0.4, 0.74, 1],
  [0, 0.19, 0.46, 0.72, 1],
];

export function performanceAt(scene: number, frame: number, still = false) {
  const acting = PERFORMANCES[scene];
  const duration =
    storyboard.sceneFrames[scene + 1] - storyboard.sceneFrames[scene];
  const progress = still
    ? 0.48
    : Math.max(0, Math.min(1, frame / (duration - 1)));
  const timing = TIMING[scene];
  const section = Math.max(
    0,
    Math.min(
      3,
      timing.findLastIndex((at) => at <= progress),
    ),
  );
  const t =
    (progress - timing[section]) / (timing[section + 1] - timing[section]);
  const eased = t * t * (3 - 2 * t);
  const joints = acting.poses[section].map(
    (start, i) => start + (acting.poses[section + 1][i] - start) * eased,
  );
  const emphasis = still ? 0 : Math.sin(Math.PI * t) * (section % 2 ? -1 : 1);
  return {
    leftShoulder: joints[0] + emphasis * 1.8,
    leftElbow: joints[1] + emphasis * 3,
    rightShoulder: joints[2] - emphasis * 1.2,
    rightElbow: joints[3] - emphasis * 2.1,
    head: joints[4] + emphasis * 0.8,
    lift: joints[5],
    leftWrist: still
      ? -8
      : -8 +
        emphasis * 8 +
        ([0, 9, 15].includes(scene) && section === 1
          ? Math.sin(t * Math.PI * 4) * 7
          : 0),
    rightWrist: still ? 5 : 5 - emphasis * 4,
    breath: still ? 0 : Math.sin(frame / 12 + scene) * 1.2,
    progress,
  };
}

// Substitutions follow the recorded word boundaries, closing in actual pauses.
// This is approximate vowel articulation, not claimed phoneme forced alignment.
export function faceAt(scene: number, frame: number, still = false) {
  if (still) return { mouth: 0, eyes: scene === 1 || scene === 2 ? 5 : 0 };
  const ms = ((storyboard.sceneFrames[scene] + frame) / storyboard.fps) * 1000;
  const word = words.find((w) => w.startMs <= ms && w.endMs > ms);
  let mouth = 0;
  if (word) {
    const letters = word.text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const fraction = (ms - word.startMs) / (word.endMs - word.startMs);
    const letter =
      letters[
        Math.min(letters.length - 1, Math.floor(fraction * letters.length))
      ];
    mouth = /[ou]/.test(letter)
      ? 3
      : /[ei]/.test(letter)
        ? 2
        : /[bmp]/.test(letter)
          ? 0
          : 1;
  }
  const duration =
    storyboard.sceneFrames[scene + 1] - storyboard.sceneFrames[scene];
  const blink = frame - Math.round(duration * (0.37 + (scene % 4) * 0.08));
  const eyes = blink === -2 || blink === 2 ? 7 : Math.abs(blink) < 2 ? 4 : 0;
  return { mouth, eyes };
}
