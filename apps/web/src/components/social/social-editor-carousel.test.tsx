import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { SocialEditor } from "./social-editor";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api, post: vi.fn() }));
vi.mock("@/lib/social-draft", async (original) => ({
  ...(await original<typeof import("@/lib/social-draft")>()),
  localSocialDraft: vi.fn().mockResolvedValue(null),
}));
vi.mock("../navigation-link", () => ({
  NavigationLink: (props: ComponentProps<"a">) => <a {...props} />,
}));

let media: { id: string; kind: "IMAGE" | "VIDEO" }[];
beforeEach(() => {
  media = [
    { id: "m1", kind: "IMAGE" },
    { id: "m2", kind: "VIDEO" },
    { id: "m3", kind: "IMAGE" },
  ];
  api.mockReset().mockImplementation((path: string, options?: RequestInit) => {
    if (options?.method) return Promise.resolve({ version: 1 });
    if (path === "/portfolio/me")
      return Promise.resolve({
        username: "eu",
        publicProfile: false,
        projects: [],
      });
    if (path === "/social/drafts")
      return Promise.resolve([
        {
          id: "d1",
          kind: "POST",
          body: "Viagem da turma",
          updatedAt: new Date().toISOString(),
          coverId: "m1",
          coverKind: "IMAGE",
          coverState: "READY",
          mediaCount: media.length,
        },
      ]);
    if (path === "/social/drafts/d1")
      return Promise.resolve({
        id: "d1",
        kind: "POST",
        body: "Viagem da turma",
        visibility: "PUBLIC",
        version: 3,
        media: media.map((item, ordinal) => ({
          ...item,
          state: "READY",
          ordinal,
        })),
      });
    return Promise.resolve([]);
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function opened() {
  render(
    <SocialEditor
      user="me"
      mediaEnabled
      initialKind="POST"
      published={() => {}}
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", {
      name: /Abrir rascunho: Viagem da turma/,
    }),
  );
  const region = screen.getByRole("region", { name: "Central de criação" });
  await waitFor(() => expect(region).toHaveAttribute("data-step", "edit"));
  return region;
}
/** The id of the media on the stage, read from the address of what is shown. */
const onStage = (region: HTMLElement) => {
  const stage = region.querySelector(".social-create-edit .social-edit-stage")!;
  const shown = stage.querySelectorAll(
    "img.social-export-preview,video.social-export-preview",
  );
  expect(shown).toHaveLength(1);
  return /m\d/.exec(shown[0].getAttribute("src") ?? "")?.[0];
};
const strip = () => screen.getByRole("group", { name: "Mídias da publicação" });

it("com várias mídias, o editor mostra uma de cada vez e a fila fica embaixo", async () => {
  const region = await opened();
  expect(onStage(region)).toBe("m1");
  expect(screen.getByText(/^Mídia 1 de 3/)).toBeVisible();
  const thumbs = within(strip()).getAllByRole("button", {
    name: /^Abrir mídia \d$/,
  });
  expect(thumbs).toHaveLength(3);
  expect(thumbs[0]).toHaveAttribute("aria-pressed", "true");
  expect(thumbs[1]).toHaveAttribute("aria-pressed", "false");
  // each thumbnail says what it is
  expect(thumbs[1]).toHaveAttribute("data-kind", "VIDEO");
  expect(
    within(strip()).getByRole("button", { name: "Adicionar mídia" }),
  ).toBeVisible();
});

it("tocar em uma miniatura abre aquela mídia", async () => {
  const region = await opened();
  fireEvent.click(
    within(strip()).getByRole("button", { name: "Abrir mídia 3" }),
  );
  expect(onStage(region)).toBe("m3");
  expect(screen.getByText(/^Mídia 3 de 3/)).toBeVisible();
  fireEvent.click(
    within(strip()).getByRole("button", { name: "Abrir mídia 2" }),
  );
  expect(onStage(region)).toBe("m2");
});

it("as setas ao lado da mídia passam para a vizinha e param nas pontas", async () => {
  const region = await opened();
  const previous = screen.getByRole("button", { name: "Mídia anterior" });
  const next = screen.getByRole("button", { name: "Próxima mídia" });
  expect(previous).toBeDisabled();
  fireEvent.click(next);
  expect(onStage(region)).toBe("m2");
  fireEvent.click(next);
  expect(onStage(region)).toBe("m3");
  expect(next).toBeDisabled();
  fireEvent.click(previous);
  expect(onStage(region)).toBe("m2");
});

it("mudar a ordem leva a mídia aberta junto", async () => {
  const region = await opened();
  fireEvent.click(screen.getByRole("button", { name: "Adiar mídia 1" }));
  // the same picture is still on the stage, now second in the post
  expect(onStage(region)).toBe("m1");
  expect(screen.getByText(/^Mídia 2 de 3/)).toBeVisible();
  expect(
    within(strip()).getByRole("button", { name: "Abrir mídia 2" }),
  ).toHaveAttribute("aria-pressed", "true");
});

it("remover a mídia aberta mostra a seguinte", async () => {
  const region = await opened();
  fireEvent.click(
    within(strip()).getByRole("button", { name: "Abrir mídia 2" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Remover mídia 2" }));
  await waitFor(() => expect(screen.getByText(/^Mídia 2 de 2/)).toBeVisible());
  expect(onStage(region)).toBe("m3");
  // and removing the last in line falls back to the one before it
  fireEvent.click(screen.getByRole("button", { name: "Remover mídia 2" }));
  await waitFor(() => expect(onStage(region)).toBe("m1"));
  // alone again, it is no longer "1 de…", and there is nothing to go back and forth between
  expect(screen.getByText(/^Mídia 1( ·|$)/)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Próxima mídia" })).toBeNull();
});

it("a fila tem um atalho para adicionar mais, até o limite de 10", async () => {
  const picker = vi
    .spyOn(HTMLInputElement.prototype, "click")
    .mockImplementation(() => {});
  await opened();
  fireEvent.click(
    within(strip()).getByRole("button", { name: "Adicionar mídia" }),
  );
  expect(picker).toHaveBeenCalledTimes(1);
  expect((picker.mock.contexts[0] as HTMLInputElement).type).toBe("file");
  cleanup();
  media = Array.from({ length: 10 }, (_, index) => ({
    id: `m${index}`,
    kind: "IMAGE" as const,
  }));
  await opened();
  expect(
    within(strip()).getAllByRole("button", { name: /^Abrir mídia/ }),
  ).toHaveLength(10);
  expect(
    within(strip()).queryByRole("button", { name: "Adicionar mídia" }),
  ).toBeNull();
});

it("a revisão antes de publicar usa a mesma fila e lembra qual mídia estava aberta", async () => {
  await opened();
  fireEvent.click(
    within(strip()).getByRole("button", { name: "Abrir mídia 3" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
  expect(
    screen.getByRole("heading", { name: "Pronto para compartilhar?" }),
  ).toBeVisible();
  const review = screen.getByRole("group", { name: "Mídias da publicação" });
  expect(
    within(review).getByRole("button", { name: "Abrir mídia 3" }),
  ).toHaveAttribute("aria-pressed", "true");
  // nothing is added from the review
  expect(
    within(review).queryByRole("button", { name: "Adicionar mídia" }),
  ).toBeNull();
});

it("na revisão, deslizar a prévia para o lado passa para a mídia vizinha", async () => {
  const region = await opened();
  fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
  const preview = region.querySelector(".social-create-preview")!;
  // only while there is more than one media does the preview keep the sideways gesture
  expect(preview).toHaveAttribute("data-social-gesture", "ignore");
  const swipe = (from: number, to: number, vertical = 0) => {
    fireEvent.touchStart(preview, {
      touches: [{ clientX: from, clientY: 300 }],
    });
    fireEvent.touchEnd(preview, {
      changedTouches: [{ clientX: to, clientY: 300 + vertical }],
    });
  };
  const open = () =>
    within(strip())
      .getAllByRole("button", { name: /^Abrir mídia/ })
      .findIndex((thumb) => thumb.getAttribute("aria-pressed") === "true");
  swipe(300, 120);
  expect(open()).toBe(1);
  swipe(300, 120);
  expect(open()).toBe(2);
  // nothing after the last one
  swipe(300, 120);
  expect(open()).toBe(2);
  swipe(120, 300);
  expect(open()).toBe(1);
  // scrolling the page up and down is not a swipe
  swipe(300, 230, 260);
  expect(open()).toBe(1);
});
