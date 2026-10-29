import { afterEach, describe, expect, it } from "vitest";
import { readRideMode, saveRideMode } from "./ride-mode";

describe("ride mode persistence", () => {
  afterEach(() => localStorage.removeItem("enturma-ride-mode"));
  it("defaults to passenger without saved preference", () => {
    expect(readRideMode()).toBe("PASSENGER");
  });
  it("persists and broadcasts a driver selection", () => {
    const values: string[] = [];
    const onMode = (event: Event) => values.push((event as CustomEvent<string>).detail);
    window.addEventListener("enturma-ride-mode-change", onMode);
    saveRideMode("DRIVER");
    expect(readRideMode()).toBe("DRIVER");
    expect(values).toEqual(["DRIVER"]);
    window.removeEventListener("enturma-ride-mode-change", onMode);
  });
  it("restores passenger after switching back", () => {
    saveRideMode("DRIVER");
    saveRideMode("PASSENGER");
    expect(readRideMode()).toBe("PASSENGER");
  });
});
