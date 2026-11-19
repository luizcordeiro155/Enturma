import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { RideMobilityMap } from "./ride-mobility-map";

const campus = { lat: -19.9245, lng: -43.9352 };

beforeEach(() => {
  document.documentElement.dataset.reducedMotion = "true";
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.reducedMotion;
  vi.unstubAllGlobals();
});

const markerAt = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".marker-campus")!.style.transform;

it("centres on the middle of the map when nothing covers it", () => {
  const { container } = render(
    <RideMobilityMap
      center={campus}
      markers={[{ id: "campus", kind: "campus", point: campus }]}
    />,
  );
  expect(markerAt(container)).toContain("translate3d(450px,310px,0)");
});

it("centres above the request sheet so the point is not hidden behind it", () => {
  const { container } = render(
    <RideMobilityMap
      center={campus}
      inset={{ top: 60, right: 0, bottom: 300, left: 0 }}
      selecting
      markers={[{ id: "campus", kind: "campus", point: campus }]}
    />,
  );
  // 620 px tall map: the visible band runs from 60 to 320, so its middle is 190.
  expect(markerAt(container)).toContain("translate3d(450px,190px,0)");
  const pin = container.querySelector<HTMLElement>(".ride-center-pin")!;
  expect(pin.style.left).toBe("450px");
  expect(pin.style.top).toBe("190px");
});

it("centres beside the side panel on a computer", () => {
  const { container } = render(
    <RideMobilityMap
      center={campus}
      inset={{ top: 0, right: 400, bottom: 0, left: 0 }}
      markers={[{ id: "campus", kind: "campus", point: campus }]}
    />,
  );
  expect(markerAt(container)).toContain("translate3d(250px,310px,0)");
});
