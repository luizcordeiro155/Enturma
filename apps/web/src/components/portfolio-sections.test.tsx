import { afterEach, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { PortfolioSections, sectionAt } from "./portfolio-sections";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

it("a seção atual é a última que já passou da linha de leitura", () => {
  const tops = [
    { id: "apresentacao", top: -900 },
    { id: "competencias", top: -200 },
    { id: "projetos", top: 80 },
    { id: "jornada", top: 900 },
  ];
  expect(sectionAt(tops, 120)).toBe("projetos");
  expect(sectionAt(tops, 60)).toBe("competencias");
});

it("antes da primeira seção, a primeira é a atual", () => {
  expect(
    sectionAt(
      [
        { id: "apresentacao", top: 600 },
        { id: "projetos", top: 1800 },
      ],
      120,
    ),
  ).toBe("apresentacao");
  expect(sectionAt([], 120)).toBeUndefined();
});

function place(id: string, top: number) {
  const el = document.getElementById(id) ?? document.createElement("section");
  el.id = id;
  el.getBoundingClientRect = () =>
    ({
      top,
      bottom: top + 400,
      left: 0,
      right: 300,
      width: 300,
      height: 400,
    }) as DOMRect;
  if (!el.isConnected) document.body.append(el);
}

it("a fila de seções marca a seção aberta e acompanha a rolagem", async () => {
  place("apresentacao", 300);
  place("competencias", 900);
  place("projetos", 1500);
  place("jornada", 2400);
  render(<PortfolioSections />);
  const nav = screen.getByRole("navigation", { name: "Seções do portfólio" });
  expect(nav).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Apresentação" })
      .getAttribute("aria-current"),
  ).toBe("true");
  expect(
    screen.getByRole("link", { name: "Projetos" }).getAttribute("aria-current"),
  ).toBeNull();

  place("apresentacao", -1400);
  place("competencias", -800);
  place("projetos", 20);
  place("jornada", 920);
  await act(async () => {
    document.dispatchEvent(new Event("scroll"));
    await new Promise((done) => setTimeout(done, 60));
  });
  expect(
    screen.getByRole("link", { name: "Projetos" }).getAttribute("aria-current"),
  ).toBe("true");
  expect(
    screen
      .getByRole("link", { name: "Apresentação" })
      .getAttribute("aria-current"),
  ).toBeNull();
});

it("o currículo continua na fila, como página à parte", () => {
  render(<PortfolioSections />);
  const link = screen.getByRole("link", { name: "Currículo" });
  expect(link.getAttribute("href")).toBe("/portfolio/curriculo");
  expect(link.getAttribute("aria-current")).toBeNull();
});
