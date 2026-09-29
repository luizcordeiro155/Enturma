"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AcademicEntry } from "@enturma/contracts";
import { api } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
const steps = [
  ["INSTITUTION", "Universidade"],
  ["CAMPUS", "Campus"],
  ["COURSE", "Curso"],
  ["CURRICULUM", "Versão da grade"],
  ["PERIOD", "Período"],
] as const;
export function Onboarding() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [entries, setEntries] = useState<AcademicEntry[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const router = useRouter();
  const parent = selected[step - 1];
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    api<AcademicEntry[]>(
      `/academics?kind=${step < 5 ? steps[step][0] : "SUBJECT"}${parent ? `&parentId=${parent}` : ""}&search=${encodeURIComponent(search)}&page=${page}`,
      { signal: controller.signal },
    )
      .then((r) => {
        if (alive) {
          setEntries(r);
          setError("");
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [step, parent, search, page]);
  function choose(id: string) {
    setBusy(true);
    setSelected((s) => [...s.slice(0, step), id]);
    setStep((s) => s + 1);
    setSearch("");
    setPage(0);
    setSubjects([]);
  }
  async function finish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/users/me/enrollment", {
        method: "PUT",
        body: JSON.stringify({
          periodId: selected[4],
          subjectIds: subjects,
          shift: form.get("shift"),
          preferences: form.get("preferences"),
        }),
      });
      router.push("/home");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="narrow">
        <p className="step-label">
          Seu perfil acadêmico · Etapa {step + 1} de 6
        </p>
        <h1>
          Vamos encontrar
          <br />a sua turma.
        </h1>
        <p className="lead">
          Selecione os dados da sua jornada. Cada opção vem do catálogo da
          plataforma.
        </p>
        <div className="progress" aria-label={`Etapa ${step + 1} de 6`}>
          <span style={{ width: `${((step + 1) / 6) * 100}%` }} />
        </div>
        <Feedback error={error} />
        <h2>{step < 5 ? steps[step][1] : "Suas matérias"}</h2>
        <label>
          Buscar no catálogo
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        {busy ? (
          <p role="status">Buscando opções…</p>
        ) : entries.length === 0 ? (
          <div className="empty compact">
            <h3>Nenhuma opção disponível.</h3>
            <p>
              O catálogo ainda não tem registros verificados para esta seleção.
              Tente outra busca ou aguarde a atualização da plataforma.
            </p>
          </div>
        ) : (
          <div className="option-list">
            {entries.map((item) =>
              step < 5 ? (
                <button onClick={() => choose(item.id)} key={item.id}>
                  <strong>{item.name}</strong>
                  <small>Fonte: {item.sourceName}</small>
                </button>
              ) : (
                <label className="check" key={item.id}>
                  <input
                    type="checkbox"
                    checked={subjects.includes(item.id)}
                    onChange={(e) =>
                      setSubjects((s) =>
                        e.target.checked
                          ? [...s, item.id]
                          : s.filter((id) => id !== item.id),
                      )
                    }
                  />
                  {item.name}
                </label>
              ),
            )}
          </div>
        )}
        <div className="actions">
          <button
            disabled={page === 0 || busy}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>Página {page + 1}</span>
          <button
            disabled={entries.length < 30 || busy}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </div>
        {step === 5 ? (
          <form onSubmit={finish}>
            <label>
              Turno
              <select name="shift">
                <option value="MORNING">Manhã</option>
                <option value="AFTERNOON">Tarde</option>
                <option value="EVENING">Noite</option>
                <option value="FULL_TIME">Integral</option>
                <option value="REMOTE">EAD</option>
              </select>
            </label>
            <label>
              Como você prefere estudar?
              <textarea
                name="preferences"
                maxLength={500}
                placeholder="Horários, formato e preferências de estudo"
              />
            </label>
            <button className="button" disabled={busy || subjects.length === 0}>
              Concluir perfil
            </button>
          </form>
        ) : null}
        {step > 0 ? (
          <button
            className="text-button"
            onClick={() => {
              setStep((s) => s - 1);
              setSearch("");
              setPage(0);
            }}
          >
            Voltar uma etapa
          </button>
        ) : null}
      </div>
    </Shell>
  );
}
