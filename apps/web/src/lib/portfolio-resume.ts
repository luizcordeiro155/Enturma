import { monthLabel, type JourneyEntry } from "./portfolio-journey";
import { kindLabel, showcase, type Project } from "./portfolio-projects";

export type ResumeTemplate = "INTERNSHIP" | "FIRST_JOB" | "ACADEMIC" | "TECH";
export type ResumeLook = "PLAIN" | "ACCENT";
type SectionId =
  | "objective"
  | "summary"
  | "education"
  | "projects"
  | "skills"
  | "activities"
  | "certificates";

export type ResumeContact = {
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  github: string;
  site: string;
};
export type ResumeEducation = {
  course: string;
  institution: string;
  period: string;
};

/** What the student chose: the model, what goes in, and how to reach them. */
export type ResumeSettings = {
  template: ResumeTemplate;
  look: ResumeLook;
  contact: ResumeContact;
  objective: string;
  summary: string;
  education: ResumeEducation[];
  /** Ids of portfolio projects, journey records and names of competencies to include. */
  projects: string[];
  journey: string[];
  skills: string[];
};

/** Each model is the same facts in the order that reader looks for them. */
export const RESUME_TEMPLATES: {
  id: ResumeTemplate;
  label: string;
  hint: string;
  order: SectionId[];
  titles?: Partial<Record<SectionId, string>>;
}[] = [
  {
    id: "INTERNSHIP",
    label: "Estágio",
    hint: "Formação e projetos primeiro: o que você está aprendendo e já fez.",
    order: [
      "objective",
      "summary",
      "education",
      "projects",
      "skills",
      "activities",
      "certificates",
    ],
  },
  {
    id: "FIRST_JOB",
    label: "Primeiro emprego",
    hint: "Competências e projetos na frente, formação depois.",
    order: [
      "objective",
      "summary",
      "skills",
      "projects",
      "activities",
      "education",
      "certificates",
    ],
  },
  {
    id: "ACADEMIC",
    label: "Acadêmico",
    hint: "Para monitoria, iniciação científica e bolsas.",
    order: [
      "objective",
      "summary",
      "education",
      "projects",
      "activities",
      "certificates",
      "skills",
    ],
    titles: {
      projects: "Projetos e pesquisa",
      activities: "Atividades acadêmicas",
    },
  },
  {
    id: "TECH",
    label: "Tecnologia",
    hint: "Lista as tecnologias dos projetos escolhidos e traz os repositórios.",
    order: [
      "objective",
      "summary",
      "skills",
      "projects",
      "education",
      "activities",
      "certificates",
    ],
    titles: { skills: "Competências técnicas" },
  },
];

const TITLES: Record<SectionId, string> = {
  objective: "Objetivo",
  summary: "Resumo",
  education: "Formação",
  projects: "Projetos",
  skills: "Competências",
  activities: "Atividades e experiências",
  certificates: "Certificados e conquistas",
};

export const MAX_RESUME_PROJECTS = 12;
export const MAX_RESUME_EDUCATION = 4;

type Source = {
  name: string;
  headline?: string;
  summary?: string;
  goal?: string;
  skills?: string[];
  projects?: Project[];
};

const text = (value?: string) => (value ?? "").trim();
const BLANK: ResumeContact = {
  email: "",
  phone: "",
  city: "",
  linkedin: "",
  github: "",
  site: "",
};

/** A goal is a plan, not something done: it never goes on a résumé. */
export const resumeJourney = (journey: JourneyEntry[]) =>
  journey.filter((entry) => entry.kind !== "GOAL");

/**
 * Where the builder starts. Anything the student saved stands as saved; the rest comes from
 * the portfolio, and from the journey only what they already show there.
 */
export function defaultResume(
  portfolio: Source,
  journey: JourneyEntry[],
  saved: Partial<ResumeSettings>,
): ResumeSettings {
  return {
    template: saved.template ?? "INTERNSHIP",
    look: saved.look ?? "PLAIN",
    contact: { ...BLANK, ...(saved.contact ?? {}) },
    objective: saved.objective ?? text(portfolio.goal),
    summary: saved.summary ?? text(portfolio.summary),
    education: saved.education ?? [],
    projects:
      saved.projects ??
      showcase(portfolio.projects ?? [])
        .slice(0, 4)
        .map((project) => project.id!)
        .filter(Boolean),
    journey:
      saved.journey ??
      resumeJourney(journey)
        .filter((entry) => entry.visible)
        .map((entry) => entry.id),
    skills: saved.skills ?? [...(portfolio.skills ?? [])],
  };
}

export type ResumeEntry = {
  title: string;
  meta?: string;
  lines: string[];
  link?: string;
};
export type ResumeSection = {
  id: SectionId;
  title: string;
  text?: string;
  items?: string[];
  entries?: ResumeEntry[];
};
/** The résumé as it prints: plain facts in reading order, nothing decorative. */
export type ResumeDoc = {
  name: string;
  headline: string;
  contact: string[];
  links: { label: string; href: string }[];
  sections: ResumeSection[];
};

function projectEntry(project: Project): ResumeEntry {
  const lines = [text(project.description)];
  if (project.team)
    lines.push(
      text(project.role)
        ? `Projeto em equipe. Minha participação: ${text(project.role)}`
        : "Projeto em equipe.",
    );
  if (text(project.outcome)) lines.push(`Resultado: ${text(project.outcome)}`);
  if (project.technologies?.length)
    lines.push(`Tecnologias: ${project.technologies.join(", ")}`);
  const meta = [kindLabel(project.kind), project.subject, project.period]
    .map((part) => text(part))
    .filter(Boolean)
    .join(" · ");
  const link = text(project.repoUrl) || text(project.url);
  return {
    title: text(project.name),
    ...(meta ? { meta } : {}),
    lines: lines.filter(Boolean),
    ...(link ? { link } : {}),
  };
}

const journeyEntry = (entry: JourneyEntry): ResumeEntry => ({
  title: entry.title,
  meta: monthLabel(entry.date),
  lines: text(entry.detail) ? [text(entry.detail)] : [],
});

/** Puts the résumé together from what was picked and still exists in the portfolio. */
export function buildResume(
  portfolio: Source,
  journey: JourneyEntry[],
  settings: ResumeSettings,
): ResumeDoc {
  const template =
    RESUME_TEMPLATES.find((item) => item.id === settings.template) ??
    RESUME_TEMPLATES[0];
  const projects = showcase(portfolio.projects ?? []).filter((project) =>
    settings.projects.includes(project.id ?? ""),
  );
  const known = portfolio.skills ?? [];
  let skills = known.filter((name) => settings.skills.includes(name));
  if (template.id === "TECH") {
    // what the chosen projects really used, without repeating a competency
    const seen = new Set(skills.map((name) => name.toLowerCase()));
    for (const project of projects)
      for (const name of project.technologies ?? [])
        if (!seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          skills = [...skills, name];
        }
  }
  const picked = resumeJourney(journey)
    .filter((entry) => settings.journey.includes(entry.id))
    .sort((a, b) => b.date.localeCompare(a.date));
  const proof = (entry: JourneyEntry) =>
    entry.kind === "CERTIFICATE" || entry.kind === "ACHIEVEMENT";
  const education = settings.education
    .filter((item) => text(item.course) || text(item.institution))
    .map((item) => ({
      title: text(item.course) || text(item.institution),
      meta: [text(item.course) ? text(item.institution) : "", text(item.period)]
        .filter(Boolean)
        .join(" | "),
      lines: [],
    }));
  const content: Record<SectionId, Omit<ResumeSection, "id" | "title">> = {
    objective: { text: text(settings.objective) },
    summary: { text: text(settings.summary) },
    education: { entries: education },
    projects: { entries: projects.map(projectEntry) },
    skills: { items: skills },
    activities: {
      entries: picked.filter((entry) => !proof(entry)).map(journeyEntry),
    },
    certificates: { entries: picked.filter(proof).map(journeyEntry) },
  };
  const sections = template.order
    .map((id) => ({
      id,
      title: template.titles?.[id] ?? TITLES[id],
      ...content[id],
    }))
    .filter(
      (section) =>
        section.text || section.items?.length || section.entries?.length,
    );
  const contact = settings.contact;
  return {
    name: text(portfolio.name),
    headline: text(portfolio.headline),
    contact: [contact.email, contact.phone, contact.city]
      .map((part) => text(part))
      .filter(Boolean),
    links: (
      [
        ["LinkedIn", contact.linkedin],
        ["GitHub", contact.github],
        ["Site", contact.site],
      ] as const
    )
      .filter(([, href]) => text(href))
      .map(([label, href]) => ({ label, href: text(href) })),
    sections,
  };
}

/** The same résumé as plain text, for application forms and profile fields. */
export function resumeText(doc: ResumeDoc) {
  const head = [
    doc.name,
    doc.headline,
    doc.contact.join(" | "),
    ...doc.links.map((link) => `${link.label}: ${link.href}`),
  ].filter(Boolean);
  const blocks = doc.sections.map((section) => {
    const lines = [section.title.toUpperCase()];
    if (section.text) lines.push(section.text);
    if (section.items?.length) lines.push(section.items.join(", "));
    (section.entries ?? []).forEach((entry, index) => {
      if (index) lines.push("");
      lines.push(entry.title);
      if (entry.meta) lines.push(entry.meta);
      lines.push(...entry.lines);
      if (entry.link) lines.push(entry.link);
    });
    return lines.join("\n");
  });
  return [head.join("\n"), ...blocks].join("\n\n");
}
