import { describe, it, expect } from "vitest";
import { robotFrames, bitValue } from "./learning-games";
describe("JavaScript learning engines", () => {
  it("traces a valid path and stops at the first collision", () => {
    expect(robotFrames("DDDRRR", 1).won).toBe(true);
    const collision = robotFrames("RRDDDD", 1);
    expect(collision.won).toBe(false);
    expect(collision.frames).toHaveLength(2);
    expect(collision.frames[1].collision).toBe(true);
  });
  it("does not execute unknown instructions", () => {
    expect(robotFrames("alert(1)", 1).won).toBe(false);
  });
  it("uses place value for bits", () => {
    expect(bitValue([true, false, true])).toBe(5);
    expect(bitValue([true, false, true, false, true, false])).toBe(42);
  });
  it("has a reachable goal on every map", () => {
    for (let level = 1; level <= 4; level++) {
      const queue = [""];
      let solved = false;
      const seen = new Set<string>();
      while (queue.length && !solved) {
        const path = queue.shift()!;
        const r = robotFrames(path, level);
        const last = r.frames.at(-1)!;
        if (last.collision) continue;
        const key = `${last.x},${last.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (r.won) {
          solved = true;
          break;
        }
        for (const c of "RDLU") queue.push(path + c);
      }
      expect(solved).toBe(true);
    }
  });
});
