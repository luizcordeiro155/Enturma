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
