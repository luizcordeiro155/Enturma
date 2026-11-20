import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { GithubImportDialog } from "./portfolio-github";
import type { Project } from "@/lib/portfolio-projects";

vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));
vi.mock("@/lib/use-overlay-history", () => ({
  useOverlayHistory: vi.fn(),
  waitForOverlayHistory: vi.fn(async () => {}),
}));

const repo = (name: string, more: Record<string, unknown> = {}) => ({
  full_name: `ana-dev/${name}`,
  name,
  description: `Sobre ${name}`,
  html_url: `https://github.com/ana-dev/${name}`,
  homepage: "",
  language: "Java",
  topics: [],
  stargazers_count: 2,
  fork: false,
  archived: false,
  pushed_at: "2026-10-02T12:00:00Z",
  ...more,
});

const fetcher = vi.fn();
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  fetcher.mockReset();
  fetcher.mockImplementation(async (url: string) =>
    url.includes("/languages")
      ? new Response(JSON.stringify({ Java: 900, SQL: 100 }))
      : url.includes("/users/ana-dev/repos")
        ? new Response(
            JSON.stringify([
              repo("caronas"),
              repo("biblioteca", { fork: true }),
              repo("tcc"),
            ]),
          )
        : new Response("{}", { status: 404 }),
  );
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function open(props: Partial<Parameters<typeof GithubImportDialog>[0]> = {}) {
  const onImport = vi.fn<(projects: Project[]) => void>();
  const onClose = vi.fn();
  render(
    <GithubImportDialog
      taken={[]}
      room={10}
      onImport={onImport}
      onClose={onClose}
      {...props}
    />,
  );
  return { onImport, onClose };
}

async function search(name: string) {
  fireEvent.change(screen.getByLabelText("Usuário do GitHub"), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buscar repositórios" }));
}

it("asks nothing of GitHub until the student searches, and says what it reads", () => {
  open();
  expect(fetcher).not.toHaveBeenCalled();
  expect(screen.getByText(/só os repositórios públicos/i)).toBeTruthy();
  expect(
    screen.getByRole<HTMLButtonElement>("button", {
      name: "Buscar repositórios",
    }).disabled,
  ).toBe(true);
});

it("imports only the repositories the student ticks", async () => {
  const { onImport, onClose } = open();
  await search("github.com/ana-dev");
  const caronas = await screen.findByRole<HTMLInputElement>("checkbox", {
    name: /caronas/,
  });
  // nothing is chosen for the student
  expect(caronas.checked).toBe(false);
  expect(
    screen.getByRole<HTMLButtonElement>("button", {
      name: "Escolha os repositórios",
    }).disabled,
  ).toBe(true);
  fireEvent.click(caronas);
  fireEvent.click(screen.getByRole("checkbox", { name: /tcc/ }));
  fireEvent.click(screen.getByRole("button", { name: "Adicionar 2 projetos" }));
  await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
  const drafts = onImport.mock.calls[0][0];
  expect(drafts.map((d) => d.name)).toEqual(["caronas", "tcc"]);
  expect(drafts[0]).toMatchObject({
    repoUrl: "https://github.com/ana-dev/caronas",
    technologies: ["Java", "SQL"],
    github: { fullName: "ana-dev/caronas", stars: 2 },
  });
  expect(onClose).toHaveBeenCalled();
});

it("marks forks and what is already in the portfolio", async () => {
  open({ taken: ["ana-dev/TCC"] });
  await search("ana-dev");
  expect(await screen.findByText("Fork")).toBeTruthy();
  const taken = screen.getByRole<HTMLInputElement>("checkbox", { name: /tcc/ });
  expect(taken.disabled).toBe(true);
  expect(screen.getByText("Já está no portfólio")).toBeTruthy();
});

it("never lets a selection pass the room left in the portfolio", async () => {
  open({ room: 1 });
  await search("ana-dev");
  fireEvent.click(await screen.findByRole("checkbox", { name: /caronas/ }));
  expect(
    screen.getByRole<HTMLInputElement>("checkbox", { name: /biblioteca/ })
      .disabled,
  ).toBe(true);
  expect(screen.getByText(/cabe mais 1 projeto/i)).toBeTruthy();
});

it("tells the student when the user does not exist", async () => {
  open();
  await search("ninguem");
  expect(
    await screen.findByText(/Não encontramos esse usuário no GitHub/),
  ).toBeTruthy();
});

it("refuses a name that is not a GitHub user before asking GitHub", async () => {
  open();
  await search("https://evil.example.test/ana");
  expect(await screen.findByText(/Escreva só o nome de usuário/)).toBeTruthy();
  expect(fetcher).not.toHaveBeenCalled();
});
