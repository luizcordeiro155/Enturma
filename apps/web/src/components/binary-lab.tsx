"use client";
import { useEffect, useRef, useState } from "react";
import { CircuitBoard, Zap, RotateCcw } from "lucide-react";
import { api, post } from "@/lib/api";
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

export function BinaryLab({ onProgress }: { onProgress: () => Promise<void> }) {
  const [binary, setBinary] = useState<BinaryChallenge>();
  const [bits, setBits] = useState<boolean[]>([]);
  const [binaryResult, setBinaryResult] = useState<BinaryResult>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const binaryStarted = useRef(0);
  useEffect(() => {
    let active = true;
    api<BinaryChallenge>("/learning/advanced/binary/challenge")
      .then((data) => {
        if (active) {
          setBinary(data);
          setBits(Array(data.bitWidth).fill(false));
          binaryStarted.current = Date.now();
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function submitBinary() {
    if (!binary) return;
    setBusy(true);
    setError("");
    try {
      const answer = bits.map((bit) => (bit ? "1" : "0")).join("");
      const result = await post<BinaryResult>(
        "/learning/advanced/binary/attempt",
        {
          challengeKey: binary.challengeKey,
          answer,
          durationMs: Date.now() - binaryStarted.current,
        },
      );
      setBinaryResult(result);
      if (result.correct) await onProgress();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const binaryValue = parseInt(
    bits.map((bit) => (bit ? "1" : "0")).join("") || "0",
    2,
  );
  return (
    <>
      <p role="alert">{error}</p>
      <section className="advanced-game-card binary-lab">
        {binary ? (
          <>
            <div className="binary-lab-header">
              <div>
                <p className="eyebrow">
                  Laboratório Binário · dia {binary.dayLevel}
                </p>
                <h2>{binary.prompt}</h2>
                <p>{binary.hint}</p>
              </div>
              <div className="binary-progress-badge">
                <CircuitBoard size={22} />
                <span>
                  <strong>{binary.completedDays}</strong> dias concluídos
                </span>
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
                    aria-label={`Bit ${power}`}
                    disabled={
                      busy ||
                      binary.completedToday ||
                      Boolean(binaryResult?.correct)
                    }
                    onClick={() =>
                      setBits((current) =>
                        current.map((value, i) =>
                          i === index ? !value : value,
                        ),
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
              <button
                disabled={
                  busy ||
                  binary.completedToday ||
                  Boolean(binaryResult?.correct)
                }
                onClick={() => void submitBinary()}
              >
                <Zap size={17} /> Validar circuito
              </button>
              <button
                className="secondary"
                disabled={binary.completedToday}
                onClick={() =>
                  setBits(Array.from({ length: binary.bitWidth }, () => false))
                }
              >
                <RotateCcw size={16} /> Limpar
              </button>
            </div>

            {binary.completedToday ? (
              <div className="game-result won">
                <strong>Desafio diário concluído.</strong>
                <span>
                  Amanhã o laboratório sobe de nível e adiciona novas operações.
                </span>
              </div>
            ) : binaryResult ? (
              <div
                role="status"
                className={
                  binaryResult.correct ? "game-result won" : "game-result"
                }
              >
                <strong>{binaryResult.message}</strong>
                {binaryResult.correct ? (
                  <span>
                    +{binaryResult.xpAwarded} XP · próximo nível diário{" "}
                    {binaryResult.nextDayLevel}
                  </span>
                ) : null}
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
        ) : (
          <p role="status">Montando circuito diário…</p>
        )}
      </section>
    </>
  );
}
