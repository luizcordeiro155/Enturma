"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarCheck, UserCheck, UserX } from "lucide-react";
import {
  planner,
  timeIn,
  type AcademicTerm,
  type AttendanceStatus,
  type AttendanceSummary,
} from "@/lib/planner";
import { dayLabel } from "./study-calendar";
import { periodLabel } from "./study-day-panel";

/**
 * Asks about classes that already started and shows presences and absences in the semester.
 * A class without an answer counts as attended; the student only has to tell the misses.
 */
export function StudyAttendance({
  summary,
  zone,
  today,
  focusKey,
  changed,
  editSemester,
  terms = [],
  termId = null,
  selectTerm,
  startTerm,
}: {
  summary: AttendanceSummary;
  zone: string;
  today: string;
  /** The class a notification asked about, shown first. */
  focusKey?: string | null;
  changed: () => Promise<void>;
  editSemester: () => void;
  /** Every semester of the student, newest first. */
  terms?: AcademicTerm[];
  /** The semester shown; null is the current one. */
  termId?: string | null;
  selectTerm?: (id: string | null) => void;
  startTerm?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const card = useRef<HTMLElement>(null);
  const asked = Boolean(focusKey && summary.pending?.some((event) => event.attendanceKey === focusKey));
  // Opened from the "você está na aula?" notification: bring the question into view.
  useEffect(() => {
    if (asked) card.current?.scrollIntoView?.({ block: "center" });
  }, [asked]);
  const pending = [...(summary.pending ?? [])].sort(
    (a, b) => Number(b.attendanceKey === focusKey) - Number(a.attendanceKey === focusKey),
  );
  const question = pending[0];
  const present = summary.present ?? 0;
  const absent = summary.absent ?? 0;
  const total = present + absent;
  const rate = total ? Math.round((present / total) * 100) : null;
  const subjects = summary.subjects ?? [];

  async function answer(key: string, status: AttendanceStatus) {
    setBusy(key);
    setError("");
    try {
      await planner.setAttendance(key, status);
      await changed();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section ref={card} className="study-card study-attendance-card" aria-label="Presença no semestre">
      <div className="study-card-title">
        <CalendarCheck aria-hidden />
        <div>
          <h3>Presença no semestre</h3>
          <p>
            {summary.semesterStart && summary.semesterEnd
              ? periodLabel(summary.semesterStart, summary.semesterEnd)
              : "Defina seu semestre na rotina"}
            {summary.estimated ? " · estimado" : ""}
          </p>
        </div>
      </div>
      {terms.length > 1 && selectTerm && (
        <label className="study-term-select">
          Semestre
          <select value={termId ?? ""} onChange={(event) => selectTerm(event.target.value || null)}>
            {terms.map((term, index) => (
              <option key={term.id} value={index === 0 ? "" : term.id}>
                {term.name}
                {index === 0 ? " (atual)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      {question && (
        <div className="study-attendance-question" role="group" aria-label={`Você foi à aula de ${question.title}?`}>
          <p>
            <strong>Você foi à aula de {question.title}?</strong>
            <span>
              {question.occursOn === today ? "Hoje" : dayLabel(question.occursOn)} · {timeIn(question.startsAt, zone)} –{" "}
              {timeIn(question.endsAt, zone)}
            </span>
          </p>
          <div className="study-attendance">
            <button
              type="button"
              data-answer="present"
              disabled={busy !== null}
              onClick={() => answer(question.attendanceKey!, "PRESENT")}
            >
              <UserCheck size={15} aria-hidden /> Fui
            </button>
            <button
              type="button"
              data-answer="absent"
              disabled={busy !== null}
              onClick={() => answer(question.attendanceKey!, "ABSENT")}
            >
              <UserX size={15} aria-hidden /> Faltei
            </button>
          </div>
          {pending.length > 1 && (
            <small className="study-muted">
              Mais {pending.length - 1} {pending.length - 1 === 1 ? "aula" : "aulas"} esperando resposta.
            </small>
          )}
        </div>
      )}
      <dl className="study-attendance-totals">
        <div data-kind="present">
          <dt>Presenças</dt>
          <dd>{present}</dd>
        </div>
        <div data-kind="absent">
          <dt>Faltas</dt>
          <dd>{absent}</dd>
        </div>
        <div>
          <dt>Frequência</dt>
          <dd>{rate === null ? "—" : `${rate}%`}</dd>
        </div>
      </dl>
      {subjects.length > 0 ? (
        <ul className="study-attendance-subjects">
          {subjects.map((subject) => {
            const count = subject.present + subject.absent;
            return (
              <li key={subject.subjectId}>
                <span>
                  <strong>{subject.subjectName}</strong>
                  <small>
                    {subject.present} {subject.present === 1 ? "presença" : "presenças"} · {subject.absent}{" "}
                    {subject.absent === 1 ? "falta" : "faltas"}
                  </small>
                </span>
                <meter
                  min={0}
                  max={count || 1}
                  value={subject.present}
                  aria-label={`Frequência em ${subject.subjectName}`}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="study-muted">As aulas que já aconteceram aparecem aqui.</p>
      )}
      <p className="study-notice">
        Aula sem resposta conta como presença. Faltou? Marque “Faltei” no dia.
      </p>
      {summary.estimated ? (
        <button type="button" className="study-schedule-button" onClick={editSemester}>
          Definir início e fim do semestre
        </button>
      ) : (
        startTerm &&
        !termId && (
          <button type="button" className="text-button study-term-start" onClick={startTerm}>
            Começar novo semestre
          </button>
        )
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
