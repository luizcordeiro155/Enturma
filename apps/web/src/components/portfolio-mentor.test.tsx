import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { api } from "@/lib/api";
import { PortfolioMentor } from "./portfolio-mentor";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));

const project = {
  id: "p1",
  name: "Caronas",
  description: "App de caronas entre colegas da faculdade.",
  url: "",
  assets: [],
  technologies: ["Java", "PostgreSQL"],
  subject: "Engenharia de Software",
  team: true,
  role: "Fiz a API.",
  outcome: "Usado por 40 colegas.",
  // nothing below is the mentor's business
  repoUrl: "https://github.com/ana-dev/caronas",
  skills: ["Trabalho em equipe"],
};
const answer = {
  description: "Aplicativo de caronas para colegas da faculdade.",
  role: "Desenvolvi a API.",
  caseStudy: "Problema: colegas sem carona.\nSolução: um app.",
  questions: ["Quantas caronas foram combinadas?"],
};

beforeEach(() => void vi.mocked(api).mockClear());
afterEach(cleanup);

const ask = () =>
  fireEvent.click(
    screen.getByRole("button", { name: "Pedir sugestões ao mentor" }),
  );

it("sends the mentor this project's draft and nothing else", async () => {
  vi.mocked(api).mockResolvedValue(answer as never);
  render(
    <PortfolioMentor
      project={project}
      number={1}
      goal={() => " Estágio em back-end "}
      onUse={vi.fn()}
    />,
  );
  ask();
  await screen.findByText(answer.description);
  expect(vi.mocked(api)).toHaveBeenCalledTimes(1);
  const [path, init] = vi.mocked(api).mock.calls[0];
  expect(path).toBe("/portfolio/me/mentor");
  expect(init?.method).toBe("POST");
  expect(JSON.parse(String(init?.body))).toEqual({
    name: "Caronas",
    description: "App de caronas entre colegas da faculdade.",
    technologies: ["Java", "PostgreSQL"],
    subject: "Engenharia de Software",
    team: true,
    role: "Fiz a API.",
    outcome: "Usado por 40 colegas.",
    goal: "Estágio em back-end",
  });
});

it("shows suggestions for the student to accept one by one, never applying them itself", async () => {
  vi.mocked(api).mockResolvedValue(answer as never);
  const onUse = vi.fn();
  render(
    <PortfolioMentor
      project={project}
      number={2}
      goal={() => ""}
      onUse={onUse}
    />,
  );
  ask();
  const panel = await screen.findByRole("region", {
    name: "Sugestões do mentor para o projeto 2",
  });
  expect(onUse).not.toHaveBeenCalled();
  expect(within(panel).getByText(/gerad[oa]s? por IA/i)).toBeTruthy();
  expect(
    within(panel).getByText("Quantas caronas foram combinadas?"),
  ).toBeTruthy();
  // no result was suggested, so there is nothing to accept for it
  expect(
    within(panel).queryByRole("button", {
      name: "Usar sugestão de resultado no projeto 2",
    }),
  ).toBeNull();
  fireEvent.click(
    within(panel).getByRole("button", {
      name: "Usar sugestão de estudo de caso no projeto 2",
    }),
  );
  expect(onUse).toHaveBeenCalledTimes(1);
  expect(onUse).toHaveBeenCalledWith({ caseStudy: answer.caseStudy });
  fireEvent.click(
    within(panel).getByRole("button", {
      name: "Usar sugestão de minha participação no projeto 2",
    }),
  );
  expect(onUse).toHaveBeenLastCalledWith({ role: answer.role });
});

it("leaves the student's part out of the request when the project is not a team one", async () => {
  vi.mocked(api).mockResolvedValue({ questions: ["E depois?"] } as never);
  render(
    <PortfolioMentor
      project={{ ...project, team: false }}
      number={1}
      goal={() => ""}
      onUse={vi.fn()}
    />,
  );
  ask();
  await screen.findByText("E depois?");
  const body = JSON.parse(String(vi.mocked(api).mock.calls[0][1]?.body));
  expect(body.team).toBe(false);
  expect("role" in body).toBe(false);
});

it("waits for a name and a sentence before the mentor can be asked", () => {
  render(
    <PortfolioMentor
      project={{ ...project, description: "App" }}
      number={1}
      goal={() => ""}
      onUse={vi.fn()}
    />,
  );
  const button = screen.getByRole<HTMLButtonElement>("button", {
    name: "Pedir sugestões ao mentor",
  });
  expect(button.disabled).toBe(true);
  expect(screen.getByText(/nome e pelo menos uma frase/i)).toBeTruthy();
  expect(api).not.toHaveBeenCalled();
});

it("says so when the mentor cannot answer, and keeps the project as it was", async () => {
  vi.mocked(api).mockImplementation(async () => {
    throw new Error("O mentor do portfólio está indisponível no momento.");
  });
  const onUse = vi.fn();
  render(
    <PortfolioMentor
      project={project}
      number={1}
      goal={() => ""}
      onUse={onUse}
    />,
  );
  ask();
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("indisponível");
  expect(onUse).not.toHaveBeenCalled();
  expect(screen.queryByRole("region")).toBeNull();
});
