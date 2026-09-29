import { expect, it } from "vitest";
import { mentionsUser } from "./mentions";

it("recognizes whole usernames with accents and ignores email addresses and prefixes", () => {
  expect(mentionsUser("Oi @Cléiton_junin, tudo bem?", "cle\u0301iton_junin")).toBe(true);
  expect(mentionsUser("Oi @bob e @ana!", "ana")).toBe(true);
  expect(mentionsUser("Oi @bobby", "bob")).toBe(false);
  expect(mentionsUser("email@bob.com", "bob")).toBe(false);
  expect(mentionsUser("@@bob", "bob")).toBe(false);
});
