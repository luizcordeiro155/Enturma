import { expect, it } from "vitest";
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
