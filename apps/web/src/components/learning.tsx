"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Bug,
  Check,
  Code2,
  Flame,
  Play,
  RotateCcw,
  ArrowRight,
  Trophy,
  Zap,
} from "lucide-react";
import { api, post } from "@/lib/api";
import {
  robotFrames,
  robotLevels,
  traceChallenges,
  wordGameLevels,
} from "@/lib/learning-games";
import { Shell } from "./shell";
import { Feedback } from "./feedback";

type Progress = {
  game: string;
  level: number;
  completed: boolean;
  attempts: number;
};

type WordCell = { letter: string; state: "exact" | "present" | "absent" };
type WordPuzzle = {
  version: string;
  mode: string;
  wordLength: number;
  maxGuesses: number;
  attempts: number;
  remaining: number;
  completed: boolean;
  boards: {
    index: number;
    solved: boolean;
    solution?: string;
    rows: WordCell[][];
  }[];
};

type LearningSummary = {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  daily: {
    date: string;
    game: string;
    level: number;
    rewardXp: number;
    attempts: number;
    completed: boolean;
  };
};

const games = [
  {
    id: "robot",
    name: "Rota do algoritmo",
    icon: Bot,
    description:
      "Escreva código de verdade em uma DSL segura: funções, repetição, condição e loops.",
  },
  {
    id: "words",
    name: "Código Secreto",
    icon: Code2,
    description:
      "Descubra termos de programação em Solo, Dueto e Quarteto com dificuldade progressiva.",
  },
  {
    id: "trace",
    name: "Detetive de código",
    icon: Bug,
    description: "Investigue variáveis, arrays e laços em JavaScript.",
  },
];

export function Learning() {
  const [access, setAccess] = useState<boolean>();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [summary, setSummary] = useState<LearningSummary>();
  const [dailyMode, setDailyMode] = useState(false);
  const [game, setGame] = useState("robot");
  const [level, setLevel] = useState(1);
  const [commands, setCommands] = useState(robotLevels[0].starter);
  const [position, setPosition] = useState({ x: 0, y: 0, collision: false });
  const [wordPuzzle, setWordPuzzle] = useState<WordPuzzle>();
  const [wordGuess, setWordGuess] = useState("");
  const [answer, setAnswer] = useState("");
  const [frame, setFrame] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [correct, setCorrect] = useState(false);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    try {
      const a = await api<{ eligible: boolean }>("/learning/access");
      setError("");
      setAccess(a.eligible);
      if (a.eligible) {
        const [saved, overview] = await Promise.all([
          api<Progress[]>("/learning/progress"),
          api<LearningSummary>("/learning/summary"),
        ]);
        setProgress(saved);
        setSummary(overview);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadWordPuzzle(targetLevel = level) {
    try {
      setWordPuzzle(
        await api<WordPuzzle>(`/learning/word-puzzle?level=${targetLevel}`),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    const run = generation;
    let active = true;
    api<{ eligible: boolean }>("/learning/access")
      .then(async (a) => {
        if (!active) return;
        setAccess(a.eligible);
        if (a.eligible) {
          const [saved, overview] = await Promise.all([
            api<Progress[]>("/learning/progress"),
            api<LearningSummary>("/learning/summary"),
          ]);
          if (active) {
            setProgress(saved);
            setSummary(overview);
          }
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
      run.current++;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (access !== true || game !== "words") return;
    let active = true;
    api<WordPuzzle>(`/learning/word-puzzle?level=${level}`)
      .then((puzzle) => {
        if (active) setWordPuzzle(puzzle);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [access, game, level]);

  function reset(nextGame = game, nextLevel = level, nextDaily = false) {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    setGame(nextGame);
    setLevel(nextLevel);
    setDailyMode(nextDaily);
    setCommands(
      nextGame === "robot" ? robotLevels[nextLevel - 1].starter : "",
    );
    setPosition({ x: 0, y: 0, collision: false });
    setWordGuess("");
    setWordPuzzle(undefined);
    setAnswer("");
    setFrame(0);
    setRunning(false);
    setMessage("");
    setError("");
    setCorrect(false);
  }

  async function submit(value: string) {
    const token = generation.current;
    setRunning(true);
    setError("");
    try {
      const r = await post<{
        correct: boolean;
        message: string;
        wordPuzzle?: WordPuzzle;
      }>("/learning/attempts", {
        game,
        level,
        answer: value,
        daily: dailyMode,
      });
      if (token !== generation.current) return;
      setCorrect(r.correct);
      setMessage(r.message);
      if (r.wordPuzzle) {
        setWordPuzzle(r.wordPuzzle);
        setWordGuess("");
      }
      const [saved, overview] = await Promise.all([
        api<Progress[]>("/learning/progress"),
        api<LearningSummary>("/learning/summary"),
      ]);
      setProgress(saved);
      setSummary(overview);
    } catch (e) {
      if (token === generation.current) setError((e as Error).message);
    } finally {
      if (token === generation.current) setRunning(false);
    }
  }

  function runRobot() {
    setRunning(true);
    setMessage("");
    setCorrect(false);
    setError("");
    const token = generation.current;
    const result = robotFrames(commands, level);
    if (result.error) {
      setRunning(false);
      setError(result.error);
      return;
    }
    let index = 0;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 260;
    const tick = () => {
      if (token !== generation.current) return;
      setPosition(result.frames[index]);
      index++;
      if (index < result.frames.length) timer.current = setTimeout(tick, delay);
      else void submit(commands);
    };
    tick();
  }

  const trace = traceChallenges[level - 1];
  const robot = robotLevels[level - 1];
  const wordLevel = wordGameLevels[level - 1];

  return (
    <Shell>
      <div className="learning-page">
        <h1>
          Seu próximo passo
          <br />
          começa com código<span className="dot">.</span>
        </h1>
        <p className="lead">
          Desafios curtos que começam acessíveis e evoluem para lógica, código e
          vocabulário técnico de verdade.
        </p>
        <Feedback error={error} />
        {error && <button onClick={() => void load()}>Tentar novamente</button>}

        {access === undefined && !error ? (
          <p role="status">Consultando suas matérias…</p>
        ) : access === false ? (
          <div className="empty">
            <h2>Este laboratório acompanha sua formação.</h2>
            <p>
              Selecione seu curso ou suas UCs de TI no perfil acadêmico para
              liberar os jogos.
            </p>
            <Link className="button" href="/onboarding">
              Atualizar perfil acadêmico
            </Link>
          </div>
        ) : access === true ? (
          <>
            <div className="learning-stats">
              <article>
                <Zap size={22} />
                <span>
                  <strong>{summary?.totalXp ?? 0} XP</strong>
                  Nível {summary?.level ?? 1}
                </span>
              </article>
              <article>
                <Flame size={22} />
                <span>
                  <strong>{summary?.currentStreak ?? 0} dias</strong>
                  Sequência atual
                </span>
              </article>
              <article>
                <Trophy size={22} />
                <span>
                  <strong>{summary?.longestStreak ?? 0} dias</strong>
                  Melhor sequência
                </span>
              </article>
            </div>

            <div className="lab-overview">
              <span>
                <strong>{progress.filter((p) => p.completed).length}</strong> de
                12 desafios concluídos
              </span>
              <progress
                max={12}
                value={progress.filter((p) => p.completed).length}
                aria-label="Desafios concluídos"
              />
              {summary ? (
                <span className="level-progress">
                  {summary.xpIntoLevel}/{summary.xpForNextLevel} XP para o próximo
                  nível
                </span>
              ) : null}
            </div>

            {summary?.daily ? (
              <section
                className={
                  summary.daily.completed ? "daily-card completed" : "daily-card"
                }
              >
                <div>
                  <h2>
                    {summary.daily.completed
                      ? "Missão de hoje concluída"
                      : "Mantenha sua sequência viva"}
                  </h2>
                  <p>
                    {summary.daily.completed
                      ? "Volte amanhã para um novo desafio."
                      : `Complete o desafio ${summary.daily.level} de ${games.find((g) => g.id === summary.daily.game)?.name ?? "prática"} e ganhe +${summary.daily.rewardXp} XP.`}
                  </p>
                </div>
                {!summary.daily.completed ? (
                  <button
                    onClick={() =>
                      reset(summary.daily.game, summary.daily.level, true)
                    }
                  >
                    Fazer desafio diário
                  </button>
                ) : (
                  <Trophy size={32} />
                )}
              </section>
            ) : null}

            <div className="game-tabs" role="tablist" aria-label="Minigames">
              {games.map((g) => (
                <button
                  key={g.id}
                  role="tab"
                  aria-selected={game === g.id}
                  aria-controls="game-panel"
                  id={`tab-${g.id}`}
                  onClick={() => reset(g.id, 1)}
                >
                  <g.icon size={28} />
                  <strong>{g.name}</strong>
                  <small>{g.description}</small>
                </button>
              ))}
            </div>

            <section
              className="game-studio"
              id="game-panel"
              role="tabpanel"
              aria-labelledby={`tab-${game}`}
            >
              <div className="game-heading">
                <div>
                  <h2>{games.find((g) => g.id === game)?.name}</h2>
                  <p className="muted">
                    {dailyMode ? "Desafio diário" : `Desafio ${level} de 4`}
                  </p>
                </div>
                <div className="level-picker" aria-label="Escolher desafio">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      aria-label={`Desafio ${n}`}
                      aria-pressed={level === n}
                      onClick={() => reset(game, n)}
                    >
                      {progress.some(
                        (p) =>
                          p.game === game && p.level === n && p.completed,
                      ) ? (
                        <Check size={16} />
                      ) : (
                        n
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {game === "robot" ? (
                <div className="robot-layout advanced">
                  <div>
                    <h3>Mapa de execução</h3>
                    <p className="muted">{robot.requirement}</p>
                    <div
                      className="robot-grid"
                      style={{
                        gridTemplateColumns: `repeat(${robot.size}, 1fr)`,
                      }}
                      aria-label={`Robô na coluna ${position.x + 1}, linha ${position.y + 1}${position.collision ? ", colisão" : ""}`}
                    >
                      {Array.from(
                        { length: robot.size * robot.size },
                        (_, i) => {
                          const goal =
                            i ===
                            robot.goal[1] * robot.size + robot.goal[0];
                          return (
                            <div
                              key={i}
                              className={
                                robot.walls.includes(i)
                                  ? "wall"
                                  : goal
                                    ? "goal"
                                    : "tile"
                              }
                            >
                              {goal ? "⚑" : i === 0 ? "INÍCIO" : ""}
                            </div>
                          );
                        },
                      )}
                      <span
                        className={`robot-piece ${position.collision ? "collision" : ""}`}
                        style={{
                          width: `${100 / robot.size}%`,
                          height: `${100 / robot.size}%`,
                          transform: `translate(${Math.max(0, Math.min(robot.size - 1, position.x)) * 100}%, ${Math.max(0, Math.min(robot.size - 1, position.y)) * 100}%)`,
                        }}
                      >
                        <Bot size={30} />
                      </span>
                    </div>
                  </div>

                  <div className="program-console code-challenge">
                    <h3>Editor do algoritmo</h3>
                    <p className="muted">
                      Não há botões de direção. Escreva o programa e execute.
                    </p>
                    <textarea
                      className="algorithm-editor"
                      spellCheck={false}
                      value={commands}
                      maxLength={2500}
                      disabled={running}
                      onChange={(e) => setCommands(e.target.value)}
                      aria-label="Código do robô"
                    />
                    <div className="dsl-reference">
                      <code>right(); left(); up(); down();</code>
                      <code>repeat(3) &#123; ... &#125;</code>
                      <code>if (canMove(&quot;R&quot;)) &#123; ... &#125; else &#123; ... &#125;</code>
                      <code>while (canMove(&quot;D&quot;)) &#123; ... &#125;</code>
                    </div>
                    <div className="actions">
                      <button
                        disabled={running || !commands.trim()}
                        onClick={runRobot}
                      >
                        <Play size={16} /> Compilar e executar
                      </button>
                      <button
                        className="secondary"
                        disabled={running}
                        onClick={() => setCommands(robot.starter)}
                      >
                        Restaurar código inicial
                      </button>
                    </div>
                    <p className="lab-hint">
                      A linguagem é interpretada pelo Enturma, sem eval. Nos
                      níveis avançados, repetir movimentos manualmente não é
                      suficiente: o validador exige estruturas de controle.
                    </p>
                  </div>
                </div>
              ) : game === "words" ? (
                <div className="word-game">
                  <div className="word-game-head">
                    <div>
                      <h3>
                        {wordPuzzle?.mode ?? wordLevel.mode} ·{" "}
                        {wordPuzzle?.wordLength ?? wordLevel.length} letras
                      </h3>
                      <p>
                        Uma tentativa é aplicada a todos os quadros. Verde =
                        posição correta; amarelo = existe em outra posição.
                      </p>
                    </div>
                    <span className="word-attempt-counter">
                      {wordPuzzle?.remaining ?? wordLevel.maxGuesses} tentativas
                      restantes
                    </span>
                  </div>

                  <div
                    className={`word-boards boards-${wordPuzzle?.boards.length ?? wordLevel.boards}`}
                  >
                    {(wordPuzzle?.boards ??
                      Array.from({ length: wordLevel.boards }, (_, index) => ({
                        index,
                        solved: false,
                        rows: [],
                      }))).map((board) => (
                      <section
                        className={board.solved ? "word-board solved" : "word-board"}
                        key={board.index}
                      >
                        <header>
                          <strong>
                            {wordLevel.boards === 1
                              ? "Termo"
                              : `Quadro ${board.index + 1}`}
                          </strong>
                          {board.solved ? <Check size={17} /> : null}
                        </header>
                        <div className="word-grid">
                          {Array.from(
                            { length: wordPuzzle?.maxGuesses ?? wordLevel.maxGuesses },
                            (_, rowIndex) => {
                              const row = board.rows[rowIndex];
                              return (
                                <div className="word-row" key={rowIndex}>
                                  {Array.from(
                                    {
                                      length:
                                        wordPuzzle?.wordLength ?? wordLevel.length,
                                    },
                                    (_, colIndex) => {
                                      const cell = row?.[colIndex];
                                      return (
                                        <span
                                          key={colIndex}
                                          className={
                                            cell
                                              ? `word-cell ${cell.state}`
                                              : "word-cell"
                                          }
                                        >
                                          {cell?.letter ?? ""}
                                        </span>
                                      );
                                    },
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                        {board.solution ? (
                          <small>
                            Solução: <strong>{board.solution}</strong>
                          </small>
                        ) : null}
                      </section>
                    ))}
                  </div>

                  <form
                    className="word-guess-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (wordGuess.length === (wordPuzzle?.wordLength ?? wordLevel.length))
                        void submit(wordGuess);
                    }}
                  >
                    <label>
                      Seu termo de programação
                      <input
                        value={wordGuess}
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={wordPuzzle?.wordLength ?? wordLevel.length}
                        placeholder={`Digite ${wordPuzzle?.wordLength ?? wordLevel.length} letras`}
                        disabled={
                          running ||
                          wordPuzzle?.completed ||
                          wordPuzzle?.remaining === 0
                        }
                        onChange={(e) =>
                          setWordGuess(
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z]/g, ""),
                          )
                        }
                      />
                    </label>
                    <button
                      disabled={
                        running ||
                        wordGuess.length !==
                          (wordPuzzle?.wordLength ?? wordLevel.length) ||
                        wordPuzzle?.completed ||
                        wordPuzzle?.remaining === 0
                      }
                    >
                      Confirmar termo
                    </button>
                  </form>
                  <p className="lab-hint">
                    O vocabulário é restrito a programação, desenvolvimento,
                    redes e computação. No Dueto e Quarteto, a mesma palavra
                    precisa gerar pistas úteis em vários quadros ao mesmo tempo.
                  </p>
                </div>
              ) : (
                <div className="trace-layout">
                  <pre className="code-window">
                    <code>{trace.code}</code>
                  </pre>
                  <div>
                    <h3>Qual é a saída?</h3>
                    <label>
                      Resultado de console.log
                      <input
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        inputMode="numeric"
                        maxLength={20}
                        disabled={running}
                      />
                    </label>
                    <button
                      disabled={running || !answer.trim()}
                      onClick={() => void submit(answer)}
                    >
                      Testar hipótese
                    </button>
                    <details>
                      <summary>Preciso de uma pista</summary>
                      <p>{trace.hint}</p>
                      <div
                        className="trace-frame"
                        aria-live="polite"
                        key={frame}
                      >
                        {trace.frames[frame]}
                      </div>
                      <button
                        className="secondary"
                        onClick={() =>
                          setFrame((f) => (f + 1) % trace.frames.length)
                        }
                      >
                        Próximo passo da execução
                      </button>
                    </details>
                  </div>
                </div>
              )}

              <div
                className={`game-result ${correct ? "won" : ""}`}
                role="status"
              >
                {message}
              </div>
              <div className="actions">
                <button
                  className="text-button"
                  disabled={running}
                  onClick={() => reset()}
                >
                  <RotateCcw size={16} /> Recomeçar interface
                </button>
                {correct && level < 4 && (
                  <button onClick={() => reset(game, level + 1)}>
                    Próximo desafio <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </section>

            <p className="muted">
              Exercícios de prática do Enturma. Não substituem atividades ou
              avaliações da sua universidade.
            </p>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
