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
import { ResumeBuilder } from "./portfolio-resume";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("./shell", () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

let saved: Record<string, unknown> | undefined;
let stored: Record<string, unknown>;
let publicProfile = true;
const portfolio = () => ({
  id: "u1",
  name: "Ana Souza",
  username: "ana",
  headline: "Estudante de ADS",
  summary: "Gosto de software simples.",
  goal: "Estágio em back-end",
  publicProfile,
  skills: ["Java", "Inglês"],
  projects: [
    {
      id: "p1",
      name: "Caronas",
      description: "App de caronas.",
      url: "",
      assets: [],
      technologies: ["Java", "PostgreSQL"],
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
});

beforeEach(() => {
  saved = undefined;
  stored = {};
  publicProfile = true;
  vi.mocked(api).mockImplementation(
    async (path: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        saved = JSON.parse(String(init.body));
        return undefined as never;
      }
      if (path === "/portfolio/me/resume")
        return structuredClone(stored) as never;
      if (path === "/portfolio/me/journey")
        return {
          entries: [
            {
              id: "j1",
              kind: "CERTIFICATE",
              title: "Curso de SQL",
              detail: "",
              date: "2025-09-10",
              visible: true,
            },
            {
              id: "j2",
              kind: "GOAL",
              title: "Conseguir estágio",
              detail: "",
              date: "2026-12-01",
              visible: true,
            },
          ],
          suggestions: [],
        } as never;
      return portfolio() as never;
    },
  );
});
afterEach(cleanup);

const ready = async () => {
  render(<ResumeBuilder />);
  return screen.findByRole("region", { name: "Prévia do currículo" });
};

it("opens with a résumé made from the portfolio, and only what is ticked goes in", async () => {
  const sheet = await ready();
  expect(within(sheet).getByRole("heading", { level: 1 }).textContent).toBe(
    "Ana Souza",
  );
  expect(within(sheet).getByText("Estágio em back-end")).toBeTruthy();
  expect(within(sheet).getByText("Caronas")).toBeTruthy();
  expect(within(sheet).getByText("Curso de SQL")).toBeTruthy();
  // archived projects and goals are not even offered
  expect(screen.queryByLabelText("Incluir o projeto Rascunho")).toBeNull();
  expect(screen.queryByLabelText("Incluir Conseguir estágio")).toBeNull();
  fireEvent.click(screen.getByLabelText("Incluir o projeto Caronas"));
  expect(within(sheet).queryByText("Caronas")).toBeNull();
  fireEvent.click(screen.getByLabelText("Incluir a competência Inglês"));
  expect(within(sheet).queryByText(/Inglês/)).toBeNull();
});

it("rearranges the same facts when another model is picked", async () => {
  const sheet = await ready();
  const order = () =>
    within(sheet)
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
  expect(order()).toEqual([
    "Objetivo",
    "Resumo",
    "Projetos",
    "Competências",
    "Certificados e conquistas",
  ]);
  fireEvent.click(screen.getByRole("radio", { name: /^Tecnologia/ }));
  expect(order().slice(2, 4)).toEqual(["Competências técnicas", "Projetos"]);
  // the technologies of the chosen projects join the competencies, once each
  expect(within(sheet).getByText("Java, Inglês, PostgreSQL")).toBeTruthy();
});

it("saves the choices and the contact details, which stay off the public page", async () => {
  await ready();
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "ana@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Telefone"), {
    target: { value: "(11) 90000-0000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar formação" }));
  fireEvent.change(screen.getByLabelText("Curso da formação 1"), {
    target: { value: "ADS" },
  });
  fireEvent.change(screen.getByLabelText("Instituição da formação 1"), {
    target: { value: "FATEC" },
  });
  expect(screen.getByText(/só aparecem neste currículo/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Salvar currículo" }));
  await waitFor(() => expect(saved).toBeTruthy());
  expect(saved).toMatchObject({
    template: "INTERNSHIP",
    look: "PLAIN",
    contact: { email: "ana@example.test", phone: "(11) 90000-0000" },
    objective: "Estágio em back-end",
    education: [{ course: "ADS", institution: "FATEC", period: "" }],
    projects: ["p1", "p2"],
    journey: ["j1"],
    skills: ["Java", "Inglês"],
  });
  expect(await screen.findByText("Currículo salvo.")).toBeTruthy();
});

it("comes back as the student left it", async () => {
  stored = {
    template: "ACADEMIC",
    projects: ["p2"],
    objective: "Monitoria",
    skills: [],
  };
  const sheet = await ready();
  expect(
    screen.getByRole<HTMLInputElement>("radio", { name: /^Acadêmico/ }).checked,
  ).toBe(true);
  expect(within(sheet).getByText("Monitoria")).toBeTruthy();
  expect(within(sheet).queryByText("Caronas")).toBeNull();
  expect(within(sheet).getByText("Jogo da velha")).toBeTruthy();
});

it("prints to PDF, copies as text and offers LinkedIn only for a public portfolio", async () => {
  const print = vi.fn();
  vi.stubGlobal("print", print);
  const writeText = vi.fn(async (text: string) => void text);
  Object.assign(navigator, { clipboard: { writeText } });
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Baixar em PDF" }));
  expect(print).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Copiar como texto" }));
  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  expect(String(writeText.mock.calls[0][0])).toContain(
    "Ana Souza\nEstudante de ADS",
  );
  expect(
    screen
      .getByRole("link", { name: "Compartilhar portfólio no LinkedIn" })
      .getAttribute("href"),
  ).toContain(encodeURIComponent("https://enturma-flax.vercel.app/p/ana"));
  cleanup();
  publicProfile = false;
  await ready();
  expect(
    screen.queryByRole("link", { name: "Compartilhar portfólio no LinkedIn" }),
  ).toBeNull();
  expect(screen.getByText(/Deixe o portfólio público/)).toBeTruthy();
  vi.unstubAllGlobals();
});
