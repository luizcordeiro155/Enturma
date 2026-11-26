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
import { PublicPortfolio } from "./portfolio-public";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("./shell", () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("./portfolio-navigation", () => ({
  PortfolioBack: () => null,
  PublicPortfolioLink: () => null,
}));
vi.mock("./portfolio-github", () => ({
  GithubImportDialog: () => <div role="dialog" aria-label="Importar do GitHub" />,
}));

const nurse = {
  id: "u1",
  name: "Bia Martins",
  username: "bia",
  assets: [],
  publicProfile: true,
  headline: "",
  summary: "",
  goal: "",
  skills: ["Anamnese"],
  track: "HEALTH",
  trackChoice: null,
  courseTrack: "HEALTH",
  course: "Enfermagem",
  projects: [
    {
      id: "p1",
      name: "Estágio na UBS",
      description: "",
      url: "",
      assets: [],
      kind: "INTERNSHIP",
      technologies: ["Anamnese", "Curativos"],
      repoUrl: "https://example.test/relatorio",
    },
  ],
  subjects: [],
  achievements: [],
  stats: { totalXp: 10, currentStreak: 1 },
  studyMinutes: 30,
};

let saved: Record<string, unknown> | undefined;
let stored: Record<string, unknown>;
beforeEach(() => {
  saved = undefined;
  stored = nurse;
  Element.prototype.animate = vi.fn(() => ({})) as never;
  vi.mocked(api).mockImplementation(async (path: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      saved = JSON.parse(String(init.body));
      return undefined as never;
    }
    if (path === "/portfolio/mentor") return { available: false } as never;
    if (path === "/portfolio/me/team")
      return { projects: {}, invitations: [] } as never;
    return structuredClone(stored) as never;
  });
});
afterEach(cleanup);

async function editor() {
  render(<PortfolioEditor />);
  await screen.findByRole("article", { name: "Projeto 1" });
  fireEvent.click(
    screen
      .getAllByRole("button", { expanded: false })
      .find((b) => b.classList.contains("portfolio-project-toggle"))!,
  );
  await screen.findByLabelText("Nome do projeto 1");
}
const save = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Salvar portfólio" }));
  await waitFor(() => expect(saved).toBeTruthy());
  return saved!;
};

it("speaks the language of a health course and leaves GitHub out", async () => {
  await editor();
  expect(screen.getByRole("heading", { name: "Práticas e trabalhos" })).toBeTruthy();
  expect(screen.queryByLabelText("Conta do GitHub")).toBeNull();
  expect(screen.getByRole("button", { name: /Adicionar trabalho/ })).toBeTruthy();
  expect(
    screen.getByLabelText<HTMLInputElement>("Procedimentos e métodos do projeto 1").value,
  ).toBe("Anamnese, Curativos");
  expect(screen.getByLabelText("Link do trabalho do projeto 1")).toBeTruthy();
  const kinds = within(screen.getByLabelText("Tipo do projeto 1"))
    .getAllByRole("option")
    .map((o) => o.textContent);
  expect(kinds).toContain("Estágio e prática");
  expect(kinds).not.toContain("Código aberto");
});

it("says where the area came from and lets the student choose another", async () => {
  await editor();
  const area = screen.getByLabelText<HTMLSelectElement>("Área do portfólio");
  expect(area.value).toBe("AUTO");
  expect(within(area).getByRole("option", { name: "Automática pelo curso: Saúde" })).toBeTruthy();
  expect(screen.getByText(/Enfermagem/)).toBeTruthy();

  fireEvent.change(area, { target: { value: "TECH" } });
  // the page changes at once, before anything is saved
  expect(screen.getByLabelText("Conta do GitHub")).toBeTruthy();
  expect(screen.getByLabelText("Tecnologias do projeto 1")).toBeTruthy();
  expect((await save()).track).toBe("TECH");
});

it("hands the area back to the course when asked", async () => {
  stored = { ...nurse, track: "DESIGN", trackChoice: "DESIGN" };
  await editor();
  const area = screen.getByLabelText<HTMLSelectElement>("Área do portfólio");
  expect(area.value).toBe("DESIGN");
  expect(screen.getByLabelText("Ferramentas e técnicas do projeto 1")).toBeTruthy();
  fireEvent.change(area, { target: { value: "AUTO" } });
  expect((await save()).track).toBe("AUTO");
});

it("adds a suggested competency with one click and offers each only once", async () => {
  await editor();
  const suggestions = screen.getByRole("group", { name: "Sugestões de competências" });
  expect(within(suggestions).queryByRole("button", { name: "Anamnese" })).toBeNull();
  fireEvent.click(within(suggestions).getByRole("button", { name: "Biossegurança" }));
  expect(screen.getByLabelText<HTMLInputElement>("Competências").value).toBe(
    "Anamnese, Biossegurança",
  );
  expect(within(suggestions).queryByRole("button", { name: "Biossegurança" })).toBeNull();
});

it("does not send an area to a server that never told one", async () => {
  const legacy: Record<string, unknown> = { ...nurse };
  for (const key of ["track", "trackChoice", "courseTrack", "course"]) delete legacy[key];
  stored = legacy;
  await editor();
  expect(screen.queryByLabelText("Área do portfólio")).toBeNull();
  // exactly as before areas existed
  expect(screen.getByLabelText("Conta do GitHub")).toBeTruthy();
  expect("track" in (await save())).toBe(false);
});

it("shows visitors the area and its own names for tools and links", async () => {
  vi.mocked(api).mockResolvedValue({
    ...nurse,
    trackChoice: undefined,
    courseTrack: undefined,
    course: undefined,
  } as never);
  render(<PublicPortfolio username="bia" />);
  await screen.findByRole("heading", { name: "Bia Martins" });
  expect(screen.getByText("Saúde")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Práticas e trabalhos" })).toBeTruthy();
  expect(screen.getByRole("list", { name: "Procedimentos e métodos" })).toBeTruthy();
  expect(screen.getByRole("link", { name: /Link do trabalho/ })).toBeTruthy();
  expect(screen.queryByText("Repositório")).toBeNull();
});
