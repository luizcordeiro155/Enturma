import { expect, it, vi } from "vitest";
vi.mock("@/lib/api", () => ({ api: vi.fn() }));
import { buildMonthGrid, isoWeekday, reminderLabel, weekOf } from "./planner";

it("monta a grade do mês começando no domingo", () => {
  const grid = buildMonthGrid(2026, 3);
  expect(grid).toHaveLength(42);
  expect(grid[0]).toEqual({ date: "2026-03-29", inMonth: false });
  expect(grid.find((cell) => cell.date === "2026-04-01")).toEqual({ date: "2026-04-01", inMonth: true });
  expect(grid.at(-1)).toEqual({ date: "2026-05-09", inMonth: false });
});

it("semana de domingo a sábado e dia da semana ISO", () => {
  expect(weekOf("2026-04-15")).toEqual([
    "2026-04-12", "2026-04-13", "2026-04-14", "2026-04-15", "2026-04-16", "2026-04-17", "2026-04-18",
  ]);
  expect(isoWeekday("2026-04-12")).toBe(7);
  expect(isoWeekday("2026-04-13")).toBe(1);
});

it("descreve o lembrete em português", () => {
  expect(reminderLabel(120)).toBe("2 horas antes");
  expect(reminderLabel(60)).toBe("1 hora antes");
  expect(reminderLabel(30)).toBe("30 minutos antes");
  expect(reminderLabel(90)).toBe("1 h 30 min antes");
  expect(reminderLabel(0)).toBeNull();
});

it("salva a rotina só com os campos que a API aceita", async () => {
  const { api } = await import("@/lib/api");
  const { planner } = await import("./planner");
  vi.mocked(api).mockResolvedValue({});
  await planner.saveRoutine({
    timezone: "America/Sao_Paulo", defaultStart: "19:00", defaultEnd: "22:30", weekdays: [1],
    semesterStart: null, semesterEnd: null, classReminderMinutes: 60, quietStart: null, quietEnd: null,
    tutorPersonality: "BALANCED", state: "MG", city: null,
    updatedAt: "2026-11-14T00:00:00Z",
  } as Parameters<typeof planner.saveRoutine>[0]);
  const body = JSON.parse(String(vi.mocked(api).mock.calls[0][1]?.body));
  expect(Object.keys(body).sort()).toEqual([
    "city", "classReminderMinutes", "defaultEnd", "defaultStart", "quietEnd", "quietStart",
    "semesterEnd", "semesterStart", "state", "timezone", "tutorPersonality", "weekdays",
  ]);
});
