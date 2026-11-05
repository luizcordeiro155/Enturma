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


describe("routing de links do Enturma", () => {
  const currentOrigin = "https://enturma-flax.vercel.app";
  it("trata rotas do próprio Enturma como navegação interna", async () => {
    const { internalEnturmaPath } = await import("./forum-links");
    expect(internalEnturmaPath("https://enturma-flax.vercel.app/forum/123?f=top#resposta", currentOrigin))
      .toBe("/forum/123?f=top#resposta");
    expect(internalEnturmaPath("/rooms/123", currentOrigin)).toBe("/rooms/123");
    expect(internalEnturmaPath("https://enturma-flax.vercel.app/join/ABCD2345", currentOrigin))
      .toBe("/join/ABCD2345");
  });
  it("reconhece link canônico em instalações de desenvolvimento sem sair do app", async () => {
    const { internalEnturmaPath } = await import("./forum-links");
    expect(internalEnturmaPath("https://enturma-flax.vercel.app/forum", "http://localhost:3000"))
      .toBe("/forum");
  });
  it("não confunde sites falsos ou externos com links do Enturma", async () => {
    const { internalEnturmaPath } = await import("./forum-links");
    for (const value of [
      "https://example.org/forum",
      "https://enturma-flax.vercel.app.evil.example/join/ABCD2345",
      "http://enturma-flax.vercel.app/forum",
      "https://user:pass@enturma-flax.vercel.app/forum",
      "javascript:alert(1)",
    ]) {
      expect(internalEnturmaPath(value, currentOrigin)).toBeNull();
    }
  });
});
