import { expect, it } from "vitest";
import {
  buildResume,
  defaultResume,
  resumeText,
  RESUME_TEMPLATES,
} from "./portfolio-resume";

const portfolio = {
  name: "Ana Souza",
  username: "ana",
  headline: "Estudante de ADS",
  summary: "Gosto de resolver problemas com software simples.",
  goal: "Estágio em back-end",
  publicProfile: true,
  skills: ["Java", "Inglês", "SQL"],
  projects: [
    {
      id: "p1",
      name: "Caronas",
      description: "App de caronas.",
      url: "",
      assets: [],
      kind: "ACADEMIC" as const,
      subject: "Engenharia de Software",
      period: "2026.1",
      technologies: ["Java", "PostgreSQL"],
      team: true,
      role: "Fiz a API.",
      outcome: "Usado por 40 colegas.",
      repoUrl: "https://github.com/ana/caronas",
      featured: true,
    },
    { id: "p2", name: "Jogo da velha", description: "", url: "", assets: [] },
    {
      id: "p3",
      name: "Rascunho",
      description: "",
      url: "",
      assets: [],
      archived: true,
    },
  ],
};
const journey = [
  {
    id: "j1",
    kind: "CERTIFICATE",
    title: "Curso de SQL",
    detail: "40 horas.",
    date: "2025-09-10",
    visible: false,
  },
  {
    id: "j2",
    kind: "ACTIVITY",
    title: "Monitoria de Algoritmos",
    detail: "",
    date: "2025-04-14",
    visible: true,
  },
  {
    id: "j3",
    kind: "GOAL",
    title: "Conseguir um estágio",
    detail: "",
    date: "2026-12-01",
    visible: true,
  },
];
const blank = {
  email: "",
  phone: "",
  city: "",
  linkedin: "",
  github: "",
  site: "",
};
const settings = {
  template: "INTERNSHIP" as const,
  look: "PLAIN" as const,
  contact: {
    ...blank,
    email: "ana@example.test",
    city: "São Paulo, SP",
    linkedin: "https://www.linkedin.com/in/ana",
  },
  objective: "Estágio em back-end",
  summary: "",
  education: [{ course: "ADS", institution: "FATEC", period: "2024 a 2026" }],
  projects: ["p1", "p3", "sumiu"],
  journey: ["j1", "j2", "j3"],
  skills: ["Java", "Sumida"],
};
const titles = (doc: ReturnType<typeof buildResume>) =>
  doc.sections.map((section) => section.title);

it("starts from the portfolio when the student has saved nothing", () => {
  const start = defaultResume(portfolio, journey, {});
  expect(start.template).toBe("INTERNSHIP");
  expect(start.objective).toBe("Estágio em back-end");
  expect(start.summary).toBe(portfolio.summary);
  // highlights first, never an archived project
  expect(start.projects).toEqual(["p1", "p2"]);
  expect(start.skills).toEqual(["Java", "Inglês", "SQL"]);
  // only what the student already shows in the journey, and never a goal
  expect(start.journey).toEqual(["j2"]);
});

it("keeps what the student saved over the portfolio's defaults", () => {
  const start = defaultResume(portfolio, journey, {
    template: "TECH",
    projects: ["p2"],
    objective: "",
  });
  expect(start.template).toBe("TECH");
  expect(start.projects).toEqual(["p2"]);
  expect(start.objective).toBe("");
});

it("builds the résumé only from what was picked and still exists", () => {
  const doc = buildResume(portfolio, journey, settings);
  expect(doc.name).toBe("Ana Souza");
  expect(doc.contact).toEqual(["ana@example.test", "São Paulo, SP"]);
  expect(doc.links).toEqual([
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ana" },
  ]);
  // no summary was written, so there is no empty section for it
  expect(titles(doc)).toEqual([
    "Objetivo",
    "Formação",
    "Projetos",
    "Competências",
    "Atividades e experiências",
    "Certificados e conquistas",
  ]);
  const projects = doc.sections.find((s) => s.id === "projects")!;
  // the archived one and the one that no longer exists stay out
  expect(projects.entries!.map((e) => e.title)).toEqual(["Caronas"]);
  expect(projects.entries![0]).toEqual({
    title: "Caronas",
    meta: "Faculdade · Engenharia de Software · 2026.1",
    lines: [
      "App de caronas.",
      "Projeto em equipe. Minha participação: Fiz a API.",
      "Resultado: Usado por 40 colegas.",
      "Tecnologias: Java, PostgreSQL",
    ],
    link: "https://github.com/ana/caronas",
  });
  expect(doc.sections.find((s) => s.id === "skills")!.items).toEqual(["Java"]);
  // a goal is not an experience
  expect(
    doc.sections
      .find((s) => s.id === "activities")!
      .entries!.map((e) => e.title),
  ).toEqual(["Monitoria de Algoritmos"]);
  expect(
    doc.sections.find((s) => s.id === "certificates")!.entries![0],
  ).toMatchObject({
    title: "Curso de SQL",
    meta: "set. de 2025",
    lines: ["40 horas."],
  });
});

it("orders the sections by the model, and the technology one lists what the projects used", () => {
  const tech = buildResume(portfolio, journey, {
    ...settings,
    template: "TECH",
    summary: "Resumo.",
  });
  expect(titles(tech).slice(0, 4)).toEqual([
    "Objetivo",
    "Resumo",
    "Competências técnicas",
    "Projetos",
  ]);
  expect(tech.sections.find((s) => s.id === "skills")!.items).toEqual([
    "Java",
    "PostgreSQL",
  ]);
  const academic = buildResume(portfolio, journey, {
    ...settings,
    template: "ACADEMIC",
  });
  expect(titles(academic)).toEqual([
    "Objetivo",
    "Formação",
    "Projetos e pesquisa",
    "Atividades acadêmicas",
    "Certificados e conquistas",
    "Competências",
  ]);
  expect(RESUME_TEMPLATES.map((t) => t.label)).toEqual([
    "Estágio",
    "Primeiro emprego",
    "Acadêmico",
    "Tecnologia",
  ]);
});

it("writes the same résumé as plain text for forms and profiles", () => {
  const text = resumeText(buildResume(portfolio, journey, settings));
  expect(
    text.startsWith(
      "Ana Souza\nEstudante de ADS\nana@example.test | São Paulo, SP\nLinkedIn: https://www.linkedin.com/in/ana\n\nOBJETIVO\nEstágio em back-end",
    ),
  ).toBe(true);
  expect(text).toContain("FORMAÇÃO\nADS\nFATEC | 2024 a 2026");
  expect(text).toContain(
    "PROJETOS\nCaronas\nFaculdade · Engenharia de Software · 2026.1\nApp de caronas.",
  );
  expect(text).toContain("https://github.com/ana/caronas");
  expect(text).toContain("COMPETÊNCIAS\nJava");
  expect(text).not.toContain("Rascunho");
});
