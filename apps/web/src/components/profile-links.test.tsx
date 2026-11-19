import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { ProfileLinks, ProfileLinksEditor } from "./profile-links";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("./room-join-dialog", () => ({ RoomJoinDialog: () => null }));

beforeEach(() => {
  document.documentElement.dataset.reducedMotion = "true";
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.reducedMotion;
  vi.unstubAllGlobals();
});

it("says what each profile link is", () => {
  render(
    <ProfileLinks
      details={{
        website: "https://www.kayn.online/pt-br",
        links: ["https://github.com/ana", "mailto:ana@example.com"],
      }}
    />,
  );
  const list = screen.getByRole("list", { name: "Links" });
  expect(list.children).toHaveLength(3);
  expect(
    screen.getByRole("link", { name: "Site kayn.online" }),
  ).toHaveAttribute("href", "https://www.kayn.online/pt-br");
  expect(screen.getByRole("link", { name: "GitHub ana" })).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "E-mail ana@example.com" }),
  ).toHaveAttribute("href", "mailto:ana@example.com");
});

it("still warns before leaving for an outside page", () => {
  render(<ProfileLinks details={{ links: ["https://github.com/ana"] }} />);
  fireEvent.click(screen.getByRole("link", { name: "GitHub ana" }));
  expect(
    screen.getByRole("dialog", { name: "Você está saindo do Enturma" }),
  ).toBeInTheDocument();
});

it("shows nothing for a profile without links", () => {
  const view = render(<ProfileLinks details={{ website: "", links: [] }} />);
  expect(view.container).toBeEmptyDOMElement();
});

function Editor({ initial = [] as string[] }) {
  const [value, setValue] = useState(initial);
  return <ProfileLinksEditor value={value} onChange={setValue} />;
}

it("recognises the service while the user types", () => {
  render(<Editor initial={[""]} />);
  const field = screen.getByLabelText("Link 1");
  fireEvent.change(field, { target: { value: "github.com/ana" } });
  expect(screen.getByText("GitHub")).toBeInTheDocument();
  fireEvent.change(field, { target: { value: "ana@example.com" } });
  expect(screen.getByText("E-mail")).toBeInTheDocument();
  fireEvent.change(field, { target: { value: "meu site" } });
  expect(screen.getByText("Use um endereço web ou e-mail")).toBeInTheDocument();
});

it("adds and removes links, up to six", () => {
  render(<Editor />);
  const add = () =>
    fireEvent.click(screen.getByRole("button", { name: "Adicionar link" }));
  for (let i = 0; i < 6; i++) add();
  expect(screen.getAllByRole("textbox")).toHaveLength(6);
  expect(screen.queryByRole("button", { name: "Adicionar link" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Remover link 2" }));
  expect(screen.getAllByRole("textbox")).toHaveLength(5);
});
