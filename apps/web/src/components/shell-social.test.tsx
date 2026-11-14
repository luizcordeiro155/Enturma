import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { Shell } from "./shell";

const route = vi.hoisted(() => ({ path: "/social" }));
const syncExperience = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock("next/navigation", () => ({ usePathname: () => route.path }));
vi.mock("./navigation-link", () => ({
  NavigationLink: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("@/lib/api", () => ({ api: vi.fn(() => new Promise(() => {})) }));
vi.mock("@/lib/visitor-context", () => ({ useVisitor: () => ({ path: "" }) }));
vi.mock("@/lib/experience-preferences", () => ({ syncExperience }));
vi.mock("./app-shell-state", () => ({
  useAppShellState: () => ({ learning: false, profileShortcut: null }),
}));
vi.mock("./desktop-updates", () => ({
  isInstalledApp: () => false,
  isMobileApp: () => false,
  useAppUpdateState: () => null,
}));
vi.mock("./notifications", () => ({ NotificationBell: () => <span>sino</span> }));
vi.mock("./experience-controls", () => ({
  ExperienceControls: () => <span>aparência</span>,
}));
vi.mock("./mobile-navigation", () => ({ MobileNavigation: () => null }));
vi.mock("./social/social-entry", () => ({ SocialEntry: () => null }));
vi.mock("./ride-navigation", () => ({
  RideDesktopNavigation: () => null,
  RideMobileNavigation: () => null,
}));
vi.mock("./community-feedback", () => ({ CommunityFeedback: () => null }));

beforeEach(() => syncExperience.mockClear());
afterEach(cleanup);

it("hides the app-wide top bar inside the Social, which has its own bar", () => {
  route.path = "/social";
  const { container } = render(<Shell navigation={<nav />}>Social</Shell>);
  expect(container.querySelector(".topbar")).toBeNull();
  expect(screen.queryByText("Início do Enturma")).toBeNull();
  // The bar that normally syncs appearance is gone, so the shell keeps it in sync.
  expect(syncExperience).toHaveBeenCalledOnce();
});

it("keeps the app-wide top bar everywhere else", () => {
  route.path = "/home";
  const { container } = render(<Shell>Início</Shell>);
  expect(container.querySelector(".topbar")).not.toBeNull();
  expect(syncExperience).not.toHaveBeenCalled();
});
