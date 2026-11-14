import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SocialStream } from "./social-stream";
import { post, stubIntersectionObserver } from "./social-test-kit";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({
  api,
  post: vi.fn(),
  invalidateApiCache: vi.fn(),
}));
vi.mock("@/lib/send-room-invitation", () => ({ preparePrivateShare: vi.fn() }));
vi.mock("../user-identity", () => ({ Avatar: () => <span>AS</span> }));
vi.mock("../forum-links", () => ({ ConfirmedLink: () => null }));

let Observer: ReturnType<typeof stubIntersectionObserver>;
const stream = (
  <SocialStream
    query="tab=for-you&kind=POST"
    active
    me="me"
    person={() => {}}
  />
);
const feedCalls = () =>
  api.mock.calls.filter(([path]) => String(path).startsWith("/social/feed"))
    .length;
const point = (x: number, y: number) => ({ clientX: x, clientY: y });
const list = () => document.querySelector<HTMLElement>(".social-stream")!;
beforeEach(() => {
  Observer = stubIntersectionObserver();
  api.mockReset().mockResolvedValue({
    items: [post("p1")],
    nextCursor: "next",
    snapshot: "s",
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("rola junto com a página do Feed quando ela é a área de rolagem", async () => {
  render(
    <div data-social-scroller data-testid="page">
      {stream}
    </div>,
  );
  await screen.findByText("Ana Souza");
  await waitFor(() => expect(Observer).toHaveBeenCalled());
  // Stories and tabs above the list scroll away with it, so paging watches the page.
  expect(Observer.mock.calls.at(-1)![1]).toMatchObject({
    root: screen.getByTestId("page"),
  });
});
it("sem uma página de rolagem, a própria lista continua sendo a área de rolagem", async () => {
  render(stream);
  await screen.findByText("Ana Souza");
  await waitFor(() => expect(Observer).toHaveBeenCalled());
  expect(Observer.mock.calls.at(-1)![1]).toMatchObject({
    root: list(),
  });
});
it("puxar para atualizar só recarrega com a página no topo", async () => {
  render(
    <div data-social-scroller data-testid="page">
      {stream}
    </div>,
  );
  await screen.findByText("Ana Souza");
  const page = screen.getByTestId("page");
  const pull = () => {
    fireEvent.touchStart(list(), { touches: [point(200, 200)] });
    fireEvent.touchEnd(list(), { changedTouches: [point(204, 320)] });
  };
  page.scrollTop = 80;
  pull();
  expect(feedCalls()).toBe(1);
  page.scrollTop = 0;
  pull();
  await waitFor(() => expect(feedCalls()).toBe(2));
});

it("não antepõe novas publicações quando o contêiner do Feed está em leitura", async () => {
  render(
    <div data-social-scroller data-testid="page">
      {stream}
    </div>,
  );
  await screen.findByText("Ana Souza");
  screen.getByTestId("page").scrollTop = 120;
  api.mockResolvedValue({
    items: [post("p2"), post("p1")],
    nextCursor: "next",
    snapshot: "s",
  });
  fireEvent(window, new Event("enturma-social_changed"));
  await waitFor(() =>
    expect(document.querySelectorAll(".social-post")).toHaveLength(2),
  );
  expect(
    Array.from(document.querySelectorAll(".social-post")).map((node) =>
      node.getAttribute("data-post"),
    ),
  ).toEqual(["p1", "p2"]);
  expect(screen.getByTestId("page").scrollTop).toBe(120);
});

it("cancela atualização por gesto interrompido ou com vários toques", async () => {
  render(stream);
  await screen.findByText("Ana Souza");
  fireEvent.touchStart(list(), { touches: [point(200, 200)] });
  fireEvent.touchCancel(list());
  fireEvent.touchEnd(list(), { changedTouches: [point(200, 340)] });
  fireEvent.touchStart(list(), { touches: [point(200, 200), point(220, 200)] });
  fireEvent.touchEnd(list(), { changedTouches: [point(200, 340)] });
  expect(feedCalls()).toBe(1);
});
