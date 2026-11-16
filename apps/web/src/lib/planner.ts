import { api } from "@/lib/api";

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Routine = {
  timezone: string;
  defaultStart: string;
  defaultEnd: string;
  weekdays: number[];
  semesterStart: string | null;
  semesterEnd: string | null;
  classReminderMinutes: number;
  quietStart: string | null;
  quietEnd: string | null;
  tutorPersonality: "WELCOMING" | "BALANCED" | "DEMANDING";
  state: string | null;
  city: string | null;
};

export type CalendarHoliday = {
  date: string;
  name: string;
  scope: "NATIONAL" | "STATE" | "OPTIONAL" | "CITY";
  custom: boolean;
  id?: string;
};

export type CalendarEvent = {
  id: string;
  kind: "CLASS" | "EXAM" | "ASSIGNMENT" | "EVENT" | "STUDY";
  title: string;
  subjectId?: string | null;
  subjectName?: string | null;
  scheduleId?: string;
  exceptionId?: string;
  version?: number;
  room?: string;
  note?: string;
  notebookId?: string | null;
  occursOn: string;
  startsAt: string;
  endsAt: string;
  status: "SCHEDULED" | "CANCELLED" | "MOVED" | "EXTRA" | "DONE" | "ACTIVE";
  holiday: boolean;
  /** Classes only: what identifies this one class when the student says if they went. */
  attendanceKey?: string;
  attendance?: AttendanceStatus | null;
};

export type AttendanceStatus = "PRESENT" | "ABSENT";

/** A school break: regular classes in it do not happen. */
export type CalendarVacation = {
  id: string;
  startsOn: string;
  endsOn: string;
  name: string;
};

export type Calendar = {
  timezone: string;
  holidays: CalendarHoliday[];
  vacations?: CalendarVacation[];
  events: CalendarEvent[];
};

export type AttendanceSummary = {
  termId?: string | null;
  termName?: string | null;
  semesterStart: string;
  semesterEnd: string;
  /** True when the routine has no semester and the current half-year is used. */
  estimated: boolean;
  present: number;
  absent: number;
  subjects: { subjectId: string; subjectName: string; present: number; absent: number }[];
  /** Recent classes that already started and have no answer yet, newest first. */
  pending: CalendarEvent[];
};

export type AcademicTerm = {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  periodId: string | null;
  periodName: string | null;
  subjects: { id: string; name: string }[];
  subjectsConfirmed: boolean;
};

/** What the student still has to do about their semester. */
export type TermNeeds = "NONE" | "SET_DATES" | "NEW_TERM" | "SUBJECTS";

export type TermOverview = {
  current: AcademicTerm | null;
  needs: TermNeeds;
  suggestion: { name: string; startsOn: string; endsOn: string };
  terms: AcademicTerm[];
};

export type ClassState = "upcoming" | "ongoing" | "attended" | "absent";

/** Where a class stands now: not started, happening, or past (attended unless marked absent). */
export function classState(event: CalendarEvent, now = Date.now()): ClassState {
  if (Date.parse(event.startsAt) > now) return "upcoming";
  if (event.attendance === "ABSENT") return "absent";
  if (Date.parse(event.endsAt) > now) return "ongoing";
  return "attended";
}

export const vacationOn = (vacations: CalendarVacation[] | undefined, day: string) =>
  (vacations ?? []).filter((vacation) => vacation.startsOn <= day && day <= vacation.endsOn);

const pad = (value: number) => String(value).padStart(2, "0");

/** A local calendar date as YYYY-MM-DD (no time-zone shift). */
export const isoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (iso: string, days: number) => {
  const date = parseDate(iso);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

/** The 6×7 month grid, Sunday first, as the Brazilian calendar is drawn. */
export function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date: isoDate(date), inMonth: date.getMonth() === month };
  });
}

/** The Sunday-to-Saturday week containing a date. */
export function weekOf(iso: string) {
  const date = parseDate(iso);
  const start = addDays(iso, -date.getDay());
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** ISO weekday (1 = Monday … 7 = Sunday) of a YYYY-MM-DD date. */
export const isoWeekday = (iso: string) => (parseDate(iso).getDay() || 7) as Weekday;

export function timeIn(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

/** "2 horas antes", "1 hora antes", "30 minutos antes", "1 h 30 min antes". */
export function reminderLabel(minutes: number) {
  if (minutes <= 0) return null;
  const hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  if (!hours) return `${rest} minutos antes`;
  if (!rest) return `${hours} ${hours === 1 ? "hora" : "horas"} antes`;
  return `${hours} h ${rest} min antes`;
}

export const WEEKDAYS: { value: Weekday; short: string; long: string }[] = [
  { value: 1, short: "Seg", long: "segunda-feira" },
  { value: 2, short: "Ter", long: "terça-feira" },
  { value: 3, short: "Qua", long: "quarta-feira" },
  { value: 4, short: "Qui", long: "quinta-feira" },
  { value: 5, short: "Sex", long: "sexta-feira" },
  { value: 6, short: "Sáb", long: "sábado" },
  { value: 7, short: "Dom", long: "domingo" },
];

export const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const json = (body: unknown, method: string): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const planner = {
  calendar: (from: string, to: string) =>
    api<Calendar>(`/planner/calendar?from=${from}&to=${to}`, { cache: "no-store" }),
  routine: () => api<Routine>("/planner/routine", { cache: "no-store" }),
  saveRoutine: (routine: Routine) =>
    api<Routine>(
      "/planner/routine",
      // The API rejects unknown fields, so send exactly the editable ones.
      json(
        {
          timezone: routine.timezone,
          defaultStart: routine.defaultStart,
          defaultEnd: routine.defaultEnd,
          weekdays: routine.weekdays,
          semesterStart: routine.semesterStart,
          semesterEnd: routine.semesterEnd,
          classReminderMinutes: routine.classReminderMinutes,
          quietStart: routine.quietStart,
          quietEnd: routine.quietEnd,
          tutorPersonality: routine.tutorPersonality,
          state: routine.state,
          city: routine.city,
        },
        "PUT",
      ),
    ),
  addClasses: (body: {
    subjectId: string;
    weekdays: number[];
    startsAt: string;
    endsAt: string;
    validFrom: string;
    validUntil?: string | null;
    room?: string;
  }) => api<{ ids: string[] }>("/planner/classes", json(body, "POST")),
  deleteClass: (id: string) => api(`/planner/classes/${id}`, { method: "DELETE" }),
  addException: (
    scheduleId: string,
    body: { occursOn: string; kind: "CANCELLED" | "MOVED" | "EXTRA"; movedTo?: string; minutes?: number; note?: string },
  ) => api<{ id: string }>(`/planner/classes/${scheduleId}/exceptions`, json(body, "POST")),
  deleteException: (scheduleId: string, id: string) =>
    api(`/planner/classes/${scheduleId}/exceptions/${id}`, { method: "DELETE" }),
  addHoliday: (body: { date: string; name: string; scope: "CITY" | "OPTIONAL" }) =>
    api<{ id: string }>("/planner/holidays", json(body, "POST")),
  deleteHoliday: (id: string) => api(`/planner/holidays/${id}`, { method: "DELETE" }),
  addVacation: (body: { startsOn: string; endsOn: string; name: string }) =>
    api<{ id: string }>("/planner/vacations", json(body, "POST")),
  updateVacation: (id: string, body: { startsOn: string; endsOn: string; name: string }) =>
    api(`/planner/vacations/${id}`, json(body, "PUT")),
  deleteVacation: (id: string) => api(`/planner/vacations/${id}`, { method: "DELETE" }),
  attendance: (termId?: string | null) =>
    api<AttendanceSummary>(`/planner/attendance${termId ? `?term=${termId}` : ""}`, { cache: "no-store" }),
  terms: () => api<TermOverview>("/planner/terms", { cache: "no-store" }),
  /** Starts the next semester: the old grade stops and the new subjects are chosen next. */
  startTerm: (body: { name?: string; startsOn: string; endsOn: string }) =>
    api<TermOverview>("/planner/terms", json(body, "POST")),
  /** Says whether the student went to a class that already started; null removes the answer. */
  setAttendance: (key: string, status: AttendanceStatus | null) =>
    api("/planner/attendance", json({ key, status }, "PUT")),
  addTask: (body: {
    kind: "EXAM" | "ASSIGNMENT" | "EVENT";
    title: string;
    subjectId?: string | null;
    dueAt: string;
    minutes?: number;
  }) => api<{ id: string }>("/planner/tasks", json(body, "POST")),
  updateTask: (
    id: string,
    body: {
      kind: "EXAM" | "ASSIGNMENT" | "EVENT";
      title: string;
      subjectId?: string | null;
      dueAt: string;
      minutes?: number;
    },
  ) => api(`/planner/tasks/${id}`, json(body, "PUT")),
  deleteTask: (id: string) => api(`/planner/tasks/${id}`, { method: "DELETE" }),
};
