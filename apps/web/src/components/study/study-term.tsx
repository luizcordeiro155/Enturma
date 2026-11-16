"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, X } from "lucide-react";
import { planner, type TermOverview } from "@/lib/planner";
import { dayLabel } from "./study-calendar";
import { periodLabel } from "./study-day-panel";

/** Where the student chooses the period and subjects of the new semester. */
export const NEW_TERM_SUBJECTS = "/onboarding?semestre=novo";

/**
 * The semester ended, or a new one has no subjects yet. A new semester ends the old grade, so the
 * student is taken straight to choose the period and subjects of the new one.
 */
export function StudyTermNotice({
  overview,
  starting,
  close,
}: {
  overview: TermOverview;
  /** The student asked to start the next semester before this one ended. */
  starting: boolean;
  close: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { current, needs, suggestion } = overview;
  const asking = starting || needs === "NEW_TERM";
  if (!asking && needs !== "SUBJECTS") return null;

  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      name: String(data.get("name") ?? "").trim(),
      startsOn: String(data.get("startsOn")),
      endsOn: String(data.get("endsOn")),
    };
    if (!body.startsOn || !body.endsOn) return setError("Informe o início e o fim do novo semestre.");
    if (body.endsOn < body.startsOn) return setError("O fim precisa ser depois do início.");
    setBusy(true);
    setError("");
    try {
      await planner.startTerm(body);
      router.push(NEW_TERM_SUBJECTS);
    } catch (cause) {
      setError((cause as Error).message);
      setBusy(false);
    }
  }

  return (
    <section className="study-term-notice" data-needs={asking ? "NEW_TERM" : needs} aria-label="Semestre">
      <header>
        <GraduationCap aria-hidden />
        <div>
          {asking ? (
            <>
              <h3>
                {needs === "NEW_TERM" && current
                  ? `Seu semestre ${current.name} terminou`
                  : "Começar um novo semestre"}
              </h3>
              <p>
                {needs === "NEW_TERM" && current
                  ? `Ele foi até ${dayLabel(current.endsOn)}. `
                  : ""}
                Sua grade muda a cada semestre: ao começar o próximo, as aulas atuais param e você escolhe o
                novo período e as novas matérias. Presenças e faltas do semestre anterior ficam guardadas.
              </p>
            </>
          ) : (
            <>
              <h3>Configure as matérias do semestre {current?.name}</h3>
              <p>
                {current ? `${periodLabel(current.startsOn, current.endsOn)}. ` : ""}Escolha seu período e as
                matérias para montar a grade nova.
              </p>
            </>
          )}
        </div>
        {starting && needs !== "NEW_TERM" && (
          <button type="button" className="study-icon" aria-label="Fechar" onClick={close}>
            <X size={18} />
          </button>
        )}
      </header>
      {asking ? (
        <form className="study-inline-form" aria-label="Novo semestre" noValidate onSubmit={start}>
          <label>
            Nome
            <input name="name" maxLength={40} defaultValue={suggestion.name} />
          </label>
          <label>
            Começa em
            <input name="startsOn" type="date" required defaultValue={suggestion.startsOn} />
          </label>
          <label>
            Termina em
            <input name="endsOn" type="date" required defaultValue={suggestion.endsOn} />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy}>
            Começar novo semestre <ArrowRight size={16} aria-hidden />
          </button>
        </form>
      ) : (
        <Link className="button study-term-link" href={NEW_TERM_SUBJECTS}>
          Escolher período e matérias <ArrowRight size={16} aria-hidden />
        </Link>
      )}
    </section>
  );
}
