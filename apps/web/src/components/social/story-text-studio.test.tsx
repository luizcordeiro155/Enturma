import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { api } from "@/lib/api";
import type { StoryOverlay } from "@/lib/social";
import { StoryTextStudio } from "./story-text-studio";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("./social-dialog", () => ({
  SocialDialog: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
}));
vi.mock("../user-identity", () => ({ Avatar: () => null }));

let latest: StoryOverlay[] = [];
const close = vi.fn();
function Harness({
  initial = [],
  write,
}: {
  initial?: StoryOverlay[];
  write?: number;
}) {
  const [items, setItems] = useState(initial);
  return (
    <StoryTextStudio
      items={items}
      change={(next) => {
        latest = next;
        setItems(next);
      }}
      close={close}
      ratio={9 / 16}
      write={write}
    />
  );
}
const styled = (
  text: string,
  patch: Partial<StoryOverlay> = {},
): StoryOverlay => ({
  text,
  x: 0.5,
  y: 0.42,
  size: 0.075,
  font: "CLASSIC",
  color: "#ffffff",
  style: "PLAIN",
  align: "CENTER",
  rotation: 0,
  ...patch,
});
const canvas = () => screen.getByRole("group", { name: "Tela do Story" });
function frame(width = 360, height = 640) {
  canvas().getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
    }) as DOMRect;
}
function pointer(
  type: string,
  target: Element,
  { pointerId, ...init }: { pointerId: number } & MouseEventInit,
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  fireEvent(target, event);
}

beforeEach(() => {
  latest = [];
  close.mockReset();
  vi.mocked(api).mockReset();
  vi.mocked(api).mockResolvedValue([]);
});
afterEach(cleanup);

it("o botão Texto abre a escrita e Pronto coloca o texto na tela", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Texto" }));
  const field = screen.getByRole("textbox", { name: "Texto do Story" });
  fireEvent.change(field, { target: { value: "Semana de provas" } });
  fireEvent.click(screen.getByRole("button", { name: "Pronto" }));
  expect(screen.queryByRole("textbox", { name: "Texto do Story" })).toBeNull();
  expect(
    screen.getByRole("button", { name: "Texto 1: Semana de provas" }),
  ).toBeTruthy();
  expect(latest).toEqual([styled("Semana de provas")]);
});

it("um texto deixado em branco não fica no Story", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Texto" }));
  fireEvent.click(screen.getByRole("button", { name: "Pronto" }));
  expect(latest).toEqual([]);
});

it("escolhe fonte, cor, destaque e alinhamento do texto selecionado", () => {
  render(<Harness initial={[styled("Oi")]} />);
  fireEvent.click(screen.getByRole("button", { name: "Texto 1: Oi" }));
  fireEvent.click(
    within(screen.getByRole("radiogroup", { name: "Fonte" })).getByRole(
      "radio",
      {
        name: "Cartaz",
      },
    ),
  );
  fireEvent.click(
    within(screen.getByRole("radiogroup", { name: "Cor do texto" })).getByRole(
      "radio",
      {
        name: "Verde-limão",
      },
    ),
  );
  fireEvent.click(
    within(
      screen.getByRole("radiogroup", { name: "Destaque do texto" }),
    ).getByRole("radio", {
      name: "Destaque cheio",
    }),
  );
  fireEvent.click(
    within(screen.getByRole("radiogroup", { name: "Alinhamento" })).getByRole(
      "radio",
      {
        name: "À esquerda",
      },
    ),
  );
  expect(latest[0]).toMatchObject({
    font: "POSTER",
    color: "#d8ef79",
    style: "FILL",
    align: "LEFT",
  });
  expect(
    within(screen.getByRole("radiogroup", { name: "Fonte" }))
      .getByRole("radio", { name: "Cartaz" })
      .getAttribute("aria-checked"),
  ).toBe("true");
});

it("o tamanho e o giro também têm controles que não dependem de gesto", () => {
  render(<Harness initial={[styled("Oi")]} />);
  fireEvent.click(screen.getByRole("button", { name: "Texto 1: Oi" }));
  fireEvent.change(screen.getByRole("slider", { name: "Tamanho do texto" }), {
    target: { value: "0.15" },
  });
  fireEvent.change(screen.getByRole("slider", { name: "Giro do texto" }), {
    target: { value: "45" },
  });
  expect(latest[0]).toMatchObject({ size: 0.15, rotation: 45 });
});

it("arrastar o texto muda a posição dele na tela", () => {
  render(<Harness initial={[styled("Oi")]} />);
  frame();
  const item = screen.getByRole("button", { name: "Texto 1: Oi" });
  pointer("pointerdown", item, {
    clientX: 180,
    clientY: 268,
    pointerId: 1,
    button: 0,
  });
  pointer("pointermove", canvas(), {
    clientX: 252,
    clientY: 396,
    pointerId: 1,
  });
  pointer("pointerup", canvas(), { clientX: 252, clientY: 396, pointerId: 1 });
  expect(latest[0].x).toBeCloseTo(0.7);
  expect(latest[0].y).toBeCloseTo(0.62);
  expect(item.getAttribute("aria-pressed")).toBe("true");
  // arrastar não abre a escrita
  expect(screen.queryByRole("textbox", { name: "Texto do Story" })).toBeNull();
});

it("tocar de novo no texto selecionado abre a escrita dele", () => {
  render(<Harness initial={[styled("Oi")]} />);
  frame();
  const item = screen.getByRole("button", { name: "Texto 1: Oi" });
  for (let tap = 0; tap < 2; tap++) {
    pointer("pointerdown", item, {
      clientX: 180,
      clientY: 268,
      pointerId: 1,
      button: 0,
    });
    pointer("pointerup", canvas(), {
      clientX: 180,
      clientY: 268,
      pointerId: 1,
    });
  }
  expect(
    (
      screen.getByRole("textbox", {
        name: "Texto do Story",
      }) as HTMLTextAreaElement
    ).value,
  ).toBe("Oi");
});

it("dois dedos aumentam e giram o texto selecionado", () => {
  render(<Harness initial={[styled("Oi")]} />);
  frame();
  const item = screen.getByRole("button", { name: "Texto 1: Oi" });
  pointer("pointerdown", item, {
    clientX: 150,
    clientY: 268,
    pointerId: 1,
    button: 0,
  });
  pointer("pointerdown", canvas(), {
    clientX: 210,
    clientY: 268,
    pointerId: 2,
    button: 0,
  });
  // de 60 px na horizontal para 120 px na vertical: o dobro do tamanho, 90° de giro
  pointer("pointermove", canvas(), {
    clientX: 150,
    clientY: 388,
    pointerId: 2,
  });
  pointer("pointerup", canvas(), { clientX: 150, clientY: 388, pointerId: 2 });
  pointer("pointerup", canvas(), { clientX: 150, clientY: 268, pointerId: 1 });
  expect(latest[0].size).toBeCloseTo(0.15);
  expect(latest[0].rotation).toBe(90);
});

it("o teclado move, redimensiona e remove o texto", () => {
  render(<Harness initial={[styled("Oi")]} />);
  const item = screen.getByRole("button", { name: "Texto 1: Oi" });
  fireEvent.keyDown(item, { key: "ArrowRight" });
  fireEvent.keyDown(item, { key: "ArrowDown", shiftKey: true });
  expect(latest[0].x).toBeCloseTo(0.51);
  expect(latest[0].y).toBeCloseTo(0.47);
  fireEvent.keyDown(screen.getByRole("button", { name: "Texto 1: Oi" }), {
    key: "+",
  });
  expect(latest[0].size!).toBeGreaterThan(0.075);
  fireEvent.keyDown(screen.getByRole("button", { name: "Texto 1: Oi" }), {
    key: "Delete",
  });
  expect(latest).toEqual([]);
});

it("Mencionar começa um texto com @ e sugere pessoas para marcar", async () => {
  vi.mocked(api).mockImplementation(async (path: string) =>
    path.startsWith("/social/people/mentions")
      ? [{ id: "u-ana", name: "Ana Lima", username: "ana_lima" }]
      : [],
  );
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Mencionar" }));
  const field = screen.getByRole("textbox", {
    name: "Texto do Story",
  }) as HTMLTextAreaElement;
  expect(field.value).toBe("@");
  field.setSelectionRange(3, 3);
  fireEvent.change(field, { target: { value: "@an", selectionStart: 3 } });
  const option = await screen.findByRole("option", { name: /@ana_lima/ });
  expect(vi.mocked(api).mock.calls.at(-1)?.[0]).toBe(
    "/social/people/mentions?q=an",
  );
  fireEvent.click(option);
  expect(field.value).toBe("@ana_lima ");
  fireEvent.click(screen.getByRole("button", { name: "Pronto" }));
  expect(latest[0].text).toBe("@ana_lima");
});

it("Hashtag sugere assuntos que a turma já usa", async () => {
  vi.mocked(api).mockImplementation(async (path: string) =>
    path.startsWith("/social/hashtags") ? [{ tag: "estudos", posts: 4 }] : [],
  );
  render(<Harness initial={[styled("Bora")]} />);
  fireEvent.click(screen.getByRole("button", { name: "Texto 1: Bora" }));
  fireEvent.click(screen.getByRole("button", { name: "Hashtag" }));
  const field = screen.getByRole("textbox", {
    name: "Texto do Story",
  }) as HTMLTextAreaElement;
  expect(field.value).toBe("Bora #");
  fireEvent.click(await screen.findByRole("option", { name: /#estudos/ }));
  expect(field.value).toBe("Bora #estudos ");
});

it("um adesivo entra como texto grande, pronto para arrastar", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Adesivo" }));
  fireEvent.click(screen.getByRole("button", { name: "Adicionar adesivo 🎓" }));
  expect(latest).toHaveLength(1);
  expect(latest[0]).toMatchObject({ text: "🎓", style: "PLAIN" });
  expect(latest[0].size!).toBeGreaterThan(0.12);
});

it("duplica e remove pelo painel", () => {
  render(<Harness initial={[styled("Oi")]} />);
  fireEvent.click(screen.getByRole("button", { name: "Texto 1: Oi" }));
  fireEvent.click(screen.getByRole("button", { name: "Duplicar texto" }));
  expect(latest).toHaveLength(2);
  expect(latest[1].text).toBe("Oi");
  expect(latest[1].y).toBeGreaterThan(latest[0].y);
  fireEvent.click(screen.getByRole("button", { name: "Remover texto" }));
  expect(latest).toHaveLength(1);
});

it("avisa e para de adicionar no limite de textos", () => {
  render(
    <Harness initial={Array.from({ length: 12 }, (_, i) => styled(`t${i}`))} />,
  );
  expect(
    (screen.getByRole("button", { name: "Texto" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(screen.getByText(/limite de 12 textos/)).toBeTruthy();
});

it("Concluir fecha o estúdio e entrega só textos válidos", async () => {
  render(<Harness initial={[styled("  Oi  "), styled("   ")]} />);
  fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(latest).toEqual([styled("Oi")]);
});

it("aberto em um texto recém-criado, já começa com o campo de texto", () => {
  render(<Harness initial={[styled("Oi"), styled("@")]} write={1} />);
  const field = screen.getByRole("textbox", {
    name: "Texto do Story",
  }) as HTMLTextAreaElement;
  expect(field.value).toBe("@");
  expect(document.activeElement).toBe(field);
});
