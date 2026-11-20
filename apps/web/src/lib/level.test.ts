import { expect, it } from "vitest";
import { levelProgress } from "./level";

it("says how far into the level the student is and what is left", () => {
  expect(
    levelProgress({
      totalXp: 3701,
      level: 15,
      xpIntoLevel: 201,
      xpForNextLevel: 250,
      xpToday: 60,
    }),
  ).toEqual({
    level: 15,
    into: 201,
    size: 250,
    left: 49,
    percent: 80.4,
    today: 60,
    // today's 60 XP started at 141 of 250
    from: 56.4,
    leveledUp: false,
  });
});

it("starts today's stretch at zero when the level itself came today", () => {
  const progress = levelProgress({
    totalXp: 3780,
    level: 16,
    xpIntoLevel: 30,
    xpForNextLevel: 250,
    xpToday: 120,
  });
  expect(progress.from).toBe(0);
  expect(progress.leveledUp).toBe(true);
  expect(progress.left).toBe(220);
});

it("has no stretch to show on a day without XP", () => {
  const progress = levelProgress({
    totalXp: 500,
    level: 3,
    xpIntoLevel: 0,
    xpForNextLevel: 250,
    xpToday: 0,
  });
  expect(progress).toMatchObject({
    into: 0,
    left: 250,
    percent: 0,
    from: 0,
    today: 0,
    leveledUp: false,
  });
});

it("works out the level from the total when the server sends only that", () => {
  expect(levelProgress({ totalXp: 3701, level: 15 })).toMatchObject({
    level: 15,
    into: 201,
    size: 250,
    left: 49,
    today: 0,
  });
});
