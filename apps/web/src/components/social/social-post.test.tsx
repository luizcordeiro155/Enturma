import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import type { SocialPost as Post } from "@/lib/social";
import { SocialPost } from "./social-post";
import { post, stubIntersectionObserver, video } from "./social-test-kit";

const socialWrite = vi.hoisted(() => vi.fn());
vi.mock("@/lib/social", async (original) => ({
  ...(await original<typeof import("@/lib/social")>()),
  socialWrite,
}));
vi.mock("@/lib/api", () => ({ api: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/send-room-invitation", () => ({ preparePrivateShare: vi.fn() }));
vi.mock("../user-identity", () => ({ Avatar: () => <span>AS</span> }));
vi.mock("../navigation-link", () => ({
  NavigationLink: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("../forum-links", () => ({
  ConfirmedLink: (props: ComponentProps<"a"> & { label: string }) => (
    <a href={props.href}>{props.label}</a>
  ),
}));

const changed = vi.fn();
function renderPost(overrides: Partial<Post> = {}) {
  return render(
    <SocialPost
      item={post("p1", overrides)}
      me="me"
      person={() => {}}
      changed={changed}
    />,
  );
}
function doubleTap(element: Element) {
  fireEvent.click(element);
  fireEvent.click(element);
}
beforeEach(() => {
  stubIntersectionObserver();
  changed.mockReset();
  socialWrite
    .mockReset()
    .mockResolvedValue(post("p1", { mine: ["LIKE"], likes: 1 }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("duplo toque na mídia curte a publicação", async () => {
  renderPost({ mine: [] });
  doubleTap(screen.getByTestId("post-media"));
  await waitFor(() =>
    expect(socialWrite).toHaveBeenCalledWith("/posts/p1/reactions/LIKE", {
      active: true,
    }),
  );
  expect(socialWrite).toHaveBeenCalledOnce();
  await waitFor(() =>
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ likes: 1 })),
  );
});
it("duplo toque numa publicação já curtida nunca descurte", async () => {
  renderPost({ mine: ["LIKE"], likes: 1 });
  doubleTap(screen.getByTestId("post-media"));
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(socialWrite).not.toHaveBeenCalled();
});
it("um toque só não curte", async () => {
  renderPost({ mine: [] });
  fireEvent.click(screen.getByTestId("post-media"));
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(socialWrite).not.toHaveBeenCalled();
});
it("publicação só de texto não reserva área de mídia", () => {
  renderPost({ media: [], body: "Só texto" });
  expect(screen.queryByTestId("post-media")).toBeNull();
  expect(screen.getByText("Só texto")).toBeVisible();
});
it("recolhe legendas longas e expande pelo botão mais", () => {
  renderPost({ body: `${"a".repeat(150)} fim-da-legenda` });
  expect(screen.queryByText(/fim-da-legenda/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "mais" }));
  expect(screen.getByText(/fim-da-legenda/)).toBeVisible();
});
it("mostra curtidas e o atalho para todos os comentários só quando existem", () => {
  const { unmount } = renderPost({ likes: 3, comments: 12 });
  expect(screen.getByText("3 curtidas")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Ver todos os 12 comentários" }),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Curtir · 3" })).toBeVisible();
  unmount();
  renderPost({ likes: 0, comments: 0 });
  expect(screen.queryByText(/curtida/)).toBeNull();
  expect(screen.queryByRole("button", { name: /Ver todos/ })).toBeNull();
});
it("mantém os nomes acessíveis das ações", () => {
  renderPost({ likes: 2, comments: 1, reposts: 4 });
  for (const name of [
    "Curtir · 2",
    "Comentários · 1",
    "Republicar · 4",
    "Compartilhar publicação",
    "Salvar publicação",
    "Opções da publicação",
  ])
    expect(screen.getByRole("button", { name })).toBeVisible();
});

it("abre o Clip selecionado pelo vídeo sem confundir o botão de som", () => {
  renderPost({ kind: "CLIP", media: [video("v1")] });
  expect(
    screen.getByRole("link", { name: "Assistir nos Clips" }),
  ).toHaveAttribute("href", "/social?post=p1");
  const sound = screen.getByRole("button", { name: "Ativar som do vídeo" });
  fireEvent.click(sound);
  expect(
    screen.getByRole("button", { name: "Silenciar vídeo" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(socialWrite).not.toHaveBeenCalled();
});
