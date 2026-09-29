import { describe, it, expect } from "vitest";
import { splitLinks } from "./forum-links";
describe("forum links", () => {
  it("preserves prose and trims sentence punctuation without losing balanced URL brackets", () => {
    const text =
      "Veja (https://example.com/wiki/Test_(code)). Depois www.example.org/a?q=1!";
    const parts = splitLinks(text);
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(parts.filter((p) => p.href).map((p) => p.href)).toEqual([
      "https://example.com/wiki/Test_(code)",
      "https://www.example.org/a?q=1",
    ]);
  });
  it("never links executable schemes, credentials or malformed URLs", () => {
    const parts = splitLinks(
      "javascript:alert(1) data:text/html,<script> https://user:password@example.org https://",
    );
    expect(parts.some((p) => p.href)).toBe(false);
  });
});
