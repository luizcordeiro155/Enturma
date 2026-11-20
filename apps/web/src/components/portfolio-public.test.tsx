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
