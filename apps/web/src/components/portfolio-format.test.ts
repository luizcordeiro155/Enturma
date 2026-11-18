import { describe, expect, it } from "vitest";
import { formatDays, formatStudyTime } from "./portfolio";

describe("portfolio formatting", () => {
  it("turns fractional minutes into hours and minutes", () => {
    expect(formatStudyTime(446.73333333333335)).toBe("7 h 27 min");
    expect(formatStudyTime(42.4)).toBe("42 min");
    expect(formatStudyTime(120)).toBe("2 h");
    expect(formatStudyTime(Number.NaN)).toBe("0 min");
  });

  it("uses singular for one day", () => {
    expect(formatDays(1)).toBe("1 dia");
    expect(formatDays(3)).toBe("3 dias");
  });
});
