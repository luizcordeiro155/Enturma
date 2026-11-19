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

it("lets the frame spill around the card in a profile dialog on a wide screen", async () => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width"),
  }));
  const dialog = document.createElement("dialog");
  dialog.className = "social-dialog";
  const surface = document.createElement("div");
  surface.className = "profile-preview-combined";
  document.body.append(dialog);
  dialog.append(surface);
  surface.append(card);
  const stage = mountCosmetics(card, { frame: "dragao", effect: "dragao" });
  await vi.waitFor(() =>
    expect(
      dialog.querySelector(":scope > canvas[data-layer=frame]"),
    ).not.toBeNull(),
  );
  // Nothing is boxed in: the card keeps its size and the art goes around it.
  expect(layers()).toEqual(["effect"]);
  expect(card.className).not.toContain("has-cosmetic-frame");
  expect(card.style.getPropertyValue("--cosmetic-side")).toBe("");
  expect(surface.className).toContain("has-cosmetic-spill");
  stage.destroy();
  expect(dialog.querySelector("canvas")).toBeNull();
  expect(surface.className).toBe("profile-preview-combined");
  dialog.remove();
});

it("hangs the frame of a profile popover on the page, where nothing can clip it", async () => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width"),
  }));
  const popover = document.createElement("div");
  popover.className = "user-profile-popover";
  document.body.append(popover);
  popover.append(card);
  const stage = mountCosmetics(card, { frame: "sakura" });
  await vi.waitFor(() =>
    expect(
      document.body.querySelector(":scope > canvas[data-layer=frame]"),
    ).not.toBeNull(),
  );
  stage.destroy();
  expect(document.body.querySelector(":scope > canvas")).toBeNull();
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
