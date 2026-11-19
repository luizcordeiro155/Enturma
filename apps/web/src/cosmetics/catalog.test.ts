import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  COSMETIC_GROUPS,
  COSMETIC_PACKS,
  chosenCosmetics,
  framePadding,
  loadPack,
  stageScale,
} from "./catalog";

it("only knows the items that exist in the catalog", () => {
  expect(
    chosenCosmetics({
      cosmeticFrame: "sakura",
      cosmeticAvatar: "",
      cosmeticEffect: "nao-existe",
    }),
  ).toEqual({ frame: "sakura" });
  expect(chosenCosmetics(undefined)).toEqual({});
});

it("draws smaller on a phone and never larger than the art was made for", () => {
  expect(stageScale(300)).toBe(0.5);
  expect(stageScale(390)).toBeCloseTo(0.513, 2);
  expect(stageScale(686)).toBe(0.9);
  expect(stageScale(1400)).toBe(0.9);
});

it("gives the frame the room its art needs, in whole pixels", () => {
  expect(framePadding({ top: 80, side: 64, bottom: 66 }, 0.5)).toEqual({
    top: 40,
    side: 32,
    bottom: 33,
  });
});

it("on a phone the frame shows above and below the card and keeps the full width for the profile", () => {
  expect(framePadding({ top: 80, side: 64, bottom: 66 }, 0.5, true)).toEqual({
    top: 40,
    side: 0,
    bottom: 33,
  });
});

it("suggests two profile colours with every pack", () => {
  for (const { id, colors } of COSMETIC_PACKS) {
    expect(colors, id).toHaveLength(2);
    for (const color of colors) expect(color, id).toMatch(/^#[0-9a-f]{6}$/);
  }
});

it("has the art for every pack it lists", async () => {
  for (const { id } of COSMETIC_PACKS) {
    const pack = (await loadPack(id))(
      { w: 340, h: 548, r: 18 },
      { x: 60, y: 112, r: 42 },
    );
    expect(pack.reach.side, id).toBeGreaterThan(0);
    expect(pack.mat, id).toHaveLength(2);
    expect(pack.name, id).toBeTruthy();
    for (const part of ["init", "drawFrame", "drawAvatar", "drawEffect"])
      expect(typeof pack[part as "init"], `${id}.${part}`).toBe("function");
  }
});

it("keeps every pack in one of the shelves the editor shows, with no repeats", () => {
  const ids = COSMETIC_PACKS.map((pack) => pack.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).toHaveLength(29);
  for (const pack of COSMETIC_PACKS)
    expect(COSMETIC_GROUPS, pack.id).toContain(pack.group);
  // Every shelf has something on it.
  for (const group of COSMETIC_GROUPS)
    expect(
      COSMETIC_PACKS.some((pack) => pack.group === group),
      group,
    ).toBe(true);
});

it("lists exactly the packs the server gives a level to", () => {
  const server = readFileSync(
    "../../services/api/src/main/java/br/com/enturma/users/SocialController.java",
    "utf8",
  );
  const levelled = [...server.matchAll(/levels\.put\("([a-z-]+)", \d+\)/g)]
    .map((match) => match[1])
    .sort();
  expect(levelled).toEqual(COSMETIC_PACKS.map((pack) => pack.id).sort());
});
