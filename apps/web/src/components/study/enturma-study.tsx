"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, Brain, CalendarClock, GraduationCap, Settings2, Sparkles } from "lucide-react";
import type { Profile } from "@enturma/contracts";
import {
  addDays,
  buildMonthGrid,
  isoDate,
  parseDate,
  planner,
  reminderLabel,
  timeIn,
  vacationOn,
  weekOf,
  type AttendanceSummary,
  type Calendar,
  type Routine,
} from "@/lib/planner";
import { StudyAttendance } from "./study-attendance";
import { StudyCalendar, dayLabel, type CalendarView } from "./study-calendar";
import { StudyDayPanel, type DayForm } from "./study-day-panel";
import { StudyRoutinePanel } from "./study-routine-panel";

function requestedDay() {
  if (typeof window === "undefined") return null;
  const day = new URLSearchParams(window.location.search).get("day");
  return day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/** The class a "você está na aula?" notification asked about. */
function requestedAttendance() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("attendance");
}

/** Attendance is extra: the calendar still works if it cannot load. */
const attendanceOrNothing = () => planner.attendance().catch(() => undefined);

/** Enturma Study on the home page: calendar, upcoming classes and today's agenda. */
export function EnturmaStudy({ profile }: { profile: Profile }) {
  const [today] = useState(() => isoDate(new Date()));
  const [now] = useState(() => Date.now());
  const [cursor, setCursor] = useState(() => requestedDay() ?? today);
  const [selected, setSelected] = useState<string | null>(() => requestedDay());
  const [view, setView] = useState<CalendarView>("month");
  const [routine, setRoutine] = useState<Routine>();
  const [calendar, setCalendar] = useState<Calendar>();
  const [attendance, setAttendance] = useState<AttendanceSummary>();
  const [focusKey] = useState(() => requestedAttendance());
  const [editingRoutine, setEditingRoutine] = useState(false);
  const [dayForm, setDayForm] = useState<DayForm>(null);
  const [error, setError] = useState("");
  const range = useMemo(() => {
    if (view === "week") {
      const week = weekOf(cursor);
      return { from: week[0], to: addDays(week[6], 21) };
    }
    const base = parseDate(cursor);
    const grid = buildMonthGrid(base.getFullYear(), base.getMonth());
    return { from: grid[0].date, to: grid[41].date };
  }, [cursor, view]);

  const load = useCallback(async () => {
    try {
      const [nextRoutine, nextCalendar, nextAttendance] = await Promise.all([
        planner.routine(),
        planner.calendar(range.from, range.to),
        attendanceOrNothing(),
      ]);
      setRoutine(nextRoutine);
      setCalendar(nextCalendar);
      setAttendance(nextAttendance);
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    let alive = true;
    void Promise.all([planner.routine(), planner.calendar(range.from, range.to), attendanceOrNothing()])
      .then(([nextRoutine, nextCalendar, nextAttendance]) => {
        if (!alive) return;
        setRoutine(nextRoutine);
        setCalendar(nextCalendar);
        setAttendance(nextAttendance);
        setError("");
      })
      .catch((cause: Error) => {
        if (alive) setError(cause.message);
      });
    return () => {
      alive = false;
    };
  }, [range.from, range.to]);

  const events = calendar?.events ?? [];
  const holidays = calendar?.holidays ?? [];
  const vacations = calendar?.vacations ?? [];
  const zone = calendar?.timezone ?? "America/Sao_Paulo";
  const upcoming = events
    .filter((event) => event.kind === "CLASS" && event.status !== "CANCELLED" && Date.parse(event.endsAt) > now)
    .slice(0, 3);
  const todays = events.filter((event) => event.occursOn === today && event.status !== "CANCELLED");
  const nextHolidays = holidays.filter((holiday) => holiday.date >= today).slice(0, 3);
  const reminder = routine ? reminderLabel(routine.classReminderMinutes) : null;
  const hasClasses = events.some((event) => event.kind === "CLASS");
  const sessions = events
    .filter(
      (event) =>
        event.kind === "STUDY" &&
        (event.status === "ACTIVE" || (event.status === "SCHEDULED" && Date.parse(event.endsAt) > now)),
    )
    .slice(0, 3);

  function move(direction: -1 | 1) {
    if (view === "week") setCursor(addDays(cursor, 7 * direction));
    else {
      const base = parseDate(cursor);
      setCursor(isoDate(new Date(base.getFullYear(), base.getMonth() + direction, 1)));
    }
  }

  return (
    <section id="enturma-study" className="enturma-study" aria-labelledby="enturma-study-title">
      <header className="enturma-study-head">
        <div>
          <span className="home-section-kicker">Enturma Study</span>
          <h2 id="enturma-study-title">Seu estudo, sua rotina, tudo em um só lugar.</h2>
          <p>Organize suas aulas, estudos e metas, e evolua na sua jornada acadêmica.</p>
        </div>
        <button type="button" className="secondary" onClick={() => setEditingRoutine((open) => !open)}>
          <Settings2 size={16} aria-hidden /> Minha rotina
        </button>
      </header>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {editingRoutine && routine && (
        <StudyRoutinePanel
          routine={routine}
          close={() => setEditingRoutine(false)}
          saved={(next) => {
            setRoutine(next);
            setEditingRoutine(false);
            void load();
          }}
        />
      )}
      <div className="enturma-study-grid">
        <article className="study-card study-calendar-card">
          <StudyCalendar
            cursor={cursor}
            view={view}
            today={today}
            selected={selected}
            holidays={holidays}
            vacations={vacations}
            events={events}
            select={(day) => {
              setDayForm(null);
              setSelected((current) => (current === day ? null : day));
            }}
            move={move}
            goToday={() => {
              setCursor(today);
              setSelected(today);
            }}
            setView={setView}
          />
          {nextHolidays.length > 0 && (
            <div className="study-next-holidays">
              <h4>Próximos feriados</h4>
              <ul>
                {nextHolidays.map((holiday) => (
                  <li key={`${holiday.date}${holiday.name}`}>
                    <span>{dayLabel(holiday.date)}</span> {holiday.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selected && routine && (
            <StudyDayPanel
              key={`${selected}:${dayForm ?? ""}`}
              initialForm={dayForm}
              day={selected}
              routine={routine}
              subjects={profile.subjects}
              holidays={holidays.filter((holiday) => holiday.date === selected)}
              vacations={vacationOn(vacations, selected)}
              events={events.filter((event) => event.occursOn === selected)}
              changed={load}
              close={() => setSelected(null)}
            />
          )}
        </article>
        <div className="enturma-study-side">
          {attendance && (
            <StudyAttendance
              summary={attendance}
              zone={zone}
              today={today}
              focusKey={focusKey}
              changed={load}
              editSemester={() => setEditingRoutine(true)}
            />
          )}
          <section className="study-card" aria-label="Próximas aulas">
            <div className="study-card-title">
              <GraduationCap aria-hidden />
              <div>
                <h3>Próximas aulas</h3>
                <p>Suas aulas na próxima janela.</p>
              </div>
            </div>
            {upcoming.length ? (
              <ul className="study-list">
                {upcoming.map((event) => (
                  <li key={event.id} data-kind="CLASS" data-status={event.status}>
                    <strong>{event.title}</strong>
                    <span>
                      {event.occursOn === today ? "Hoje" : dayLabel(event.occursOn)} · {timeIn(event.startsAt, zone)} –{" "}
                      {timeIn(event.endsAt, zone)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="study-empty">
                <p>{hasClasses ? "Nenhuma aula nos próximos dias." : "Monte sua grade e o Enturma lembra você das aulas."}</p>
                {!hasClasses && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoutine(true);
                      setSelected(today);
                    }}
                  >
                    Configure sua rotina
                  </button>
                )}
              </div>
            )}
            <p className="study-notice">
              <Bell size={16} aria-hidden />
              {reminder
                ? `O Enturma vai te notificar ${reminder} de cada aula.`
                : "Lembretes de aula desligados na sua rotina."}
            </p>
          </section>
          <section className="study-card study-sessions-card" aria-label="Sessões de estudo">
            <div className="study-card-title">
              <Brain aria-hidden />
              <div>
                <h3>Sessões de estudo</h3>
                <p>Estude com um tutor de IA no horário que você marcar.</p>
              </div>
            </div>
            {sessions.length ? (
              <ul className="study-list">
                {sessions.map((event) => (
                  <li key={event.id} data-kind="STUDY" data-status={event.status}>
                    <strong>{event.subjectName ?? event.title}</strong>
                    <span>
                      {event.status === "ACTIVE"
                        ? "Em andamento"
                        : `${event.occursOn === today ? "Hoje" : dayLabel(event.occursOn)} · ${timeIn(event.startsAt, zone)}`}
                    </span>
                    <Link className="study-room-link" href={`/study/${event.id}`}>
                      Abrir sala <ArrowRight size={14} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="study-muted">Nenhum estudo marcado. Escolha um dia e deixe a IA te ajudar.</p>
            )}
            <button
              type="button"
              className="study-schedule-button"
              onClick={() => {
                setDayForm("study");
                setSelected(selected ?? today);
              }}
            >
              <CalendarClock size={16} aria-hidden /> Agendar estudo
            </button>
          </section>
          <section className="study-card" aria-label="Agenda de hoje">
            <div className="study-card-title">
              <CalendarClock aria-hidden />
              <div>
                <h3>Agenda de hoje</h3>
                <p>{dayLabel(today)}</p>
              </div>
            </div>
            {todays.length ? (
              <ol className="study-timeline">
                {todays.map((event) => (
                  <li key={event.id} data-kind={event.kind} data-status={event.status}>
                    <span>
                      {timeIn(event.startsAt, zone)} – {timeIn(event.endsAt, zone)}
                    </span>
                    <strong>{event.title}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="study-muted">
                <Sparkles size={15} aria-hidden /> Dia livre. Que tal reservar um tempo para revisar?
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
