import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import {
  EnturmaIntroExperience,
  INTRO_VIDEOS,
  introClock,
} from "./enturma-intro-experience";
import { INTRO_STORAGE_KEY } from "./intro-model";

function stubScreen(width: number) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width: 760px") ? width <= 760 : false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("EnturmaIntroExperience", () => {
  it("plays the 9:16 cut on phones", async () => {
    stubScreen(390);
    await act(async () => render(<EnturmaIntroExperience />));
    const region = screen.getByRole("region", { name: "Apresentação do Enturma" });
    expect(region.getAttribute("data-layout")).toBe("portrait");
    const video = region.querySelector("video")!;
    expect(video.getAttribute("src")).toBe(INTRO_VIDEOS.portrait.src);
    expect(video.getAttribute("poster")).toBe(INTRO_VIDEOS.portrait.poster);
  });

  it("plays the 16:9 cut on desktop and the desktop app", async () => {
    stubScreen(1440);
    await act(async () => render(<EnturmaIntroExperience />));
    const region = screen.getByRole("region", { name: "Apresentação do Enturma" });
    expect(region.getAttribute("data-layout")).toBe("landscape");
    expect(region.querySelector("video")!.getAttribute("src")).toBe(
      INTRO_VIDEOS.landscape.src,
    );
  });

  it("shows the replay tile once seen and reopens the video on click", async () => {
    stubScreen(1440);
    localStorage.setItem(INTRO_STORAGE_KEY, "seen");
    await act(async () => render(<EnturmaIntroExperience />));
    expect(screen.getByText("Conheça o Enturma")).toBeTruthy();
    expect(document.querySelector("video")).toBeNull();
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Assistir apresentação" })),
    );
    expect(document.querySelector("video")).not.toBeNull();
  });

  it("formats the timeline clock", () => {
    expect(introClock(0)).toBe("0:00");
    expect(introClock(65.4)).toBe("1:05");
    expect(introClock(90)).toBe("1:30");
  });
});
