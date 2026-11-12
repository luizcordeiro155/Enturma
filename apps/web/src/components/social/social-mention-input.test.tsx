import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { mentionAt, SocialMentionInput } from "./social-mention-input";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("../user-identity", () => ({ Avatar: () => <span /> }));
const people = [
  { id: "luiz", name: "Luiz Cordeiro", username: "luiz" },
  { id: "luis", name: "Luis", username: "luis" },
];
function Input() {
  const [text, setText] = useState("");
  return (
    <SocialMentionInput
      aria-label="Legenda"
      value={text}
      onValueChange={setText}
      maxLength={100}
    />
  );
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(api).mockReset().mockResolvedValue(people);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function type(value: string) {
  const input = screen.getByRole("textbox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value, selectionStart: value.length } });
  await act(() => vi.advanceTimersByTimeAsync(310));
  return input;
}
it("replaces only the active mention and leaves email addresses and URLs alone", () => {
  expect(mentionAt("Oi @lu depois", 6)).toEqual({
    query: "lu",
    start: 3,
    end: 6,
  });
  expect(mentionAt("Oi @luiz depois", 6)).toEqual({
    query: "lu",
    start: 3,
    end: 8,
  });
  expect(mentionAt("mail@lu", 7)).toBeNull();
  expect(mentionAt("https://site/@lu", 16)).toBeNull();
  expect(mentionAt("Olá @joão", 9)?.query).toBe("joão");
});
it("suggests on bare @, accepts a keyboard choice and keeps the rest of the caption", async () => {
  render(<Input />);
  const input = await type("Oi @ depois");
  fireEvent.select(input, { target: { selectionStart: 4, selectionEnd: 4 } });
  await act(() => vi.advanceTimersByTimeAsync(310));
  expect(api).toHaveBeenLastCalledWith(
    "/social/people/mentions?q=",
    expect.anything(),
  );
  expect(screen.getAllByRole("option")).toHaveLength(2);
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  await act(() => vi.advanceTimersByTimeAsync(20));
  expect(input).toHaveValue("Oi @luis  depois");
  expect(screen.queryByRole("listbox")).toBeNull();
});
it("accepts a pointer choice without submitting and Escape only dismisses suggestions", async () => {
  render(<Input />);
  const input = await type("@lu");
  fireEvent.click(screen.getByRole("option", { name: /Luiz Cordeiro/ }));
  await act(() => vi.advanceTimersByTimeAsync(20));
  expect(input).toHaveValue("@luiz ");
  await type("@lui");
  fireEvent.keyDown(input, { key: "Escape" });
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(input).toHaveValue("@lui");
});
it("ignores stale responses and shows a recoverable search failure", async () => {
  let finish!: (results: typeof people) => void;
  vi.mocked(api).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<Input />);
  await type("@lu");
  vi.mocked(api).mockRejectedValueOnce(new Error("offline"));
  await type("@ana");
  await act(async () => finish(people));
  expect(screen.queryByRole("option")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Não foi possível buscar",
  );
  await type("@anab");
  expect(screen.getAllByRole("option")).toHaveLength(2);
});
it("does not search or accept Enter while composing text", async () => {
  render(<Input />);
  const input = screen.getByRole("textbox");
  fireEvent.compositionStart(input);
  await type("@lu");
  expect(api).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  expect(input).toHaveValue("@lu");
  fireEvent.compositionEnd(input);
  await act(() => vi.advanceTimersByTimeAsync(310));
  expect(screen.getAllByRole("option")).toHaveLength(2);
});
