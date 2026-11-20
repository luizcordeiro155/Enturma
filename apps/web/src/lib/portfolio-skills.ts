import type { Project } from "./portfolio-projects";

/**
 * Declared: the student says so. Demonstrated: a project in this portfolio shows it.
 * There is no "validated" here: nobody but the student has confirmed anything yet.
 */
export type CompetencyLevel = "DECLARED" | "DEMONSTRATED";

export type Competency = {
  name: string;
  level: CompetencyLevel;
  /** The projects visitors can open to see it. */
  evidence: Project[];
};

const same = (a: string, b: string) =>
  a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");

/** True when the project lists the competency among its technologies. */
export function byTechnology(name: string, project: Project) {
  return (project.technologies ?? []).some((label) => same(label, name));
}

/** The projects that show a competency: by a technology they use or by the student's link. */
export function evidenceOf(name: string, projects: Project[]) {
  return projects.filter(
    (project) =>
      !project.archived &&
      (byTechnology(name, project) ||
        (project.skills ?? []).some((label) => same(label, name))),
  );
}

/** Every competency with what backs it, the demonstrated ones first. */
export function competencies(skills: string[], projects: Project[]) {
  const all: Competency[] = skills.map((name) => {
    const evidence = evidenceOf(name, projects);
    return {
      name,
      level: evidence.length ? "DEMONSTRATED" : "DECLARED",
      evidence,
    };
  });
  return [
    ...all.filter((entry) => entry.level === "DEMONSTRATED"),
    ...all.filter((entry) => entry.level === "DECLARED"),
  ];
}
