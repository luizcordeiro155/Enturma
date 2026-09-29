"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Braces, Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";

type Board = { marks: string; solved: boolean };
type Played = { word: string; boards: Board[] };
type Challenge = {
  challengeKey: string;
  mode: string;
  difficulty: number;
  daily: boolean;
  boards: number;
  wordLength: number;
  maxAttempts: number;
  history: Played[];
  finished: boolean;
};
type WordResult = {
  boards: Board[];
  finished: boolean;
  completed: boolean;
  message: string;
  answers?: string[];
};
type Frame = { x: number; y: number; step: number };
type Run = {
  won: boolean;
  stars: number;
  commands: number;
  frames: Frame[];
  message: string;
};
const difficultyNames = ["Fácil", "Médio", "Difícil", "Especialista", "Insano"];
const starter =
  "// Programe o caminho até a bandeira.\n// Use x, y, blocked() e atGoal() como sensores.\nrepeat(2, moveRight);\nmoveDown();";
export function ProgrammingLab() {
  const [eligible, setEligible] = useState<boolean>();
  const [tab, setTab] = useState("words");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<{
    totalXp: number;
    level: number;
    currentStreak: number;
  }>();
  const [mode, setMode] = useState("SOLO");
  const [difficulty, setDifficulty] = useState(1);
  const [daily, setDaily] = useState(false);
  const [challenge, setChallenge] = useState<Challenge>();
  const [played, setPlayed] = useState<Played[]>([]);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<WordResult>();
  const [level, setLevel] = useState(1);
  const [walls, setWalls] = useState<number[]>([]);
  const [loadedLevel, setLoadedLevel] = useState(0);
  const [code, setCode] = useState(starter);
  const [run, setRun] = useState<Run>();
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const started = useRef(0);
  const attempts = useRef(0);
  const refresh = useCallback(
    () =>
      api<{ totalXp: number; level: number; currentStreak: number }>(
        "/learning/summary",
      ).then(setSummary),
    [],
  );
  useEffect(() => {
    started.current = Date.now();
    api<{ eligible: boolean }>("/learning/access")
      .then((r) => setEligible(r.eligible))
      .catch((e) => setError(e.message));
    void refresh().catch(() => {});
  }, [refresh]);
  useEffect(() => {
    if (!eligible) return;
    let active = true;
    api<{ walls: number[] }>(
      `/learning/advanced/algorithm/challenge?level=${level}`,
    )
      .then((r) => {
        if (active) {
          setWalls(r.walls);
          setLoadedLevel(level);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [level, eligible]);
  useEffect(() => {
    if (!playing || !run) return;
    const timer = setTimeout(() => {
      if (frame >= run.frames.length - 1) setPlaying(false);
      else setFrame(frame + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [playing, frame, run]);
  async function newWord() {
    setBusy(true);
    setError("");
    try {
      const c = await api<Challenge>(
        `/learning/advanced/words/challenge?mode=${mode}&difficulty=${difficulty}&daily=${daily}`,
      );
      setChallenge(c);
      setPlayed(c.history ?? []);
      setGuess("");
      setResult(
        c.finished
          ? {
              finished: true,
              completed: false,
              message:
                "Desafio diário já concluído. Volte amanhã ou escolha treino livre.",
              boards: [],
            }
          : undefined,
      );
      started.current = Date.now();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submitWord() {
    if (
      !challenge ||
      busy ||
      result?.finished ||
      guess.length !== challenge.wordLength
    )
      return;
    setBusy(true);
    setError("");
    try {
      const r = await post<WordResult>("/learning/advanced/words/attempt", {
        challengeKey: challenge.challengeKey,
        mode: challenge.mode,
        difficulty: challenge.difficulty,
        daily: challenge.daily,
        guess,
        guesses: [],
        attempt: played.length + 1,
        durationMs: Date.now() - started.current,
      });
      setPlayed((v) => [...v, { word: guess, boards: r.boards }]);
      setResult(r);
      setGuess("");
      if (r.completed) void refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function execute() {
    if (busy || loadedLevel !== level) return;
    setBusy(true);
    setError("");
    setPlaying(false);
    try {
      const r = await post<Run>("/learning/advanced/algorithm/evaluate", {
        level,
        code,
        attempts: Math.min(++attempts.current, 100),
        durationMs: Date.now() - started.current,
      });
      setRun(r);
      setFrame(0);
      const reduced =
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.dataset.reducedMotion === "true";
      if (reduced) setFrame(r.frames.length - 1);
      else setPlaying(true);
      if (r.won) void refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function changeLevel(next: number) {
    setLevel(next);
    setRun(undefined);
    setFrame(0);
    setPlaying(false);
    attempts.current = 0;
    started.current = Date.now();
  }
  const position = run?.frames[frame] ?? { x: 0, y: 0, step: 0 };
  return (
    <Shell>
      <div className="programming-lab">
        <header className="lab-heading">
          <h1>Aprenda jogando. Evolua programando.</h1>
          <p>Desafios de programação com progresso salvo no seu perfil.</p>
        </header>
        <Feedback error={error} />
        {eligible === false ? (
          <p>
            Estes desafios são liberados para estudantes de cursos ou matérias
            de TI.
          </p>
        ) : eligible === undefined ? (
          <p role="status">Carregando laboratório…</p>
        ) : (
          <>
            <div className="learning-stats">
              <span>
                <strong>{summary?.totalXp ?? 0}</strong> XP
              </span>
              <span>Nível {summary?.level ?? 1}</span>
              <span>{summary?.currentStreak ?? 0} dias de sequência</span>
            </div>
            <nav className="advanced-game-tabs" aria-label="Minigames">
              <button
                aria-pressed={tab === "words"}
                onClick={() => setTab("words")}
              >
                <Braces size={20} /> Termo Dev
              </button>
              <button
                aria-pressed={tab === "algorithm"}
                onClick={() => setTab("algorithm")}
              >
                <Bot size={20} /> Rota do Algoritmo
              </button>
            </nav>
            {tab === "words" ? (
              <section className="advanced-game-card">
                <h2>Termo Dev</h2>
                <p>
                  Investigue palavras técnicas. Cada treino sorteia uma nova
                  combinação; o desafio diário é igual para todos.
                </p>
                <div className="word-settings">
                  <label>
                    Modo
                    <select
                      value={mode}
                      disabled={busy}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      <option value="SOLO">Solo</option>
                      <option value="DUET">Dueto</option>
                      <option value="QUARTET">Quarteto</option>
                    </select>
                  </label>
                  <label>
                    Dificuldade
                    <select
                      value={difficulty}
                      disabled={busy}
                      onChange={(e) => setDifficulty(Number(e.target.value))}
                    >
                      {difficultyNames.map((n, i) => (
                        <option key={n} value={i + 1}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={daily}
                      disabled={busy}
                      onChange={(e) => setDaily(e.target.checked)}
                    />
                    Desafio diário
                  </label>
                  <button disabled={busy} onClick={() => void newWord()}>
                    {busy ? "Preparando…" : "Iniciar nova rodada"}
                  </button>
                </div>
                {challenge ? (
                  <>
                    <p>
                      {difficultyNames[challenge.difficulty - 1]} ·{" "}
                      {challenge.wordLength} letras · {played.length}/
                      {challenge.maxAttempts} tentativas ·{" "}
                      {challenge.daily ? "Diário" : "Treino livre"}
                    </p>
                    <div className={`word-boards boards-${challenge.boards}`}>
                      {Array.from({ length: challenge.boards }, (_, b) => (
                        <div className="word-board" key={b}>
                          <h3>Palavra {b + 1}</h3>
                          {Array.from(
                            { length: challenge.maxAttempts },
                            (_, r) => (
                              <div
                                className="word-row"
                                key={r}
                                style={{
                                  gridTemplateColumns: `repeat(${challenge.wordLength},minmax(28px,1fr))`,
                                }}
                              >
                                {Array.from(
                                  { length: challenge.wordLength },
                                  (_, c) => {
                                    const mark = played[r]?.boards[b]?.marks[c];
                                    const letter = played[r]?.word[c] ?? "";
                                    return (
                                      <span
                                        key={c}
                                        className={
                                          mark === "C"
                                            ? "correct"
                                            : mark === "P"
                                              ? "present"
                                              : mark === "A"
                                                ? "absent"
                                                : ""
                                        }
                                        aria-label={`${letter || "vazio"}: ${mark === "C" ? "posição correta" : mark === "P" ? "outra posição" : mark === "A" ? "ausente" : "não preenchido"}`}
                                      >
                                        {letter}
                                      </span>
                                    );
                                  },
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      ))}
                    </div>
                    <form
                      className="word-entry"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submitWord();
                      }}
                    >
                      <label>
                        Palavra tentativa
                        <input
                          value={guess}
                          autoComplete="off"
                          autoCapitalize="characters"
                          maxLength={challenge.wordLength}
                          disabled={busy || result?.finished}
                          onChange={(e) =>
                            setGuess(
                              e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z]/g, ""),
                            )
                          }
                        />
                      </label>
                      <button
                        disabled={
                          busy ||
                          result?.finished ||
                          guess.length !== challenge.wordLength
                        }
                      >
                        Testar palavra
                      </button>
                    </form>
                    <div
                      className="virtual-keyboard"
                      aria-label="Teclado de letras"
                    >
                      {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row) => (
                        <div key={row}>
                          {row.split("").map((letter) => (
                            <button
                              key={letter}
                              type="button"
                              aria-label={`Letra ${letter}`}
                              disabled={busy || result?.finished}
                              onClick={() =>
                                setGuess((v) =>
                                  (v + letter).slice(0, challenge.wordLength),
                                )
                              }
                            >
                              {letter}
                            </button>
                          ))}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setGuess((v) => v.slice(0, -1))}
                        disabled={busy || result?.finished}
                      >
                        Apagar letra
                      </button>
                    </div>
                    <p role="status" className="game-result">
                      {result?.message ??
                        "Verde: posição correta. Amarelo: outra posição. Cinza: ausente."}
                      {result?.answers
                        ? ` Palavras: ${result.answers.join(", ")}.`
                        : ""}
                    </p>
                  </>
                ) : (
                  <div className="empty">
                    <p>Escolha Solo, Dueto ou Quarteto e inicie uma rodada.</p>
                  </div>
                )}
              </section>
            ) : (
              <section className="advanced-game-card">
                <div className="game-heading">
                  <div>
                    <h2>Rota do Algoritmo · nível {level}</h2>
                    <p>
                      Execute um programa real na linguagem limitada do jogo.
                      Cada nível gera um mapa com solução.
                    </p>
                  </div>
                  <label>
                    Nível
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={level}
                      onChange={(e) =>
                        changeLevel(
                          Math.max(
                            1,
                            Math.min(100000, Number(e.target.value) || 1),
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <div className="algorithm-workspace">
                  <div className="algorithm-board">
                    <div
                      className="robot-grid six"
                      aria-label={`Robô na coluna ${position.x + 1}, linha ${position.y + 1}`}
                    >
                      {Array.from({ length: 36 }, (_, i) => (
                        <div
                          key={i}
                          className={
                            walls.includes(i)
                              ? "wall"
                              : i === 35
                                ? "goal"
                                : "tile"
                          }
                        >
                          {i === 0 ? "INÍCIO" : i === 35 ? "FIM" : ""}
                        </div>
                      ))}
                      <span
                        className="robot-piece six"
                        style={{
                          transform: `translate(${position.x * 100}%,${position.y * 100}%)`,
                        }}
                      >
                        <Bot size={28} />
                      </span>
                    </div>
                    <p role="status">
                      Passo {position.step} · Coluna {position.x + 1}, linha{" "}
                      {position.y + 1}
                    </p>
                  </div>
                  <div className="algorithm-editor">
                    <label htmlFor="algorithm-code">Seu programa</label>
                    <textarea
                      id="algorithm-code"
                      spellCheck={false}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={6000}
                    />
                    <div className="actions">
                      <button
                        disabled={busy || !code.trim()}
                        onClick={() => void execute()}
                      >
                        <Play size={16} />
                        Executar
                      </button>
                      <button
                        className="secondary"
                        disabled={!run}
                        onClick={() => setPlaying(!playing)}
                      >
                        {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
                        {playing ? "Pausar" : "Reproduzir"}
                      </button>
                      <button
                        className="secondary"
                        disabled={!run || frame >= run.frames.length - 1}
                        onClick={() => {
                          setPlaying(false);
                          setFrame((v) => v + 1);
                        }}
                      >
                        <SkipForward size={16} />
                        Passo
                      </button>
                      <button
                        className="secondary"
                        onClick={() => {
                          setPlaying(false);
                          setFrame(0);
                        }}
                      >
                        <RotateCcw size={16} />
                        Resetar execução
                      </button>
                    </div>
                    <details>
                      <summary>Comandos, sensores e exemplos</summary>
                      <p>
                        moveRight(), moveLeft(), moveUp(), moveDown(),
                        moveForward(), turnRight(), turnLeft(). Use blocked(),
                        atGoal(), x e y. Limite: 100 movimentos e 1000
                        operações.
                      </p>
                      <pre>
                        {
                          "let passos = 0;\nfunction avancar() {\n  if (!blocked()) { moveForward(); }\n  else { turnRight(); }\n}\nwhile (!atGoal() && passos < 30) {\n  avancar();\n  passos = passos + 1;\n}\n// Também: repeat(3, moveDown);\n// ou repeat(3) { moveDown(); }"
                        }
                      </pre>
                      <p>
                        Não há acesso à internet, DOM ou arquivos. Sintaxe não
                        suportada é rejeitada, nunca ignorada.
                      </p>
                    </details>
                    {run ? (
                      <p role="status" className="game-result">
                        {run.message}{" "}
                        {run.won
                          ? `${run.stars} estrelas · ${run.commands} movimentos`
                          : ""}
                      </p>
                    ) : null}
                    {run?.won && level < 100000 ? (
                      <button onClick={() => changeLevel(level + 1)}>
                        Próximo desafio
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
