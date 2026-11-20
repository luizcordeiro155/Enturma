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
import { ProjectTeam, PublicTeam, TeamInvitations } from "./portfolio-team";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));

type Call = { path: string; method: string; body?: Record<string, unknown> };
let calls: Call[] = [];
const friends = [
  {
    id: "f1",
    userId: "u-bruno",
    name: "Bruno Lima",
    username: "bruno",
    status: "ACCEPTED",
  },
  {
    id: "f2",
    userId: "u-carla",
    name: "Carla Dias",
    username: "carla",
    status: "ACCEPTED",
  },
  {
    id: "f3",
    userId: "u-davi",
    name: "Davi",
    username: "davi",
    status: "PENDING",
  },
];

beforeEach(() => {
  calls = [];
  vi.mocked(api).mockImplementation(
    async (path: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ path, method, body });
      if (path === "/friends") return structuredClone(friends) as never;
      if (path.endsWith("/copy"))
        return {
          id: "copia",
          name: "Caronas",
          description: "App",
          url: "",
          assets: [],
          team: true,
          role: "Fiz o front-end.",
          sharedFrom: { userId: "o1", projectId: "p9" },
        } as never;
      return undefined as never;
    },
  );
});
afterEach(cleanup);
const sent = (method: string) => calls.filter((c) => c.method === method);

it("shows who was tagged in a project and what each one answered", () => {
  render(
    <ProjectTeam
      projectId="p1"
      number={1}
      saved
      members={[
        {
          userId: "u-bruno",
          name: "Bruno Lima",
          username: "bruno",
          status: "ACCEPTED",
          contribution: "Fiz o front-end.",
        },
        {
          userId: "u-carla",
          name: "Carla Dias",
          username: "carla",
          status: "PENDING",
          contribution: "",
        },
      ]}
      onChanged={vi.fn()}
    />,
  );
  const list = screen.getByRole("list", { name: "Equipe do projeto 1" });
  const bruno = within(list).getByText("Bruno Lima").closest("li")!;
  expect(within(bruno).getByText("Na equipe")).toBeTruthy();
  expect(within(bruno).getByText("Fiz o front-end.")).toBeTruthy();
  const carla = within(list).getByText("Carla Dias").closest("li")!;
  expect(within(carla).getByText("Aguardando resposta")).toBeTruthy();
});

it("tags a friend who is not in the team yet and tells the page to refresh", async () => {
  const onChanged = vi.fn();
  render(
    <ProjectTeam
      projectId="p1"
      number={1}
      saved
      members={[
        {
          userId: "u-bruno",
          name: "Bruno Lima",
          username: "bruno",
          status: "ACCEPTED",
          contribution: "",
        },
      ]}
      onChanged={onChanged}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Marcar colega" }));
  const picker = await screen.findByRole("list", {
    name: "Amigos para marcar",
  });
  // already in the team, or not a friend yet: neither is offered
  expect(within(picker).queryByText("Bruno Lima")).toBeNull();
  expect(within(picker).queryByText("Davi")).toBeNull();
  fireEvent.click(
    within(picker).getByRole("button", { name: "Marcar Carla Dias" }),
  );
  await waitFor(() => expect(sent("POST")).toHaveLength(1));
  expect(sent("POST")[0]).toEqual({
    path: "/portfolio/me/projects/p1/members",
    method: "POST",
    body: { username: "carla" },
  });
  await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
});

it("asks to save first when the project is not in the portfolio yet", () => {
  render(
    <ProjectTeam
      projectId="novo"
      number={3}
      saved={false}
      members={[]}
      onChanged={vi.fn()}
    />,
  );
  expect(screen.getByText(/Salve o portfólio/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Marcar colega" })).toBeNull();
});

it("takes someone off the team", async () => {
  const onChanged = vi.fn();
  render(
    <ProjectTeam
      projectId="p1"
      number={1}
      saved
      members={[
        {
          userId: "u-carla",
          name: "Carla Dias",
          username: "carla",
          status: "DECLINED",
          contribution: "",
        },
      ]}
      onChanged={onChanged}
    />,
  );
  expect(screen.getByText("Recusou")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Tirar Carla Dias da equipe" }),
  );
  await waitFor(() => expect(sent("DELETE")).toHaveLength(1));
  expect(sent("DELETE")[0].path).toBe(
    "/portfolio/me/projects/p1/members/u-carla",
  );
  await waitFor(() => expect(onChanged).toHaveBeenCalled());
});

const invitation = {
  ownerId: "o1",
  projectId: "p9",
  ownerName: "Ana Souza",
  ownerUsername: "ana",
  status: "PENDING" as const,
  contribution: "",
  projectName: "Caronas",
  projectDescription: "App de caronas.",
  included: false,
};

it("lets the tagged student accept in their own words, or decline", async () => {
  const onChanged = vi.fn();
  const { rerender } = render(
    <TeamInvitations
      invitations={[invitation]}
      onChanged={onChanged}
      onIncluded={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Projetos em equipe" }),
  ).toBeTruthy();
  expect(screen.getByText(/Ana Souza marcou você/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Minha participação em Caronas"), {
    target: { value: "Fiz o front-end." },
  });
  fireEvent.click(
    screen.getByRole("button", {
      name: "Aceitar e entrar na equipe de Caronas",
    }),
  );
  await waitFor(() => expect(sent("PUT")).toHaveLength(1));
  expect(sent("PUT")[0]).toEqual({
    path: "/portfolio/team/o1/p9",
    method: "PUT",
    body: { status: "ACCEPTED", contribution: "Fiz o front-end." },
  });
  await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  rerender(
    <TeamInvitations
      invitations={[invitation]}
      onChanged={onChanged}
      onIncluded={vi.fn()}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Recusar o convite de Caronas" }),
  );
  await waitFor(() => expect(sent("PUT")).toHaveLength(2));
  expect(sent("PUT")[1].body).toEqual({ status: "DECLINED", contribution: "" });
});

it("brings an accepted team project into the student's own portfolio on request", async () => {
  const onIncluded = vi.fn();
  render(
    <TeamInvitations
      invitations={[
        { ...invitation, status: "ACCEPTED", contribution: "Fiz o front-end." },
      ]}
      onChanged={vi.fn()}
      onIncluded={onIncluded}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Adicionar Caronas ao meu portfólio" }),
  );
  await waitFor(() => expect(onIncluded).toHaveBeenCalledTimes(1));
  expect(sent("POST")[0].path).toBe("/portfolio/team/o1/p9/copy");
  expect(onIncluded.mock.calls[0][0]).toMatchObject({
    id: "copia",
    sharedFrom: { userId: "o1", projectId: "p9" },
  });
});

it("leaves a team only after a second press", async () => {
  const onChanged = vi.fn();
  render(
    <TeamInvitations
      invitations={[{ ...invitation, status: "ACCEPTED", included: true }]}
      onChanged={onChanged}
      onIncluded={vi.fn()}
    />,
  );
  // already in the portfolio: nothing to add again
  expect(screen.queryByRole("button", { name: /ao meu portfólio/ })).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Sair da equipe de Caronas" }),
  );
  expect(sent("DELETE")).toHaveLength(0);
  fireEvent.click(
    screen.getByRole("button", { name: "Sair mesmo da equipe de Caronas" }),
  );
  await waitFor(() => expect(sent("DELETE")).toHaveLength(1));
  expect(sent("DELETE")[0].path).toBe("/portfolio/team/o1/p9");
});

it("draws no team section when nobody tagged the student", () => {
  const { container } = render(
    <TeamInvitations
      invitations={[]}
      onChanged={vi.fn()}
      onIncluded={vi.fn()}
    />,
  );
  expect(container.innerHTML).toBe("");
});

it("names the team to visitors and links only to portfolios that are public", () => {
  render(
    <PublicTeam
      members={[
        {
          name: "Bruno Lima",
          username: "bruno",
          contribution: "Fiz o front-end.",
          portfolio: true,
        },
        {
          name: "Carla Dias",
          username: "carla",
          contribution: "",
          portfolio: false,
        },
      ]}
    />,
  );
  const list = screen.getByRole("list", { name: "Equipe" });
  expect(
    within(list).getByRole("link", { name: "Bruno Lima" }).getAttribute("href"),
  ).toBe("/p/bruno");
  expect(within(list).getByText("Fiz o front-end.")).toBeTruthy();
  expect(within(list).queryByRole("link", { name: "Carla Dias" })).toBeNull();
  expect(within(list).getByText("Carla Dias")).toBeTruthy();
});
