import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StartExperience } from "./start-experience";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("./public-theme-control", () => ({ PublicThemeControl: () => null }));
afterEach(cleanup);

it("a tela inicial leva aos slides da apresentação, em outra aba", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  Element.prototype.animate = vi.fn(() => ({ cancel: vi.fn(), finished: Promise.resolve() })) as never;
  render(<StartExperience />);
  const slides = screen.getByRole("link", { name: "Ver os slides" });
  // o endereço termina em .html para abrir sem login
  expect(slides).toHaveAttribute("href", "/apresentacao/index.html");
  expect(slides).toHaveAttribute("target", "_blank");
  expect(slides).toHaveAttribute("rel", expect.stringContaining("noopener"));
});
