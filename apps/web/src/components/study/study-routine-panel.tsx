"use client";
import { useState } from "react";
import { Settings2, X } from "lucide-react";
import { planner, STATES, WEEKDAYS, type Routine } from "@/lib/planner";

const REMINDERS = [
  [0, "Não avisar"],
  [30, "30 minutos antes"],
  [60, "1 hora antes"],
  [120, "2 horas antes"],
  [180, "3 horas antes"],
  [1440, "1 dia antes"],
] as const;

/** "Minha rotina acadêmica": the defaults every class, reminder and holiday builds on. */
export function StudyRoutinePanel({
  routine,
  saved,
  close,
}: {
  routine: Routine;
  saved: (routine: Routine) => void;
  close: () => void;
}) {
  const [days, setDays] = useState(routine.weekdays);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="study-routine-panel" aria-label="Minha rotina acadêmica">
      <header>
        <h3>
          <Settings2 size={18} aria-hidden /> Minha rotina acadêmica
        </h3>
        <button type="button" className="study-icon" aria-label="Fechar a rotina" onClick={close}>
          <X size={18} />
        </button>
      </header>
      <form
        className="study-inline-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const text = (key: string) => String(data.get(key) ?? "").trim() || null;
          setBusy(true);
          setError("");
          try {
            saved(
              await planner.saveRoutine({
                ...routine,
                defaultStart: String(data.get("start")),
                defaultEnd: String(data.get("end")),
                weekdays: days,
                classReminderMinutes: Number(data.get("reminder")),
                quietStart: text("quietStart"),
                quietEnd: text("quietEnd"),
                semesterStart: text("semesterStart"),
                semesterEnd: text("semesterEnd"),
                state: text("state"),
                city: text("city"),
              }),
            );
          } catch (cause) {
            setError((cause as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Aulas começam às
          <input name="start" type="time" required defaultValue={routine.defaultStart} />
        </label>
        <label>
          e terminam às
          <input name="end" type="time" required defaultValue={routine.defaultEnd} />
        </label>
        <fieldset className="study-weekdays">
          <legend>Dias de aula</legend>
          {WEEKDAYS.map((weekday) => (
            <button
              key={weekday.value}
              type="button"
              aria-pressed={days.includes(weekday.value)}
              aria-label={weekday.long}
              onClick={() =>
                setDays((current) =>
                  current.includes(weekday.value)
                    ? current.filter((value) => value !== weekday.value)
                    : [...current, weekday.value].sort(),
                )
              }
            >
              {weekday.short}
            </button>
          ))}
        </fieldset>
        <label>
          Lembrete antes de cada aula
          <select name="reminder" defaultValue={routine.classReminderMinutes}>
            {REMINDERS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Silêncio a partir de
          <input name="quietStart" type="time" defaultValue={routine.quietStart ?? ""} />
        </label>
        <label>
          até
          <input name="quietEnd" type="time" defaultValue={routine.quietEnd ?? ""} />
        </label>
        <label>
          Início do semestre
          <input name="semesterStart" type="date" defaultValue={routine.semesterStart ?? ""} />
        </label>
        <label>
          Fim do semestre
          <input name="semesterEnd" type="date" defaultValue={routine.semesterEnd ?? ""} />
        </label>
        <label>
          Estado (feriados estaduais)
          <select name="state" defaultValue={routine.state ?? ""}>
            <option value="">Não informar</option>
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cidade
          <input name="city" maxLength={150} defaultValue={routine.city ?? ""} />
        </label>
        <p className="study-muted">
          Feriados nacionais e do seu estado aparecem sozinhos. Os da sua cidade você marca tocando no dia.
        </p>
        <button type="submit" disabled={busy}>
          Salvar rotina
        </button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
