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
    { id: "gato", level: 2, unlocked: true },
  ],
};
const open = (
  details = {},
  trying?: string,
  colors: [string, string] = ["#111111", "#222222"],
) => {
  const change = vi.fn(),
    tryOn = vi.fn(),
    paint = vi.fn();
  render(
    <CosmeticsPicker
      shop={shop}
      details={details}
      colors={colors}
      trying={trying}
      onChange={change}
      onColors={paint}
      onTry={tryOn}
    />,
  );
  return { change, tryOn, paint };
};
const pack = (name: string) => screen.getByRole("group", { name });

it("puts on the whole pack with one tap, colours included", () => {
  const { change, paint } = open();
  fireEvent.click(
    pack("Sakura").querySelector('button[data-action="all"]') as HTMLElement,
  );
  expect(change).toHaveBeenCalledWith({
    cosmeticFrame: "sakura",
    cosmeticAvatar: "sakura",
    cosmeticEffect: "sakura",
  });
  expect(paint).toHaveBeenCalledWith(["#e86a9a", "#6d4bc4"]);
});

it("offers the pack's colours on their own and shows when the profile wears them", () => {
  const { paint, change } = open({}, undefined, ["#E86A9A", "#6d4bc4"]);
  const colors = pack("Sakura").querySelector(
    'button[data-action="colors"]',
  ) as HTMLElement;
  expect(colors).toHaveAttribute("aria-pressed", "true");
  const other = pack("Noite das Abóboras").querySelector(
    'button[data-action="colors"]',
  ) as HTMLElement;
  expect(other).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(other);
  expect(paint).toHaveBeenCalledWith(["#7a35a8", "#f07a1c"]);
  expect(change).not.toHaveBeenCalled();
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

it("sorts the packs into shelves and shows one shelf when asked", () => {
  open();
  // Everything at first, under the name of its shelf.
  expect(screen.getByRole("heading", { name: "Bichinhos" })).toBeVisible();
  expect(pack("Gatinhos")).toBeVisible();
  expect(pack("Sakura")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Bichinhos" }));
  expect(screen.getByRole("button", { name: "Bichinhos" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(pack("Gatinhos")).toBeVisible();
  expect(screen.queryByRole("group", { name: "Sakura" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Todos" }));
  expect(pack("Sakura")).toBeVisible();
});
