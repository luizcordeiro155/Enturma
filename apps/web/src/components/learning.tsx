"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Binary,
  Bug,
  Check,
  Play,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Flame,
  Trophy,
  Zap,
} from "lucide-react";
import { api, post } from "@/lib/api";
import {
  robotFrames,
  robotWalls,
  binaryTargets,
  bitValue,
  traceChallenges,
} from "@/lib/learning-games";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
type Progress = {
  game: string;
  level: number;
  completed: boolean;
  attempts: number;
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
    description: "Programe o caminho. Execute. Observe cada passo.",
  },
  {
    id: "binary",
    name: "Laboratório binário",
    icon: Binary,
    description: "Transforme números em bits e veja a matemática acontecer.",
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
  const [commands, setCommands] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0, collision: false });
  const [bits, setBits] = useState<boolean[]>(Array(6).fill(false));
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
  function reset(nextGame = game, nextLevel = level, nextDaily = false) {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    setGame(nextGame);
    setLevel(nextLevel);
    setDailyMode(nextDaily);
    setCommands("");
    setPosition({ x: 0, y: 0, collision: false });
    setBits(Array(6).fill(false));
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
      const r = await post<{ correct: boolean; message: string }>(
        "/learning/attempts",
        { game, level, answer: value, daily: dailyMode },
      );
      if (token !== generation.current) return;
      setCorrect(r.correct);
      setMessage(r.message);
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
    const token = generation.current;
    const result = robotFrames(commands, level);
    let index = 0;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 420;
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
  return (
    <Shell>
      <div className="learning-page">
        <p className="eyebrow">Aprender fazendo · Laboratório de TI</p>
        <h1>
          Seu próximo passo
          <br />
          começa com código<span className="dot">.</span>
        </h1>
        <p className="lead">
          Pequenos desafios. Descobertas de verdade. Pratique no seu ritmo.
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
                  {summary.xpIntoLevel}/{summary.xpForNextLevel} XP para o próximo nível
                </span>
              ) : null}
            </div>
            {summary?.daily ? (
              <section className={summary.daily.completed ? "daily-card completed" : "daily-card"}>
                <div>
                  <p className="eyebrow">Desafio diário · +{summary.daily.rewardXp} XP</p>
                  <h2>
                    {summary.daily.completed
                      ? "Missão de hoje concluída"
                      : "Mantenha sua sequência viva"}
                  </h2>
                  <p>
                    {summary.daily.completed
                      ? "Volte amanhã para um novo desafio."
                      : `Complete o desafio ${summary.daily.level} de ${games.find((g) => g.id === summary.daily.game)?.name ?? "prática"}.`}
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
                  <span className="eyebrow">
                    {dailyMode ? "Desafio diário" : `Desafio ${level} de 4`}
                  </span>
                  <h2>{games.find((g) => g.id === game)?.name}</h2>
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
                        (p) => p.game === game && p.level === n && p.completed,
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
                <div className="robot-layout">
                  <div>
                    <p>
                      Leve o robô do início até a bandeira. Evite os blocos.
                      Cada seta é uma instrução.
                    </p>
                    <div
                      className="robot-grid"
                      aria-label={`Robô na coluna ${position.x + 1}, linha ${position.y + 1}${position.collision ? ", colisão" : ""}`}
                    >
                      {Array.from({ length: 16 }, (_, i) => (
                        <div
                          key={i}
                          className={
                            robotWalls[level - 1].includes(i)
                              ? "wall"
                              : i === 15
                                ? "goal"
                                : "tile"
                          }
                        >
                          {i === 15 ? "⚑" : i === 0 ? "INÍCIO" : ""}
                        </div>
                      ))}
                      <span
                        className={`robot-piece ${position.collision ? "collision" : ""}`}
                        style={{
                          transform: `translate(${Math.max(0, Math.min(3, position.x)) * 100}%, ${Math.max(0, Math.min(3, position.y)) * 100}%)`,
                        }}
                      >
                        <Bot size={32} />
                      </span>
                    </div>
                  </div>
                  <div className="program-console">
                    <h3>Seu programa</h3>
                    <p className="muted">
                      Até 24 comandos · {commands.length} usados
                    </p>
                    <div className="command-track" aria-live="polite">
                      {commands ? (
                        commands
                          .split("")
                          .map((c, i) => (
                            <span key={i}>
                              {{ R: "→", L: "←", U: "↑", D: "↓" }[c]}
                            </span>
                          ))
                      ) : (
                        <span className="muted">
                          Adicione instruções abaixo
                        </span>
                      )}
                    </div>
                    <div className="command-buttons">
                      {[
                        ["U", ArrowUp, "Cima"],
                        ["L", ArrowLeft, "Esquerda"],
                        ["D", ArrowDown, "Baixo"],
                        ["R", ArrowRight, "Direita"],
                      ].map(([c, Icon, label]) => {
                        const Direction = Icon as typeof ArrowUp;
                        return (
                          <button
                            key={String(c)}
                            aria-label={String(label)}
                            disabled={running || commands.length >= 24}
                            onClick={() => setCommands((s) => s + String(c))}
                          >
                            <Direction size={23} />
                          </button>
                        );
                      })}
                    </div>
                    <div className="actions">
                      <button
                        disabled={running || !commands}
                        onClick={runRobot}
                      >
                        <Play size={16} /> Executar
                      </button>
                      <button
                        className="secondary"
                        disabled={running || !commands}
                        onClick={() => setCommands((s) => s.slice(0, -1))}
                      >
                        Desfazer
                      </button>
                    </div>
                    <p className="lab-hint">
                      Pense antes de executar: qual instrução muda a linha? Qual
                      muda a coluna?
                    </p>
                  </div>
                </div>
              ) : game === "binary" ? (
                <div className="binary-lab">
                  <p>
                    Acenda os bits para representar o número{" "}
                    <strong className="target-number">
                      {binaryTargets[level - 1]}
                    </strong>
                    .
                  </p>
                  <div className="bit-switches">
                    {bits.map((bit, i) => (
                      <button
                        key={i}
                        aria-label={`Bit ${2 ** (5 - i)}`}
                        aria-pressed={bit}
                        disabled={running}
                        onClick={() =>
                          setBits((values) =>
                            values.map((v, n) => (n === i ? !v : v)),
                          )
                        }
                      >
                        <small>{2 ** (5 - i)}</small>
                        <strong>{bit ? 1 : 0}</strong>
                        <span>{bit ? "Ligado" : "Desligado"}</span>
                      </button>
                    ))}
                  </div>
                  <div className="binary-equation" aria-live="polite">
                    {bits.map((b, i) => (b ? 2 ** (5 - i) : 0)).join(" + ")} ={" "}
                    <strong>{bitValue(bits)}</strong>
                  </div>
                  <button
                    disabled={running}
                    onClick={() => void submit(bitValue(bits).toString(2))}
                  >
                    Conferir combinação
                  </button>
                  <p className="lab-hint">
                    Cada posição vale uma potência de 2. Somente os bits ligados
                    entram na soma.
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
                  <RotateCcw size={16} /> Recomeçar
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
