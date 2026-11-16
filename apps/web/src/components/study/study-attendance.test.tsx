import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StudyAttendance } from "./study-attendance";
import type { AttendanceSummary } from "@/lib/planner";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));

const pending = (key: string, title: string, day: string) => ({
  id: key,
  kind: "CLASS",
  title,
  occursOn: day,
  startsAt: `${day}T22:00:00Z`,
  endsAt: `${day}T23:30:00Z`,
  status: "SCHEDULED",
  holiday: false,
  attendanceKey: key,
  attendance: null,
});

const summary = (overrides: Partial<AttendanceSummary> = {}): AttendanceSummary => ({
  semesterStart: "2026-08-03",
  semesterEnd: "2026-12-12",
  estimated: false,
  present: 18,
  absent: 2,
  subjects: [{ subjectId: "calc", subjectName: "Cálculo I", present: 18, absent: 2 }],
  pending: [pending("a:2026-11-14", "Física", "2026-11-14"), pending("b:2026-11-13", "Cálculo I", "2026-11-13")] as never,
  ...overrides,
});

beforeEach(() => api.mockReset().mockResolvedValue(undefined));
afterEach(cleanup);

function show(value: AttendanceSummary, focusKey: string | null = null, changed = vi.fn(async () => {})) {
  render(
    <StudyAttendance
      summary={value}
      zone="America/Sao_Paulo"
      today="2026-11-15"
      focusKey={focusKey}
      changed={changed}
      editSemester={() => {}}
    />,
  );
  return changed;
}

it("shows presences, absences and frequency in the semester", () => {
  show(summary());
  expect(screen.getByText("3 de agosto a 12 de dezembro")).toBeInTheDocument();
  expect(screen.getByText("Presenças").nextSibling).toHaveTextContent("18");
  expect(screen.getByText("Faltas").nextSibling).toHaveTextContent("2");
  expect(screen.getByText("90%")).toBeInTheDocument();
  expect(screen.getByText("18 presenças · 2 faltas")).toBeInTheDocument();
});

it("asks about the latest class first, or the one the notification pointed to", () => {
  show(summary(), "b:2026-11-13");
  expect(screen.getByText("Você foi à aula de Cálculo I?")).toBeInTheDocument();
  expect(screen.getByText("Mais 1 aula esperando resposta.")).toBeInTheDocument();
});

it("answering records the absence and refreshes", async () => {
  const changed = show(summary());
  expect(screen.getByText("Você foi à aula de Física?")).toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Faltei" })));
  expect(api).toHaveBeenCalledWith(
    "/planner/attendance",
    expect.objectContaining({ method: "PUT", body: JSON.stringify({ key: "a:2026-11-14", status: "ABSENT" }) }),
  );
  expect(changed).toHaveBeenCalled();
});

it("without a semester it says the period is estimated and offers to set it", () => {
  show(summary({ estimated: true, pending: [] }));
  expect(screen.getByText(/· estimado/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Definir início e fim do semestre" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Faltei" })).not.toBeInTheDocument();
});
