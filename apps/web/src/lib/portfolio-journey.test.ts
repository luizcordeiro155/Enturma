import { expect, it } from "vitest";
import {
  bySemester,
  journeyKindLabel,
  monthLabel,
  semesterOf,
} from "./portfolio-journey";

it("puts January to June in the first semester and the rest in the second", () => {
  expect(semesterOf("2026-01-01")).toBe("2026.1");
  expect(semesterOf("2026-06-30")).toBe("2026.1");
  expect(semesterOf("2026-07-01")).toBe("2026.2");
  expect(semesterOf("2025-12-31")).toBe("2025.2");
});

it("reads the month from the date as written, whatever the time zone", () => {
  expect(monthLabel("2026-03-01")).toBe("mar. de 2026");
  expect(monthLabel("2025-12-31")).toBe("dez. de 2025");
  expect(monthLabel("sem data")).toBe("");
});

it("groups records by semester, newest semester and newest record first", () => {
  const groups = bySemester([
    { id: "a", kind: "GOAL", title: "A", detail: "", date: "2025-09-10" },
    { id: "b", kind: "GOAL", title: "B", detail: "", date: "2026-05-21" },
    { id: "c", kind: "GOAL", title: "C", detail: "", date: "2026-03-01" },
  ]);
  expect(groups.map((group) => group.semester)).toEqual(["2026.1", "2025.2"]);
  expect(groups[0].entries.map((entry) => entry.id)).toEqual(["b", "c"]);
});

it("names every kind in Portuguese", () => {
  expect(journeyKindLabel("TEAM")).toBe("Trabalho em equipe");
  expect(journeyKindLabel("CERTIFICATE")).toBe("Certificado");
  expect(journeyKindLabel("???")).toBe("Registro");
});
