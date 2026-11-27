import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryDecorations } from "./story-decorations";

vi.mock("../navigation-link", () => ({
  NavigationLink: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

afterEach(cleanup);

it("mostra cada texto na posição, com fonte, cor, destaque e giro", () => {
  const { container } = render(
    <StoryDecorations
      items={[
        {
          text: "Semana de provas",
          x: 0.25,
          y: 0.8,
          size: 0.1,
          font: "POSTER",
          color: "#d8ef79",
          style: "FILL",
          align: "LEFT",
          rotation: -12,
        },
      ]}
    />,
  );
  const text = container.querySelector<HTMLElement>(".story-text")!;
  expect(text.textContent).toBe("Semana de provas");
  expect(text.style.left).toBe("25%");
  expect(text.style.top).toBe("80%");
  expect(text.style.transform).toContain("rotate(-12deg)");
  expect(text.style.getPropertyValue("--story-size")).toBe("0.1");
  expect(text.style.getPropertyValue("--story-ink")).toBe("#d8ef79");
  expect(text.style.getPropertyValue("--story-on")).toBe("#111111");
  expect(text.dataset.font).toBe("POSTER");
  expect(text.dataset.look).toBe("FILL");
  expect(text.dataset.align).toBe("LEFT");
});

it("um texto antigo continua aparecendo, com o destaque suave", () => {
  const { container } = render(
    <StoryDecorations items={[{ text: "📚", x: 0.5, y: 0.3 }]} />,
  );
  const text = container.querySelector<HTMLElement>(".story-text")!;
  expect(text.dataset.look).toBe("SOFT");
  expect(text.dataset.font).toBe("CLASSIC");
});

it("no Story publicado, a menção abre o perfil e a hashtag abre a página dela", () => {
  const person = vi.fn();
  render(
    <StoryDecorations
      links
      people={[{ id: "u-ana", username: "ana_lima" }]}
      onPerson={person}
      items={[
        { text: "Bora @Ana_Lima pro #TCC", x: 0.5, y: 0.5, style: "PLAIN" },
      ]}
    />,
  );
  fireEvent.click(screen.getByRole("link", { name: "@Ana_Lima" }));
  expect(person).toHaveBeenCalledWith("u-ana");
  expect(screen.getByRole("link", { name: "#TCC" }).getAttribute("href")).toBe(
    "/social?tag=tcc",
  );
});

it("uma menção sem perfil conhecido leva à busca por ela", () => {
  render(
    <StoryDecorations
      links
      items={[{ text: "@alguem", x: 0.5, y: 0.5, style: "PLAIN" }]}
    />,
  );
  expect(
    screen.getByRole("link", { name: "@alguem" }).getAttribute("href"),
  ).toBe("/social?q=%40alguem");
});

it("na prévia do editor os textos não viram links", () => {
  render(
    <StoryDecorations
      items={[{ text: "@ana #tcc", x: 0.5, y: 0.5, style: "PLAIN" }]}
    />,
  );
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.getByText("@ana")).toBeTruthy();
});

it("com a proporção da mídia, a camada ocupa a mesma área que a mídia", () => {
  const stage = document.createElement("div");
  Object.defineProperty(stage, "clientWidth", { value: 400 });
  Object.defineProperty(stage, "clientHeight", { value: 400 });
  document.body.append(stage);
  const { container } = render(
    <StoryDecorations
      ratio={9 / 16}
      items={[{ text: "Oi", x: 0.5, y: 0.5 }]}
    />,
    { container: stage },
  );
  const layer = container.querySelector<HTMLElement>(
    ".social-story-decorations",
  )!;
  expect(layer.style.width).toBe("225px");
  expect(layer.style.height).toBe("400px");
  stage.remove();
});
