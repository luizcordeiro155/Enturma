import { describe, expect, it } from "vitest";
import { decodeLiveMessage, encodeLiveMessage } from "./social-live";
describe("ephemeral live messages", () => {
  it("accepts only bounded chat or heart payloads, not arbitrary objects", () => {
    const valid = encodeLiveMessage("CHAT", "Oi turma");
    expect(decodeLiveMessage(valid)).toMatchObject({
      kind: "CHAT",
      body: "Oi turma",
    });
    expect(
      decodeLiveMessage(
        new TextEncoder().encode('{"kind":"ADMIN","body":"oops"}'),
      ),
    ).toBeNull();
    expect(decodeLiveMessage(new Uint8Array(4097))).toBeNull();
    expect(() => encodeLiveMessage("CHAT", "a".repeat(501))).toThrow();
  });
  it("never accepts identity from the message body", () => {
    const encoded = encodeLiveMessage("HEART", "");
    const parsed = JSON.parse(new TextDecoder().decode(encoded));
    parsed.authorId = "spoofed";
    expect(
      decodeLiveMessage(new TextEncoder().encode(JSON.stringify(parsed))),
    ).not.toHaveProperty("authorId");
  });
});
