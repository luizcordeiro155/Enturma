import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { NoticeSummary, type Notice } from "./notification-entry";

afterEach(cleanup);

const notice = (extra: Partial<Notice>): Notice => ({
  id: "n1",
  message: "Sua publicação recebeu uma curtida.",
  actorName: "Ana",
  actorId: "a",
  kind: "SOCIAL_LIKE",
  contextKey: "social:interaction",
  targetId: "post",
  href: "/social?post=post",
  readAt: null,
  createdAt: "2026-11-19T12:00:00Z",
  ...extra,
});
const people = (...names: string[]) =>
  names.map((name) => ({ id: name.toLowerCase(), name, hasAvatar: false }));
const text = (value: Notice) =>
  render(<NoticeSummary notice={value} />).container.querySelector(
    ".notification-copy > span",
  )?.textContent;

it("says who liked, by name, when it was one person", () => {
  expect(text(notice({ actors: people("Ana"), actorCount: 1 }))).toBe(
    "Ana curtiu sua publicação.",
  );
});

it("names both when two people liked", () => {
  expect(text(notice({ actors: people("Bruno", "Ana"), actorCount: 2 }))).toBe(
    "Bruno e Ana curtiram sua publicação.",
  );
});

it("names the latest two and counts the rest, with up to three faces", () => {
  const { container } = render(
    <NoticeSummary
      notice={notice({
        actors: people("Caio", "Bruno", "Ana"),
        actorCount: 6,
      })}
    />,
  );
  expect(
    container.querySelector(".notification-copy > span")?.textContent,
  ).toBe("Caio, Bruno e mais 4 pessoas curtiram sua publicação.");
  const faces = container.querySelector(".notification-faces")!;
  expect(faces.querySelectorAll(".identity-avatar")).toHaveLength(3);
  expect(faces.getAttribute("data-faces")).toBe("3");
});

it("counts one more person in the singular", () => {
  expect(
    text(notice({ actors: people("Caio", "Bruno", "Ana"), actorCount: 3 })),
  ).toBe("Caio, Bruno e mais 1 pessoa curtiram sua publicação.");
});

it("shows the face of who followed, with what they did", () => {
  const { container } = render(
    <NoticeSummary
      notice={notice({
        kind: "SOCIAL_FOLLOW",
        message: "Um estudante começou a seguir você.",
        actors: people("Ana"),
        actorCount: 1,
      })}
    />,
  );
  expect(
    container.querySelector(".notification-copy > span")?.textContent,
  ).toBe("Ana começou a seguir você.");
  expect(container.querySelectorAll(".identity-avatar")).toHaveLength(1);
});

it("keeps the server's words for everything else", () => {
  const { container } = render(
    <NoticeSummary
      notice={notice({
        kind: "MENTION",
        actorName: "Ana",
        message: "Você foi mencionado em uma conversa do fórum.",
      })}
    />,
  );
  expect(container.querySelector(".notification-copy")?.textContent).toContain(
    "AnaVocê foi mencionado em uma conversa do fórum.",
  );
  expect(container.querySelector(".notification-faces")).toBeNull();
});
