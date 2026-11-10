import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { defaultRecipe } from "@/lib/social";
import { VideoEditor } from "./video-editor";

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function Editor() {
  const [recipe, setRecipe] = useState(defaultRecipe(30));
  return (
    <>
      <VideoEditor
        url="blob:local-test"
        sourceDuration={120}
        value={recipe}
        onChange={setRecipe}
      />
      <output data-testid="recipe">{JSON.stringify(recipe)}</output>
    </>
  );
}
const recipe = () => JSON.parse(screen.getByTestId("recipe").textContent!);
it("splits, reorders, removes, undoes and redoes the actual export recipe", () => {
  render(<Editor />);
  fireEvent.change(screen.getByLabelText("Posição de reprodução"), {
    target: { value: "10" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Dividir aqui" }));
  expect(recipe().segments).toEqual([
    { start: 0, end: 10 },
    { start: 10, end: 30 },
  ]);
  fireEvent.click(
    screen.getByRole("button", { name: "Mover trecho para depois" }),
  );
  expect(recipe().segments[0]).toEqual({ start: 10, end: 30 });
  fireEvent.click(screen.getByRole("button", { name: "Excluir trecho" }));
  expect(recipe().segments).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Desfazer edição" }));
  expect(recipe().segments).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Refazer edição" }));
  expect(recipe().segments).toHaveLength(1);
});
it("exports framing, captions and audio choices and exposes invalid final duration", () => {
  render(<Editor />);
  fireEvent.click(screen.getByText("Enquadramento, áudio e capa"));
  fireEvent.change(screen.getByLabelText("Zoom"), { target: { value: "1.5" } });
  fireEvent.click(screen.getByRole("button", { name: "Girar 0°" }));
  fireEvent.click(screen.getByLabelText("Silenciar original"));
  fireEvent.click(screen.getByText("Textos e legendas"));
  fireEvent.change(screen.getByLabelText("Nova legenda"), {
    target: { value: "Conhecimento em companhia" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar texto" }));
  expect(recipe()).toMatchObject({
    zoom: 1.5,
    rotation: 90,
    mute: true,
    captions: [
      { text: "Conhecimento em companhia", start: 0, end: 30, y: 0.8 },
    ],
  });
  fireEvent.change(
    screen.getByLabelText("Fim (s)", {
      exact: true,
      selector:
        ".social-video-editor > .social-editor-tools > .social-edit-controls input",
    }),
    { target: { value: "100" } },
  );
  expect(screen.getByRole("alert")).toHaveTextContent("até 90 segundos");
});
