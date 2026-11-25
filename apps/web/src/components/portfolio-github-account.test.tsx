import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { api } from "@/lib/api";
import { PortfolioEditor } from "./portfolio";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("./shell", () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("./portfolio-navigation", () => ({
  PortfolioBack: () => null,
  PublicPortfolioLink: () => null,
}));
vi.mock("./portfolio-github", () => ({
  GithubImportDialog: (props: {
    initialLogin?: string;
    autoSearch?: boolean;
  }) => (
    <div role="dialog" aria-label="Importar do GitHub">
      {props.initialLogin}:{String(props.autoSearch)}
    </div>
  ),
}));

const project = (id: string, name: string) => ({
  id,
  name,
  description: "",
  url: "",
  assets: [],
  kind: "PERSONAL",
  repoUrl: `https://github.com/ana-dev/${name}`,
  github: { fullName: `ana-dev/${name}` },
});
const base = {
  id: "u1",
  name: "Ana Dev",
  username: "ana",
  assets: [],
  publicProfile: true,
  headline: "",
  summary: "",
  goal: "",
  skills: [],
  track: "TECH",
  trackChoice: null,
  courseTrack: "TECH",
  course: "Ciência da Computação",
  subjects: [],
  achievements: [],
  stats: { totalXp: 0, currentStreak: 0 },
  studyMinutes: 0,
};

let stored: Record<string, unknown>;
let providers: Record<string, { enabled: boolean }>;
let calls: { path: string; method: string; body?: unknown }[];
let githubDown = false;
beforeEach(() => {
  window.history.replaceState(null, "", "/portfolio");
  providers = { google: { enabled: true }, github: { enabled: true } };
  stored = { ...base, projects: [project("p1", "site")], github: null };
  calls = [];
  githubDown = false;
  Element.prototype.animate = vi.fn(() => ({})) as never;
  vi.mocked(api).mockImplementation(
    async (path: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (method !== "GET")
        calls.push({
          path,
          method,
          body: init?.body ? JSON.parse(String(init.body)) : undefined,
        });
      if (path === "/public/auth/providers") return providers as never;
      if (path === "/portfolio/mentor") return { available: false } as never;
      if (path === "/portfolio/me/team")
        return { projects: {}, invitations: [] } as never;
      if (path === "/portfolio/me/github" && method === "PUT") {
        const auto = (JSON.parse(String(init!.body)) as { auto: boolean }).auto;
        if (githubDown) {
          stored = { ...stored, github: { login: "ana-dev", auto } };
          return { login: "ana-dev", auto, added: 0, reached: false } as never;
        }
        // turning it on, the server brings two repositories into the saved portfolio
        if (auto)
          stored = {
            ...stored,
            projects: [
              project("p1", "site"),
              project("p2", "jogo"),
              project("p3", "api"),
            ],
          };
        stored = { ...stored, github: { login: "ana-dev", auto } };
        return {
          login: "ana-dev",
          auto,
          added: auto ? 2 : 0,
          reached: true,
        } as never;
      }
      if (path === "/auth/identities/github" && method === "DELETE") {
        stored = { ...stored, github: null };
        return { passwordSet: true, identities: [] } as never;
      }
      return structuredClone(stored) as never;
    },
  );
});
afterEach(cleanup);

const opened = () => screen.findByRole("article", { name: "Projeto 1" });

it("convida quem faz Tecnologia e Jogos a conectar o GitHub", async () => {
  render(<PortfolioEditor />);
  await opened();
  expect(
    await screen.findByRole("link", { name: "Conectar GitHub" }),
  ).toHaveAttribute("href", "/api/oauth/github/start");
});

it("fora de Tecnologia e Jogos o GitHub não aparece", async () => {
  stored = {
    ...stored,
    track: "HEALTH",
    courseTrack: "HEALTH",
    course: "Enfermagem",
  };
  render(<PortfolioEditor />);
  await opened();
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(screen.queryByText(/GitHub/)).not.toBeInTheDocument();
});

it("sem o GitHub configurado no servidor, resta a importação pelo nome de usuário", async () => {
  providers = { google: { enabled: false }, github: { enabled: false } };
  render(<PortfolioEditor />);
  await opened();
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(
    screen.queryByRole("link", { name: "Conectar GitHub" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Importar do GitHub/ }),
  ).toBeInTheDocument();
});

it("com a conta conectada, escolher repositórios já abre na conta certa", async () => {
  stored = { ...stored, github: { login: "ana-dev", auto: false } };
  render(<PortfolioEditor />);
  await opened();
  expect(screen.getByText("@ana-dev")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Escolher repositórios" }),
  );
  expect(
    screen.getByRole("dialog", { name: "Importar do GitHub" }),
  ).toHaveTextContent("ana-dev:true");
});

it("ligar a importação automática traz os repositórios sem perder o que estava sendo editado", async () => {
  stored = { ...stored, github: { login: "ana-dev", auto: false } };
  render(<PortfolioEditor />);
  await opened();
  // um rascunho que ainda não foi salvo
  fireEvent.click(screen.getByRole("button", { name: /Adicionar projeto/ }));
  expect(screen.getAllByRole("article")).toHaveLength(2);

  const auto = screen.getByRole("switch", {
    name: /Trazer repositórios novos sozinho/,
  });
  expect(auto).not.toBeChecked();
  await act(async () => fireEvent.click(auto));
  expect(calls).toContainEqual({
    path: "/portfolio/me/github",
    method: "PUT",
    body: { auto: true },
  });
  await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(4));
  expect(auto).toBeChecked();
  expect(screen.getByRole("status")).toHaveTextContent(
    "2 repositórios entraram no portfólio.",
  );
});

it("quando o GitHub não responde, a escolha fica guardada e a pessoa sabe que a busca vem depois", async () => {
  githubDown = true;
  stored = { ...stored, github: { login: "ana-dev", auto: false } };
  render(<PortfolioEditor />);
  await opened();
  const auto = screen.getByRole("switch", {
    name: /Trazer repositórios novos sozinho/,
  });
  await act(async () => fireEvent.click(auto));
  expect(auto).toBeChecked();
  expect(screen.getByRole("status")).toHaveTextContent(
    /O GitHub não respondeu agora/,
  );
});

it("desconectar volta ao convite", async () => {
  stored = { ...stored, github: { login: "ana-dev", auto: true } };
  render(<PortfolioEditor />);
  await opened();
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Desconectar GitHub" })),
  );
  expect(calls).toContainEqual({
    path: "/auth/identities/github",
    method: "DELETE",
    body: undefined,
  });
  expect(
    await screen.findByRole("link", { name: "Conectar GitHub" }),
  ).toBeInTheDocument();
});

it("conta o resultado da volta do GitHub", async () => {
  window.history.replaceState(null, "", "/portfolio?github=ok");
  stored = { ...stored, github: { login: "ana-dev", auto: false } };
  render(<PortfolioEditor />);
  await opened();
  expect(await screen.findByRole("status")).toHaveTextContent(
    "GitHub conectado",
  );
  expect(window.location.search).toBe("");
  cleanup();
  window.history.replaceState(null, "", "/portfolio?github=IDENTITY_IN_USE");
  render(<PortfolioEditor />);
  expect(await screen.findByRole("alert")).toHaveTextContent(/outro perfil/);
});
