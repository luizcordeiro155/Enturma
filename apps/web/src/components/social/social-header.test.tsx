import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { SocialHeader } from "./social-header";

vi.mock("../navigation-link", () => ({
  NavigationLink: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("../notifications", () => ({
  NotificationBell: () => <button type="button">Notificações</button>,
}));

afterEach(cleanup);

function header() {
  const actions = { create: vi.fn(), explore: vi.fn(), settings: vi.fn() };
  render(<SocialHeader {...actions} />);
  return actions;
}

it("is a single Instagram-style bar: back, create, wordmark, explore, notifications and preferences", () => {
  const actions = header();
  const back = screen.getByRole("link", { name: "Voltar ao início do Enturma" });
  expect(back).toHaveAttribute("href", "/home");
  // The visible wordmark reads "Enturma"; assistive technology keeps the full name.
  const title = screen.getByRole("heading", { level: 1, name: "Enturma Social." });
  expect(title).toHaveClass("social-wordmark");
  expect(title).toHaveTextContent(/^Enturma$/);
  fireEvent.click(screen.getByRole("button", { name: "Criar publicação" }));
  fireEvent.click(screen.getByRole("button", { name: "Explorar" }));
  fireEvent.click(screen.getByRole("button", { name: "Preferências do Social" }));
  expect(actions.create).toHaveBeenCalledOnce();
  expect(actions.explore).toHaveBeenCalledOnce();
  expect(actions.settings).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Notificações" })).toBeInTheDocument();
});

it("searches only through Explorar: there is no separate magnifier", () => {
  header();
  expect(screen.queryByRole("button", { name: "Abrir busca do Social" })).toBeNull();
});

it("outside the Feed the arrow returns to the Feed instead of leaving the Social", () => {
  const toFeed = vi.fn();
  render(<SocialHeader create={() => {}} explore={() => {}} settings={() => {}} back={toFeed} />);
  expect(screen.queryByRole("link", { name: "Voltar ao início do Enturma" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Voltar ao Feed" }));
  expect(toFeed).toHaveBeenCalledOnce();
});

it("tapping the Enturma wordmark refreshes the Feed", () => {
  const refresh = vi.fn();
  render(<SocialHeader create={() => {}} explore={() => {}} settings={() => {}} refresh={refresh} />);
  fireEvent.click(screen.getByRole("button", { name: "Atualizar o Feed" }));
  expect(refresh).toHaveBeenCalledOnce();
  expect(screen.getByRole("heading", { level: 1, name: "Enturma Social." })).toBeInTheDocument();
});
