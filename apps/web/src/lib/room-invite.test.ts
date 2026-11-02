import { describe, expect, it } from "vitest";
import { roomInvitationCodes } from "./room-invite";

const origin = "https://enturma.test";
describe("message invitation previews", () => {
  it("recognizes actual same-origin links, deduplicating repeated codes", () => {
    expect(
      roomInvitationCodes(
        "Vem estudar: https://enturma.test/join/mdut2sgt.\nhttps://enturma.test/join/MDUT2SGT?from=chat\n /join/R5WKWU32",
        origin,
      ),
    ).toEqual(["MDUT2SGT", "R5WKWU32"]);
  });
  it("does not preview foreign origins, credentials, codes alone, or code samples", () => {
    expect(
      roomInvitationCodes(
        [
          "MDUT2SGT",
          "https://evil.test/join/MDUT2SGT",
          "https://enturma.test.evil.test/join/MDUT2SGT",
          "https://enturma.test@evil.test/join/MDUT2SGT",
          "https://user:pass@enturma.test/join/MDUT2SGT",
          "http://enturma.test/join/MDUT2SGT",
          "`https://enturma.test/join/MDUT2SGT`",
          "```text\nhttps://enturma.test/join/MDUT2SGT\n```",
        ].join("\n"),
        origin,
      ),
    ).toEqual([]);
  });
  it("caps expensive metadata previews in a single message", () => {
    expect(
      roomInvitationCodes(
        ["AAAAAAAA", "BBBBBBBB", "CCCCCCCC", "DDDDDDDD"]
          .map((code) => `${origin}/join/${code}`)
          .join(" "),
        origin,
      ),
    ).toEqual(["AAAAAAAA", "BBBBBBBB", "CCCCCCCC"]);
  });
});
