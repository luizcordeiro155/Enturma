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
    login,
  }: {
    onImport: (projects: unknown[]) => void;
    onClose: () => void;
    taken: string[];
    room: number;
    login: string;
  }) => (
    <div role="dialog" aria-label="Importar do GitHub">
      <output data-testid="import-state">
        {JSON.stringify({ taken, room, login })}
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
  github: { login: "ana-dev", auto: false },
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
let mentorOn = true;
let team: { projects: Record<string, unknown[]>; invitations: unknown[] };
beforeEach(() => {
  saved = undefined;
  mentorOn = true;
  team = { projects: {}, invitations: [] };
  Element.prototype.animate = vi.fn(() => ({})) as never;
  vi.mocked(api).mockImplementation(
    async (path: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        saved = JSON.parse(String(init.body));
        return undefined as never;
      }
      if (path === "/portfolio/mentor") return { available: mentorOn } as never;
      if (path === "/portfolio/me/team") return structuredClone(team) as never;
      return structuredClone(stored) as never;
    },
  );
});
afterEach(cleanup);

/** The editor as it opens: a list of closed projects. */
async function closed() {
  render(<PortfolioEditor />);
  await screen.findByRole("article", { name: "Projeto 1" });
}
const expanded = () =>
  screen
    .getAllByRole("article")
    .filter((card) => card.hasAttribute("data-open"))
    .map((card) => card.getAttribute("aria-label"));
/** Most tests work inside the projects, so they open every one first. */
async function ready() {
  await closed();
  for (const toggle of screen.getAllByRole("button", { expanded: false }))
    if (toggle.classList.contains("portfolio-project-toggle"))
      fireEvent.click(toggle);
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
  fireEvent.click(screen.getByRole("button", { name: "Escolher repositórios" }));
  const state = JSON.parse(screen.getByTestId("import-state").textContent!);
  expect(state).toEqual({
    taken: ["ana-dev/caronas"],
    room: 58,
    login: "ana-dev",
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

it("keeps the case study the student wrote for a project", async () => {
  await ready();
  fireEvent.change(screen.getByLabelText("Estudo de caso do projeto 1"), {
    target: { value: "  Problema: colegas sem carona.  " },
  });
  const body = await save();
  expect(body.projects[0].caseStudy).toBe("Problema: colegas sem carona.");
  expect("caseStudy" in body.projects[1]).toBe(false);
});

it("offers the mentor in each project, with the goal typed above", async () => {
  await ready();
  vi.mocked(api).mockClear();
  fireEvent.change(screen.getByLabelText("Objetivo profissional"), {
    target: { value: "Vaga júnior em dados" },
  });
  fireEvent.change(screen.getByLabelText("Descrição do projeto 1"), {
    target: { value: "App de caronas entre colegas da faculdade." },
  });
  const card = screen.getByRole("article", { name: "Projeto 1" });
  fireEvent.click(
    within(card).getByRole("button", { name: "Pedir sugestões ao mentor" }),
  );
  await waitFor(() =>
    expect(
      vi
        .mocked(api)
        .mock.calls.some(([path]) => path === "/portfolio/me/mentor"),
    ).toBe(true),
  );
  const call = vi
    .mocked(api)
    .mock.calls.find(([path]) => path === "/portfolio/me/mentor")!;
  expect(JSON.parse(String(call[1]?.body)).goal).toBe("Vaga júnior em dados");
});

it("leaves the mentor out when the service is not there", async () => {
  mentorOn = false;
  await ready();
  await waitFor(() =>
    expect(
      vi.mocked(api).mock.calls.some(([path]) => path === "/portfolio/mentor"),
    ).toBe(true),
  );
  expect(
    screen.queryByRole("button", { name: "Pedir sugestões ao mentor" }),
  ).toBeNull();
});

it("keeps the journey on the page but out of the portfolio's own save", async () => {
  await ready();
  expect(
    await screen.findByRole("heading", { name: "Minha jornada" }),
  ).toBeTruthy();
  expect(
    vi
      .mocked(api)
      .mock.calls.some(([path]) => path === "/portfolio/me/journey"),
  ).toBe(true);
  const body = await save();
  expect("journey" in body).toBe(false);
});

it("opens as a list of closed projects, however few they are", async () => {
  await closed();
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(expanded()).toEqual([]);
  expect(screen.queryByLabelText("Nome do projeto 1")).toBeNull();
  // the student opens the one they want to look at
  fireEvent.click(
    within(screen.getByRole("article", { name: "Projeto 2" })).getByRole(
      "button",
      { expanded: false },
    ),
  );
  expect(expanded()).toEqual(["Projeto 2"]);
});

it("brings imported projects in closed and opens only a blank one to be filled", async () => {
  await closed();
  fireEvent.click(screen.getByRole("button", { name: "Escolher repositórios" }));
  fireEvent.click(screen.getByRole("button", { name: "importar" }));
  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(expanded()).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Adicionar projeto" }));
  expect(expanded()).toEqual(["Projeto 4"]);
});

it("folds the projects back into the list once the portfolio is saved", async () => {
  await ready();
  expect(expanded()).toEqual(["Projeto 1", "Projeto 2"]);
  await save();
  await screen.findByText("Portfólio atualizado.");
  await waitFor(() => expect(expanded()).toEqual([]));
});

it("shows the team of a saved project inside its card once it is marked as team work", async () => {
  team.projects.p1 = [
    {
      userId: "u-bruno",
      name: "Bruno Lima",
      username: "bruno",
      status: "PENDING",
      contribution: "",
    },
  ];
  await ready();
  const card = screen.getByRole("article", { name: "Projeto 1" });
  expect(within(card).queryByText("Quem fez com você")).toBeNull();
  fireEvent.click(screen.getByLabelText("Projeto 1 feito em equipe"));
  const list = await within(card).findByRole("list", {
    name: "Equipe do projeto 1",
  });
  expect(within(list).getByText("Bruno Lima")).toBeTruthy();
  expect(within(list).getByText("Aguardando resposta")).toBeTruthy();
});

it("lists the projects that tagged the student and takes an accepted one into the list", async () => {
  team.invitations = [
    {
      ownerId: "o1",
      projectId: "p9",
      ownerName: "Bia Reis",
      ownerUsername: "bia",
      status: "ACCEPTED",
      contribution: "Fiz os testes.",
      projectName: "Horta comunitária",
      projectDescription: "Sensores na horta.",
      included: false,
    },
  ];
  await closed();
  expect(
    await screen.findByRole("heading", { name: "Projetos em equipe" }),
  ).toBeTruthy();
  const before = vi.mocked(api).getMockImplementation()!;
  vi.mocked(api).mockImplementation(async (path, init) =>
    String(path).endsWith("/copy")
      ? ({
          id: "copia",
          name: "Horta comunitária",
          description: "Sensores na horta.",
          url: "",
          assets: [],
          team: true,
          role: "Fiz os testes.",
          sharedFrom: { userId: "o1", projectId: "p9" },
        } as never)
      : before(path, init),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Adicionar Horta comunitária ao meu portfólio",
    }),
  );
  expect(await screen.findByText("3 de 60 projetos")).toBeTruthy();
  // it is the team's project: the card says whose it is and saving keeps the link
  const card = screen.getByRole("article", { name: "Projeto 3" });
  fireEvent.click(within(card).getByRole("button", { expanded: false }));
  expect(within(card).getByText(/Projeto da equipe de Bia Reis/)).toBeTruthy();
  expect(within(card).queryByText("Quem fez com você")).toBeNull();
  const body = await save();
  expect(body.projects[2].sharedFrom).toEqual({
    userId: "o1",
    projectId: "p9",
  });
});

it("gives the long page a way around and sends the résumé to its own page", async () => {
  await closed();
  const nav = screen.getByRole("navigation", { name: "Seções do portfólio" });
  expect(
    within(nav)
      .getAllByRole("link")
      .map((link) => [link.textContent, link.getAttribute("href")]),
  ).toEqual([
    ["Apresentação", "#apresentacao"],
    ["Competências", "#competencias"],
    ["Projetos", "#projetos"],
    ["Jornada", "#jornada"],
    ["Currículo", "/portfolio/curriculo"],
  ]);
  for (const id of ["apresentacao", "competencias", "projetos", "jornada"])
    expect(document.getElementById(id), id).toBeTruthy();
  // the editor itself is not something to print: the résumé page makes the PDF
  expect(screen.queryByRole("button", { name: /Gerar PDF/ })).toBeNull();
  expect(
    screen.getByRole("link", { name: "Montar currículo" }).getAttribute("href"),
  ).toBe("/portfolio/curriculo");
});
