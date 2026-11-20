import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProfileVisualSurface } from "./profile-visual-surface";
import type { Showcase } from "./profile-showcase";

let social = true;
vi.mock("./app-shell-state", () => ({
  useAppShellState: () => ({ socialEnabled: social }),
}));
vi.mock("./profile-motion", () => ({ ProfileBackdrop: () => null }));
vi.mock("./user-identity", () => ({
  ProfileCard: () => <div data-testid="card" />,
  profileStyle: () => ({}),
}));
vi.mock("./profile-showcase", () => ({
  ShowcaseView: ({ compact }: { compact?: boolean }) => (
    <div data-testid="showcase" data-compact={compact ? "true" : "false"} />
  ),
}));

const showcase = {
  appearance: { muralMode: "DEFAULT" },
  widgets: [{ kind: "GOAL", visible: true, favorite: false }],
} as unknown as Showcase;
const user = { id: "u1", name: "Ana" };

function screenWidth(wide: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: wide && query.includes("min-width: 761px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  social = true;
});

it("on a computer, the editor's preview lays the mural out as the open profile does", () => {
  screenWidth(true);
  const { container } = render(
    <ProfileVisualSurface user={user} showcase={showcase} preview />,
  );
  const mural = container.querySelector(".profile-preview-mural")!;
  expect(mural.classList.contains("profile-has-community")).toBe(true);
  const tabs = mural.querySelector(".profile-community-tabs")!;
  expect(
    [...tabs.querySelectorAll("button")].map((b) => b.textContent),
  ).toEqual(["Mural", "Atividade", "Salas em comum", "Amigos em comum"]);
  expect(tabs.querySelector('[aria-selected="true"]')!.textContent).toBe(
    "Mural",
  );
  expect(mural.textContent).toContain("Posts, Clips e seguidores");
  expect(
    mural
      .querySelector(".profile-community-panel [data-testid='showcase']")!
      .getAttribute("data-compact"),
  ).toBe("true");
  expect(screen.queryByText("Seu mural")).toBeNull();
});

it("shows that header without letting it be used: it is a picture of the profile", () => {
  screenWidth(true);
  const { container } = render(
    <ProfileVisualSurface user={user} showcase={showcase} preview />,
  );
  const parts = container.querySelectorAll(
    ".profile-community > .text-button, .profile-community-tabs",
  );
  expect(parts).toHaveLength(2);
  for (const part of parts) {
    expect(part.hasAttribute("inert")).toBe(true);
    expect(part.getAttribute("aria-hidden")).toBe("true");
  }
});

it("leaves the Social button out where the Social is off", () => {
  social = false;
  screenWidth(true);
  const { container } = render(
    <ProfileVisualSurface user={user} showcase={showcase} preview />,
  );
  expect(container.querySelector(".profile-community-tabs")).toBeTruthy();
  expect(container.textContent).not.toContain("Posts, Clips e seguidores");
});

it("on a phone, the preview's mural stays as it was", () => {
  screenWidth(false);
  const { container } = render(
    <ProfileVisualSurface user={user} showcase={showcase} preview />,
  );
  expect(screen.getByText("Seu mural")).toBeTruthy();
  expect(container.querySelector(".profile-community")).toBeNull();
  expect(
    container
      .querySelector("[data-testid='showcase']")!
      .getAttribute("data-compact"),
  ).toBe("false");
});

it("the open profile keeps its own live content beside the card", () => {
  screenWidth(true);
  const { container } = render(
    <ProfileVisualSurface
      user={user}
      showcase={showcase}
      mural={<div data-testid="live" />}
    />,
  );
  expect(container.querySelector("[data-testid='live']")).toBeTruthy();
  expect(container.querySelector(".profile-community-tabs")).toBeNull();
});
