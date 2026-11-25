import type { PublicMember } from "./portfolio-team";
export const MAX_PROJECTS = 60;
export const MAX_FEATURED = 6;
export const MAX_TECHNOLOGIES = 12;

export type ProjectKind =
  | "ACADEMIC"
  | "PERSONAL"
  | "OPEN_SOURCE"
  | "RESEARCH"
  | "INTERNSHIP"
  | "CASE_STUDY"
  | "PUBLICATION"
  | "CREATIVE"
  | "COMPETITION"
  | "VOLUNTEER";

/** Every kind of work there is. Each area offers its own selection, in its own order. */
export const PROJECT_KINDS: { id: ProjectKind; label: string }[] = [
  { id: "ACADEMIC", label: "Faculdade" },
  { id: "PERSONAL", label: "Pessoal" },
  { id: "OPEN_SOURCE", label: "Código aberto" },
  { id: "RESEARCH", label: "Pesquisa e extensão" },
  { id: "INTERNSHIP", label: "Estágio e prática" },
  { id: "CASE_STUDY", label: "Estudo de caso" },
  { id: "PUBLICATION", label: "Artigo e publicação" },
  { id: "CREATIVE", label: "Criação autoral" },
  { id: "COMPETITION", label: "Competição e evento" },
  { id: "VOLUNTEER", label: "Voluntariado e ligas" },
];

export const kindLabel = (kind?: string) =>
  PROJECT_KINDS.find((entry) => entry.id === kind)?.label ?? "";

/** Where an imported project came from: public repository data the student chose. */
export type GithubSource = {
  fullName: string;
  stars?: number;
  fork?: boolean;
  updatedAt?: string;
};

export type Project = {
  id?: string;
  name: string;
  description?: string;
  /** Where the project can be seen running. */
  url?: string;
  assets?: string[];
  kind?: ProjectKind;
  technologies?: string[];
  subject?: string;
  period?: string;
  team?: boolean;
  /** What the student did, so a team project is not read as theirs alone. */
  role?: string;
  outcome?: string;
  repoUrl?: string;
  featured?: boolean;
  archived?: boolean;
  github?: GithubSource;
  /** Competencies from the portfolio's list that this project is evidence of. */
  skills?: string[];
  /** Problem, solution, challenges and result, in the student's words. */
  caseStudy?: string;
  /** Owner only: this is the student's copy of a team project someone else authored. */
  sharedFrom?: { userId: string; projectId: string };
  /** Visitors only: the teammates who accepted. */
  members?: PublicMember[];
};

/** "Java, SQL ,java" → ["Java", "SQL"]. */
export function splitLabels(text: string, limit: number) {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const part of text.split(",")) {
    const label = part.trim();
    const key = label.toLocaleLowerCase("pt-BR");
    if (!label || seen.has(key)) continue;
    seen.add(key);
    if (labels.length < limit) labels.push(label);
  }
  return labels;
}

/** What visitors see: nothing archived, highlights first, the student's order kept. */
export function showcase(projects: Project[]) {
  const open = projects.filter((project) => !project.archived);
  return [
    ...open.filter((project) => project.featured),
    ...open.filter((project) => !project.featured),
  ];
}

export function kindsIn(projects: Project[]) {
  return PROJECT_KINDS.map((entry) => entry.id).filter((kind) =>
    projects.some((project) => project.kind === kind),
  );
}

export const githubAddress = (fullName: string) =>
  `https://github.com/${fullName}`;

/** The GitHub label only stands beside the repository it names. */
export function matchesGithub(repoUrl: string | undefined, fullName: string) {
  return (
    (repoUrl ?? "").trim().replace(/\/+$/, "").toLowerCase() ===
    githubAddress(fullName).toLowerCase()
  );
}

/** The project as the API stores it: optional detail only when it was filled in. */
export function projectPayload(project: Project) {
  const text = (value?: string) => (value ?? "").trim();
  const payload: Project = {
    id: project.id,
    name: text(project.name),
    description: text(project.description),
    url: text(project.url),
    assets: project.assets ?? [],
  };
  if (project.kind) payload.kind = project.kind;
  if (project.technologies?.length)
    payload.technologies = project.technologies.slice(0, MAX_TECHNOLOGIES);
  if (text(project.subject)) payload.subject = text(project.subject);
  if (text(project.period)) payload.period = text(project.period);
  if (project.team) {
    payload.team = true;
    if (text(project.role)) payload.role = text(project.role);
  }
  if (text(project.outcome)) payload.outcome = text(project.outcome);
  if (text(project.repoUrl)) payload.repoUrl = text(project.repoUrl);
  if (project.archived) payload.archived = true;
  else if (project.featured) payload.featured = true;
  if (project.github && matchesGithub(project.repoUrl, project.github.fullName))
    payload.github = project.github;
  if (project.skills?.length) payload.skills = project.skills.slice(0, 12);
  if (text(project.caseStudy)) payload.caseStudy = text(project.caseStudy);
  // the server keeps this only while the student is still in that team
  if (project.sharedFrom) payload.sharedFrom = project.sharedFrom;
  return payload;
}
