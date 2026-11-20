import { describe, expect, it } from "vitest";
import { presenceLine } from "./last-seen";

// 19 Nov 2026, 22:05 in São Paulo
const now = new Date("2026-11-20T01:05:00Z");
const zone = "America/Sao_Paulo";
const line = (online: boolean | undefined, seen?: string | null) =>
  presenceLine({ online, lastSeenAt: seen }, now, zone);

describe("last seen", () => {
  it("says online while the friend has the app open", () => {
    expect(line(true, "2026-11-20T01:03:00Z")).toBe("online");
  });

  it("gives the time for today and yesterday, the way people say it", () => {
    expect(line(false, "2026-11-20T01:03:00Z")).toBe(
      "visto por último hoje às 22:03",
    );
    expect(line(false, "2026-11-19T03:10:00Z")).toBe(
      "visto por último hoje às 00:10",
    );
    expect(line(false, "2026-11-19T02:50:00Z")).toBe(
      "visto por último ontem às 23:50",
    );
  });

  it("gives the day for anything older, and the year once it is another year", () => {
    expect(line(false, "2026-11-12T18:30:00Z")).toBe(
      "visto por último em 12/11 às 15:30",
    );
    expect(line(false, "2025-12-31T18:30:00Z")).toBe(
      "visto por último em 31/12/2025",
    );
  });

  it("says nothing when the friend does not share it or it is not known", () => {
    expect(line(false, null)).toBe("");
    expect(line(undefined, undefined)).toBe("");
    expect(line(false, "not a date")).toBe("");
  });

  it("never reads a clock that runs ahead as the future", () => {
    expect(line(false, "2026-11-20T01:09:00Z")).toBe(
      "visto por último hoje às 22:05",
    );
  });
});
