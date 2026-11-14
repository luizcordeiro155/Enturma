import { api } from "@/lib/api";

export type TutorPersonality = "WELCOMING" | "BALANCED" | "DEMANDING";
export type StudyStatus = "PLANNED" | "ACTIVE" | "DONE" | "SKIPPED";

export type StudySessionSummary = {
  id: string;
  subjectId: string;
  subjectName: string;
  startsAt: string;
  minutes: number;
  goal: string;
  status: StudyStatus;
};

export type StudySession = StudySessionSummary & {
  notebookId: string | null;
  personality: TutorPersonality;
  difficulty: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  topic: string;
  answer?: number;
  explanation?: string;
};

export type QuizResult = {
  correct: boolean;
  chosen: number | null;
  answer: number;
  explanation: string;
  topic: string;
};

export type QuizGrade = {
  score: number;
  total: number;
  done: boolean;
  weakTopics: string[];
  results: QuizResult[];
};

export type StudyMessage = {
  id: string;
  kind: "CHAT" | "QUIZ";
  question: string;
  answer?: string | null;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  error?: string | null;
  createdAt: string;
  quiz?: QuizQuestion[];
  attempt?: { answers: number[]; score: number; total: number; wrongTopics: string[] };
};

export type StudyRoom = {
  session: StudySession;
  messages: StudyMessage[];
  sources: { id: string; title: string; kind: string; status: string; error?: string | null }[];
  mastery: { level: string; evidence?: Record<string, [number, number]> };
};

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const base = "/study/sessions";

export const study = {
  upcoming: () => api<StudySessionSummary[]>(base, { cache: "no-store" }),
  due: () => api<StudySessionSummary[]>(`${base}/due`, { cache: "no-store" }),
  create: (body: { subjectId: string; startsAt: string; minutes: number; goal: string }) =>
    api<{ id: string }>(base, json(body)),
  room: (id: string) => api<StudyRoom>(`${base}/${id}`, { cache: "no-store" }),
  start: (id: string) => api<StudyRoom>(`${base}/${id}/start`, { method: "POST" }),
  message: (id: string, messageId: string, message: string) =>
    api<{ id: string }>(`${base}/${id}/messages`, json({ id: messageId, message })),
  quiz: (id: string, quizId: string) => api<{ id: string }>(`${base}/${id}/quiz`, json({ id: quizId })),
  answer: (id: string, quizId: string, answers: (number | null)[]) =>
    api<QuizGrade>(`${base}/${id}/quiz/${quizId}/answers`, json({ answers })),
  personality: (id: string, personality: TutorPersonality) =>
    api(`${base}/${id}/personality`, json({ personality }, "PUT")),
  skip: (id: string) => api(`${base}/${id}/skip`, { method: "POST" }),
  finish: (id: string) => api(`${base}/${id}/finish`, { method: "POST" }),
  continueLater: (id: string, startsAt: string, minutes: number) =>
    api<{ id: string }>(`${base}/${id}/continue`, json({ startsAt, minutes })),
  remove: (id: string) => api(`${base}/${id}`, { method: "DELETE" }),
};

export const PERSONALITIES: { value: TutorPersonality; label: string; hint: string }[] = [
  { value: "WELCOMING", label: "Acolhedor", hint: "Paciente e caloroso" },
  { value: "BALANCED", label: "Equilibrado", hint: "Explica e desafia" },
  { value: "DEMANDING", label: "Exigente", hint: "Firme e direto" },
];

/** The tutor's first words, written locally so the room opens instantly. */
export function tutorGreeting(personality: TutorPersonality, subject: string, goal: string) {
  const focus = goal ? ` O objetivo de hoje é: ${goal}.` : "";
  if (personality === "WELCOMING")
    return `Que bom te ver por aqui! 😊 Vamos estudar ${subject} juntos, no seu ritmo.${focus} Me conta: qual parte da matéria está sendo mais difícil pra você?`;
  if (personality === "DEMANDING")
    return `Sessão de ${subject} iniciada.${focus} Para eu montar o plano certo, seja específico: qual conteúdo você não consegue resolver sozinho hoje?`;
  return `Olá! Vamos estudar ${subject}.${focus} Para começar, qual é a sua maior dificuldade nessa matéria?`;
}

export function minutesUntil(iso: string, now = Date.now()) {
  return Math.round((new Date(iso).getTime() - now) / 60000);
}

/** "agora", "em 8 min", "há 12 min", "às 19:00". */
export function whenLabel(iso: string, now = Date.now()) {
  const minutes = minutesUntil(iso, now);
  if (Math.abs(minutes) < 1) return "agora";
  if (minutes > 0 && minutes < 60) return `em ${minutes} min`;
  if (minutes < 0 && minutes > -60) return `começou há ${-minutes} min`;
  return `às ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso))}`;
}
