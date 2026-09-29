"use client";
import {
  robotBoards,
  robotFrames,
  codeWordChallenges,
  programmerDictionary,
  evaluateWordGuess,
  normalizedCodewordAnswer,
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
    id: "codeword",
    name: "Código Secreto",
    icon: Code2,
    description: "Termo para programadores com Solo, Dueto e Quarteto.",
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
  const [wordGuess, setWordGuess] = useState("");
  const [wordRows, setWordRows] = useState<string[]>([]);
  const [wordSolved, setWordSolved] = useState<boolean[]>([false]);
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
    setWordGuess("");
    setWordRows([]);
    setWordSolved(Array(codeWordChallenges[nextLevel - 1]?.words.length ?? 1).fill(false));
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
    if (!result.valid) {
      setMessage("Programa inválido. Use UP, DOWN, LEFT, RIGHT ou REPEAT N DIRECAO.");
      setRunning(false);
      return;
    }
    if (result.operations > robotBoards[level - 1].maxOps) {
      setMessage("Seu programa excede o limite de movimentos deste nível.");
      setRunning(false);
      return;
    }
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
  function submitWordGuess() {
    const challenge = codeWordChallenges[level - 1];
    const guess = wordGuess.trim().toUpperCase();
    if (guess.length !== challenge.length) {
      setMessage(`Digite uma palavra de ${challenge.length} letras.`);
      return;
    }
    if (!programmerDictionary.includes(guess) && !challenge.words.includes(guess)) {
      setMessage("Use um termo de programação válido para este tamanho.");
      return;
    }
    const nextSolved = challenge.words.map(
      (target, index) => wordSolved[index] || target === guess,
    );
    const nextRows = [...wordRows, guess];
    setWordRows(nextRows);
    setWordSolved(nextSolved);
    setWordGuess("");
    if (nextSolved.every(Boolean)) void submit(normalizedCodewordAnswer(challenge.words));
    else if (nextRows.length >= challenge.attempts)
      setMessage("Limite de tentativas atingido. Recomece e use as pistas.");
  }

  const trace = traceChallenges[level - 1];
  const wordChallenge = codeWordChallenges[level - 1];
  const robotBoard = robotBoards[level - 1];
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
                      Programe o robô até a bandeira. Obstáculos encerram a execução e os níveis
                      finais exigem soluções compactas com repetição.
                    </p>
                    <div
                      className="robot-grid hard"
                      style={{ gridTemplateColumns: `repeat(${robotBoard.size}, 1fr)` }}
                      aria-label={`Robô na coluna ${position.x + 1}, linha ${position.y + 1}`}
                    >
                      {Array.from({ length: robotBoard.size * robotBoard.size }, (_, i) => (
                        <div
                          key={i}
                          className={
                            robotBoard.walls.includes(i)
                              ? "wall"
                              : i === robotBoard.goal
                                ? "goal"
                                : "tile"
                          }
                        >
                          {i === robotBoard.goal ? "⚑" : i === 0 ? "INÍCIO" : ""}
                        </div>
                      ))}
                      <span
                        className={`robot-piece ${position.collision ? "collision" : ""}`}
                        style={{
                          width: `${100 / robotBoard.size}%`,
                          height: `${100 / robotBoard.size}%`,
                          transform: `translate(${Math.max(0, Math.min(robotBoard.size - 1, position.x)) * 100}%, ${Math.max(0, Math.min(robotBoard.size - 1, position.y)) * 100}%)`,
                        }}
                      >
                        <Bot size={32} />
                      </span>
                    </div>
                  </div>
                  <div className="program-console">
                    <h3>Seu programa</h3>
                    <p className="muted">
                      Use UP, DOWN, LEFT, RIGHT ou REPEAT N DIRECAO. Limite expandido:
                      {" "}{robotBoard.maxOps} movimentos.
                    </p>
                    <textarea
                      className="code-input robot-code"
                      value={commands}
                      onChange={(e) => setCommands(e.target.value)}
                      placeholder={"RIGHT\nREPEAT 3 DOWN\nLEFT"}
                      spellCheck={false}
                      disabled={running}
                    />
                    <div className="actions">
                      <button disabled={running || !commands.trim()} onClick={runRobot}>
                        <Play size={16} /> Executar programa
                      </button>
                      <button className="secondary" disabled={running} onClick={() => reset()}>
                        <RotateCcw size={16} /> Limpar
                      </button>
                    </div>
                    <p className="lab-hint">
                      Nos níveis finais uma sequência longa demais falha mesmo chegando ao objetivo.
                    </p>
                  </div>
                </div>
              ) : game === "codeword" ? (
                <div className="codeword-lab">
                  <div className="codeword-mode-switch">
                    <button className={level === 1 ? "" : "secondary"} onClick={() => reset("codeword", 1)}>Solo</button>
                    <button className={level === 2 || level === 3 ? "" : "secondary"} onClick={() => reset("codeword", 2)}>Dueto</button>
                    <button className={level === 4 ? "" : "secondary"} onClick={() => reset("codeword", 4)}>Quarteto</button>
                  </div>
                  <p>
                    Descubra {wordChallenge.words.length === 1 ? "a palavra" : `as ${wordChallenge.words.length} palavras`}
                    {" "}de programação em até {wordChallenge.attempts} tentativas compartilhadas.
                  </p>
                  <div className={`codeword-boards ${wordChallenge.mode}`}>
                    {wordChallenge.words.map((target, boardIndex) => (
                      <div className="codeword-board" key={target}>
                        <strong>{wordChallenge.mode === "solo" ? "Solo" : `Painel ${boardIndex + 1}`}</strong>
                        {Array.from({ length: wordChallenge.attempts }, (_, rowIndex) => {
                          const guess = wordRows[rowIndex] ?? "";
                          const marks = guess
                            ? evaluateWordGuess(target, guess)
                            : Array(wordChallenge.length).fill("empty");
                          return (
                            <div className="codeword-row" key={rowIndex}>
                              {Array.from({ length: wordChallenge.length }, (_, charIndex) => (
                                <span key={charIndex} className={marks[charIndex]}>
                                  {guess[charIndex] ?? ""}
                                </span>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="codeword-entry">
                    <input
                      value={wordGuess}
                      onChange={(e) =>
                        setWordGuess(
                          e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, wordChallenge.length).toUpperCase(),
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitWordGuess();
                      }}
                      maxLength={wordChallenge.length}
                      placeholder={`${wordChallenge.length} letras`}
                      disabled={running || correct}
                    />
                    <button disabled={running || !wordGuess.trim() || correct} onClick={submitWordGuess}>
                      Testar termo
                    </button>
                  </div>
                  <p className="lab-hint">
                    Verde: posição certa. Amarelo: letra existente em outra posição. Cinza: ausente.
                  </p>
                </div>              ) : (
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
