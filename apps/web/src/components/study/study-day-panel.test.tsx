import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StudyDayPanel } from "./study-day-panel";
import { isoDate, type Routine } from "@/lib/planner";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));

const routine = {
  timezone: "America/Sao_Paulo",
  defaultStart: "19:00",
  defaultEnd: "22:00",
  weekdays: [1, 2, 3, 4, 5],
  semesterStart: null,
  semesterEnd: null,
  classReminderMinutes: 120,
  quietStart: null,
  quietEnd: null,
  tutorPersonality: "BALANCED",
  state: null,
  city: null,
} as Routine;
const subjects = [{ id: "calc", name: "Cálculo I" }] as never;

function panel(day: string, events: never[] = []) {
  return render(
    <StudyDayPanel
      day={day}
      routine={routine}
      subjects={subjects}
      holidays={[]}
      events={events}
      changed={async () => {}}
      close={() => {}}
      initialForm={events.length ? null : "study"}
    />,
  );
}

beforeEach(() => api.mockReset().mockResolvedValue({ id: "s1" }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("a day that already passed cannot receive a study session", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  panel(isoDate(yesterday));
  expect(screen.getByRole("button", { name: /agendar estudo com ia/i })).toBeDisabled();
  expect(screen.getByText(/esse dia já passou/i)).toBeInTheDocument();
  expect(screen.queryByLabelText("Horário")).not.toBeInTheDocument();
});

it("today only accepts a time that has not passed yet", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 14, 20, 17));
  panel(isoDate(new Date()));
  const time = screen.getByLabelText("Horário");
  expect(time).toHaveAttribute("min", "20:18");
  expect(time).toHaveValue("20:20");
  fireEvent.change(time, { target: { value: "18:00" } });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Agendar estudo" })));
  expect(screen.getByRole("alert")).toHaveTextContent(/esse horário já passou/i);
  expect(api).not.toHaveBeenCalled();

  fireEvent.change(time, { target: { value: "21:00" } });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Agendar estudo" })));
  expect(api).toHaveBeenCalledWith("/study/sessions", expect.objectContaining({ method: "POST" }));
});

it("an exam, assignment or reminder can be edited again, keeping what it was", async () => {
  const task = {
    id: "t1",
    kind: "ASSIGNMENT",
    title: "RT4 Low-Code Enturma",
    subjectId: "calc",
    subjectName: "Cálculo I",
    occursOn: "2026-11-16",
    startsAt: "2026-11-16T22:00:00Z",
    endsAt: "2026-11-16T23:00:00Z",
    status: "SCHEDULED",
    holiday: false,
  };
  panel("2026-11-16", [task as never]);
  fireEvent.click(screen.getByRole("button", { name: "Editar RT4 Low-Code Enturma" }));
  const form = screen.getByRole("form", { name: "Editar marcação" });
  expect(screen.getByLabelText("Tipo")).toHaveValue("ASSIGNMENT");
  expect(screen.getByLabelText("Título")).toHaveValue("RT4 Low-Code Enturma");
  expect(screen.getByLabelText("Matéria")).toHaveValue("calc");
  expect(screen.getByLabelText("Dia")).toHaveValue("2026-11-16");
  expect(screen.getByLabelText("Horário")).toHaveValue("19:00");
  expect(screen.getByLabelText("Duração (min)")).toHaveValue(60);
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "EXAM" } });
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Prova RT4" } });
  fireEvent.change(screen.getByLabelText("Dia"), { target: { value: "2026-11-17" } });
  await act(async () => fireEvent.submit(form));
  const call = api.mock.calls.find(([path]) => path === "/planner/tasks/t1");
  expect(call?.[1]?.method).toBe("PUT");
  expect(JSON.parse(String(call?.[1]?.body))).toEqual({
    kind: "EXAM",
    title: "Prova RT4",
    subjectId: "calc",
    dueAt: new Date("2026-11-17T19:00").toISOString(),
    minutes: 60,
  });
  expect(screen.queryByRole("form", { name: "Editar marcação" })).not.toBeInTheDocument();
});

const lesson = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "s1:2026-11-10",
    kind: "CLASS",
    title: "Cálculo I",
    subjectId: "calc",
    scheduleId: "s1",
    occursOn: "2026-11-10",
    startsAt: "2026-11-10T22:00:00Z",
    endsAt: "2026-11-11T01:30:00Z",
    status: "SCHEDULED",
    holiday: false,
    attendanceKey: "s1:2026-11-10",
    attendance: null,
    ...overrides,
  }) as never;

it("a class that already happened shows as done and can be marked as missed", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-15T12:00:00-03:00"));
  panel("2026-11-10", [lesson()]);
  expect(screen.getByText("Aula · Concluída")).toBeInTheDocument();
  expect(screen.getByText("Você foi a esta aula?")).toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Faltei" })));
  const call = api.mock.calls.find(([path]) => path === "/planner/attendance");
  expect(call?.[1]?.method).toBe("PUT");
  expect(JSON.parse(String(call?.[1]?.body))).toEqual({ key: "s1:2026-11-10", status: "ABSENT" });
});

it("a missed class shows the absence and tapping it again removes the answer", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-15T12:00:00-03:00"));
  panel("2026-11-10", [lesson({ attendance: "ABSENT" })]);
  expect(screen.getByText("Aula · Falta")).toBeInTheDocument();
  const missed = screen.getByRole("button", { name: "Faltei" });
  expect(missed).toHaveAttribute("aria-pressed", "true");
  await act(async () => fireEvent.click(missed));
  const call = api.mock.calls.find(([path]) => path === "/planner/attendance");
  expect(JSON.parse(String(call?.[1]?.body))).toEqual({ key: "s1:2026-11-10", status: null });
});

it("a future class does not ask about attendance", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00-03:00"));
  panel("2026-11-10", [lesson()]);
  expect(screen.getByText("Aula")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Faltei" })).not.toBeInTheDocument();
});

it("a school break can be moved or removed by the student", async () => {
  render(
    <StudyDayPanel
      day="2026-07-10"
      routine={routine}
      subjects={subjects}
      holidays={[]}
      vacations={[{ id: "v1", startsOn: "2026-07-01", endsOn: "2026-07-31", name: "Férias de julho" }]}
      events={[]}
      changed={async () => {}}
      close={() => {}}
    />,
  );
  expect(screen.getByText("Férias de julho")).toBeInTheDocument();
  expect(screen.getByText(/1 a 31 de julho/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Editar período" }));
  fireEvent.change(screen.getByLabelText("Começa em"), { target: { value: "2026-07-15" } });
  await act(async () => fireEvent.submit(screen.getByRole("form", { name: "Editar férias" })));
  const call = api.mock.calls.find(([path]) => path === "/planner/vacations/v1");
  expect(call?.[1]?.method).toBe("PUT");
  expect(JSON.parse(String(call?.[1]?.body))).toEqual({
    name: "Férias de julho",
    startsOn: "2026-07-15",
    endsOn: "2026-07-31",
  });
  fireEvent.click(screen.getByRole("button", { name: "Remover" }));
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Remover estas férias" })));
  expect(api).toHaveBeenCalledWith("/planner/vacations/v1", { method: "DELETE" });
});

it("a new break needs its end after its start", async () => {
  panel("2026-07-10", [lesson({ occursOn: "2026-07-10" })]);
  fireEvent.click(screen.getByRole("button", { name: /^Férias$/ }));
  fireEvent.change(screen.getByLabelText("Termina em"), { target: { value: "2026-07-01" } });
  await act(async () => fireEvent.submit(screen.getByRole("form", { name: "Novas férias" })));
  expect(screen.getByRole("alert")).toHaveTextContent(/fim precisa ser depois/i);
  expect(api).not.toHaveBeenCalledWith("/planner/vacations", expect.anything());
});
