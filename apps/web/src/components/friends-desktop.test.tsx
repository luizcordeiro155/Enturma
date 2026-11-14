import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { FriendsChatPlaceholder, useEscapeClosesChat } from "./friends-desktop";

afterEach(cleanup);

it("o painel vazio explica que as conversas são protegidas e aparecem ali", () => {
  render(<FriendsChatPlaceholder />);
  expect(screen.getByRole("heading", { name: "Suas conversas" })).toBeVisible();
  expect(screen.getByText(/ponta a ponta/i)).toBeVisible();
});

it("Esc fecha a conversa aberta, como no WhatsApp Web", () => {
  const close = vi.fn();
  renderHook(() => useEscapeClosesChat(true, close));
  fireEvent.keyDown(window, { key: "Escape" });
  expect(close).toHaveBeenCalledTimes(1);
});

it("Esc não fecha a conversa quando um diálogo está aberto ou nada está aberto", () => {
  const close = vi.fn();
  const { rerender } = renderHook(({ open }) => useEscapeClosesChat(open, close), {
    initialProps: { open: false },
  });
  fireEvent.keyDown(window, { key: "Escape" });
  rerender({ open: true });
  const dialog = document.createElement("dialog");
  dialog.setAttribute("open", "");
  document.body.appendChild(dialog);
  fireEvent.keyDown(window, { key: "Escape" });
  dialog.remove();
  expect(close).not.toHaveBeenCalled();
});
