import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WordGame, eraseLetter, keyMarks, placeLetter } from "./word-game";

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const cell = (n: number, of = 5) =>
  screen.getByRole("button", { name: new RegExp(`^Letra ${n} de ${of}`) });
const key = (name: string) => screen.getByRole("button", { name });
const typed = () =>
  Array.from({ length: 5 }, (_, i) => cell(i + 1).textContent || "·").join("");

describe("the row being typed", () => {
  it("puts the letter in the selected cell and goes to the next empty one", () => {
    expect(placeLetter({ letters: ["", "B", "", ""], cursor: 0 }, "A")).toEqual(
      {
        letters: ["A", "B", "", ""],
        cursor: 2,
      },
    );
  });

  it("goes back to an earlier gap when nothing is empty to the right", () => {
    expect(
      placeLetter({ letters: ["", "B", "C", ""], cursor: 3 }, "D"),
    ).toEqual({
      letters: ["", "B", "C", "D"],
      cursor: 0,
    });
  });

  it("leaves no cell selected once the row is full", () => {
    const full = placeLetter({ letters: ["A", "B", "C", ""], cursor: 3 }, "D");
    expect(full).toEqual({ letters: ["A", "B", "C", "D"], cursor: 4 });
    expect(placeLetter(full, "Z")).toEqual(full);
  });

  it("erases the selected letter and stays on it", () => {
    expect(eraseLetter({ letters: ["A", "B", "C", ""], cursor: 1 })).toEqual({
      letters: ["A", "", "C", ""],
      cursor: 1,
    });
  });

  it("erases the previous letter when the selected cell is empty", () => {
    expect(eraseLetter({ letters: ["A", "B", "", ""], cursor: 2 })).toEqual({
      letters: ["A", "", "", ""],
      cursor: 1,
    });
    expect(eraseLetter({ letters: ["A", "B", "C", "D"], cursor: 4 })).toEqual({
      letters: ["A", "B", "C", ""],
      cursor: 3,
    });
  });
});

describe("what the attempts revealed", () => {
  it("keeps the best clue of each letter", () => {
    expect(
      keyMarks([
        { word: "ARRAY", marks: "PAAAC" },
        { word: "QUEUA", marks: "AAAAC" },
      ]),
    ).toEqual({ A: "C", R: "A", Y: "C", Q: "A", U: "A", E: "A" });
  });
});

describe("Termo Dev board", () => {
  const setup = (props: Partial<Parameters<typeof WordGame>[0]> = {}) => {
    const onSubmit = vi.fn();
    render(<WordGame length={5} history={[]} onSubmit={onSubmit} {...props} />);
    return onSubmit;
  };

  it("types exactly where the player tapped", () => {
    setup();
    fireEvent.click(cell(3));
    fireEvent.click(key("R"));
    expect(typed()).toBe("··R··");
    expect(cell(4)).toHaveAttribute("aria-pressed", "true");
  });

  it("has no text field, so the phone keyboard never opens", () => {
    setup();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("only sends the attempt when every cell has a letter", () => {
    const onSubmit = setup();
    for (const letter of "ARRA") fireEvent.click(key(letter));
    fireEvent.click(key("Testar palavra"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Falta 1 letra");
    fireEvent.click(key("Y"));
    fireEvent.click(key("Testar palavra"));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("ARRAY");
  });

  it("follows the computer keyboard", () => {
    const onSubmit = setup();
    for (const k of ["c", "á", "x", "Backspace", "c", "h", "e"])
      fireEvent.keyDown(window, { key: k });
    expect(typed()).toBe("CACHE");
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "Delete" });
    expect(typed()).toBe("CAC·E");
    fireEvent.keyDown(window, { key: "h" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("CACHE");
  });

  it("leaves shortcuts and other fields alone", () => {
    setup();
    const other = document.body.appendChild(document.createElement("input"));
    fireEvent.keyDown(other, { key: "a" });
    fireEvent.keyDown(window, { key: "r", ctrlKey: true });
    expect(typed()).toBe("·····");
    other.remove();
  });

  it("shows earlier attempts and paints the keyboard with them", () => {
    setup({ history: [{ word: "ARRAY", marks: "PAAAC" }] });
    expect(
      screen.getByRole("group", { name: /^Tentativa 1: ARRAY/ }),
    ).toHaveTextContent("ARRAY");
    expect(key("Y")).toHaveAttribute("data-mark", "C");
    expect(key("A")).toHaveAttribute("data-mark", "P");
    expect(key("R")).toHaveAttribute("data-mark", "A");
    expect(key("Q")).not.toHaveAttribute("data-mark");
  });

  it("starts a clean row after each attempt", () => {
    const view = render(
      <WordGame length={5} history={[]} onSubmit={vi.fn()} />,
    );
    for (const letter of "ARRAY") fireEvent.click(key(letter));
    view.rerender(
      <WordGame
        length={5}
        history={[{ word: "ARRAY", marks: "PAAAC" }]}
        onSubmit={vi.fn()}
      />,
    );
    expect(typed()).toBe("·····");
    expect(cell(1)).toHaveAttribute("aria-pressed", "true");
  });

  it("stops taking letters when the mission is over", () => {
    const onSubmit = setup({ disabled: true });
    expect(key("A")).toBeDisabled();
    fireEvent.keyDown(window, { key: "a" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByRole("button", { name: /^Letra 1 de 5/ })).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
