import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SocialDraftsShelf, type SavedDraft } from "./social-drafts-shelf";

afterEach(cleanup);

const drafts: SavedDraft[] = [
  {
    id: "d1",
    kind: "POST",
    body: "Meu projeto de robótica na feira",
    updatedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    coverId: "m1",
    coverKind: "IMAGE",
    coverState: "READY",
    mediaCount: 3,
  },
  {
    id: "d2",
    kind: "CLIP",
    body: "",
    updatedAt: new Date().toISOString(),
    coverId: "m2",
    coverKind: "VIDEO",
    coverState: "READY",
    mediaCount: 1,
  },
  { id: "d3", kind: "STORY", body: "Só texto", updatedAt: new Date().toISOString(), mediaCount: 0 },
];

it("mostra a capa, o tipo, a legenda e quantas mídias cada rascunho tem", () => {
  render(<SocialDraftsShelf drafts={drafts} onOpen={vi.fn()} onDelete={vi.fn()} />);
  const list = screen.getByRole("list", { name: "Rascunhos salvos" });
  const [first, clip, story] = within(list).getAllByRole("listitem");
  expect(within(first).getByRole("img")).toHaveAttribute(
    "src",
    "/api/backend/social/media/m1/content",
  );
  expect(first).toHaveTextContent("Post");
  expect(first).toHaveTextContent("Meu projeto de robótica na feira");
  expect(first).toHaveTextContent("3 mídias");
  expect(first).toHaveTextContent("há 3 h");
  expect(within(clip).getByRole("img")).toHaveAttribute(
    "src",
    "/api/backend/social/media/m2/content?thumbnail=true",
  );
  expect(clip).toHaveTextContent("Sem legenda");
  expect(within(story).queryByRole("img")).toBeNull();
  expect(story).toHaveTextContent("Story");
});

it("abre o rascunho tocando no cartão", () => {
  const onOpen = vi.fn();
  render(<SocialDraftsShelf drafts={drafts} onOpen={onOpen} onDelete={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /Abrir rascunho: Meu projeto/ }));
  expect(onOpen).toHaveBeenCalledWith("d1");
});

it("só exclui depois de confirmar e permite desistir", () => {
  const onDelete = vi.fn();
  render(<SocialDraftsShelf drafts={drafts} onOpen={vi.fn()} onDelete={onDelete} />);
  fireEvent.click(screen.getAllByRole("button", { name: "Excluir rascunho" })[0]);
  expect(onDelete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("button", { name: "Excluir de vez" })).toBeNull();
  fireEvent.click(screen.getAllByRole("button", { name: "Excluir rascunho" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Excluir de vez" }));
  expect(onDelete).toHaveBeenCalledWith("d1");
});
