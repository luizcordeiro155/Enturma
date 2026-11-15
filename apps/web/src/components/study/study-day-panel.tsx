"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CalendarPlus,
  Check,
  ClipboardList,
  Flag,
  PartyPopper,
  Pencil,
  Undo2,
  X,
} from "lucide-react";
import type { AcademicEntry } from "@enturma/contracts";
import {
  isoDate,
  isoWeekday,
  planner,
  timeIn,
  WEEKDAYS,
  type CalendarEvent,
  type CalendarHoliday,
  type Routine,
} from "@/lib/planner";
import { study } from "@/lib/study";
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
  ACTIVE: "Em andamento",
};

export type DayForm = "class" | "task" | "holiday" | "study" | null;

/** Everything about one day: what happens, and the actions to change it. */
export function StudyDayPanel({
  day,
  routine,
  subjects,
  holidays,
  events,
  changed,
  close,
  initialForm = null,
}: {
  day: string;
  routine: Routine;
  subjects: AcademicEntry[];
  holidays: CalendarHoliday[];
  events: CalendarEvent[];
  changed: () => Promise<void>;
  close: () => void;
  initialForm?: DayForm;
}) {
  const [form, setForm] = useState<DayForm>(initialForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const weekday = WEEKDAYS.find((item) => item.value === isoWeekday(day))!.long;
  const past = day < isoDate(new Date());
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
      setEditing(null);
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
                {event.kind === "STUDY" && (
                  <div className="study-event-actions">
                    {event.status !== "CANCELLED" && (
                      <Link className="study-room-link" href={`/study/${event.id}`}>
                        {event.status === "DONE" ? "Revisar sala" : "Abrir sala"} <ArrowRight size={15} aria-hidden />
                      </Link>
                    )}
                    {event.status === "SCHEDULED" && (
                      <button type="button" disabled={busy} onClick={() => run(() => study.skip(event.id))}>
                        Desistir desta sessão
                      </button>
                    )}
                    {confirmDelete === event.id ? (
                      <button
                        type="button"
                        className="danger"
                        disabled={busy}
                        onClick={() => run(() => study.remove(event.id))}
                      >
                        Excluir sessão e caderno
                      </button>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => setConfirmDelete(event.id)}>
                        Excluir
                      </button>
                    )}
                  </div>
                )}
                {event.kind !== "CLASS" && event.kind !== "STUDY" && (
                  <div className="study-event-actions">
                    <button
                      type="button"
                      aria-label={`Editar ${event.title}`}
                      aria-expanded={editing === event.id}
                      disabled={busy}
                      onClick={() => setEditing(editing === event.id ? null : event.id)}
                    >
                      <Pencil size={14} aria-hidden /> Editar
                    </button>
                    <button type="button" disabled={busy} onClick={() => run(() => planner.deleteTask(event.id))}>
                      Excluir
                    </button>
                  </div>
                )}
                {editing === event.id && event.kind !== "CLASS" && event.kind !== "STUDY" && (
                  <TaskForm
                    day={day}
                    routine={routine}
                    subjects={subjects}
                    busy={busy}
                    event={event}
                    zone={zone}
                    submit={(body) => run(() => planner.updateTask(event.id, body))}
                  />
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
        <button
          type="button"
          aria-pressed={form === "study" && !past}
          disabled={past}
          title={past ? "Esse dia já passou" : undefined}
          onClick={() => setForm(form === "study" ? null : "study")}
        >
          <Brain size={16} aria-hidden /> Agendar estudo com IA
        </button>
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
      {past && (
        <p className="study-muted study-past-note">Esse dia já passou. Escolha hoje ou um dia futuro para agendar estudos.</p>
      )}
      {form === "study" && !past && (
        <StudyForm
          day={day}
          routine={routine}
          subjects={subjects}
          busy={busy}
          submit={(body) => run(() => study.create(body))}
        />
      )}
      {form === "class" && (
        <ClassForm day={day} routine={routine} subjects={subjects} busy={busy} submit={(body) => run(() => planner.addClasses(body))} />
      )}
      {form === "task" && (
        <TaskForm
          day={day}
          routine={routine}
          subjects={subjects}
          busy={busy}
          submit={(body) => run(() => planner.addTask(body))}
        />
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

function StudyForm({
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
  submit: (body: Parameters<typeof study.create>[0]) => void;
}) {
  const [error, setError] = useState("");
  if (!subjects.length)
    return (
      <p className="study-muted">
        Salve suas matérias no perfil acadêmico para agendar estudos com a IA.
      </p>
    );
  const now = new Date();
  const today = day === isoDate(now);
  const earliest = new Date(now.getTime() + 60000);
  const earliestTime = today ? clockTime(earliest) : undefined;
  const rounded = new Date(Math.ceil(earliest.getTime() / 300000) * 300000);
  const suggested =
    today && isoDate(rounded) === day && clockTime(rounded) > routine.defaultStart
      ? clockTime(rounded)
      : today && clockTime(earliest) > routine.defaultStart
        ? clockTime(earliest)
        : routine.defaultStart;
  return (
    <form
      className="study-inline-form study-session-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const startsAt = new Date(`${day}T${String(data.get("time"))}`);
        if (Number.isNaN(startsAt.getTime())) {
          setError("Informe o horário do estudo.");
          return;
        }
        if (startsAt.getTime() < Date.now()) {
          setError("Esse horário já passou. Escolha um horário a partir de agora.");
          return;
        }
        setError("");
        submit({
          subjectId: String(data.get("subject")),
          startsAt: startsAt.toISOString(),
          minutes: Number(data.get("minutes")),
          goal: String(data.get("goal") ?? "").trim(),
        });
      }}
    >
      <p className="study-session-form-intro">
        <Brain size={16} aria-hidden /> O Enturma cria um caderno com um tutor de IA para esta matéria e te chama na hora
        marcada.
      </p>
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
      <label>
        Horário
        <input name="time" type="time" required min={earliestTime} defaultValue={suggested} />
      </label>
      <label>
        Duração
        <select name="minutes" defaultValue="45">
          {[15, 25, 30, 45, 60, 90, 120].map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} min
            </option>
          ))}
        </select>
      </label>
      <label className="study-session-goal">
        O que você quer estudar? (opcional)
        <input name="goal" maxLength={300} placeholder="Ex.: Limites laterais e continuidade" />
      </label>
      {error && (
        <p role="alert" className="error study-session-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy}>
        <CalendarPlus size={16} aria-hidden /> Agendar estudo
      </button>
    </form>
  );
}

const clockTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

type TaskBody = Parameters<typeof planner.addTask>[0];

/** Adds an exam, assignment or reminder, or edits one keeping what it was. */
function TaskForm({
  day,
  routine,
  subjects,
  busy,
  submit,
  event,
  zone,
}: {
  day: string;
  routine: Routine;
  subjects: AcademicEntry[];
  busy: boolean;
  submit: (body: TaskBody) => void;
  event?: CalendarEvent;
  zone?: string;
}) {
  const minutes = event
    ? Math.max(5, Math.round((Date.parse(event.endsAt) - Date.parse(event.startsAt)) / 60000))
    : 60;
  return (
    <form
      className={`study-inline-form${event ? " study-task-edit" : ""}`}
      aria-label={event ? "Editar marcação" : "Nova marcação"}
      onSubmit={(submitEvent: FormEvent<HTMLFormElement>) => {
        submitEvent.preventDefault();
        const data = new FormData(submitEvent.currentTarget);
        const date = event ? String(data.get("date")) : day;
        submit({
          kind: String(data.get("kind")) as TaskBody["kind"],
          title: String(data.get("title")).trim(),
          subjectId: String(data.get("subject")) || null,
          dueAt: new Date(`${date}T${String(data.get("time"))}`).toISOString(),
          minutes: Number(data.get("minutes")),
        });
      }}
    >
      <label>
        Tipo
        <select name="kind" defaultValue={event?.kind ?? "EXAM"}>
          <option value="EXAM">Prova</option>
          <option value="ASSIGNMENT">Trabalho</option>
          <option value="EVENT">Lembrete</option>
        </select>
      </label>
      <label>
        Título
        <input name="title" required maxLength={180} defaultValue={event?.title} placeholder="Ex.: Prova de Cálculo" />
      </label>
      <label>
        Matéria
        <select name="subject" defaultValue={event?.subjectId ?? ""}>
          <option value="">Nenhuma</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </label>
      {event ? (
        <label>
          Dia
          <input name="date" type="date" required defaultValue={event.occursOn} />
        </label>
      ) : null}
      <label>
        Horário
        <input
          name="time"
          type="time"
          required
          defaultValue={event ? timeIn(event.startsAt, zone ?? routine.timezone) : routine.defaultStart}
        />
      </label>
      <label>
        Duração (min)
        <input name="minutes" type="number" min={5} max={1440} defaultValue={minutes} />
      </label>
      <button type="submit" disabled={busy}>
        {event ? <Check size={16} aria-hidden /> : <CalendarPlus size={16} aria-hidden />}{" "}
        {event ? "Salvar alterações" : "Salvar"}
      </button>
    </form>
  );
}
