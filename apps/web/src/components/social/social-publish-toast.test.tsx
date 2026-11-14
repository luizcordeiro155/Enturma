import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PUBLISH_TOAST_MS, SocialPublishToast } from "./social-publish-toast";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const done = { state: "done" as const, message: "Publicado no Enturma.", percent: 100 };

it("depois de publicar, tocar no aviso abre a publicação", () => {
  const openPost = vi.fn();
  render(
    <SocialPublishToast
      progress={done}
      postId="p1"
      openProgress={vi.fn()}
      openPost={openPost}
      dismiss={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Ver sua publicação/ }));
  expect(openPost).toHaveBeenCalledWith("p1");
});

it("some sozinho depois de alguns segundos e pode ser fechado antes", () => {
  const dismiss = vi.fn();
  const view = render(
    <SocialPublishToast
      progress={done}
      postId="p1"
      openProgress={vi.fn()}
      openPost={vi.fn()}
      dismiss={dismiss}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Fechar aviso" }));
  expect(dismiss).toHaveBeenCalledTimes(1);
  view.unmount();
  const auto = vi.fn();
  render(
    <SocialPublishToast
      progress={done}
      postId="p2"
      openProgress={vi.fn()}
      openPost={vi.fn()}
      dismiss={auto}
    />,
  );
  act(() => vi.advanceTimersByTime(PUBLISH_TOAST_MS - 100));
  expect(auto).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(400));
  expect(auto).toHaveBeenCalledTimes(1);
});

it("durante o envio mostra o progresso, não some sozinho e abre o Criar", () => {
  const openProgress = vi.fn(),
    dismiss = vi.fn();
  render(
    <SocialPublishToast
      progress={{ state: "working", message: "Enviando 40%", percent: 40 }}
      openProgress={openProgress}
      openPost={vi.fn()}
      dismiss={dismiss}
    />,
  );
  expect(screen.getByRole("progressbar", { name: "Progresso do envio" })).toHaveAttribute(
    "value",
    "40",
  );
  expect(screen.queryByRole("button", { name: "Fechar aviso" })).toBeNull();
  act(() => vi.advanceTimersByTime(PUBLISH_TOAST_MS * 3));
  expect(dismiss).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Abrir progresso/ }));
  expect(openProgress).toHaveBeenCalled();
});

it("um erro fica até a pessoa fechar", () => {
  const dismiss = vi.fn();
  render(
    <SocialPublishToast
      progress={{ state: "error", message: "Falhou", percent: 0 }}
      openProgress={vi.fn()}
      openPost={vi.fn()}
      dismiss={dismiss}
    />,
  );
  act(() => vi.advanceTimersByTime(PUBLISH_TOAST_MS * 3));
  expect(dismiss).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
});
