import { describe, expect, it } from "vitest";
import {
  kindsIn,
  projectPayload,
  showcase,
  splitLabels,
  type Project,
} from "./portfolio-projects";

const project = (name: string, more: Partial<Project> = {}): Project => ({
  id: name,
  name,
  ...more,
});

describe("portfolio projects", () => {
  it("reads typed technologies as tidy labels", () => {
    expect(splitLabels(" Java, PostgreSQL ,java,, React ", 12)).toEqual([
      "Java",
      "PostgreSQL",
      "React",
    ]);
    expect(splitLabels("a,b,c", 2)).toEqual(["a", "b"]);
  });

  it("puts highlights first for visitors and leaves archived projects out", () => {
    const shown = showcase([
      project("Antigo"),
      project("Guardado", { archived: true, featured: true }),
      project("Vitrine", { featured: true }),
      project("Recente"),
    ]);
    expect(shown.map((p) => p.name)).toEqual(["Vitrine", "Antigo", "Recente"]);
  });

  it("lists the kinds a visitor can filter by, in a fixed order", () => {
    expect(
      kindsIn([
        project("a", { kind: "PERSONAL" }),
        project("b", { kind: "ACADEMIC" }),
        project("c", { kind: "PERSONAL" }),
        project("d"),
      ]),
    ).toEqual(["ACADEMIC", "PERSONAL"]);
  });

  it("sends only what the student filled in", () => {
    expect(
      projectPayload(
        project("Caronas", {
          description: " App ",
          url: "",
          subject: "  ",
          role: " Fiz a API ",
          team: true,
          technologies: ["Java"],
          featured: false,
          archived: false,
          repoUrl: " https://github.com/ana/caronas ",
          github: { fullName: "ana/caronas", stars: 3 },
        }),
      ),
    ).toEqual({
      id: "Caronas",
      name: "Caronas",
      description: "App",
      url: "",
      assets: [],
      technologies: ["Java"],
      team: true,
      role: "Fiz a API",
      repoUrl: "https://github.com/ana/caronas",
      github: { fullName: "ana/caronas", stars: 3 },
    });
  });

  it("keeps the student's part only on a team project", () => {
    const solo = projectPayload(project("TCC", { role: "Fiz tudo" }));
    expect(solo.role).toBeUndefined();
    expect(solo.team).toBeUndefined();
  });

  it("drops the GitHub label once the repository link no longer matches it", () => {
    const payload = projectPayload(
      project("Caronas", {
        repoUrl: "https://gitlab.com/ana/caronas",
        github: { fullName: "ana/caronas" },
      }),
    );
    expect(payload.github).toBeUndefined();
    expect(payload.repoUrl).toBe("https://gitlab.com/ana/caronas");
  });
});
