"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Binary,
  Bot,
  Braces,
  CircuitBoard,
  Flame,
  Gamepad2,
  Grid2X2,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";

type Summary = {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
};

type WordChallenge = {
  challengeKey: string;
  mode: "SOLO" | "DUET" | "QUARTET";
  difficulty: number;
  boards: number;
  wordLength: number;
  maxAttempts: number;
  daily: boolean;
  category: string;
};

type WordBoard = { marks: string; solved: boolean };
type WordAttemptResult = {
  boards: WordBoard[];
  completed: boolean;
  finished: boolean;
  attempt: number;
  maxAttempts: number;
  message: string;
};

type AlgorithmResult = {
  won: boolean;
  stars: number;
  commands: number;
  frames: { x: number; y: number }[];
  message: string;
};

type BinaryOperand = {
  label: string;
  decimal: number;
  binary: string;
};

type BinaryChallenge = {
  challengeKey: string;
  dayLevel: number;
  bitWidth: number;
  operation: string;
  prompt: string;
  hint: string;
  expression: string;
  operands: BinaryOperand[];
  completedToday: boolean;
  completedDays: number;
  rewardXp: number;
};

type BinaryResult = {
  correct: boolean;
  xpAwarded: number;
  expectedBits: string;
  message: string;
  nextDayLevel: number;
};

const algorithmPrompts = [
  {
    title: "Sequência precisa",
    help: "Use os comandos de movimento para chegar ao objetivo sem tocar nos blocos.",
    starter: "moveRight();\nmoveRight();\nmoveDown();",
  },
  {
    title: "Controle de fluxo",
    help: "Este nível exige if, switch, for, while ou repeat(...).",
    starter: "repeat(3, moveRight);\nif (true) {\n  moveDown();\n}",
  },
  {
    title: "Menos comandos",
    help: "Resolva com estrutura de controle e respeite o limite de instruções.",
    starter: "for (let i = 0; i < 4; i++) {\n  moveRight();\n}\nmoveDown();",
  },
  {
    title: "Reutilização",
    help: "A partir daqui você precisa definir ou reutilizar uma função.",
    starter: "function avance() {\n  moveRight();\n}\nrepeat(4, moveRight);",
  },
  {
    title: "Otimização",
    help: "O caminho é mais restrito e o limite de comandos é menor.",
    starter: "const linha = () => {\n  moveRight();\n};\nrepeat(5, moveRight);",
  },
  {
    title: "Desafio avançado",
    help: "Combine abstração, controle de fluxo e raciocínio espacial.",
    starter: "const passo = () => moveRight();\nrepeat(5, moveRight);\nrepeat(5, moveDown);",
  },
];

const wallSets = [
  [8, 14, 20],
  [7, 8, 14, 20, 26],
  [7, 13, 14, 15, 21, 27],
  [2, 8, 14, 20, 26, 27],
  [6, 7, 13, 19, 25, 31],
  [1, 7, 8, 14, 20, 21, 27, 33],
];

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export function ProgrammingLab() {
  const [access, setAccess] = useState<boolean>();
  const [summary, setSummary] = useState<Summary>();
  const [tab, setTab] = useState<"algorithm" | "words" | "binary">("algorithm");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [algorithmLevel, setAlgorithmLevel] = useState(1);
  const [code, setCode] = useState(algorithmPrompts[0].starter);
  const [algorithmResult, setAlgorithmResult] = useState<AlgorithmResult>();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const algorithmAttempts = useRef(0);
  const algorithmStarted = useRef(Date.now());
  const animation = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mode, setMode] = useState<"SOLO" | "DUET" | "QUARTET">("SOLO");
  const [difficulty, setDifficulty] = useState(1);
  const [daily, setDaily] = useState(false);
  const [challenge, setChallenge] = useState<WordChallenge>();
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<{ word: string; boards: WordBoard[] }[]>([]);
  const [wordResult, setWordResult] = useState<WordAttemptResult>();
  const wordStarted = useRef(Date.now());

  const [binary, setBinary] = useState<BinaryChallenge>();
  const [bits, setBits] = useState<boolean[]>([]);
  const [binaryResult, setBinaryResult] = useState<BinaryResult>();
  const binaryStarted = useRef(Date.now());

  async function loadSummary() {
    const [a, s] = await Promise.all([
      api<{ eligible: boolean }>("/learning/access"),
      api<Summary>("/learning/summary").catch(() => undefined),
    ]);
    setAccess(a.eligible);
    if (s) setSummary(s);
  }

  useEffect(() => {
    const bootstrap = setTimeout(() => {
      void loadSummary().catch((e) => setError((e as Error).message));
    }, 0);
    return () => {
      clearTimeout(bootstrap);
      if (animation.current) clearTimeout(animation.current);
    };
  }, []);

  useEffect(() => {
    const reset = setTimeout(() => {
      setCode(algorithmPrompts[algorithmLevel - 1].starter);
      setAlgorithmResult(undefined);
      setPosition({ x: 0, y: 0 });
      algorithmAttempts.current = 0;
      algorithmStarted.current = Date.now();
    }, 0);
    return () => clearTimeout(reset);
  }, [algorithmLevel]);

  useEffect(() => {
    if (tab !== "words" || access !== true) return;
    const bootstrap = setTimeout(() => {
      void loadWordChallenge(mode, difficulty, daily);
    }, 0);
    return () => clearTimeout(bootstrap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, mode, difficulty, daily, access]);

  useEffect(() => {
    if (tab !== "binary" || access !== true) return;
    const bootstrap = setTimeout(() => {
      void loadBinary();
    }, 0);
    return () => clearTimeout(bootstrap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, access]);

  async function loadWordChallenge(
    nextMode = mode,
    nextDifficulty = difficulty,
    nextDaily = daily,
  ) {
    setBusy(true);
    setError("");
    try {
      const data = await api<WordChallenge>(
        `/learning/advanced/words/challenge?mode=${nextMode}&difficulty=${nextDifficulty}&daily=${nextDaily}`,
      );
      setChallenge(data);
      setGuess("");
      setGuesses([]);
      setWordResult(undefined);
      wordStarted.current = Date.now();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadBinary() {
    setBusy(true);
    setError("");
    try {
      const data = await api<BinaryChallenge>("/learning/advanced/binary/challenge");
      setBinary(data);
      setBits(Array.from({ length: data.bitWidth }, () => false));
      setBinaryResult(undefined);
      binaryStarted.current = Date.now();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runAlgorithm() {
    setBusy(true);
    setError("");
    algorithmAttempts.current += 1;
    try {
      const result = await post<AlgorithmResult>("/learning/advanced/algorithm/evaluate", {
        level: algorithmLevel,
        code,
        attempts: algorithmAttempts.current,
        durationMs: Date.now() - algorithmStarted.current,
      });
      setAlgorithmResult(result);
      animateFrames(result.frames);
      if (result.won) await loadSummary();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function animateFrames(frames: { x: number; y: number }[]) {
    if (animation.current) clearTimeout(animation.current);
    let i = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = () => {
      setPosition(frames[i] ?? { x: 0, y: 0 });
      i += 1;
      if (i < frames.length)
        animation.current = setTimeout(next, reduced ? 0 : 220);
    };
    next();
  }

  async function submitWord() {
    if (!challenge || guess.length !== challenge.wordLength) return;
    setBusy(true);
    setError("");
    try {
      const result = await post<WordAttemptResult>("/learning/advanced/words/attempt", {
        challengeKey: challenge.challengeKey,
        mode: challenge.mode,
        difficulty: challenge.difficulty,
        guess,
        guesses: [...guesses.map((item) => item.word), guess],
        attempt: guesses.length + 1,
        daily: challenge.daily,
        durationMs: Date.now() - wordStarted.current,
      });
      setGuesses((current) => [...current, { word: guess, boards: result.boards }]);
      setWordResult(result);
      setGuess("");
      if (result.completed) {
        await loadSummary();
        if (!daily && difficulty < 5)
          setTimeout(() => setDifficulty((value) => Math.min(5, value + 1)), 800);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitBinary() {
    if (!binary) return;
    setBusy(true);
    setError("");
    try {
      const answer = bits.map((bit) => (bit ? "1" : "0")).join("");
      const result = await post<BinaryResult>("/learning/advanced/binary/attempt", {
        challengeKey: binary.challengeKey,
        answer,
        durationMs: Date.now() - binaryStarted.current,
      });
      setBinaryResult(result);
      if (result.correct) await loadSummary();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const completedCount = useMemo(() => guesses.length, [guesses]);
  const binaryValue = useMemo(
    () => parseInt(bits.map((bit) => (bit ? "1" : "0")).join("") || "0", 2),
    [bits],
  );

  return (
    <Shell>
      <div className="programming-lab-page">
        <div className="practice-hero">
          <div>
            <p className="eyebrow">Praticar programação</p>
            <h1>Treino que fica mais difícil conforme você evolui.</h1>
            <p className="lead">
              Resolva lógica, domine termos técnicos e exercite raciocínio binário.
            </p>
          </div>
          <Gamepad2 size={54} />
        </div>

        <Feedback error={error} />

        {access === false ? (
          <div className="empty">
            <h2>Disponível para estudantes de TI.</h2>
            <p>Selecione seu curso ou suas matérias de programação no perfil acadêmico.</p>
          </div>
        ) : access === undefined ? (
          <p role="status">Carregando laboratório…</p>
        ) : (
          <>
            <div className="learning-stats">
              <article>
                <Zap size={22} />
                <span><strong>{summary?.totalXp ?? 0} XP</strong>Nível {summary?.level ?? 1}</span>
              </article>
              <article>
                <Flame size={22} />
                <span><strong>{summary?.currentStreak ?? 0} dias</strong>Sequência atual</span>
              </article>
              <article>
                <Trophy size={22} />
                <span><strong>{summary?.longestStreak ?? 0} dias</strong>Melhor sequência</span>
              </article>
            </div>

            <div className="advanced-game-tabs three" role="tablist">
              <button className={tab === "algorithm" ? "active" : ""} onClick={() => setTab("algorithm")}>
                <Bot size={20} />
                <span><strong>Rota do algoritmo</strong><small>Programe de verdade para avançar</small></span>
              </button>
              <button className={tab === "words" ? "active" : ""} onClick={() => setTab("words")}>
                <Braces size={20} />
                <span><strong>Termo Dev</strong><small>Solo, Dueto e Quarteto técnico</small></span>
              </button>
              <button className={tab === "binary" ? "active" : ""} onClick={() => setTab("binary")}>
                <Binary size={20} />
                <span><strong>Laboratório Binário</strong><small>Desafio diário que evolui com você</small></span>
              </button>
            </div>

            {tab === "algorithm" ? (
              <section className="advanced-game-card">
                <div className="game-heading">
                  <div>
                    <p className="eyebrow">Rota do algoritmo · nível {algorithmLevel}/6</p>
                    <h2>{algorithmPrompts[algorithmLevel - 1].title}</h2>
                    <p>{algorithmPrompts[algorithmLevel - 1].help}</p>
                  </div>
                  <div className="level-picker">
                    {[1,2,3,4,5,6].map((level) => (
                      <button key={level} aria-pressed={algorithmLevel === level} onClick={() => setAlgorithmLevel(level)}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="algorithm-workspace">
                  <div className="algorithm-board">
                    <div className="robot-grid six">
                      {Array.from({ length: 36 }, (_, index) => (
                        <div
                          key={index}
                          className={wallSets[algorithmLevel - 1].includes(index) ? "wall" : index === 35 ? "goal" : "tile"}
                        >
                          {index === 0 ? "INÍCIO" : index === 35 ? "⚑" : ""}
                        </div>
                      ))}
                      <span className="robot-piece six" style={{ transform: `translate(${position.x * 100}%, ${position.y * 100}%)` }}>
                        <Bot size={30} />
                      </span>
                    </div>
                    <div className="algorithm-api-help">
                      <strong>Comandos disponíveis</strong>
                      <code>moveRight()</code><code>moveLeft()</code><code>moveUp()</code>
                      <code>moveDown()</code><code>moveForward()</code><code>repeat(n, moveRight)</code>
                    </div>
                  </div>

                  <div className="algorithm-editor">
                    <div className="code-editor-heading">
                      <span><Braces size={16} /> seu-algoritmo.js</span>
                      <small>Execução segura · sem eval</small>
                    </div>
                    <textarea spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} aria-label="Código do algoritmo" />
                    <div className="actions">
                      <button disabled={busy || !code.trim()} onClick={() => void runAlgorithm()}>
                        <Play size={16} /> Executar algoritmo
                      </button>
                      <button className="secondary" onClick={() => {
                        setCode(algorithmPrompts[algorithmLevel - 1].starter);
                        setAlgorithmResult(undefined);
                        setPosition({ x: 0, y: 0 });
                      }}>
                        <RotateCcw size={16} /> Reiniciar
                      </button>
                    </div>
                    {algorithmResult ? (
                      <div className={algorithmResult.won ? "game-result won" : "game-result"}>
                        <strong>{algorithmResult.message}</strong>
                        {algorithmResult.won ? <span>{"★".repeat(algorithmResult.stars)}{"☆".repeat(3 - algorithmResult.stars)} · {algorithmResult.commands} comandos</span> : null}
                      </div>
                    ) : null}
                    {algorithmResult?.won && algorithmLevel < 6 ? (
                      <button onClick={() => setAlgorithmLevel((value) => value + 1)}>Próximo nível <ArrowRight size={16} /></button>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {tab === "words" ? (
              <section className="advanced-game-card word-game compact-word-game">
                <div className="game-heading">
                  <div>
                    <p className="eyebrow">Termo Dev · {challenge?.category ?? "Programação"}</p>
                    <h2>Encontre {mode === "SOLO" ? "a palavra" : mode === "DUET" ? "as duas palavras" : "as quatro palavras"}.</h2>
                    <p>Cada tentativa vale para todos os tabuleiros.</p>
                  </div>
                </div>

                <div className="word-config">
                  <div>
                    {(["SOLO","DUET","QUARTET"] as const).map((value) => (
                      <button key={value} className={mode === value ? "active" : "secondary"} onClick={() => setMode(value)}>
                        {value === "SOLO" ? "Solo" : value === "DUET" ? "Dueto" : "Quarteto"}
                      </button>
                    ))}
                  </div>
                  <div className="difficulty-picker">
                    {[1,2,3,4,5].map((value) => (
                      <button key={value} aria-pressed={difficulty === value} onClick={() => setDifficulty(value)}>{value}</button>
                    ))}
                  </div>
                  <label className="daily-toggle">
                    <input type="checkbox" checked={daily} onChange={(e) => setDaily(e.target.checked)} />
                    Desafio diário
                  </label>
                </div>

                {challenge ? (
                  <>
                    <div className={`word-boards boards-${challenge.boards}`}>
                      {Array.from({ length: challenge.boards }, (_, boardIndex) => (
                        <div className="word-board" key={boardIndex}>
                          <header><Grid2X2 size={16} /><strong>{challenge.boards === 1 ? "Palavra" : `Palavra ${boardIndex + 1}`}</strong></header>
                          {Array.from({ length: challenge.maxAttempts }, (_, row) => {
                            const played = guesses[row];
                            return (
                              <div className="word-row" key={row} style={{ gridTemplateColumns: `repeat(${challenge.wordLength}, minmax(0, 1fr))` }}>
                                {Array.from({ length: challenge.wordLength }, (_, column) => {
                                  const letter = played?.word[column] ?? "";
                                  const mark = played?.boards[boardIndex]?.marks[column];
                                  return (
                                    <span key={column} className={mark === "C" ? "correct" : mark === "P" ? "present" : mark === "A" ? "absent" : ""}>
                                      {letter}
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="word-entry">
                      <input
                        value={guess}
                        onChange={(e) => setGuess(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, challenge.wordLength))}
                        maxLength={challenge.wordLength}
                        disabled={busy || wordResult?.finished}
                        placeholder={`${challenge.wordLength} letras`}
                        aria-label="Palavra tentativa"
                        onKeyDown={(e) => { if (e.key === "Enter") void submitWord(); }}
                      />
                      <button disabled={busy || wordResult?.finished || guess.length !== challenge.wordLength} onClick={() => void submitWord()}>
                        Testar palavra
                      </button>
                    </div>

                    <div className="virtual-keyboard" aria-hidden="true">
                      {keyboardRows.map((row) => <div key={row}>{row.split("").map((letter) => <span key={letter}>{letter}</span>)}</div>)}
                    </div>

                    <div className={wordResult?.completed ? "game-result won" : "game-result"}>
                      {wordResult ? <><strong>{wordResult.message}</strong><span>{completedCount}/{challenge.maxAttempts} tentativas</span></> : <span>Verde: posição certa · amarelo: presente · cinza: ausente</span>}
                    </div>

                    {wordResult?.finished ? (
                      <button className="secondary" onClick={() => void loadWordChallenge()}>
                        <Sparkles size={16} /> Jogar novamente
                      </button>
                    ) : null}
                  </>
                ) : <p role="status">Preparando desafio…</p>}
              </section>
            ) : null}

            {tab === "binary" ? (
              <section className="advanced-game-card binary-lab">
                {binary ? (
                  <>
                    <div className="binary-lab-header">
                      <div>
                        <p className="eyebrow">Laboratório Binário · dia {binary.dayLevel}</p>
                        <h2>{binary.prompt}</h2>
                        <p>{binary.hint}</p>
                      </div>
                      <div className="binary-progress-badge">
                        <CircuitBoard size={22} />
                        <span><strong>{binary.completedDays}</strong> dias concluídos</span>
                      </div>
                    </div>

                    <div className="binary-expression">
                      <small>Expressão do circuito</small>
                      <strong>{binary.expression}</strong>
                    </div>

                    <div className="binary-operands">
                      {binary.operands.map((operand) => (
                        <article key={operand.label}>
                          <strong>{operand.label}</strong>
                          <code>{operand.binary}</code>
                          <small>decimal {operand.decimal}</small>
                        </article>
                      ))}
                    </div>

                    <div className="binary-switch-board">
                      {bits.map((enabled, index) => {
                        const power = bits.length - index - 1;
                        return (
                          <button
                            type="button"
                            key={index}
                            className={enabled ? "bit-on" : ""}
                            aria-pressed={enabled}
                            disabled={binary.completedToday || Boolean(binaryResult?.correct)}
                            onClick={() =>
                              setBits((current) =>
                                current.map((value, i) => (i === index ? !value : value)),
                              )
                            }
                          >
                            <span>{enabled ? "1" : "0"}</span>
                            <small>2^{power}</small>
                          </button>
                        );
                      })}
                    </div>

                    <div className="binary-current-value">
                      <span>Resultado montado</span>
                      <strong>{bits.map((bit) => (bit ? "1" : "0")).join("")}</strong>
                      <small>decimal {binaryValue}</small>
                    </div>

                    <div className="binary-actions">
                      <button disabled={busy || binary.completedToday || Boolean(binaryResult?.correct)} onClick={() => void submitBinary()}>
                        <Zap size={17} /> Validar circuito
                      </button>
                      <button className="secondary" disabled={binary.completedToday} onClick={() => setBits(Array.from({ length: binary.bitWidth }, () => false))}>
                        <RotateCcw size={16} /> Limpar
                      </button>
                    </div>

                    {binary.completedToday ? (
                      <div className="game-result won">
                        <strong>Desafio diário concluído.</strong>
                        <span>Amanhã o laboratório sobe de nível e adiciona novas operações.</span>
                      </div>
                    ) : binaryResult ? (
                      <div className={binaryResult.correct ? "game-result won" : "game-result"}>
                        <strong>{binaryResult.message}</strong>
                        {binaryResult.correct ? <span>+{binaryResult.xpAwarded} XP · próximo nível diário {binaryResult.nextDayLevel}</span> : null}
                      </div>
                    ) : null}

                    <div className="binary-difficulty-roadmap">
                      <span>Dia 1 · decimal → binário</span>
                      <span>Dia 2 · soma</span>
                      <span>Dia 3 · XOR</span>
                      <span>Dia 4 · AND/OR</span>
                      <span>Dia 5 · shift + XOR</span>
                      <span>Dia 6+ · pipelines progressivos</span>
                    </div>
                  </>
                ) : <p role="status">Montando circuito diário…</p>}
              </section>
            ) : null}
          </>
        )}
      </div>
    </Shell>
  );
}
