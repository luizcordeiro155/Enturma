import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { api } from "@/lib/api";
import { PortfolioEditor } from "./portfolio";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("./shell", () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("./portfolio-github", () => ({
  GithubImportDialog: ({
    onImport,
    onClose,
    taken,
    room,
    initialLogin,
  }: {
    onImport: (projects: unknown[]) => void;
    onClose: () => void;
    taken: string[];
    room: number;
    initialLogin?: string;
  }) => (
    <div role="dialog" aria-label="Importar do GitHub">
      <output data-testid="import-state">
        {JSON.stringify({ taken, room, initialLogin })}
      </output>
      <button
        onClick={() => {
          onImport([
            {
              id: "novo",
              name: "biblioteca",
              description: "Sobre",
              url: "",
              assets: [],
              kind: "PERSONAL",
              technologies: ["Java"],
              repoUrl: "https://github.com/ana-dev/biblioteca",
              github: { fullName: "ana-dev/biblioteca", stars: 1 },
            },
          ]);
          onClose();
        }}
      >
        importar
      </button>
    </div>
  ),
}));

const stored = {
  id: "u1",
  name: "Ana",
  username: "ana",
  assets: [],
  publicProfile: true,
  headline: "Dev",
  summary: "",
  goal: "Estágio em back-end",
  skills: ["Java"],
  projects: [
    {
      id: "p1",
      name: "Caronas",
      description: "App",
      url: "",
      assets: [],
      kind: "ACADEMIC",
      technologies: ["Java", "PostgreSQL"],
      repoUrl: "https://github.com/ana-dev/caronas",
      github: { fullName: "ana-dev/caronas", stars: 12 },
    },
    { id: "p2", name: "TCC", description: "", url: "", assets: [] },
  ],
  subjects: [],
  achievements: [],
  stats: { totalXp: 10, currentStreak: 1 },
  studyMinutes: 30,
};

let saved: Record<string, unknown> | undefined;
beforeEach(() => {
  saved = undefined;
  Element.prototype.animate = vi.fn(() => ({})) as never;
  vi.mocked(api).mockImplementation(
    async (path: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        saved = JSON.parse(String(init.body));
        return undefined as never;
      }
      return structuredClone(stored) as never;
    },
  );
});
afterEach(cleanup);

async function ready() {
  render(<PortfolioEditor />);
  await screen.findByLabelText("Nome do projeto 1");
}
const save = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Salvar portfólio" }));
  await waitFor(() => expect(saved).toBeTruthy());
  return saved as {
    goal: string;
    projects: Record<string, unknown>[];
  };
};

it("keeps the goal and every professional detail when saving", async () => {
  await ready();
  expect(
    screen.getByLabelText<HTMLInputElement>("Objetivo profissional").value,
  ).toBe("Estágio em back-end");
  expect(screen.getByText("2 de 60 projetos")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Tecnologias do projeto 2"), {
    target: { value: "React, TypeScript, react" },
  });
  fireEvent.change(screen.getByLabelText("Tipo do projeto 2"), {
    target: { value: "RESEARCH" },
  });
  fireEvent.change(screen.getByLabelText("Disciplina do projeto 2"), {
    target: { value: "Projeto Integrador" },
  });
  fireEvent.click(screen.getByLabelText("Projeto 2 feito em equipe"));
  fireEvent.change(screen.getByLabelText("Minha participação no projeto 2"), {
    target: { value: "Fiz a interface" },
  });
  const body = await save();
  expect(body.goal).toBe("Estágio em back-end");
  expect(body.projects[0]).toMatchObject({
    id: "p1",
    kind: "ACADEMIC",
    technologies: ["Java", "PostgreSQL"],
    github: { fullName: "ana-dev/caronas", stars: 12 },
  });
  expect(body.projects[1]).toMatchObject({
    id: "p2",
    kind: "RESEARCH",
    technologies: ["React", "TypeScript"],
    subject: "Projeto Integrador",
    team: true,
    role: "Fiz a interface",
  });
});

it("asks for the student's part only when the project was made in a team", async () => {
  await ready();
  expect(screen.queryByLabelText("Minha participação no projeto 1")).toBeNull();
  fireEvent.click(screen.getByLabelText("Projeto 1 feito em equipe"));
  expect(screen.getByLabelText("Minha participação no projeto 1")).toBeTruthy();
});

it("highlights a project and archives another, which leaves the active list", async () => {
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Destacar projeto 2" }));
  expect(
    screen
      .getByRole("button", { name: "Tirar destaque do projeto 2" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Arquivar projeto 1" }));
  // the archived project is out of the active list, which renumbers
  expect(
    screen.getByLabelText<HTMLInputElement>("Nome do projeto 1").value,
  ).toBe("TCC");
  expect(screen.getByRole("tab", { name: "Arquivados (1)" })).toBeTruthy();
  const body = await save();
  expect(body.projects.map((p) => [p.name, p.archived, p.featured])).toEqual([
    ["Caronas", true, undefined],
    ["TCC", undefined, true],
  ]);
  fireEvent.click(screen.getByRole("tab", { name: "Arquivados (1)" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Desarquivar projeto 1" }),
  );
  expect(screen.queryByRole("tab", { name: /Arquivados/ })).toBeNull();
});

it("moves a project up so the student decides the order", async () => {
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Subir projeto 2" }));
  const body = await save();
  expect(body.projects.map((p) => p.name)).toEqual(["TCC", "Caronas"]);
});

it("adds GitHub drafts without saving them, and knows what is already there", async () => {
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Importar do GitHub" }));
  const state = JSON.parse(screen.getByTestId("import-state").textContent!);
  expect(state).toEqual({
    taken: ["ana-dev/caronas"],
    room: 58,
    initialLogin: "ana-dev",
  });
  fireEvent.click(screen.getByRole("button", { name: "importar" }));
  expect(saved).toBeUndefined();
  expect(
    screen.getByText(/1 projeto do GitHub entrou como rascunho/),
  ).toBeTruthy();
  expect(screen.getByText("3 de 60 projetos")).toBeTruthy();
  const card = screen.getByRole("article", { name: "Projeto 3" });
  expect(within(card).getByText(/ana-dev\/biblioteca/)).toBeTruthy();
  const body = await save();
  expect(body.projects[2]).toMatchObject({
    name: "biblioteca",
    github: { fullName: "ana-dev/biblioteca" },
  });
});

it("names the project that still has no name instead of sending it", async () => {
  await ready();
  fireEvent.change(screen.getByLabelText("Nome do projeto 2"), {
    target: { value: "  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar portfólio" }));
  expect(await screen.findByText("Dê um nome ao projeto 2.")).toBeTruthy();
  expect(saved).toBeUndefined();
});

it("shows which competencies are demonstrated as the student types and links them", async () => {
  await ready();
  const levels = () =>
    within(screen.getByRole("list", { name: "Competências e evidências" }))
      .getAllByRole("listitem")
      .map((li) => li.textContent!.replace(/\s+/g, " ").trim());
  // "Java" is a technology of the first project
  expect(levels()).toEqual(["Java Demonstrada em 1 projeto"]);
  fireEvent.change(screen.getByLabelText("Competências"), {
    target: { value: "Java, Trabalho em equipe" },
  });
  expect(levels()).toEqual([
    "Java Demonstrada em 1 projeto",
    "Trabalho em equipe Declarada",
  ]);
  // linking a project to it is what makes it demonstrated
  fireEvent.click(
    screen.getByRole("button", { name: "Trabalho em equipe no projeto 2" }),
  );
  expect(levels()[1]).toBe("Trabalho em equipe Demonstrada em 1 projeto");
  // what a technology already shows needs no link
  expect(
    screen.getByRole<HTMLButtonElement>("button", { name: "Java no projeto 1" })
      .disabled,
  ).toBe(true);
  const body = await save();
  expect(body.projects[1].skills).toEqual(["Trabalho em equipe"]);
  expect(body.projects[0].skills).toBeUndefined();
});

it("drops a project's link to a competency the student took off the list", async () => {
  await ready();
  fireEvent.change(screen.getByLabelText("Competências"), {
    target: { value: "Java, UX" },
  });
  fireEvent.click(screen.getByRole("button", { name: "UX no projeto 2" }));
  fireEvent.change(screen.getByLabelText("Competências"), {
    target: { value: "Java" },
  });
  const body = await save();
  expect(body.projects[1].skills).toBeUndefined();
});
