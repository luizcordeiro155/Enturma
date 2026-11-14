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
};

export type Calendar = {
  timezone: string;
  holidays: CalendarHoliday[];
  events: CalendarEvent[];
};

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
  addTask: (body: {
    kind: "EXAM" | "ASSIGNMENT" | "EVENT";
    title: string;
    subjectId?: string | null;
    dueAt: string;
    minutes?: number;
  }) => api<{ id: string }>("/planner/tasks", json(body, "POST")),
  deleteTask: (id: string) => api(`/planner/tasks/${id}`, { method: "DELETE" }),
};
