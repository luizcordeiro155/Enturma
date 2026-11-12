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
import * as motion from "@/lib/motion";

const state = vi.hoisted(() => ({
  learning: false,
  socialEnabled: true,
  claimSocialOpening: vi.fn(),
  playerReady: undefined as (() => void) | undefined,
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
  default:
    () =>
    ({ ready }: { ready: () => void }) => {
      state.playerReady = ready;
      return <div data-testid="opening-player" />;
    },
}));

beforeEach(() => {
  state.learning = false;
  state.socialEnabled = true;
  state.playerReady = undefined;
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
  // Messages moved to the Feed header; the dock keeps only the Social places.
  expect(within(nav).queryByRole("link", { name: "Mensagens" })).toBeNull();
  expect(within(nav).getAllByRole("button")).toHaveLength(4);
  expect(within(nav).getByRole("button", { name: "Criar" })).toHaveAttribute(
    "title",
    "Criar (Alt + 3)",
  );
});

it("opens only once in the app lifecycle and has a timeout when the player fails to load", async () => {
  vi.useFakeTimers();
  const page = render(<SocialOpening />);
  await act(() => vi.advanceTimersByTimeAsync(1));
  act(() => state.playerReady?.());
  expect(screen.getByRole("dialog")).toBeVisible();
  await act(() => vi.advanceTimersByTimeAsync(6000));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  page.unmount();
  render(<SocialOpening />);
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("animates the selected destination when the pager changes view", () => {
  const animate = vi.spyOn(motion, "playMotion").mockReturnValue(undefined);
  const props = {
    order: ["clips", "feed", "create"] as ("clips" | "feed" | "create")[],
    highlight: null,
    select: vi.fn(),
    me: { id: "me", name: "Eu", username: "eu" },
    profile: vi.fn(),
    settings: vi.fn(),
  };
  const page = render(<SocialNavigation {...props} view="feed" />);
  const feed = screen.getByRole("button", { name: "Feed", exact: true });
  const clips = screen.getByRole("button", { name: "Clips", exact: true });
  const feedBox = vi
    .spyOn(feed, "getBoundingClientRect")
    .mockReturnValue({ x: 100, y: 0 } as DOMRect);
  const clipsBox = vi
    .spyOn(clips, "getBoundingClientRect")
    .mockReturnValue({ x: 0, y: 0 } as DOMRect);
  page.rerender(<SocialNavigation {...props} view="clips" />);
  expect(clips).toHaveAttribute("aria-current", "page");
  expect(feed).not.toHaveAttribute("aria-current");
  expect(animate).toHaveBeenCalledWith(
    clips.querySelector(".social-nav-selection"),
    [{ transform: "translate(100px, 0px)" }, { transform: "translate(0, 0)" }],
    { duration: 280 },
  );
  feedBox.mockRestore();
  clipsBox.mockRestore();
  animate.mockRestore();
});

it("waits for the actual animation before opening and never reopens after skipping", async () => {
  vi.useFakeTimers();
  render(
    <SocialOpening>
      <main data-testid="workspace">Feed e Clips</main>
    </SocialOpening>,
  );
  expect(screen.queryByTestId("workspace")).not.toBeInTheDocument();
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(screen.queryByTestId("workspace")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(state.playerReady).toBeTypeOf("function");
  act(() => state.playerReady?.());
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.queryByTestId("workspace")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Explorar o Social" }));
  expect(screen.getByTestId("workspace")).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  act(() => state.playerReady?.());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("abandons a slow animation without showing a late welcome over the feed", async () => {
  vi.useFakeTimers();
  render(<SocialOpening />);
  await act(() => vi.advanceTimersByTimeAsync(1));
  await act(() => vi.advanceTimersByTimeAsync(6000));
  act(() => state.playerReady?.());
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
