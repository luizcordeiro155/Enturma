import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { LevelBadge, LevelMeter } from "./level-meter";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const stats = {
  totalXp: 3701,
  level: 15,
  xpIntoLevel: 201,
  xpForNextLevel: 250,
  xpToday: 60,
};

it("shows the level, how far it is and what is left for the next one", () => {
  render(<LevelMeter stats={stats} />);
  expect(screen.getByText("Nível 15")).toBeTruthy();
  const bar = screen.getByRole("progressbar", {
    name: "Progresso do nível 15",
  });
  expect(bar.getAttribute("aria-valuenow")).toBe("201");
  expect(bar.getAttribute("aria-valuemax")).toBe("250");
  expect(bar.getAttribute("aria-valuetext")).toBe("201 de 250 XP");
  expect(screen.getByText("Faltam 49 XP para o nível 16")).toBeTruthy();
  expect(screen.getByText("+60 XP hoje")).toBeTruthy();
  // today's stretch is drawn from where the day began to where it stands
  const meter = bar.closest(".level-meter") as HTMLElement;
  expect(meter.style.getPropertyValue("--level-from")).toBe("56.4%");
  expect(meter.style.getPropertyValue("--level-to")).toBe("80.4%");
});

it("has nothing to say about today on a day without XP", () => {
  render(<LevelMeter stats={{ ...stats, xpToday: 0 }} />);
  expect(screen.queryByText(/hoje/)).toBeNull();
  const meter = screen
    .getByRole("progressbar")
    .closest(".level-meter") as HTMLElement;
  // the bar still fills in when the profile opens
  expect(meter.style.getPropertyValue("--level-from")).toBe("0%");
  expect(meter.dataset.today).toBeUndefined();
});

it("marks the day the level was reached", () => {
  render(
    <LevelMeter
      stats={{
        totalXp: 3780,
        level: 16,
        xpIntoLevel: 30,
        xpForNextLevel: 250,
        xpToday: 120,
      }}
    />,
  );
  expect(screen.getByText("Subiu de nível hoje")).toBeTruthy();
  expect(
    screen.getByText(
      "Falta 220 XP para o nível 17".replace("Falta ", "Faltam "),
    ),
  ).toBeTruthy();
});

it("plays the gain again every time the XP goes up while the profile is open", () => {
  const { rerender } = render(<LevelMeter stats={stats} />);
  rerender(
    <LevelMeter
      stats={{ ...stats, totalXp: 3741, xpIntoLevel: 241, xpToday: 100 }}
    />,
  );
  // the new stretch starts where the bar was, not at the start of the day
  const meter = screen
    .getByRole("progressbar")
    .closest(".level-meter") as HTMLElement;
  expect(meter.style.getPropertyValue("--level-from")).toBe("80.4%");
  expect(meter.style.getPropertyValue("--level-to")).toBe("96.4%");
  expect(screen.getByRole("status").textContent).toBe("+40 XP");
  expect(screen.getByText("+100 XP hoje")).toBeTruthy();
  expect(screen.getByText("Faltam 9 XP para o nível 16")).toBeTruthy();
});

it("keeps the streak beside the level when the profile shows it", () => {
  render(<LevelMeter stats={stats} streak="3 dias de sequência" />);
  expect(screen.getByText("3 dias de sequência")).toBeTruthy();
});

it("fits the level in a small badge for the profile card", () => {
  render(<LevelBadge stats={stats} />);
  const badge = screen.getByLabelText("Nível 15, 201 de 250 XP");
  expect(badge.textContent).toBe("Nv15");
});

it("waits to be on screen before the XP starts to rise, so the rise is seen", async () => {
  let seen: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof seen) {
        seen = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  render(<LevelMeter stats={stats} />);
  const meter = screen
    .getByRole("progressbar")
    .closest(".level-meter") as HTMLElement;
  expect(meter.dataset.live).toBeUndefined();
  act(() => seen!([{ isIntersecting: false }]));
  expect(meter.dataset.live).toBeUndefined();
  act(() => seen!([{ isIntersecting: true }]));
  await waitFor(() => expect(meter.dataset.live).toBe("true"));
  // once is enough: it does not replay on every scroll
  expect(disconnect).toHaveBeenCalled();
});

it("holds the rise while the app's opening is still covering the page", async () => {
  const opening = document.createElement("div");
  opening.className = "enturma-launch-overlay";
  document.body.append(opening);
  render(<LevelMeter stats={stats} />);
  const meter = screen
    .getByRole("progressbar")
    .closest(".level-meter") as HTMLElement;
  await new Promise((done) => setTimeout(done, 60));
  expect(meter.dataset.live).toBeUndefined();
  opening.remove();
  await waitFor(() => expect(meter.dataset.live).toBe("true"));
});
