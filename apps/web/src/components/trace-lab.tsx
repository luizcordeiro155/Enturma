"use client";
import { useState } from "react";
import { post } from "@/lib/api";
import { traceChallenges } from "@/lib/learning-games";

export function TraceLab({ onProgress }: { onProgress: () => Promise<void> }) {
  const [level, setLevel] = useState(1);
  const [answer, setAnswer] = useState("");
  const [frame, setFrame] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; message: string }>();
  const challenge = traceChallenges[level - 1];
  function change(next: number) {
    setLevel(next);
    setAnswer("");
    setFrame(0);
    setResult(undefined);
  }
  return (
    <section className="advanced-game-card">
      <h2>Detetive de código</h2>
      <p>
        Investigue variáveis, arrays e laços em JavaScript. Os quatro desafios
        originais continuam disponíveis com seu progresso salvo.
      </p>
      <label>
        Desafio
        <select
          value={level}
          disabled={busy}
          onChange={(e) => change(Number(e.target.value))}
        >
          {traceChallenges.map((_, i) => (
            <option key={i} value={i + 1}>
              Caso {i + 1}
            </option>
          ))}
        </select>
      </label>
      <div className="trace-layout">
        <pre className="code-window">
          <code>{challenge.code}</code>
        </pre>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await post<{ correct: boolean; message: string }>(
                "/learning/attempts",
                { game: "trace", level, answer, daily: false },
              );
              setResult(r);
              if (r.correct) await onProgress();
            } catch (e) {
              setResult({ correct: false, message: (e as Error).message });
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Resultado de console.log
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              inputMode="numeric"
              maxLength={20}
              disabled={busy}
            />
          </label>
          <button disabled={busy || !answer.trim()}>Testar hipótese</button>
          <details>
            <summary>Preciso de uma pista</summary>
            <p>{challenge.hint}</p>
            <div className="trace-frame" aria-live="polite">
              {challenge.frames[frame]}
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => setFrame((f) => (f + 1) % challenge.frames.length)}
            >
              Próximo passo da execução
            </button>
          </details>
        </form>
      </div>
      <p
        role="status"
        className={result?.correct ? "game-result won" : "game-result"}
      >
        {result?.message}
      </p>
      {result?.correct && level < traceChallenges.length ? (
        <button onClick={() => change(level + 1)}>Próximo desafio</button>
      ) : null}
    </section>
  );
}
