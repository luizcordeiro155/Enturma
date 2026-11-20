export type JourneyKind =
  | "PROJECT"
  | "TEAM"
  | "COURSE"
  | "ACHIEVEMENT"
  | "CERTIFICATE"
  | "ACTIVITY"
  | "GOAL"
  | "MILESTONE";

/** The order kinds are offered in. */
export const JOURNEY_KINDS: { id: JourneyKind; label: string }[] = [
  { id: "MILESTONE", label: "Marco" },
  { id: "PROJECT", label: "Projeto" },
  { id: "TEAM", label: "Trabalho em equipe" },
  { id: "COURSE", label: "Disciplina" },
  { id: "ACTIVITY", label: "Atividade acadêmica" },
  { id: "CERTIFICATE", label: "Certificado" },
  { id: "ACHIEVEMENT", label: "Conquista" },
  { id: "GOAL", label: "Objetivo" },
];

export const journeyKindLabel = (kind?: string) =>
  JOURNEY_KINDS.find((entry) => entry.id === kind)?.label ?? "Registro";

/** One record of the timeline. `date` is a calendar day, "2026-05-21". */
export type JourneyEntry = {
  id: string;
  kind: JourneyKind | string;
  title: string;
  detail: string;
  date: string;
  /** Only the owner is told; visitors only ever receive shown records. */
  visible?: boolean;
  source?: string | null;
  /** Set for visitors when the record came from a project they can see. */
  projectId?: string;
};

/** Something the platform already knows that could become a record, if the student wants. */
export type JourneySuggestion = {
  source: string;
  kind: JourneyKind | string;
  title: string;
  detail: string;
  date?: string;
  origin: string;
};

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = [
  "jan.",
  "fev.",
  "mar.",
  "abr.",
  "mai.",
  "jun.",
  "jul.",
  "ago.",
  "set.",
  "out.",
  "nov.",
  "dez.",
];

/** "2026-05-21" → "2026.1": January to June, then July to December. */
export function semesterOf(date: string) {
  const parts = DAY.exec(date);
  if (!parts) return "";
  return `${parts[1]}.${Number(parts[2]) <= 6 ? 1 : 2}`;
}

/** The date as written, so a day never slides to the month before in another time zone. */
export function monthLabel(date: string) {
  const parts = DAY.exec(date);
  const month = parts ? MONTHS[Number(parts[2]) - 1] : undefined;
  return parts && month ? `${month} de ${parts[1]}` : "";
}

export function bySemester<T extends { date: string }>(entries: T[]) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const groups: { semester: string; entries: T[] }[] = [];
  for (const entry of sorted) {
    const semester = semesterOf(entry.date);
    const last = groups[groups.length - 1];
    if (last?.semester === semester) last.entries.push(entry);
    else groups.push({ semester, entries: [entry] });
  }
  return groups;
}
