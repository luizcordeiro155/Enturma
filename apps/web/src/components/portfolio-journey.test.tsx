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
import { JourneyEditor, PublicJourney } from "./portfolio-journey";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));

type Call = { path: string; method: string; body?: Record<string, unknown> };
let calls: Call[] = [];
let stored: {
  entries: Record<string, unknown>[];
  suggestions: Record<string, unknown>[];
};

beforeEach(() => {
  calls = [];
  stored = {
    entries: [
      {
        id: "e1",
        kind: "CERTIFICATE",
        title: "Curso de SQL",
        detail: "40 horas.",
        date: "2025-09-10",
        visible: false,
      },
      {
        id: "e2",
        kind: "MILESTONE",
        title: "Entrei na faculdade",
        detail: "",
        date: "2024-02-05",
        visible: true,
      },
    ],
    suggestions: [
      {
        source: "task:t1",
        kind: "ACTIVITY",
        title: "Seminário de redes",
        detail: "",
        date: "2026-05-21",
        origin: "Atividade do seu calendário",
      },
      {
        source: "project:p1",
        kind: "PROJECT",
        title: "Caronas",
        detail: "App de caronas.",
        origin: "Projeto do portfólio",
      },
    ],
  };
  vi.mocked(api).mockImplementation(
    async (path: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ path, method, body });
      if (method === "GET") return structuredClone(stored) as never;
      if (method === "POST" && path === "/portfolio/me/journey")
        return { id: "novo", visible: false, ...body } as never;
      if (method === "PUT")
        return { id: path.split("/").pop(), ...body } as never;
      return undefined as never;
    },
  );
});
afterEach(cleanup);

const ready = async () => {
  render(<JourneyEditor />);
  await screen.findByRole("heading", { name: "Minha jornada" });
  await screen.findByText("Curso de SQL");
};
const sent = (method: string) => calls.filter((c) => c.method === method);

it("lists the records by semester and says who can see each one", async () => {
  await ready();
  const list = screen.getByRole("list", { name: "Registros da jornada" });
  expect(
    within(list)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent),
  ).toEqual(["2025.2", "2024.1"]);
  const hidden = within(list).getByText("Curso de SQL").closest("li")!;
  expect(within(hidden).getByText("Só você vê")).toBeTruthy();
  const shown = within(list).getByText("Entrei na faculdade").closest("li")!;
  expect(within(shown).getByText("No portfólio público")).toBeTruthy();
});

it("adds a record the student wrote, shown only if the box stays ticked", async () => {
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Novo registro" }));
  const form = screen.getByRole("form", { name: "Novo registro da jornada" });
  const box = within(form).getByLabelText<HTMLInputElement>(
    "Mostrar no portfólio público",
  );
  expect(box.checked).toBe(true);
  fireEvent.change(within(form).getByLabelText("Tipo"), {
    target: { value: "GOAL" },
  });
  fireEvent.change(within(form).getByLabelText("Título"), {
    target: { value: "  Conseguir um estágio  " },
  });
  fireEvent.change(within(form).getByLabelText("Data"), {
    target: { value: "2026-12-01" },
  });
  fireEvent.click(box);
  fireEvent.click(
    within(form).getByRole("button", { name: "Salvar registro" }),
  );
  await waitFor(() => expect(sent("POST")).toHaveLength(1));
  expect(sent("POST")[0]).toEqual({
    path: "/portfolio/me/journey",
    method: "POST",
    body: {
      kind: "GOAL",
      title: "Conseguir um estágio",
      detail: "",
      date: "2026-12-01",
      visible: false,
    },
  });
  expect(await screen.findByText("Conseguir um estágio")).toBeTruthy();
  expect(screen.queryByRole("form")).toBeNull();
});

it("turns a suggestion into a record only after the student reviews it, private by default", async () => {
  await ready();
  const offers = screen.getByRole("list", { name: "Sugestões para a jornada" });
  const offer = within(offers).getByText("Seminário de redes").closest("li")!;
  expect(
    within(offer).getByText("Atividade do seu calendário, mai. de 2026"),
  ).toBeTruthy();
  fireEvent.click(
    within(offer).getByRole("button", {
      name: "Revisar e adicionar Seminário de redes",
    }),
  );
  expect(sent("POST")).toHaveLength(0);
  const form = screen.getByRole("form", { name: "Novo registro da jornada" });
  expect(within(form).getByLabelText<HTMLInputElement>("Título").value).toBe(
    "Seminário de redes",
  );
  expect(within(form).getByLabelText<HTMLInputElement>("Data").value).toBe(
    "2026-05-21",
  );
  expect(
    within(form).getByLabelText<HTMLInputElement>(
      "Mostrar no portfólio público",
    ).checked,
  ).toBe(false);
  fireEvent.click(
    within(form).getByRole("button", { name: "Salvar registro" }),
  );
  await waitFor(() => expect(sent("POST")).toHaveLength(1));
  expect(sent("POST")[0].body).toEqual({
    kind: "ACTIVITY",
    title: "Seminário de redes",
    detail: "",
    date: "2026-05-21",
    visible: false,
    source: "task:t1",
  });
  await waitFor(() =>
    expect(within(offers).queryByText("Seminário de redes")).toBeNull(),
  );
});

it("asks for the date when a suggestion has none", async () => {
  await ready();
  fireEvent.click(
    screen.getByRole("button", { name: "Revisar e adicionar Caronas" }),
  );
  const form = screen.getByRole("form", { name: "Novo registro da jornada" });
  expect(within(form).getByLabelText<HTMLInputElement>("Data").value).toBe("");
  fireEvent.click(
    within(form).getByRole("button", { name: "Salvar registro" }),
  );
  expect((await within(form).findByRole("alert")).textContent).toContain(
    "data",
  );
  expect(sent("POST")).toHaveLength(0);
});

it("stops offering a suggestion the student dismissed", async () => {
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Dispensar Caronas" }));
  await waitFor(() => expect(sent("POST")).toHaveLength(1));
  expect(sent("POST")[0]).toEqual({
    path: "/portfolio/me/journey/dismissals",
    method: "POST",
    body: { source: "project:p1" },
  });
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Dispensar Caronas" }),
    ).toBeNull(),
  );
});

it("shows or hides a record with one press and removes it only after a second one", async () => {
  await ready();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Mostrar Curso de SQL no portfólio público",
    }),
  );
  await waitFor(() => expect(sent("PUT")).toHaveLength(1));
  expect(sent("PUT")[0]).toEqual({
    path: "/portfolio/me/journey/e1",
    method: "PUT",
    body: {
      kind: "CERTIFICATE",
      title: "Curso de SQL",
      detail: "40 horas.",
      date: "2025-09-10",
      visible: true,
    },
  });
  await screen.findByRole("button", {
    name: "Ocultar Curso de SQL do portfólio público",
  });
  fireEvent.click(screen.getByRole("button", { name: "Remover Curso de SQL" }));
  expect(sent("DELETE")).toHaveLength(0);
  fireEvent.click(
    screen.getByRole("button", { name: "Remover Curso de SQL de vez" }),
  );
  await waitFor(() => expect(sent("DELETE")).toHaveLength(1));
  expect(sent("DELETE")[0].path).toBe("/portfolio/me/journey/e1");
  await waitFor(() => expect(screen.queryByText("Curso de SQL")).toBeNull());
});

it("opens with a few suggestions and brings the rest on request", async () => {
  stored.suggestions = Array.from({ length: 7 }, (_, i) => ({
    source: "task:t" + i,
    kind: "ACTIVITY",
    title: "Atividade " + i,
    detail: "",
    date: "2026-05-21",
    origin: "Atividade do seu calendário",
  }));
  await ready();
  const offers = screen.getByRole("list", { name: "Sugestões para a jornada" });
  expect(within(offers).getAllByRole("listitem")).toHaveLength(4);
  fireEvent.click(
    screen.getByRole("button", { name: "Mostrar mais 3 sugestões" }),
  );
  expect(within(offers).getAllByRole("listitem")).toHaveLength(7);
  expect(screen.queryByRole("button", { name: /Mostrar mais/ })).toBeNull();
});

it("shows visitors the timeline by semester, with a filter and the way to a project", () => {
  const onProject = vi.fn();
  render(
    <PublicJourney
      entries={[
        {
          id: "a",
          kind: "TEAM",
          title: "Caronas",
          detail: "App de caronas.",
          date: "2026-03-01",
          projectId: "p1",
        },
        {
          id: "b",
          kind: "MILESTONE",
          title: "Entrei na faculdade",
          detail: "",
          date: "2024-02-05",
        },
      ]}
      onProject={onProject}
    />,
  );
  expect(screen.getByRole("heading", { name: "Minha jornada" })).toBeTruthy();
  const all = () =>
    screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
  expect(all()).toEqual(["Caronas", "Entrei na faculdade"]);
  expect(screen.getByText("mar. de 2026")).toBeTruthy();
  expect(screen.getByText("Trabalho em equipe")).toBeTruthy();
  const filter = screen.getByRole("group", {
    name: "Filtrar jornada por semestre",
  });
  fireEvent.click(within(filter).getByRole("button", { name: "2024.1" }));
  expect(all()).toEqual(["Entrei na faculdade"]);
  fireEvent.click(within(filter).getByRole("button", { name: "Tudo" }));
  fireEvent.click(screen.getByRole("link", { name: "Ver o projeto Caronas" }));
  expect(onProject).toHaveBeenCalledTimes(1);
  expect(onProject.mock.calls[0][0]).toBe("p1");
});

it("draws nothing for visitors when no record is shown", () => {
  const { container } = render(
    <PublicJourney entries={[]} onProject={vi.fn()} />,
  );
  expect(container.innerHTML).toBe("");
});
