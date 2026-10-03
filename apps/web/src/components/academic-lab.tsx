"use client";
import { useEffect, useRef, useState } from "react";
import { Brain, Check, Lightbulb, Play, Trophy } from "lucide-react";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import Link from "next/link";
type Game = {
  subjectId: string;
  subject: string;
  code: string;
  title: string;
  category: string;
  template: string;
};
type Challenge = {
  id: string;
  difficulty: number;
  attempts: number;
  completed: boolean;
  prompt: string;
  hint: string;
  context: string;
  source: string;
  template: string;
};
type Progress = {
  id: string;
  subjectId: string;
  gameCode: string;
  slot: number;
  daily: boolean;
  completedAt?: string;
};
const areaNames: Record<string, string> = {
  IT: "Computação",
  NURSING: "Saúde e enfermagem",
  BUSINESS: "Administração",
  LAW: "Direito",
  ENGINEERING: "Engenharias",
  DESIGN: "Design e UX",
};
export function AcademicLab() {
  const [games, setGames] = useState<Game[]>([]),
    [selected, setSelected] = useState<Game>(),
    [challenge, setChallenge] = useState<Challenge>(),
    [progress, setProgress] = useState<Progress[]>([]),
    [answer, setAnswer] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [hint, setHint] = useState(false),
    [daily, setDaily] = useState(true),
    [slot, setSlot] = useState(1);
  const stage = useRef<HTMLElement>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Game[]>("/learning/academic"),
      api<Progress[]>("/learning/academic/progress"),
    ])
      .then(([g, p]) => {
        if (active) {
          setGames(g);
          setProgress(p);
          setSelected(g[0]);
        }
      })
      .catch((e) => setStatus(e.message));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const el = stage.current;
    if (
      !el ||
      document.documentElement.dataset.reducedMotion === "true" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const a = el.animate(
      [
        { opacity: 0, transform: "translateY(15px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 320, easing: "ease-out" },
    );
    return () => a.cancel();
  }, [challenge?.id]);
  async function start() {
    if (!selected) return;
    setBusy(true);
    setStatus("");
    setHint(false);
    setAnswer("");
    try {
      setChallenge(
        await post<Challenge>("/learning/academic/start", {
          subjectId: selected.subjectId,
          game: selected.code,
          daily,
          slot,
        }),
      );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setBusy(true);
    try {
      const result = await post<{
        correct: boolean;
        xpAwarded: number;
        message: string;
      }>(`/learning/academic/${challenge.id}/answer`, { answer });
      setStatus(
        result.message + (result.xpAwarded ? ` +${result.xpAwarded} XP` : ""),
      );
      setChallenge({
        ...challenge,
        attempts: challenge.attempts + 1,
        completed: result.correct,
      });
      setProgress(await api<Progress[]>("/learning/academic/progress"));
      if (
        result.correct &&
        stage.current &&
        document.documentElement.dataset.reducedMotion !== "true" &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        stage.current.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.015)" },
            { transform: "scale(1)" },
          ],
          { duration: 400 },
        );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="academic-lab">
        <header>
          <span className="eyebrow">Aprenda com a sua área</span>
          <h1>Desafios acadêmicos</h1>
          <p>
            Escolha uma atividade ligada às suas matérias. Cinco missões por
            jogo a cada dia, com progresso e dificuldade crescentes.
          </p>
          <Link href="/learn">Ir para o laboratório de programação →</Link>
        </header>
        <div className="academic-lab-layout">
          <aside className="academic-game-list">
            <h2>Suas atividades</h2>
            {games.map((g) => (
              <button
                className="secondary"
                aria-pressed={
                  selected?.code === g.code &&
                  selected.subjectId === g.subjectId
                }
                key={`${g.subjectId}:${g.code}`}
                onClick={() => {
                  setSelected(g);
                  setChallenge(undefined);
                  setStatus("");
                }}
              >
                <Brain size={18} />
                <span>
                  <strong>{g.title}</strong>
                  <small>
                    {areaNames[g.category]} · {g.subject}
                  </small>
                </span>
              </button>
            ))}
            {!games.length && (
              <p>
                Selecione suas matérias verificadas em{" "}
                <Link href="/home#minhas-materias">Minhas matérias no Início</Link>. As atividades
                compatíveis aparecerão aqui.
              </p>
            )}
          </aside>
          <section className="academic-stage" ref={stage}>
            <h2>{selected?.title ?? "Seu próximo desafio"}</h2>
            {selected && (
              <>
                <p>{selected.subject}</p>
                <div className="actions">
                  <button
                    className={daily ? "" : "secondary"}
                    onClick={() => {
                      setDaily(true);
                      setChallenge(undefined);
                    }}
                  >
                    Missões diárias
                  </button>
                  <button
                    className={!daily ? "" : "secondary"}
                    onClick={() => {
                      setDaily(false);
                      setChallenge(undefined);
                    }}
                  >
                    Treino livre
                  </button>
                </div>
                {daily && (
                  <nav className="daily-slots" aria-label="Missões do dia">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const complete = progress.some(
                        (p) =>
                          p.daily &&
                          p.subjectId === selected.subjectId &&
                          p.gameCode === selected.code &&
                          p.slot === n &&
                          p.completedAt,
                      );
                      return (
                        <button
                          aria-label={`Missão ${n}${complete ? " concluída" : ""}`}
                          aria-pressed={slot === n}
                          className="secondary"
                          key={n}
                          onClick={() => {
                            setSlot(n);
                            setChallenge(undefined);
                          }}
                        >
                          {complete ? <Check size={18} /> : n}
                        </button>
                      );
                    })}
                  </nav>
                )}
                <button disabled={busy} onClick={() => void start()}>
                  <Play size={18} />
                  {challenge ? "Reabrir atividade" : "Começar atividade"}
                </button>
              </>
            )}
            {challenge && (
              <div className="academic-exercise">
                <div className="mission-overview">
                  <Trophy />
                  <strong>Nível {challenge.difficulty}</strong>
                  <span>{challenge.attempts} tentativas</span>
                </div>
                <p className="academic-context">{challenge.context}</p>
                <p className="academic-prompt">{challenge.prompt}</p>
                <button className="text-button" onClick={() => setHint(!hint)}>
                  <Lightbulb size={18} />
                  {hint ? "Ocultar dica" : "Receber uma dica"}
                </button>
                {hint && <p className="academic-hint">{challenge.hint}</p>}
                {challenge.completed ? (
                  <p className="success" role="status">
                    <Check />
                    Atividade concluída. Escolha a próxima missão.
                  </p>
                ) : (
                  <form onSubmit={submit}>
                    <label>
                      Sua resposta
                      <input
                        autoComplete="off"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        required
                        maxLength={500}
                      />
                    </label>
                    <button disabled={busy}>Verificar raciocínio</button>
                  </form>
                )}
                {challenge.source && (
                  <a href={challenge.source} target="_blank" rel="noreferrer">
                    Fonte de referência ↗
                  </a>
                )}
              </div>
            )}
            <p role="status">{status}</p>
          </section>
        </div>
      </div>
    </Shell>
  );
}
