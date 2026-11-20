import { describe, expect, it } from "vitest";
import { competencies, evidenceOf } from "./portfolio-skills";
import { projectPayload, type Project } from "./portfolio-projects";

const project = (name: string, more: Partial<Project> = {}): Project => ({
  id: name,
  name,
  ...more,
});

describe("competencies with evidence", () => {
  const projects = [
    project("Caronas", {
      technologies: ["Java", "PostgreSQL"],
      skills: ["Trabalho em equipe"],
    }),
    project("Biblioteca", { technologies: ["java"] }),
    project("Rascunho", { archived: true, technologies: ["Python"] }),
  ];

  it("counts a project as evidence by its technologies or because the student linked it", () => {
    expect(evidenceOf("JAVA", projects).map((p) => p.name)).toEqual([
      "Caronas",
      "Biblioteca",
    ]);
    expect(
      evidenceOf("trabalho em equipe", projects).map((p) => p.name),
    ).toEqual(["Caronas"]);
  });

  it("never takes an archived project as evidence: visitors cannot see it", () => {
    expect(evidenceOf("Python", projects)).toEqual([]);
  });

  it("sorts what is demonstrated first and says which is only declared", () => {
    expect(
      competencies(
        ["Python", "Java", "Trabalho em equipe", "Inglês"],
        projects,
      ).map((c) => [c.name, c.level, c.evidence.length]),
    ).toEqual([
      ["Java", "DEMONSTRATED", 2],
      ["Trabalho em equipe", "DEMONSTRATED", 1],
      ["Python", "DECLARED", 0],
      ["Inglês", "DECLARED", 0],
    ]);
  });

  it("has no third level: nobody validates anything here yet", () => {
    const levels = new Set(
      competencies(["Java", "Inglês"], projects).map((c) => c.level),
    );
    expect([...levels].sort()).toEqual(["DECLARED", "DEMONSTRATED"]);
  });

  it("sends the competencies a project is linked to, and none when there are none", () => {
    expect(
      projectPayload(project("Caronas", { skills: ["Trabalho em equipe"] }))
        .skills,
    ).toEqual(["Trabalho em equipe"]);
    expect(
      projectPayload(project("TCC", { skills: [] })).skills,
    ).toBeUndefined();
  });
});
