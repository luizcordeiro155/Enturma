import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SocialMediaCarousel } from "./social-media-carousel";
import { readFileSync } from "node:fs";
import {
  img,
  intersect,
  stubIntersectionObserver,
  video,
} from "./social-test-kit";

let Observer: ReturnType<typeof stubIntersectionObserver>;
beforeEach(() => {
  Observer = stubIntersectionObserver();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(document, "hidden", { value: false, configurable: true });
});

it("só bloqueia o gesto de página quando há mais de uma mídia", () => {
  const { container, rerender } = render(
    <SocialMediaCarousel media={[img("a")]} authorName="Ana" autoplay />,
  );
  expect(container.querySelector("[data-social-gesture]")).toBeNull();
  expect(screen.queryByRole("tablist")).toBeNull();
  rerender(
    <SocialMediaCarousel media={[img("a"), img("b")]} authorName="Ana" autoplay />,
  );
  expect(container.querySelector("[data-social-gesture]")).not.toBeNull();
  expect(screen.getAllByRole("tab")).toHaveLength(2);
  expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
});
it("reserva a proporção da primeira mídia, limitada a 3:4", () => {
  const { container } = render(
    <SocialMediaCarousel media={[img("a", 1080, 1920)]} authorName="Ana" autoplay />,
  );
  // The stylesheet reads this property as the element's aspect-ratio.
  expect(
    container
      .querySelector<HTMLElement>(".social-carousel")!
      .style.getPropertyValue("--social-media-aspect"),
  ).toBe("0.75");
});
it("as setas e os pontos trocam a mídia selecionada", () => {
  render(
    <SocialMediaCarousel media={[img("a"), img("b")]} authorName="Ana" autoplay />,
  );
  expect(screen.getByRole("button", { name: "Mídia anterior" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Próxima mídia" }));
  expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("button", { name: "Próxima mídia" })).toBeDisabled();
  fireEvent.click(screen.getAllByRole("tab")[0]);
  expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
});
it("com autoplay desligado o vídeo não recebe o observador", () => {
  render(<SocialMediaCarousel media={[video("v")]} authorName="Ana" autoplay={false} />);
  expect(Observer).not.toHaveBeenCalled();
});
it("a cascata real preserva o quadro inteiro dos vídeos no feed e no modal", () => {
  const style = document.createElement("style");
  style.textContent = ["social.css", "social-3.css", "social-3-continuation.css", "social-studio.css"]
    .map((file) => readFileSync(`src/components/social/${file}`, "utf8"))
    .join("\n");
  document.head.append(style);
  try {
    const { rerender } = render(
      <main className="social-page"><article className="social-post">
        <SocialMediaCarousel media={[video("v")]} authorName="Ana" autoplay={false} />
      </article></main>,
    );
    expect(getComputedStyle(screen.getByTestId("post-video")).objectFit).toBe("contain");
    rerender(
      <div className="social-dialog"><article className="social-post">
        <SocialMediaCarousel media={[video("v")]} authorName="Ana" autoplay={false} />
      </article></div>,
    );
    expect(getComputedStyle(screen.getByTestId("post-video")).objectFit).toBe("contain");
  } finally {
    style.remove();
  }
});
it("vídeo 60% visível toca sem som e pausa ao sair", () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  render(<SocialMediaCarousel media={[video("v")]} authorName="Ana" autoplay />);
  const element = screen.getByTestId("post-video") as HTMLVideoElement;
  expect(element.muted).toBe(true);
  intersect(element, 0.4);
  expect(play).not.toHaveBeenCalled();
  intersect(element, 0.8);
  expect(play).toHaveBeenCalledOnce();
  pause.mockClear();
  intersect(element, 0);
  expect(pause).toHaveBeenCalled();
});
it("com a aba em segundo plano o vídeo visível não começa a tocar", () => {
  Object.defineProperty(document, "hidden", { value: true, configurable: true });
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  render(<SocialMediaCarousel media={[video("v")]} authorName="Ana" autoplay />);
  intersect(screen.getByTestId("post-video"), 0.8);
  expect(play).not.toHaveBeenCalled();
});
