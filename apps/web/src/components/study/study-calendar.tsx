"use client";
import { useEffect, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { playMotion } from "@/lib/motion";
import {
  buildMonthGrid,
  parseDate,
  weekOf,
  type CalendarEvent,
  type CalendarHoliday,
} from "@/lib/planner";

export const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const HEADERS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export type CalendarView = "month" | "week";

export function dayLabel(iso: string) {
  const date = parseDate(iso);
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/** Monthly or weekly calendar: holidays in red, classes, studies and exams marked by kind. */
export function StudyCalendar({
  cursor,
  view,
  today,
  selected,
  holidays,
  events,
  select,
  move,
  goToday,
  setView,
}: {
  cursor: string;
  view: CalendarView;
  today: string;
  selected: string | null;
  holidays: CalendarHoliday[];
  events: CalendarEvent[];
  select: (day: string) => void;
  move: (direction: -1 | 1) => void;
  goToday: () => void;
  setView: (view: CalendarView) => void;
}) {
  const base = parseDate(cursor);
  const cells =
    view === "month"
      ? buildMonthGrid(base.getFullYear(), base.getMonth())
      : weekOf(cursor).map((date) => ({ date, inMonth: true }));
  const grid = useRef<HTMLDivElement>(null);
  const first = cells[0].date;
  useEffect(() => {
    if (grid.current)
      playMotion(grid.current, [
        { opacity: 0.35, transform: "translateY(6px)" },
        { opacity: 1, transform: "none" },
      ]);
  }, [first, view]);
  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events)
    byDay.set(event.occursOn, [...(byDay.get(event.occursOn) ?? []), event]);
  const holidayByDay = new Map<string, CalendarHoliday[]>();
  for (const holiday of holidays)
    holidayByDay.set(holiday.date, [...(holidayByDay.get(holiday.date) ?? []), holiday]);
  const title =
    view === "month"
      ? `${MONTHS[base.getMonth()]} de ${base.getFullYear()}`
      : `Semana de ${dayLabel(cells[0].date)}`;
  return (
    <div className="study-calendar" data-view={view}>
      <header className="study-calendar-head">
        <div className="study-card-title">
          <CalendarDays aria-hidden />
          <div>
            <h3>Calendário acadêmico</h3>
            <p>Suas aulas, estudos, provas e feriados.</p>
          </div>
        </div>
        <div className="study-calendar-controls">
          <div className="study-segmented" role="group" aria-label="Visualização">
            {(["month", "week"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
              >
                {option === "month" ? "Mês" : "Semana"}
              </button>
            ))}
          </div>
          <button type="button" className="study-icon" aria-label="Anterior" onClick={() => move(-1)}>
            <ChevronLeft size={18} />
          </button>
          <strong className="study-calendar-title" aria-live="polite">
            {title}
          </strong>
          <button type="button" className="study-icon" aria-label="Próximo" onClick={() => move(1)}>
            <ChevronRight size={18} />
          </button>
          <button type="button" className="study-today" onClick={goToday}>
            Hoje
          </button>
        </div>
      </header>
      <div className="study-calendar-weekdays" aria-hidden>
        {HEADERS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="study-calendar-grid" ref={grid}>
        {cells.map(({ date, inMonth }) => {
          const dayEvents = (byDay.get(date) ?? []).filter((event) => event.status !== "CANCELLED");
          const dayHolidays = holidayByDay.get(date) ?? [];
          const kinds = new Set(dayEvents.map((event) => (event.kind === "CLASS" ? "class" : event.kind === "STUDY" ? "study" : "exam")));
          const label = [
            dayLabel(date),
            ...dayHolidays.map((holiday) => `feriado: ${holiday.name}`),
            dayEvents.length
              ? `${dayEvents.length} ${dayEvents.length === 1 ? "compromisso" : "compromissos"}`
              : "",
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <button
              key={date}
              type="button"
              aria-label={label}
              aria-pressed={selected === date}
              aria-current={today === date ? "date" : undefined}
              className={[
                "study-day",
                inMonth ? "" : "is-outside",
                dayHolidays.length ? "is-holiday" : "",
                today === date ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => select(date)}
            >
              <span className="study-day-number">{parseDate(date).getDate()}</span>
              {view === "week" && (
                <span className="study-day-items">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span key={event.id} data-kind={event.kind}>
                      {event.title}
                    </span>
                  ))}
                </span>
              )}
              <span className="study-day-dots" aria-hidden>
                {[...kinds].map((kind) => (
                  <i key={kind} data-kind={kind} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <ul className="study-legend" aria-label="Legenda">
        <li data-kind="class">Aula</li>
        <li data-kind="study">Estudo</li>
        <li data-kind="exam">Prova ou trabalho</li>
        <li data-kind="holiday">Feriado</li>
      </ul>
    </div>
  );
}
