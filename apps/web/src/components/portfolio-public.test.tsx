import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { api } from "@/lib/api";
import { PublicPortfolio } from "./portfolio-public";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("./portfolio-navigation", () => ({
  PortfolioBack: () => null,
}));

const base = {
  id: "u1",
  name: "Ana Souza",
  username: "ana",
  assets: [],
  publicProfile: true,
  headline: "Estudante de ADS",
  summary: "Gosto de back-end.",
  goal: "Estágio em back-end",
  skills: [],
  subjects: [],
  achievements: [],
  stats: { totalXp: 10, currentStreak: 1 },
  studyMinutes: 30,
};
const show = async (projects: unknown[]) => {
  vi.mocked(api).mockResolvedValue({ ...base, projects } as never);
  render(<PublicPortfolio username="ana" />);
  await screen.findByRole("heading", { name: "Ana Souza" });
};
beforeEach(() => vi.mocked(api).mockReset());
afterEach(cleanup);

it("opens with the goal and the highlighted project first", async () => {
  await show([
    { id: "a", name: "Antigo", kind: "PERSONAL" },
    { id: "b", name: "Vitrine", featured: true, kind: "ACADEMIC" },
  ]);
  expect(screen.getByText("Estágio em back-end")).toBeTruthy();
  const names = screen
    .getAllByRole("heading", { level: 3 })
    .map((h) => h.textContent);
  expect(names).toEqual(["Vitrine", "Antigo"]);
  const first = screen
    .getByRole("heading", { name: "Vitrine" })
    .closest("article")!;
  expect(within(first).getByText("Destaque")).toBeTruthy();
});

it("shows what the student did in a team project and where the code is", async () => {
  await show([
    {
      id: "a",
      name: "Caronas",
      description: "App de caronas",
      kind: "ACADEMIC",
      subject: "Engenharia de Software",
      period: "2026.1",
      team: true,
      role: "Fiz a API e o banco.",
      outcome: "Usado por 40 colegas.",
      technologies: ["Java", "PostgreSQL"],
      url: "https://caronas.example.test",
      repoUrl: "https://github.com/ana-dev/caronas",
      github: { fullName: "ana-dev/caronas", stars: 12, fork: true },
    },
  ]);
  const card = screen
    .getByRole("heading", { name: "Caronas" })
    .closest("article")!;
  const inside = within(card);
  expect(
    inside.getByText("Faculdade · Engenharia de Software · 2026.1"),
  ).toBeTruthy();
  expect(inside.getByText("Projeto em equipe.")).toBeTruthy();
  expect(
    inside.getByText(/Minha participação: Fiz a API e o banco\./),
  ).toBeTruthy();
  expect(inside.getByText(/Usado por 40 colegas\./)).toBeTruthy();
  expect(
    within(inside.getByRole("list", { name: "Tecnologias" }))
      .getAllByRole("listitem")
      .map((li) => li.textContent),
  ).toEqual(["Java", "PostgreSQL"]);
  const repo = inside.getByRole("link", { name: /Repositório/ });
  expect(repo.getAttribute("href")).toBe("https://github.com/ana-dev/caronas");
  // a fork is said to be a fork, so it is not read as the student's own project
  expect(repo.textContent).toContain("ana-dev/caronas (fork)");
  expect(
    inside.getByRole("link", { name: /Abrir projeto/ }).getAttribute("href"),
  ).toBe("https://caronas.example.test");
});

it("never links a repository address that is not a web address", async () => {
  await show([
    {
      id: "a",
      name: "Estranho",
      repoUrl: "javascript:alert(1)",
      url: "data:x",
    },
  ]);
  expect(screen.queryByRole("link", { name: /Repositório/ })).toBeNull();
  expect(screen.queryByRole("link", { name: /Abrir projeto/ })).toBeNull();
});

it("filters by kind only when there is more than one kind", async () => {
  await show([
    { id: "a", name: "Da faculdade", kind: "ACADEMIC" },
    { id: "b", name: "Meu", kind: "PERSONAL" },
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Pessoal" }));
  expect(screen.queryByRole("heading", { name: "Da faculdade" })).toBeNull();
  expect(screen.getByRole("heading", { name: "Meu" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Todos" }));
  expect(screen.getByRole("heading", { name: "Da faculdade" })).toBeTruthy();
  cleanup();
  await show([{ id: "a", name: "Só um", kind: "ACADEMIC" }]);
  expect(screen.queryByRole("button", { name: "Todos" })).toBeNull();
});

it("opens the first eight projects and brings the rest on request", async () => {
  await show(
    Array.from({ length: 11 }, (_, i) => ({
      id: String(i),
      name: `P${i + 1}`,
    })),
  );
  const article = (name: string) =>
    screen.getByText(name, { selector: "h3" }).closest("article")!;
  expect(article("P8").hidden).toBe(false);
  // still in the page, so a printed portfolio has every project
  expect(article("P9").hidden).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: /Mostrar mais projetos/ }),
  );
  expect(article("P11").hidden).toBe(false);
  expect(
    screen.queryByRole("button", { name: /Mostrar mais projetos/ }),
  ).toBeNull();
});

it("says which competencies a project shows and which are only declared", async () => {
  vi.mocked(api).mockResolvedValue({
    ...base,
    skills: ["Inglês", "Java", "Trabalho em equipe"],
    projects: [
      { id: "a", name: "Caronas", technologies: ["java"] },
      { id: "b", name: "Feira", skills: ["Trabalho em equipe"] },
      { id: "c", name: "Guardado", archived: true, technologies: ["Inglês"] },
    ],
  } as never);
  render(<PublicPortfolio username="ana" />);
  await screen.findByRole("heading", { name: "Ana Souza" });
  const list = screen.getByRole("list", { name: "Competências" });
  const rows = within(list)
    .getAllByRole("listitem")
    .map((li) => li.textContent!.replace(/\s+/g, " ").trim());
  expect(rows).toEqual([
    "Java Demonstrada em Caronas",
    "Trabalho em equipe Demonstrada em Feira",
    "Inglês Declarada",
  ]);
  expect(
    within(list).getByRole("link", { name: "Caronas" }).getAttribute("href"),
  ).toBe("#projeto-a");
  // the reader is told what the two words mean, and no one is called "validated"
  expect(screen.getByText(/Demonstrada: aparece em um projeto/)).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/validad/i);
});

it("brings a project into view when its name is followed from a competency", async () => {
  vi.mocked(api).mockResolvedValue({
    ...base,
    skills: ["Java"],
    projects: [
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `p${i}`,
        name: `P${i + 1}`,
        kind: "PERSONAL",
      })),
      { id: "last", name: "Caronas", kind: "ACADEMIC", technologies: ["Java"] },
    ],
  } as never);
  Element.prototype.scrollIntoView = vi.fn();
  render(<PublicPortfolio username="ana" />);
  await screen.findByRole("heading", { name: "Ana Souza" });
  const card = () =>
    screen.getByText("Caronas", { selector: "h3" }).closest("article")!;
  expect(card().hidden).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Pessoal" }));
  fireEvent.click(
    within(screen.getByRole("list", { name: "Competências" })).getByRole(
      "link",
      { name: "Caronas" },
    ),
  );
  expect(card().hidden).toBe(false);
});

it("shows the case study in the student's words, opened on request when it is long", async () => {
  const long =
    "Problema: colegas sem carona.\n" + "Solução: um app. ".repeat(40);
  await show([
    { id: "a", name: "Curto", caseStudy: "Problema: fila no RU." },
    { id: "b", name: "Longo", caseStudy: long },
    { id: "c", name: "Sem estudo" },
  ]);
  const short = screen
    .getByRole("heading", { name: "Curto" })
    .closest("article")!;
  expect(within(short).getByText("Estudo de caso")).toBeTruthy();
  expect(within(short).getByText("Problema: fila no RU.")).toBeTruthy();
  expect(within(short).queryByRole("button")).toBeNull();
  const tall = screen
    .getByRole("heading", { name: "Longo" })
    .closest("article")!;
  const more = within(tall).getByRole("button", {
    name: "Ler o estudo de caso inteiro",
  });
  expect(more.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(more);
  expect(
    within(tall)
      .getByRole("button", { name: "Recolher o estudo de caso" })
      .getAttribute("aria-expanded"),
  ).toBe("true");
  const none = screen
    .getByRole("heading", { name: "Sem estudo" })
    .closest("article")!;
  expect(within(none).queryByText("Estudo de caso")).toBeNull();
});

it("shows the journey the student chose to show and leads from a record to its project", async () => {
  vi.mocked(api).mockResolvedValue({
    ...base,
    projects: Array.from({ length: 10 }, (_, i) => ({
      id: "p" + i,
      name: "Projeto " + i,
    })),
    journey: [
      {
        id: "j1",
        kind: "PROJECT",
        title: "Projeto 9",
        detail: "",
        date: "2026-03-01",
        projectId: "p9",
      },
    ],
  } as never);
  Element.prototype.scrollIntoView = vi.fn();
  render(<PublicPortfolio username="ana" />);
  await screen.findByRole("heading", { name: "Minha jornada" });
  const last = screen
    .getByRole("heading", { name: "Projeto 9", level: 3, hidden: true })
    .closest("article")!;
  expect(last.hidden).toBe(true);
  fireEvent.click(
    screen.getByRole("link", { name: "Ver o projeto Projeto 9" }),
  );
  expect(last.hidden).toBe(false);
});

it("has no journey section when the student shows no record", async () => {
  await show([{ id: "a", name: "Só projeto" }]);
  expect(screen.queryByRole("heading", { name: "Minha jornada" })).toBeNull();
});
