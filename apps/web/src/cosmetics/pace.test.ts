import { expect, it } from "vitest";
import { createPacer } from "./pace";

it("draws every frame during the entrance and half as often at rest", () => {
  const pacer = createPacer();
  expect(pacer.gap(0.5)).toBe(0);
  expect(pacer.gap(30)).toBeCloseTo(1000 / 30, 1);
});

it("keeps full quality while frames are cheap", () => {
  const pacer = createPacer();
  for (let i = 0; i < 200; i++) pacer.took(3);
  expect(pacer.gap(0.5)).toBe(0);
  expect(pacer.ratio(2)).toBe(2);
});

it("draws fewer, lighter frames on a device that cannot keep up", () => {
  const pacer = createPacer();
  for (let i = 0; i < 40; i++) pacer.took(22);
  // The entrance no longer asks for every frame, and the canvas is not oversampled.
  expect(pacer.gap(0.5)).toBeGreaterThanOrEqual(1000 / 30 - 0.1);
  expect(pacer.ratio(2)).toBeLessThanOrEqual(1.5);
  for (let i = 0; i < 80; i++) pacer.took(22);
  expect(pacer.gap(30)).toBeGreaterThanOrEqual(50 - 0.1);
  expect(pacer.ratio(2)).toBe(1);
});

it("does not give up quality over one slow frame", () => {
  const pacer = createPacer();
  pacer.took(120);
  for (let i = 0; i < 60; i++) pacer.took(2);
  expect(pacer.gap(0.5)).toBe(0);
  expect(pacer.ratio(2)).toBe(2);
});
