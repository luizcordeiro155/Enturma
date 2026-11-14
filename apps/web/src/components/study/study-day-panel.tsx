"use client";
import { useState, type FormEvent } from "react";
import {
  BookOpenCheck,
  CalendarPlus,
  ClipboardList,
  Flag,
  PartyPopper,
  Undo2,
  X,
} from "lucide-react";
import type { AcademicEntry } from "@enturma/contracts";
import {
  isoWeekday,
  planner,
  timeIn,
  WEEKDAYS,
  type CalendarEvent,
  type CalendarHoliday,
  type Routine,
} from "@/lib/planner";
import { dayLabel } from "./study-calendar";

const KIND_LABEL: Record<CalendarEvent["kind"], string> = {
  CLASS: "Aula",
  STUDY: "Estudo",
  EXAM: "Prova",
  ASSIGNMENT: "Trabalho",
  EVENT: "Lembrete",
};
const STATUS_LABEL: Partial<Record<CalendarEvent["status"], string>> = {
  CANCELLED: "Cancelada",
  MOVED: "Remarcada",
  EXTRA: "Reposição",
  DONE: "Concluído",
};

type Form = "class" | "task" | "holiday" | null;

/** Everything about one day: what happens, and the actions to change it. */
export function StudyDayPanel({
  day,
  routine,
  subjects,
  holidays,
  events,
  changed,
  close,
}: {
  day: string;
  routine: Routine;
  subjects: AcademicEntry[];
  holidays: CalendarHoliday[];
  events: CalendarEvent[];
  changed: () => Promise<void>;
  close: () => void;
}) {
  const [form, setForm] = useState<Form>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const weekday = WEEKDAYS.find((item) => item.value === isoWeekday(day))!.long;
  const title = `${weekday}, ${dayLabel(day)}`;
  const zone = routine.timezone;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await changed();
      setForm(null);
      setMoving(null);
      setConfirmDelete(null);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="study-day-panel" aria-label={title}>
      <header>
        <h3>{title}</h3>
        <button type="button" className="study-icon" aria-label="Fechar o dia" onClick={close}>
          <X size={18} />
        </button>
      </header>
      {holidays.map((holiday) => (
        <p key={`${holiday.date}${holiday.name}`} className="study-holiday-line">
          <Flag size={16} aria-hidden />
          <span>
            <strong>{holiday.name}</strong>
            {holiday.scope === "OPTIONAL" ? " · ponto facultativo" : holiday.custom ? " · feriado da cidade" : " · feriado"}
          </span>
          {holiday.custom && holiday.id && (
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => run(() => planner.deleteHoliday(holiday.id!))}
            >
              Remover
            </button>
          )}
        </p>
      ))}
      {events.length ? (
        <ul className="study-day-events">
          {events.map((event) => (
            <li key={event.id} data-kind={event.kind} data-status={event.status}>
              <span className="study-event-time">
                {timeIn(event.startsAt, zone)} – {timeIn(event.endsAt, zone)}
              </span>
              <div className="study-event-body">
                <span className="study-event-kind">
                  {KIND_LABEL[event.kind]}
                  {STATUS_LABEL[event.status] ? ` · ${STATUS_LABEL[event.status]}` : ""}
                </span>
                <strong>{event.title}</strong>
                {event.room ? <small>{event.room}</small> : null}
                {event.kind === "CLASS" && event.holiday && event.status === "SCHEDULED" && (
                  <small className="study-holiday-warning">Feriado — confirme se haverá aula.</small>
                )}
                {event.kind === "CLASS" && event.scheduleId && (
                  <div className="study-event-actions">
                    {event.exceptionId ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(() => planner.deleteException(event.scheduleId!, event.exceptionId!))}
                      >
                        <Undo2 size={15} aria-hidden /> Desfazer alteração
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              planner.addException(event.scheduleId!, { occursOn: event.occursOn, kind: "CANCELLED" }),
                            )
                          }
                        >
                          Cancelar esta aula
                        </button>
                        <button type="button" disabled={busy} onClick={() => setMoving(event.id)}>
                          Mover esta aula
                        </button>
                      </>
                    )}
                    {confirmDelete === event.scheduleId ? (
                      <button
                        type="button"
                        className="danger"
                        disabled={busy}
                        onClick={() => run(() => planner.deleteClass(event.scheduleId!))}
                      >
                        Excluir todas as aulas desta série
                      </button>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => setConfirmDelete(event.scheduleId!)}>
                        Excluir série
                      </button>
                    )}
                  </div>
                )}
                {event.kind !== "CLASS" && (
                  <div className="study-event-actions">
                    <button type="button" disabled={busy} onClick={() => run(() => planner.deleteTask(event.id))}>
                      Excluir
                    </button>
                  </div>
                )}
                {moving === event.id && (
                  <form
                    className="study-inline-form"
                    onSubmit={(submit) => {
                      submit.preventDefault();
                      const data = new FormData(submit.currentTarget);
                      const when = String(data.get("when"));
                      run(() =>
                        planner.addException(event.scheduleId!, {
                          occursOn: event.occursOn,
                          kind: "MOVED",
                          movedTo: new Date(when).toISOString(),
                        }),
                      );
                    }}
                  >
                    <label>
                      Novo dia e horário
                      <input name="when" type="datetime-local" required defaultValue={`${event.occursOn}T${timeIn(event.startsAt, zone)}`} />
                    </label>
                    <button type="submit" disabled={busy}>Mover</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="study-muted">Nada marcado para este dia.</p>
      )}
      <div className="study-day-add" role="group" aria-label="Adicionar ao dia">
        <button type="button" aria-pressed={form === "class"} onClick={() => setForm(form === "class" ? null : "class")}>
          <BookOpenCheck size={16} aria-hidden /> Adicionar aula
        </button>
        <button type="button" aria-pressed={form === "task"} onClick={() => setForm(form === "task" ? null : "task")}>
          <ClipboardList size={16} aria-hidden /> Prova, trabalho ou lembrete
        </button>
        <button type="button" aria-pressed={form === "holiday"} onClick={() => setForm(form === "holiday" ? null : "holiday")}>
          <PartyPopper size={16} aria-hidden /> Feriado da cidade
        </button>
      </div>
      {form === "class" && (
        <ClassForm day={day} routine={routine} subjects={subjects} busy={busy} submit={(body) => run(() => planner.addClasses(body))} />
      )}
      {form === "task" && (
        <form
          className="study-inline-form"
          onSubmit={(submit: FormEvent<HTMLFormElement>) => {
            submit.preventDefault();
            const data = new FormData(submit.currentTarget);
            run(() =>
              planner.addTask({
                kind: String(data.get("kind")) as "EXAM" | "ASSIGNMENT" | "EVENT",
                title: String(data.get("title")),
                subjectId: String(data.get("subject")) || null,
                dueAt: new Date(`${day}T${String(data.get("time"))}`).toISOString(),
                minutes: Number(data.get("minutes")),
              }),
            );
          }}
        >
          <label>
            Tipo
            <select name="kind" defaultValue="EXAM">
              <option value="EXAM">Prova</option>
              <option value="ASSIGNMENT">Trabalho</option>
              <option value="EVENT">Lembrete</option>
            </select>
          </label>
          <label>
            Título
            <input name="title" required maxLength={180} placeholder="Ex.: Prova de Cálculo" />
          </label>
          <label>
            Matéria
            <select name="subject" defaultValue="">
              <option value="">Nenhuma</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Horário
            <input name="time" type="time" required defaultValue={routine.defaultStart} />
          </label>
          <label>
            Duração (min)
            <input name="minutes" type="number" min={5} max={1440} defaultValue={60} />
          </label>
          <button type="submit" disabled={busy}>
            <CalendarPlus size={16} aria-hidden /> Salvar
          </button>
        </form>
      )}
      {form === "holiday" && (
        <form
          className="study-inline-form"
          onSubmit={(submit) => {
            submit.preventDefault();
            const data = new FormData(submit.currentTarget);
            run(() =>
              planner.addHoliday({
                date: day,
                name: String(data.get("name")),
                scope: data.get("optional") ? "OPTIONAL" : "CITY",
              }),
            );
          }}
        >
          <label>
            Nome do feriado
            <input name="name" required maxLength={120} placeholder="Ex.: Aniversário da cidade" />
          </label>
          <label className="study-check">
            <input name="optional" type="checkbox" /> É ponto facultativo
          </label>
          <button type="submit" disabled={busy}>Marcar feriado</button>
        </form>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}

function ClassForm({
  day,
  routine,
  subjects,
  busy,
  submit,
}: {
  day: string;
  routine: Routine;
  subjects: AcademicEntry[];
  busy: boolean;
  submit: (body: Parameters<typeof planner.addClasses>[0]) => void;
}) {
  const [days, setDays] = useState<number[]>([isoWeekday(day)]);
  if (!subjects.length)
    return (
      <p className="study-muted">
        Salve suas matérias no perfil acadêmico para montar a sua grade.
      </p>
    );
  return (
    <form
      className="study-inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        submit({
          subjectId: String(data.get("subject")),
          weekdays: days,
          startsAt: String(data.get("start")),
          endsAt: String(data.get("end")),
          validFrom: day,
          validUntil: String(data.get("until")) || routine.semesterEnd,
          room: String(data.get("room")),
        });
      }}
    >
      <label>
        Matéria
        <select name="subject" required defaultValue={subjects[0].id}>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="study-weekdays">
        <legend>Repete em</legend>
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
                  : [...current, weekday.value],
              )
            }
          >
            {weekday.short}
          </button>
        ))}
      </fieldset>
      <label>
        Início
        <input name="start" type="time" required defaultValue={routine.defaultStart} />
      </label>
      <label>
        Fim
        <input name="end" type="time" required defaultValue={routine.defaultEnd} />
      </label>
      <label>
        Até (opcional)
        <input name="until" type="date" min={day} defaultValue={routine.semesterEnd ?? ""} />
      </label>
      <label>
        Sala (opcional)
        <input name="room" maxLength={120} />
      </label>
      <button type="submit" disabled={busy || !days.length}>
        Salvar aulas
      </button>
    </form>
  );
}
