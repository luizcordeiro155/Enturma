"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CornerDownLeft, Delete } from "lucide-react";

export type Played = { word: string; marks: string };
export type Draft = { letters: string[]; cursor: number };
type Mark = "C" | "P" | "A";

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const RANK: Record<string, number> = { A: 1, P: 2, C: 3 };
const MARK_NAME: Record<string, string> = {
  C: "na posição certa",
  P: "em outra posição",
  A: "fora da palavra",
};

/** Writes in the selected cell, then selects the next gap (none when full). */
export function placeLetter(draft: Draft, letter: string): Draft {
  const { letters, cursor } = draft;
  if (cursor < 0 || cursor >= letters.length) return draft;
  const next = letters.slice();
  next[cursor] = letter;
  let to = next.findIndex((value, i) => i > cursor && !value);
  if (to < 0) to = next.findIndex((value) => !value);
  return { letters: next, cursor: to < 0 ? next.length : to };
}

/** Clears the selected letter, or the one before it when the cell is empty. */
export function eraseLetter(draft: Draft): Draft {
  const { letters, cursor } = draft;
  const at = cursor < letters.length && letters[cursor] ? cursor : cursor - 1;
  if (at < 0) return draft;
  const next = letters.slice();
  next[at] = "";
  return { letters: next, cursor: at };
}

/** Best clue seen so far for each letter: certa > outra posição > fora. */
export function keyMarks(history: Played[]): Record<string, Mark> {
  const marks: Record<string, Mark> = {};
  for (const { word, marks: row } of history)
    for (let i = 0; i < word.length; i++)
      if ((RANK[row[i]] ?? 0) > (RANK[marks[word[i]]] ?? 0))
        marks[word[i]] = row[i] as Mark;
  return marks;
}

const letterOf = (key: string) => {
  if (key.length !== 1) return "";
  const letter = key.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : "";
};
const blank = (length: number, row: number) => ({
  row,
  letters: Array.from({ length }, () => ""),
  cursor: 0,
});
const still = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.dataset.reducedMotion === "true";

export function WordGame({
  length,
  history,
  attempts = 6,
  disabled = false,
  busy = false,
  onSubmit,
}: {
  length: number;
  history: Played[];
  attempts?: number;
  disabled?: boolean;
  busy?: boolean;
  onSubmit: (word: string) => void;
}) {
  const [draft, setDraft] = useState(() => blank(length, history.length));
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const activeRow = useRef<HTMLDivElement>(null);
  // A saved attempt opens the next row: start it clean.
  if (draft.row !== history.length || draft.letters.length !== length)
    setDraft(blank(length, history.length));
  const open = !disabled && history.length < attempts;
  const locked = !open || busy;
  const marks = keyMarks(history);

  const edit = (change: (draft: Draft) => Draft) => {
    if (locked) return;
    setNotice("");
    setDraft((current) => ({ ...current, ...change(current) }));
  };
  const move = (to: number) =>
    edit((current) => ({
      ...current,
      cursor: Math.max(0, Math.min(length - 1, to)),
    }));
  const send = () => {
    if (locked) return;
    const missing = draft.letters.filter((letter) => !letter).length;
    if (!missing) return onSubmit(draft.letters.join(""));
    setNotice(missing === 1 ? "Falta 1 letra." : `Faltam ${missing} letras.`);
    if (!still())
      activeRow.current?.animate?.(
        [-6, 6, -4, 4, 0].map((x) => ({ transform: `translateX(${x}px)` })),
        { duration: 260, easing: "ease-out" },
      );
  };
  const press = useRef({ edit, move, send, cursor: draft.cursor });
  useEffect(() => {
    press.current = { edit, move, send, cursor: draft.cursor };
  });

  useEffect(() => {
    if (locked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const inGame = !target || !!root.current?.contains(target);
      if (
        target?.closest(
          "input, textarea, select, [contenteditable='true'], dialog, [role='dialog']",
        ) ||
        (!inGame && document.querySelector("dialog[open], [aria-modal='true']"))
      )
        return;
      const { edit, move, send, cursor } = press.current;
      const letter = letterOf(event.key);
      if (letter) edit((current) => placeLetter(current, letter));
      else if (event.key === "Backspace") edit(eraseLetter);
      else if (event.key === "Delete")
        edit((current) => ({
          ...current,
          letters: current.letters.map((value, i) =>
            i === current.cursor ? "" : value,
          ),
        }));
      else if (event.key === "ArrowLeft") move(cursor - 1);
      else if (event.key === "ArrowRight") move(cursor + 1);
      else if (event.key === "Home") move(0);
      else if (event.key === "End") move(length - 1);
      else if (event.key === "Enter" && (inGame || target === document.body))
        send();
      else return;
      // The game used the key: a focused game button must not fire as well.
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, length]);

  // Pointer taps keep focus where it was, so nothing scrolls or steals the caret.
  const keepFocus = (event: React.MouseEvent) => event.preventDefault();
  return (
    <div
      className="word-game"
      ref={root}
      style={{ "--word-cols": length } as CSSProperties}
    >
      <div className="mission-word-board">
        {Array.from({ length: attempts }, (_, r) => {
          const played = history[r];
          if (played)
            return (
              <div
                className="mission-word-row"
                key={r}
                role="group"
                aria-label={`Tentativa ${r + 1}: ${played.word}. ${[
                  ...played.word,
                ]
                  .map((letter, i) => `${letter} ${MARK_NAME[played.marks[i]]}`)
                  .join(", ")}`}
              >
                {[...played.word].map((letter, c) => (
                  <span
                    key={c}
                    className={played.marks[c]}
                    style={{ animationDelay: `${c * 50}ms` }}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            );
          if (r !== history.length || !open)
            return (
              <div className="mission-word-row" key={r} aria-hidden="true">
                {Array.from({ length }, (_, c) => (
                  <span key={c} />
                ))}
              </div>
            );
          return (
            <div className="mission-word-row is-active" key={r} ref={activeRow}>
              {draft.letters.map((letter, c) => (
                <button
                  type="button"
                  key={c}
                  className="word-cell"
                  aria-label={`Letra ${c + 1} de ${length}: ${letter || "vazia"}`}
                  aria-pressed={draft.cursor === c}
                  tabIndex={
                    draft.cursor === c || (draft.cursor >= length && !c)
                      ? 0
                      : -1
                  }
                  disabled={busy}
                  onMouseDown={keepFocus}
                  onClick={() => move(c)}
                >
                  {letter}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <p className="word-notice" role="status">
        {notice}
      </p>
      <div className="word-keyboard" role="group" aria-label="Teclado do jogo">
        {KEY_ROWS.map((row, r) => (
          <div key={row} className="word-keys">
            {[...row].map((letter) => (
              <button
                type="button"
                key={letter}
                className="word-key"
                data-mark={marks[letter]}
                aria-label={letter}
                title={
                  marks[letter]
                    ? `${letter} ${MARK_NAME[marks[letter]]}`
                    : undefined
                }
                disabled={locked}
                onMouseDown={keepFocus}
                onClick={() => edit((current) => placeLetter(current, letter))}
              >
                {letter}
              </button>
            ))}
            {r === 1 ? (
              <button
                type="button"
                className="word-key is-wide"
                aria-label="Apagar letra"
                disabled={locked}
                onMouseDown={keepFocus}
                onClick={() => edit(eraseLetter)}
              >
                <Delete size={20} aria-hidden="true" />
              </button>
            ) : r === 2 ? (
              <button
                type="button"
                className="word-key is-enter"
                aria-label="Testar palavra"
                disabled={locked}
                onMouseDown={keepFocus}
                onClick={send}
              >
                <CornerDownLeft size={16} aria-hidden="true" />
                {busy ? "…" : "Enter"}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <ul className="word-legend" aria-label="Como ler as cores">
        <li>
          <i className="C" aria-hidden="true" />
          Posição certa
        </li>
        <li>
          <i className="P" aria-hidden="true" />
          Outra posição
        </li>
        <li>
          <i className="A" aria-hidden="true" />
          Fora da palavra
        </li>
      </ul>
    </div>
  );
}
