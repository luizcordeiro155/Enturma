import { expect, it } from "vitest";
import { linkedProject, projectLink } from "./social-project-link";

const portfolio = {
  username: "ana.souza",
  publicProfile: true,
  projects: [
    { id: "11111111-1111-4111-8111-111111111111", name: "Caronas" },
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Rascunho",
      archived: true,
    },
  ],
};

it("points a post at the project's place on the public portfolio", () => {
  expect(projectLink("ana.souza", "abc")).toBe(
    "https://enturma-flax.vercel.app/p/ana.souza#projeto-abc",
  );
});

it("links only a project visitors can open", () => {
  expect(linkedProject(portfolio.projects[0].id, portfolio)).toEqual({
    name: "Caronas",
    url: "https://enturma-flax.vercel.app/p/ana.souza#projeto-11111111-1111-4111-8111-111111111111",
  });
  expect(linkedProject(portfolio.projects[1].id, portfolio)).toBeUndefined();
  expect(linkedProject("outro", portfolio)).toBeUndefined();
  expect(linkedProject(null, portfolio)).toBeUndefined();
  expect(
    linkedProject(portfolio.projects[0].id, {
      ...portfolio,
      publicProfile: false,
    }),
  ).toBeUndefined();
  expect(linkedProject(portfolio.projects[0].id, undefined)).toBeUndefined();
});
