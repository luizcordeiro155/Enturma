import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mountCosmetics } from "./stage";

let card: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  card = document.createElement("div");
  card.className = "public-profile-card";
  card.innerHTML = '<div class="identity-avatar"></div>';
  document.body.append(card);
});
afterEach(() => {
  card.remove();
  vi.unstubAllGlobals();
});
const layers = () =>
  [...card.querySelectorAll("canvas.profile-cosmetic-layer")].map(
    (canvas) => (canvas as HTMLElement).dataset.layer,
  );

it("adds one decorative layer per chosen item and makes room for the frame", async () => {
  const stage = mountCosmetics(card, { frame: "sakura", avatar: "abobora" });
  // The frame goes last in the document so it sits over the others.
  await vi.waitFor(() => expect(layers()).toEqual(["avatar", "frame"]));
  expect(card).toHaveProperty(
    "className",
    expect.stringContaining("has-cosmetic-frame"),
  );
  expect(card.className).toContain("has-cosmetic-avatar");
  expect(card.style.getPropertyValue("--cosmetic-side")).toMatch(/^\d+px$/);
  // Decoration only: nothing here is content for a screen reader.
  for (const canvas of card.querySelectorAll("canvas"))
    expect(canvas.getAttribute("aria-hidden")).toBe("true");
  stage.destroy();
  expect(layers()).toEqual([]);
  expect(card.className).toBe("public-profile-card");
  expect(card.style.getPropertyValue("--cosmetic-side")).toBe("");
});

/** The card as it stands in a floating profile: room > column that holds the card > card. */
function floatingProfile(room: HTMLElement) {
  const surface = document.createElement("div");
  surface.className = "profile-preview-combined";
  const column = document.createElement("section");
  column.className = "profile-preview-identity";
  document.body.append(room);
  room.append(surface);
  surface.append(column);
  column.append(card);
  return { surface, column };
}
const wide = () =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width"),
  }));

it("lets the frame spill around the card in a profile dialog on a wide screen", async () => {
  wide();
  const dialog = document.createElement("dialog");
  dialog.className = "social-dialog";
  const { surface, column } = floatingProfile(dialog);
  const stage = mountCosmetics(card, { frame: "dragao", effect: "dragao" });
  // The frame lives in the column that scrolls the card, so both move as one piece.
  await vi.waitFor(() =>
    expect(
      column.querySelector(":scope > canvas[data-layer=frame]"),
    ).not.toBeNull(),
  );
  // Nothing is boxed in: the card keeps its size and the art goes around it.
  expect(layers()).toEqual(["effect"]);
  expect(card.className).not.toContain("has-cosmetic-frame");
  expect(card.style.getPropertyValue("--cosmetic-side")).toBe("");
  expect(surface.className).toContain("has-cosmetic-spill");
  // The whole room learns how far the art reaches, so it can leave that much clear.
  for (const side of ["", "-top", "-bottom"])
    expect(dialog.style.getPropertyValue(`--cosmetic-spill${side}`)).toMatch(
      /^\d+px$/,
    );
  stage.destroy();
  expect(dialog.querySelector("canvas")).toBeNull();
  expect(surface.className).toBe("profile-preview-combined");
  expect(dialog.getAttribute("style") ?? "").not.toContain("cosmetic");
  dialog.remove();
});

it("shows the editor's preview the way the profile opens for everyone else", async () => {
  wide();
  const preview = document.createElement("section");
  preview.className = "profile-preview-stage";
  const { surface, column } = floatingProfile(preview);
  const stage = mountCosmetics(card, { frame: "sakura" });
  // No box around the art: the frame spills around the card, as in the full profile.
  await vi.waitFor(() =>
    expect(
      column.querySelector(":scope > canvas[data-layer=frame]"),
    ).not.toBeNull(),
  );
  expect(card.className).not.toContain("has-cosmetic-frame");
  expect(surface.className).toContain("has-cosmetic-spill");
  stage.destroy();
  preview.remove();
});

it("keeps the frame of a profile popover in whatever scrolls its card", async () => {
  wide();
  const popover = document.createElement("div");
  popover.className = "user-profile-popover";
  popover.dataset.profileView = "compact";
  const { column } = floatingProfile(popover);
  const stage = mountCosmetics(card, { frame: "sakura" });
  // Compact, the popover is the card and scrolls as a whole.
  await vi.waitFor(() =>
    expect(
      popover.querySelector(":scope > canvas[data-layer=frame]"),
    ).not.toBeNull(),
  );
  // Opened in full, the card has a column of its own.
  popover.dataset.profileView = "full";
  await vi.waitFor(() =>
    expect(
      column.querySelector(":scope > canvas[data-layer=frame]"),
    ).not.toBeNull(),
  );
  expect(popover.querySelectorAll("canvas[data-layer=frame]")).toHaveLength(1);
  stage.destroy();
  expect(popover.querySelector("canvas")).toBeNull();
  popover.remove();
});

it("leaves the card untouched when nothing is chosen", () => {
  const stage = mountCosmetics(card, {});
  expect(layers()).toEqual([]);
  expect(card.className).toBe("public-profile-card");
  stage.destroy();
});

it("does not add layers after it was taken down while the art was loading", async () => {
  const stage = mountCosmetics(card, { effect: "dragao" });
  stage.destroy();
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(layers()).toEqual([]);
});
