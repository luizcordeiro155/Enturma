import { describe, expect, it } from "vitest";
import { describeLink, normalizeLink, profileLinks } from "./profile-links";

describe("what a profile link is", () => {
  it.each([
    ["https://github.com/luizcordeiro155", "GitHub", "luizcordeiro155"],
    ["https://www.instagram.com/enturma.app/", "Instagram", "@enturma.app"],
    ["https://www.linkedin.com/in/ana-souza/", "LinkedIn", "ana-souza"],
    ["https://facebook.com/enturma", "Facebook", "enturma"],
    ["https://x.com/enturma", "X", "@enturma"],
    ["https://www.youtube.com/@enturma", "YouTube", "@enturma"],
    ["https://t.me/enturma", "Telegram", "@enturma"],
    ["https://www.twitch.tv/enturma", "Twitch", "enturma"],
    ["https://discord.gg/abc123", "Discord", ""],
    ["mailto:ana@example.com", "E-mail", "ana@example.com"],
    ["https://www.kayn.online/pt-br", "Site", "kayn.online"],
  ])("%s is %s", (href, name, detail) => {
    expect(describeLink(href)).toMatchObject({ name, detail });
  });

  it("names WhatsApp without showing the phone number", () => {
    expect(describeLink("https://wa.me/5531999990000")).toMatchObject({
      name: "WhatsApp",
      detail: "",
    });
    expect(
      describeLink("https://api.whatsapp.com/send?phone=5531999990000"),
    ).toMatchObject({ name: "WhatsApp", detail: "" });
  });

  it("does not trust a lookalike address", () => {
    expect(describeLink("https://github.com.evil.example/ana")).toMatchObject({
      name: "Site",
      detail: "github.com.evil.example",
    });
  });
});

describe("what the user types", () => {
  it("completes an address typed without https", () => {
    expect(normalizeLink(" github.com/ana ")).toBe("https://github.com/ana");
  });

  it("turns an e-mail address into an e-mail link", () => {
    expect(normalizeLink("ana@example.com")).toBe("mailto:ana@example.com");
  });

  it("keeps full links as they are", () => {
    expect(normalizeLink("https://wa.me/5531999990000")).toBe(
      "https://wa.me/5531999990000",
    );
    expect(normalizeLink("mailto:ana@example.com")).toBe(
      "mailto:ana@example.com",
    );
  });

  it("refuses what is not a web or e-mail link", () => {
    expect(normalizeLink("javascript:alert(1)")).toBe("");
    expect(normalizeLink("https://user:pass@example.com")).toBe("");
    expect(normalizeLink("meu site")).toBe("");
    expect(normalizeLink("")).toBe("");
  });
});

describe("the links of a profile", () => {
  it("joins the old single site with the new list, once each", () => {
    expect(
      profileLinks({
        website: "https://kayn.online",
        links: [
          "https://github.com/ana",
          "https://kayn.online",
          "javascript:alert(1)",
        ],
      }),
    ).toEqual(["https://kayn.online", "https://github.com/ana"]);
  });

  it("shows at most six", () => {
    const links = Array.from({ length: 9 }, (_, i) => `https://s${i}.example`);
    expect(profileLinks({ links })).toHaveLength(6);
  });

  it("is empty for a profile without links", () => {
    expect(profileLinks(undefined)).toEqual([]);
  });
});
