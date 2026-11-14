import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Profile } from "@enturma/contracts";
import { EnturmaStudy } from "./enturma-study";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));

const profile = {
  id: "me",
  name: "Luiz Cordeiro",
  username: "luiz",
  email: "",
  emailVerified: true,
  role: "STUDENT",
  enrollment: { periodId: "p", periodName: "3º período", shift: "EVENING" },
  subjects: [{ id: "calc", name: "Cálculo I" }],
} as unknown as Profile;

const routine = {
  timezone: "America/Sao_Paulo",
  defaultStart: "19:00",
  defaultEnd: "22:30",
  weekdays: [1, 2, 3, 4, 5],
  semesterStart: null,
  semesterEnd: null,
  classReminderMinutes: 120,
  quietStart: null,
  quietEnd: null,
  tutorPersonality: "BALANCED",
  state: "MG",
  city: "Belo Horizonte",
};

const tiradentes = { date: "2026-04-21", name: "Tiradentes", scope: "NATIONAL", custom: false };
const classOn = (day: string) => ({
  id: `s1:${day}`,
  kind: "CLASS",
  title: "Cálculo I",
  subjectId: "calc",
  scheduleId: "s1",
  occursOn: day,
  startsAt: `${day}T22:00:00Z`,
  endsAt: `${day}T23:30:00Z`,
  status: "SCHEDULED",
  holiday: day === "2026-04-21",
});

function serve(events: unknown[], minutes = 120) {
  api.mockImplementation((path: string) => {
    if (path.startsWith("/planner/routine"))
      return Promise.resolve({ ...routine, classReminderMinutes: minutes });
    if (path.startsWith("/planner/calendar"))
      return Promise.resolve({ timezone: "America/Sao_Paulo", holidays: [tiradentes], events });
    return Promise.resolve({});
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-04-15T12:00:00-03:00"));
  api.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("marca o feriado em vermelho com o nome acessível", async () => {
  serve([classOn("2026-04-20")]);
  render(<EnturmaStudy profile={profile} />);
  const day = await screen.findByRole("button", { name: /21 de abril.*Tiradentes/ });
  expect(day).toHaveClass("is-holiday");
});

it("tocar no dia abre o painel com as aulas daquele dia", async () => {
  serve([classOn("2026-04-20"), classOn("2026-04-27")]);
  render(<EnturmaStudy profile={profile} />);
  fireEvent.click(await screen.findByRole("button", { name: /^20 de abril/ }));
  const panel = screen.getByRole("region", { name: /segunda-feira, 20 de abril/ });
  expect(within(panel).getByText("Cálculo I")).toBeVisible();
  expect(within(panel).getByText("19:00 – 20:30")).toBeVisible();
  expect(within(panel).getByRole("button", { name: "Cancelar esta aula" })).toBeVisible();
});

it("sem aulas convida a configurar a rotina", async () => {
  serve([]);
  render(<EnturmaStudy profile={profile} />);
  expect(await screen.findByRole("button", { name: "Configure sua rotina" })).toBeVisible();
});

it("próximas aulas usam os minutos reais do lembrete", async () => {
  serve([classOn("2026-04-20")], 60);
  render(<EnturmaStudy profile={profile} />);
  const next = await screen.findByRole("region", { name: "Próximas aulas" });
  expect(within(next).getByText("Cálculo I")).toBeVisible();
  expect(within(next).getByText(/O Enturma vai te notificar 1 hora antes de cada aula/)).toBeVisible();
});

it("um dia de aula em feriado pede confirmação, sem cancelar", async () => {
  serve([classOn("2026-04-21")]);
  render(<EnturmaStudy profile={profile} />);
  fireEvent.click(await screen.findByRole("button", { name: /^21 de abril/ }));
  const panel = screen.getByRole("region", { name: /terça-feira, 21 de abril/ });
  expect(within(panel).getByText(/Feriado — confirme se haverá aula/)).toBeVisible();
});
