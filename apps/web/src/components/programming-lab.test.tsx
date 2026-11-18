import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { ProgrammingLab } from "./programming-lab";

const api = vi.hoisted(() => vi.fn());
const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api, post }));
vi.mock("./shell", () => ({
  Shell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const definitions = {
  words: { hint: "Repete instruções.", length: 4, language: "Inglês" },
  algorithm: { hint: "Chegue ao fim.", walls: [7], budget: 12 },
  binary: { hint: "Converta.", width: 4, expression: "decimal 2" },
  trace: { hint: "Leia o laço.", code: "console.log(1);" },
};
const daily = {
  date: "2026-11-18",
  difficulty: 3,
  missions: Object.entries(definitions).flatMap(([game, definition]) =>
    [1, 2, 3, 4, 5].map((slot) => ({
      game,
      slot,
      difficulty: 3,
      attempts: 0,
      completed: false,
      won: false,
      history: [],
      definition,
    })),
  ),
};

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  api.mockImplementation(async (path: string) =>
    path === "/learning/access" ? { eligible: true } : daily,
  );
  post.mockResolvedValue({
    won: false,
    completed: false,
    message: "Use as cores para ajustar.",
    history: [{ word: "LOOP", marks: "CCCC" }],
    frames: [],
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  api.mockReset();
  post.mockReset();
});

it("sends the word typed on the game keyboard as the attempt", async () => {
  render(<ProgrammingLab />);
  await screen.findByRole("heading", { name: "Termo Dev" });
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  for (const letter of "LOOP")
    fireEvent.click(screen.getByRole("button", { name: letter }));
  fireEvent.click(screen.getByRole("button", { name: "Testar palavra" }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith("/learning/missions", {
      date: "2026-11-18",
      game: "words",
      slot: 1,
      answer: "LOOP",
    }),
  );
  expect(
    await screen.findByRole("group", { name: /^Tentativa 1: LOOP/ }),
  ).toBeInTheDocument();
});

it("lets the player flip each bit by tapping it", async () => {
  render(<ProgrammingLab />);
  fireEvent.click(
    await screen.findByRole("button", { name: /^Laboratório Binário/ }),
  );
  const bit = screen.getByRole("button", { name: "Bit 2^1" });
  expect(bit).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(bit);
  expect(bit).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByLabelText("Resposta em binário")).toHaveValue("0010");
  fireEvent.click(screen.getByRole("button", { name: "Bit 2^1" }));
  expect(screen.getByLabelText("Resposta em binário")).toHaveValue("0000");
  fireEvent.click(screen.getByRole("button", { name: "Bit 2^3" }));
  fireEvent.click(screen.getByRole("button", { name: "Testar resposta" }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      "/learning/missions",
      expect.objectContaining({ game: "binary", answer: "1000" }),
    ),
  );
});
