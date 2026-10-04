"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Binary,
  Bug,
  Braces,
  Check,
  Lock,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
type Game = "words" | "algorithm" | "binary" | "trace";
type Played = { word: string; marks: string };
type Mission = {
  game: Game;
  slot: number;
  difficulty: number;
  attempts: number;
  completed: boolean;
  won: boolean;
  history: Played[];
  definition: {
    hint: string;
    length?: number;
    maxAttempts?: number;
    language?: string;
    walls?: number[];
    budget?: number;
    width?: number;
    expression?: string;
    code?: string;
  };
};
type Daily = { date: string; difficulty: number; missions: Mission[] };
type Frame = { x: number; y: number; step: number };
const games = [
  { id: "words", name: "Termo Dev", icon: Braces },
  { id: "algorithm", name: "Rota do Algoritmo", icon: Bot },
  { id: "binary", name: "Laboratório Binário", icon: Binary },
  { id: "trace", name: "Detetive de código", icon: Bug },
] as const;
export function ProgrammingLab() {
  const [daily, setDaily] = useState<Daily>();
  const [game, setGame] = useState<Game>("words");
  const [slot, setSlot] = useState(1);
  const [error, setError] = useState("");
  const [eligible, setEligible] = useState<boolean>();
  const load = useCallback(
    async () => setDaily(await api<Daily>("/learning/missions", { cache: "no-store" })),
    [],
  );
  useEffect(() => {
    let active = true;
    api<{ eligible: boolean }>("/learning/access")
      .then(async (a) => {
        if (!active) return;
        setEligible(a.eligible);
        if (a.eligible) await load();
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [load]);
  const mission = daily?.missions.find(
    (m) => m.game === game && m.slot === slot,
  );
  return (
    <Shell>
      <div className="daily-lab">
        <header className="daily-heading">
          <span className="eyebrow">Sua jornada de programação</span>
          <h1>Um pouco de prática. Todos os dias.</h1>
          <p>
            Cinco missões de cada jogo por dia. Digite suas respostas, teste
            hipóteses e aprenda com as pistas.
          </p>
        </header>
        <Feedback error={error} />
        {eligible === false ? (
          <div className="empty">
            Os jogos são liberados para estudantes de cursos ou matérias de TI.
          </div>
        ) : daily ? (
          <>
            <div className="mission-overview">
              <Trophy />
              <strong>
                {daily.missions.filter((m) => m.completed).length}/20 missões
              </strong>
              <span>Nível diário {daily.difficulty}</span>
              <span>
                {daily.date.split("-").reverse().join("/")} · Renova à
                meia-noite de Brasília
              </span>
            </div>
            <nav className="mission-games" aria-label="Minigames">
              {games.map((g) => (
                <button
                  key={g.id}
                  aria-pressed={game === g.id}
                  onClick={() => {
                    setGame(g.id);
                    setSlot(1);
                  }}
                >
                  <g.icon />
                  <span>
                    {g.name}
                    <small>
                      {
                        daily.missions.filter(
                          (m) => m.game === g.id && m.completed,
                        ).length
                      }
                      /5 concluídas
                    </small>
                  </span>
                </button>
              ))}
            </nav>
            <nav className="mission-steps" aria-label="Missões do jogo">
              {daily.missions
                .filter((m) => m.game === game)
                .map((m, i, items) => (
                  <button
                    key={m.slot}
                    aria-current={slot === m.slot ? "step" : undefined}
                    disabled={i > 0 && !items[i - 1].completed}
                    onClick={() => setSlot(m.slot)}
                  >
                    {m.completed ? (
                      <Check size={16} />
                    ) : i > 0 && !items[i - 1].completed ? (
                      <Lock size={14} />
                    ) : null}
                    Missão {m.slot}
                  </button>
                ))}
            </nav>
            {mission ? (
              <MissionGame
                key={`${daily.date}:${game}:${slot}`}
                mission={mission}
                date={daily.date}
                onSaved={load}
                onNext={() => setSlot((s) => Math.min(5, s + 1))}
              />
            ) : null}
          </>
        ) : (
          <p role="status">Carregando missões…</p>
        )}
      </div>
    </Shell>
  );
}
function MissionGame({
  mission,
  date,
  onSaved,
  onNext,
}: {
  mission: Mission;
  date: string;
  onSaved: () => Promise<void>;
  onNext: () => void;
}) {
  const d = mission.definition;
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState(mission.history);
  const [complete, setComplete] = useState(mission.completed);
  const [won, setWon] = useState(mission.won);
  const [frames, setFrames] = useState<Frame[]>([{ x: 0, y: 0, step: 0 }]);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (frame >= frames.length - 1) setPlaying(false);
      else setFrame((f) => f + 1);
    }, 240);
    return () => clearTimeout(timer);
  }, [playing, frame, frames]);
  function animate() {
    if (
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      document.documentElement.dataset.reducedMotion !== "true"
    )
      resultRef.current?.animate(
        [
          { transform: "translateY(6px)", opacity: 0.5 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        { duration: 350, easing: "ease-out" },
      );
  }
  async function submit() {
    if (busy || complete || !answer.trim()) return;
    setBusy(true);
    setError("");
    try {
      const r = await post<{
        won: boolean;
        completed: boolean;
        message: string;
        history: Played[];
        frames: Frame[];
      }>("/learning/missions", {
        date,
        game: mission.game,
        slot: mission.slot,
        answer,
      });
      setHistory(r.history);
      setFeedback(r.message);
      setWon(r.won);
      setComplete(r.completed);
      if (r.frames.length) {
        setFrames(r.frames);
        setFrame(0);
        if (
          matchMedia("(prefers-reduced-motion: reduce)").matches ||
          document.documentElement.dataset.reducedMotion === "true"
        )
          setFrame(r.frames.length - 1);
        else setPlaying(true);
      }
      if (mission.game === "words") setAnswer("");
      animate();
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const position = frames[frame];
  return (
    <section
      className={`mission-stage game-${mission.game}`}
      aria-label={games.find((g) => g.id === mission.game)?.name}
    >
      <div className="game-heading">
        <h2>{games.find((g) => g.id === mission.game)?.name}</h2>
        <span>
          Missão {mission.slot} de 5 · nível {mission.difficulty}
        </span>
      </div>
      <div className="mission-hint">
        <strong>
          {mission.game === "words"
            ? "Qual é o conceito?"
            : "Pista para investigar"}
        </strong>
        <p>{d.hint}</p>
        {mission.game === "words" ? (
          <small>
            {d.language} · {d.length} letras · {history.length}/6 tentativas
          </small>
        ) : null}
      </div>
      <Feedback error={error} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {mission.game === "words" ? (
          <div className="mission-word-layout">
            <div className="mission-word-board">
              {Array.from({ length: 6 }, (_, r) => (
                <div
                  className="mission-word-row"
                  key={r}
                  style={{
                    gridTemplateColumns: `repeat(${d.length}, minmax(0,1fr))`,
                  }}
                >
                  {Array.from({ length: d.length! }, (_, c) => (
                    <span
                      key={c}
                      className={history[r]?.marks[c] ?? ""}
                      style={{ animationDelay: `${c * 50}ms` }}
                    >
                      {history[r]?.word[c] ??
                        (r === history.length ? (answer[c] ?? "") : "")}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <label>
              Palavra tentativa
              <input
                value={answer}
                maxLength={d.length}
                placeholder={`${d.length} letras`}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={busy || complete}
                onChange={(e) =>
                  setAnswer(
                    e.target.value
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toUpperCase()
                      .replace(/[^A-Z]/g, ""),
                  )
                }
              />
            </label>
            <small>
              Verde: letra certa. Amarelo: outra posição. Cinza: ausente. Não
              mostramos a resposta.
            </small>
          </div>
        ) : mission.game === "algorithm" ? (
          <div className="mission-code-layout">
            <div>
              <div className="mission-maze">
                {Array.from({ length: 36 }, (_, i) => (
                  <div
                    key={i}
                    className={
                      d.walls?.includes(i) ? "wall" : i === 35 ? "goal" : ""
                    }
                  >
                    {i === 35 ? "FIM" : ""}
                  </div>
                ))}
                <div
                  className="mission-robot"
                  style={{
                    left: `${(position.x / 6) * 100}%`,
                    top: `${(position.y / 6) * 100}%`,
                  }}
                >
                  <Bot />
                </div>
              </div>
              <p>
                Passo {position.step} · até {d.budget} movimentos
              </p>
              <button
                type="button"
                className="secondary"
                disabled={frames.length < 2}
                onClick={() => {
                  setFrame(0);
                  setPlaying(true);
                }}
              >
                <Play size={16} />
                Reproduzir
              </button>
            </div>
            <div>
              <label>
                Seu programa
                <textarea
                  value={answer}
                  maxLength={6000}
                  disabled={busy || complete}
                  spellCheck={false}
                  placeholder={
                    "moveRight();\nmoveDown();\nrepeat(2, moveRight);"
                  }
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </label>
              <div className="mission-command-buttons">
                {[
                  ["↑", "moveUp"],
                  ["←", "moveLeft"],
                  ["↓", "moveDown"],
                  ["→", "moveRight"],
                ].map(([label, cmd]) => (
                  <button
                    type="button"
                    className="secondary"
                    key={cmd}
                    disabled={busy || complete}
                    aria-label={cmd}
                    onClick={() => setAnswer((a) => a + cmd + "();\n")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <details>
                <summary>Comandos e sensores</summary>
                <p>
                  moveRight(), moveLeft(), moveUp(), moveDown(). Use repeat(3,
                  moveRight), if, while, variáveis e funções. Sensores: x, y,
                  blocked() e atGoal(). O interpretador é limitado e não acessa
                  sua conta.
                </p>
              </details>
            </div>
          </div>
        ) : mission.game === "binary" ? (
          <div className="mission-binary">
            <pre>{d.expression}</pre>
            <div className="bit-display" aria-hidden="true">
              {Array.from({ length: d.width! }, (_, i) => (
                <span
                  key={i}
                  className={
                    answer.padStart(d.width!, "0")[i] === "1" ? "on" : ""
                  }
                >
                  <b>{answer.padStart(d.width!, "0")[i]}</b>
                  <small>2^{d.width! - i - 1}</small>
                </span>
              ))}
            </div>
            <label>
              Resposta em binário
              <input
                value={answer}
                inputMode="numeric"
                maxLength={d.width}
                disabled={busy || complete}
                onChange={(e) =>
                  setAnswer(e.target.value.replace(/[^01]/g, ""))
                }
                placeholder="Digite os bits: 0 e 1"
              />
            </label>
          </div>
        ) : (
          <div className="mission-code-layout">
            <pre className="code-window">
              <code>{d.code}</code>
            </pre>
            <label>
              Resultado de console.log
              <input
                value={answer}
                maxLength={20}
                inputMode="numeric"
                disabled={busy || complete}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Digite o resultado"
              />
            </label>
          </div>
        )}
        <div className="mission-actions">
          <button
            disabled={
              busy ||
              complete ||
              !answer.trim() ||
              (mission.game === "words" && answer.length !== d.length)
            }
          >
            {busy
              ? "Conferindo…"
              : mission.game === "words"
                ? "Testar palavra"
                : mission.game === "algorithm"
                  ? "Executar"
                  : "Testar resposta"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy || complete}
            onClick={() => {
              setAnswer("");
              setFrame(0);
              setPlaying(false);
            }}
          >
            <RotateCcw size={16} />
            Limpar
          </button>
        </div>
      </form>
      <div
        ref={resultRef}
        role="status"
        className={`mission-feedback ${won ? "won" : ""}`}
      >
        {won ? <Trophy /> : null}
        {feedback ||
          (complete
            ? "Missão de hoje já concluída."
            : "Seu progresso é salvo a cada tentativa.")}
      </div>
      {complete && mission.slot < 5 ? (
        <button onClick={onNext}>Próxima missão</button>
      ) : complete ? (
        <p>
          As cinco missões deste jogo estão concluídas. Amanhã você terá novos
          desafios em um nível maior.
        </p>
      ) : null}
    </section>
  );
}
