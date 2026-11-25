import { describe, expect, it } from "vitest";
import { PROJECT_KINDS } from "./portfolio-projects";
import { kindsFor, TRACKS, trackOf, type TrackId } from "./portfolio-tracks";

const ids: TrackId[] = [
  "TECH",
  "HEALTH",
  "LAW",
  "BUSINESS",
  "ENGINEERING",
  "DESIGN",
  "COMMUNICATION",
  "EDUCATION",
  "SCIENCE",
  "GENERAL",
];

describe("portfolio areas", () => {
  it("has every area the server can send", () => {
    expect(TRACKS.map((track) => track.id)).toEqual(ids);
  });

  it("keeps the portfolio as it always was when the server sends no area", () => {
    // an older API does not know about areas: nothing may change for those students
    expect(trackOf(undefined).id).toBe("TECH");
    expect(trackOf("SOMETHING_NEW").id).toBe("GENERAL");
    expect(trackOf("HEALTH").id).toBe("HEALTH");
  });

  it("offers GitHub only where code is the work", () => {
    expect(TRACKS.filter((track) => track.github).map((track) => track.id)).toEqual(["TECH"]);
  });

  it("keeps the technology wording students already know", () => {
    const tech = trackOf("TECH");
    expect(tech.fields.tools.label).toBe("Tecnologias");
    expect(tech.fields.link.label).toBe("Repositório");
    expect(tech.heading).toBe("Projetos");
    expect(tech.add).toBe("Adicionar projeto");
  });

  it("names tools and links in each area's own words", () => {
    expect(trackOf("HEALTH").fields.tools.label).not.toBe("Tecnologias");
    expect(trackOf("LAW").fields.link.label).not.toBe("Repositório");
    for (const track of TRACKS) {
      expect(track.label).not.toBe("");
      expect(track.ideas.length).toBeGreaterThanOrEqual(3);
      expect(track.suggested.length).toBeGreaterThanOrEqual(4);
      expect(track.accent).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("offers only kinds of work that exist, without repeats", () => {
    const known = new Set(PROJECT_KINDS.map((kind) => kind.id));
    for (const track of TRACKS) {
      expect(track.kinds.length).toBeGreaterThanOrEqual(4);
      expect(new Set(track.kinds).size).toBe(track.kinds.length);
      for (const kind of track.kinds) expect(known.has(kind)).toBe(true);
    }
    expect(trackOf("TECH").kinds).toContain("OPEN_SOURCE");
    expect(trackOf("HEALTH").kinds).not.toContain("OPEN_SOURCE");
    expect(trackOf("HEALTH").kinds).toContain("INTERNSHIP");
  });

  it("still shows the kind a project already has when the area does not offer it", () => {
    const options = kindsFor(trackOf("HEALTH"), "OPEN_SOURCE");
    expect(options.map((kind) => kind.id)).toContain("OPEN_SOURCE");
    expect(options.at(-1)?.label).toBe("Código aberto");
    expect(kindsFor(trackOf("HEALTH")).map((kind) => kind.id)).not.toContain("OPEN_SOURCE");
  });
});
