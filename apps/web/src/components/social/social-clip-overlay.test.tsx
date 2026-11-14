import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SocialPost as Post } from "@/lib/social";
import { SocialClipOverlay } from "./social-clip-overlay";
import { post, video } from "./social-test-kit";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api, post: vi.fn() }));
vi.mock("@/lib/send-room-invitation", () => ({ preparePrivateShare: vi.fn() }));
vi.mock("../user-identity", () => ({ Avatar: () => <span>AS</span> }));
vi.mock("../forum-links", () => ({ ConfirmedLink: () => null }));

function renderOverlay(overrides: Partial<Post> = {}, me = "me", progress = 0.4) {
  return render(
    <SocialClipOverlay
      item={post("c1", { kind: "CLIP", media: [video("v1")], ...overrides })}
      me={me}
      person={() => {}}
      changed={() => {}}
      progress={progress}
    />,
  );
}
beforeEach(() => {
  api.mockReset().mockResolvedValue({
    relationship: { status: "NONE", followsYou: false },
  });
});
afterEach(cleanup);

it("mostra as ações laterais com os nomes acessíveis e o progresso", () => {
  renderOverlay({ likes: 2, comments: 1, reposts: 0 });
  for (const name of [
    "Curtir · 2",
    "Comentários · 1",
    "Republicar · 0",
    "Compartilhar publicação",
    "Salvar publicação",
    "Opções da publicação",
  ])
    expect(screen.getByRole("button", { name })).toBeVisible();
  const bar = screen.getByRole("progressbar", { name: "Progresso do Clip" });
  expect(bar).toHaveAttribute("aria-valuenow", "40");
});
it("oferece seguir o autor, menos no próprio Clip", async () => {
  const { unmount } = renderOverlay({ authorId: "author" }, "me");
  expect(await screen.findByRole("button", { name: "Seguir" })).toBeVisible();
  unmount();
  renderOverlay({ authorId: "me" }, "me");
  expect(screen.queryByRole("button", { name: /Seguir/ })).toBeNull();
});
it("recolhe a legenda longa e expande pelo botão mais", () => {
  renderOverlay({ body: `${"a".repeat(130)} fim-da-legenda` });
  expect(screen.queryByText(/fim-da-legenda/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "mais" }));
  expect(screen.getByText(/fim-da-legenda/)).toBeVisible();
});
it("limita o progresso entre 0 e 100", () => {
  renderOverlay({}, "me", 1.7);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
});
it("anima o coração ao curtir o Clip, mas não ao descurtir", () => {
  const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {}, addEventListener() {} }));
  Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  const { unmount } = renderOverlay({ mine: [], likes: 0 });
  fireEvent.click(screen.getByRole("button", { name: "Curtir · 0" }));
  expect(animate).toHaveBeenCalledOnce();
  unmount();
  animate.mockClear();
  renderOverlay({ mine: ["LIKE"], likes: 1 });
  fireEvent.click(screen.getByRole("button", { name: "Curtir · 1" }));
  expect(animate).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as { animate?: unknown }).animate;
});

function renderSeekable(seek = vi.fn(), progress = 0.4) {
  render(
    <SocialClipOverlay
      item={post("c1", { kind: "CLIP", media: [video("v1")] })}
      me="me"
      person={() => {}}
      changed={() => {}}
      progress={progress}
      duration={6}
      seek={seek}
    />,
  );
  return seek;
}

it("a bolinha de tempo só aparece depois de tocar na barrinha", () => {
  renderSeekable();
  expect(screen.queryByRole("slider", { name: "Avançar ou voltar o Clip" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar controle de tempo do Clip" }));
  const slider = screen.getByRole("slider", { name: "Avançar ou voltar o Clip" });
  expect(slider).toHaveAttribute("aria-valuetext", "0:02 de 0:06");
  expect(screen.getByText("0:02")).toBeInTheDocument();
  expect(screen.getByText("0:06")).toBeInTheDocument();
});

it("arrastar a bolinha adianta ou volta o Clip", () => {
  const seek = renderSeekable();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar controle de tempo do Clip" }));
  const slider = screen.getByRole("slider", { name: "Avançar ou voltar o Clip" });
  fireEvent.change(slider, { target: { value: "750" } });
  expect(seek).toHaveBeenLastCalledWith(0.75);
  fireEvent.change(slider, { target: { value: "100" } });
  expect(seek).toHaveBeenLastCalledWith(0.1);
});

it("a bolinha some sozinha depois de um tempo parada", () => {
  vi.useFakeTimers();
  try {
    renderSeekable();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar controle de tempo do Clip" }));
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.queryByRole("slider", { name: "Avançar ou voltar o Clip" })).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});
