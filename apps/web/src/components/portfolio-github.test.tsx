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
      login="ana-dev"
      taken={[]}
      room={10}
      onImport={onImport}
      onClose={onClose}
      {...props}
    />,
  );
  return { onImport, onClose };
}

it("lists the connected account at once, with no field to type someone else's name", async () => {
  open();
  expect(await screen.findByRole("checkbox", { name: /caronas/ })).toBeTruthy();
  expect(fetcher.mock.calls[0][0]).toContain("/users/ana-dev/repos");
  expect(screen.queryByLabelText("Usuário do GitHub")).toBeNull();
  expect(screen.queryByRole("button", { name: "Buscar repositórios" })).toBeNull();
  expect(screen.getByText(/@ana-dev/)).toBeTruthy();
  expect(screen.getByText(/só os repositórios públicos/i)).toBeTruthy();
});

it("imports only the repositories the student ticks", async () => {
  const { onImport, onClose } = open();
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
  expect(await screen.findByText("Fork")).toBeTruthy();
  const taken = screen.getByRole<HTMLInputElement>("checkbox", { name: /tcc/ });
  expect(taken.disabled).toBe(true);
  expect(screen.getByText("Já está no portfólio")).toBeTruthy();
});

it("never lets a selection pass the room left in the portfolio", async () => {
  open({ room: 1 });
  fireEvent.click(await screen.findByRole("checkbox", { name: /caronas/ }));
  expect(
    screen.getByRole<HTMLInputElement>("checkbox", { name: /biblioteca/ })
      .disabled,
  ).toBe(true);
  expect(screen.getByText(/cabe mais 1 projeto/i)).toBeTruthy();
});

it("says so when GitHub does not answer and lets the student try again", async () => {
  fetcher.mockImplementationOnce(async () => new Response("{}", { status: 500 }));
  open();
  expect(await screen.findByRole("alert")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await screen.findByRole("checkbox", { name: /caronas/ })).toBeTruthy();
});
