"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { AcademicEntry } from "@enturma/contracts";
import { academicLabels, catalogOptions } from "@enturma/contracts";
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
  const [selection, setSelection] = useState<AcademicEntry[]>([]);
  const [retry, setRetry] = useState(0);
  const [notice, setNotice] = useState("");
  const cache = useRef(new Map<string, AcademicEntry[]>());
  const [entries, setEntries] = useState<AcademicEntry[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const router = useRouter();
  const parent = selected[step - 1];
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    const url = `/catalog/onboarding/options?kind=${step < 5 ? steps[step][0] : "SUBJECT"}${parent ? `&parentId=${parent}` : ""}&search=${encodeURIComponent(search)}&page=${page}`;
    const timer = setTimeout(() => {
      setBusy(true);
      setError("");
      setNotice("");
      const cached = cache.current.get(url);
      if (cached) {
        setEntries(cached);
        setBusy(false);
        return;
      }
      catalogOptions(api, url.split("?")[1], { signal: controller.signal })
        .then((r) => {
          if (alive) {
            setEntries(r.items);
            cache.current.set(url, r.items);
            setError("");
          }
        })
        .catch((e) => {
          if (alive) setError(e.message);
        })
        .finally(() => {
          if (alive) setBusy(false);
        });
    }, 180);
    return () => {
      alive = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [step, parent, search, page, retry]);
  function choose(item: AcademicEntry) {
    setBusy(true);
    setSelected((s) => [...s.slice(0, step), item.id]);
    setSelection((s) => [...s.slice(0, step), item]);
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
        <Feedback error={error} success={notice} />
        {error ? (
          <button
            onClick={() => {
              cache.current.clear();
              setRetry((n) => n + 1);
            }}
          >
            Tentar novamente
          </button>
        ) : null}
        {selection.slice(0, step).length ? (
          <p className="muted">
            {selection
              .slice(0, step)
              .map((s) => s.name)
              .join(" / ")}
          </p>
        ) : null}
        {selection[3]?.attributes?.note && step >= 4 ? (
          <p className="catalog-note">{selection[3].attributes.note}</p>
        ) : null}
        {step === 5 ? (
          <p className="catalog-note">
            Selecione somente as UCs que você está cursando agora. Na matriz por
            níveis da UNA, matérias de vários semestres aparecem juntas.
          </p>
        ) : null}
        <h2>{step < 5 ? steps[step][1] : "Suas matérias"}</h2>
        <label>
          Buscar no catálogo
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setBusy(true);
              setPage(0);
            }}
          />
        </label>
        {busy ? (
          <p role="status">Buscando opções…</p>
        ) : entries.length === 0 ? (
          <div className="empty compact">
            <h3>
              {step === 3
                ? "Esta grade ainda está sendo verificada."
                : "Nenhuma opção disponível."}
            </h3>
            <p>
              O catálogo ainda não tem registros verificados para esta seleção.
              Tente outra busca ou aguarde a atualização da plataforma.
            </p>
            {step === 3 && selected[2] ? (
              <button
                onClick={async () => {
                  try {
                    await api("/catalog/requests", {
                      method: "POST",
                      body: JSON.stringify({ courseOfferingId: selected[2] }),
                    });
                    setNotice(
                      "Solicitação registrada. Sua oferta entrou na lista de prioridades.",
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Solicitar disponibilidade
              </button>
            ) : null}
            <button
              className="secondary"
              onClick={() => {
                cache.current.clear();
                setBusy(true);
                setRetry((n) => n + 1);
              }}
            >
              Atualizar opções
            </button>
          </div>
        ) : (
          <div className="option-list">
            {entries.map((item) =>
              step < 5 ? (
                <button onClick={() => choose(item)} key={item.id}>
                  <strong>{item.name}</strong>
                  {item.modality || item.shift ? (
                    <span>
                      {[item.modality, item.shift]
                        .filter(Boolean)
                        .map((v) => academicLabels[v!] ?? v)
                        .join(" · ")}
                    </span>
                  ) : null}
                  {item.kind === "COURSE" &&
                  item.hasCurriculum !== undefined ? (
                    <span className="catalog-badge">
                      {item.hasCurriculum
                        ? "Grade disponível"
                        : "Grade em verificação"}
                    </span>
                  ) : null}
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
                  {item.workloadHours ? (
                    <small> · {item.workloadHours}h</small>
                  ) : null}
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
              setBusy(true);
              setSubjects([]);
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
