import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  act,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { MobileNavigation } from "../mobile-navigation";
import { SocialNavigation } from "./social-navigation";
import { SocialOpening } from "./social-opening";

const state = vi.hoisted(() => ({
  learning: false,
  socialEnabled: true,
  claimSocialOpening: vi.fn(),
}));
vi.mock("../app-shell-state", () => ({ useAppShellState: () => state }));
vi.mock("next/navigation", () => ({ usePathname: () => "/home" }));
vi.mock("../navigation-link", () => ({
  NavigationLink: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("../desktop-updates", () => ({
  isInstalledApp: () => true,
  isMobileApp: () => false,
  useAppUpdateState: () => null,
}));
vi.mock("../user-identity", () => ({ Avatar: () => <span>EU</span> }));
vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="opening-player" />,
}));

beforeEach(() => {
  state.learning = false;
  state.socialEnabled = true;
  state.claimSocialOpening
    .mockReset()
    .mockReturnValueOnce(true)
    .mockReturnValue(false);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.reducedMotion;
});

it("keeps Social in the main dock and gates programming with the shared academic eligibility", () => {
  document.documentElement.dataset.reducedMotion = "true";
  const page = render(<MobileNavigation />);
  expect(
    within(screen.getByRole("navigation"))
      .getAllByRole("link")
      .map((a) => a.textContent),
  ).toEqual(["Início", "Salas", "Social Entu", "Comunidade", "Amigos"]);
  fireEvent.click(screen.getByRole("button", { name: "Mais opções" }));
  const menu = screen.getByRole("dialog");
  expect(
    within(menu).queryByRole("link", { name: "Programação" }),
  ).not.toBeInTheDocument();
  expect(
    within(menu).getByRole("link", { name: "Cadernos IA" }),
  ).toHaveAttribute("href", "/notebooks");
  state.learning = true;
  page.rerender(<MobileNavigation />);
  const names = within(menu)
    .getAllByRole("link")
    .map((a) => a.textContent);
  expect(names.indexOf("Cadernos IA")).toBe(names.indexOf("Programação") + 1);
  state.socialEnabled = false;
  page.rerender(<MobileNavigation />);
  expect(
    screen.queryByRole("link", { name: "Social Entu" }),
  ).not.toBeInTheDocument();
});

it("Social uses the existing selection handlers, persisted order and explicit exit links", () => {
  const select = vi.fn(),
    profile = vi.fn();
  render(
    <SocialNavigation
      view="clips"
      order={["clips", "feed", "create"]}
      highlight="feed"
      select={select}
      me={{ id: "me", name: "Eu", username: "eu" }}
      profile={profile}
      settings={vi.fn()}
    />,
  );
  const nav = screen.getByRole("navigation", { name: "Ambientes do Social" });
  expect(within(nav).getAllByRole("button")[0]).toHaveTextContent("Clips");
  expect(within(nav).getByRole("button", { name: "Clips" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  fireEvent.click(within(nav).getByRole("button", { name: "Criar" }));
  expect(select).toHaveBeenCalledWith("create");
  fireEvent.click(
    within(nav).getByRole("button", { name: "Meu perfil social" }),
  );
  expect(profile).toHaveBeenCalledOnce();
  expect(
    screen.getByRole("link", { name: "Início do Enturma" }),
  ).toHaveAttribute("href", "/home");
  expect(within(nav).getByRole("link", { name: "Mensagens" })).toHaveAttribute(
    "href",
    "/friends",
  );
});

it("opens only once in the app lifecycle and has a timeout when the player fails to load", async () => {
  vi.useFakeTimers();
  const page = render(<SocialOpening />);
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(screen.getByRole("dialog")).toBeVisible();
  await act(() => vi.advanceTimersByTimeAsync(6000));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  page.unmount();
  render(<SocialOpening />);
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("respects reduced motion without delaying access", async () => {
  vi.useFakeTimers();
  document.documentElement.dataset.reducedMotion = "true";
  render(<SocialOpening />);
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(state.claimSocialOpening).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
