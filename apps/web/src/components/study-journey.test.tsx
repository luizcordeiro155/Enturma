import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StudyJourney } from "./study-journey";

const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ post, api: vi.fn() }));
vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));
vi.mock("@/lib/live-updates", () => ({ useLiveRefresh: () => {} }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
afterEach(cleanup);

const journey = (completed: number) => ({
  steps: [0, 1, 2].map((i) => ({ key: `s${i}`, completed: i < completed, xp: 10 })),
  completed,
  level: 12,
  totalXp: 2887,
  tutorialSeen: true,
});

it("com 3 de 3 concluídos mostra só a linha concluída, o Guia e a apresentação", async () => {
  post.mockResolvedValue(journey(3));
  render(<StudyJourney enrolled />);
  expect(await screen.findByText(/Jornada concluída/)).toBeVisible();
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.getByRole("button", { name: /Guia do Enturma/ })).toBeVisible();
  expect(screen.getByRole("button", { name: "Ver apresentação novamente" })).toBeVisible();
});

it("com 2 de 3 mantém as etapas e a barra", async () => {
  post.mockResolvedValue(journey(2));
  render(<StudyJourney enrolled />);
  expect(await screen.findByRole("progressbar")).toBeVisible();
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});
