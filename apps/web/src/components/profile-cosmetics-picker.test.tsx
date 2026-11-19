import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CosmeticsPicker } from "./profile-cosmetics-picker";

afterEach(cleanup);
const shop = {
  level: 3,
  items: [
    { id: "sakura", level: 1, unlocked: true },
    { id: "abobora", level: 3, unlocked: true },
    { id: "dragao", level: 5, unlocked: false },
  ],
};
const open = (details = {}, trying?: string) => {
  const change = vi.fn(),
    tryOn = vi.fn();
  render(
    <CosmeticsPicker
      shop={shop}
      details={details}
      trying={trying}
      onChange={change}
      onTry={tryOn}
    />,
  );
  return { change, tryOn };
};
const pack = (name: string) => screen.getByRole("group", { name });

it("puts on the whole pack with one tap", () => {
  const { change } = open();
  fireEvent.click(
    pack("Sakura").querySelector('button[data-action="all"]') as HTMLElement,
  );
  expect(change).toHaveBeenCalledWith({
    cosmeticFrame: "sakura",
    cosmeticAvatar: "sakura",
    cosmeticEffect: "sakura",
    cosmeticTheme: "sakura",
  });
});

it("mixes pieces of different packs and takes a piece off when tapped again", () => {
  const { change } = open({ cosmeticFrame: "sakura" });
  const frame = pack("Sakura").querySelector(
    'button[data-layer="frame"]',
  ) as HTMLElement;
  expect(frame).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(frame);
  expect(change).toHaveBeenLastCalledWith({ cosmeticFrame: "" });
  fireEvent.click(
    pack("Noite das Abóboras").querySelector(
      'button[data-layer="avatar"]',
    ) as HTMLElement,
  );
  expect(change).toHaveBeenLastCalledWith({ cosmeticAvatar: "abobora" });
});

it("says which level opens a locked pack and only lets the student try it on", () => {
  const { change, tryOn } = open();
  const dragon = pack("Dragão Imperial");
  expect(dragon).toHaveTextContent("Libera no nível 5");
  for (const button of dragon.querySelectorAll("button[data-layer]"))
    expect(button).toBeDisabled();
  fireEvent.click(
    dragon.querySelector('button[data-action="try"]') as HTMLElement,
  );
  expect(tryOn).toHaveBeenCalledWith("dragao");
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByText("Você está no nível 3")).toBeInTheDocument();
});

it("shows what is being tried on and lets the student stop", () => {
  const { tryOn } = open({}, "dragao");
  const stop = pack("Dragão Imperial").querySelector(
    'button[data-action="try"]',
  ) as HTMLElement;
  expect(stop).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(stop);
  expect(tryOn).toHaveBeenCalledWith(undefined);
});
