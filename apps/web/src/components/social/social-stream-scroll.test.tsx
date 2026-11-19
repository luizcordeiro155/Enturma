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
import { intersect, post, stubIntersectionObserver } from "./social-test-kit";

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
  // The first render of the whole Feed tree is slow on busy CI runners (~3 s locally).
}, 15000);
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

const sentinel = () => document.querySelector<HTMLElement>(".social-load")!;
const shownPosts = () =>
  Array.from(document.querySelectorAll(".social-post")).map((node) =>
    node.getAttribute("data-post"),
  );

it("só avisa de novas publicações quando chegou publicação nova durante a leitura", async () => {
  render(
    <div data-social-scroller data-testid="page">
      {stream}
    </div>,
  );
  await screen.findByText("Ana Souza");
  screen.getByTestId("page").scrollTop = 120;
  // A like or a comment changes the Social without bringing anything new to read.
  fireEvent(window, new Event("enturma-social_changed"));
  await waitFor(() => expect(feedCalls()).toBe(2));
  expect(
    screen.queryByRole("button", { name: "Novas publicações" }),
  ).toBeNull();
  api.mockResolvedValue({
    items: [post("p2"), post("p1")],
    nextCursor: "next",
    snapshot: "s",
  });
  fireEvent(window, new Event("enturma-social_changed"));
  const notice = await screen.findByRole("button", {
    name: "Novas publicações",
  });
  api.mockResolvedValue({
    items: [post("p2"), post("p1")],
    nextCursor: "next",
    snapshot: "s",
  });
  fireEvent.click(notice);
  await waitFor(() => expect(shownPosts()).toEqual(["p2", "p1"]));
  expect(
    screen.queryByRole("button", { name: "Novas publicações" }),
  ).toBeNull();
});

it("no fim do Feed busca novidades sozinho, sem pedir para atualizar", async () => {
  api.mockResolvedValue({ items: [post("p1")], nextCursor: "", snapshot: "s" });
  render(
    <div data-social-scroller data-testid="page">
      {stream}
    </div>,
  );
  await screen.findByText(/Você está em dia/);
  screen.getByTestId("page").scrollTop = 400;
  api.mockResolvedValue({
    items: [post("p2"), post("p1")],
    nextCursor: "",
    snapshot: "s",
  });
  // Reaching the end is reading what arrived: the notice must never appear,
  // not even for the one frame before an effect could take it away.
  let noticed = false;
  const watcher = new MutationObserver(() => {
    if (screen.queryByRole("button", { name: "Novas publicações" }))
      noticed = true;
  });
  watcher.observe(document.body, { childList: true, subtree: true });
  intersect(sentinel(), 1);
  await waitFor(() => expect(shownPosts()).toEqual(["p1", "p2"]));
  watcher.disconnect();
  expect(noticed).toBe(false);
  expect(
    screen.queryByRole("button", { name: "Novas publicações" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  const calls = feedCalls();
  intersect(sentinel(), 1);
  expect(feedCalls()).toBe(calls);
});

it("quando Seguindo acaba, o Feed continua com sugestões de Para Você", async () => {
  api.mockImplementation((path: string) =>
    Promise.resolve(
      String(path).includes("tab=for-you")
        ? { items: [post("p1"), post("s1")], nextCursor: "", snapshot: "s" }
        : { items: [post("p1")], nextCursor: "", snapshot: "s" },
    ),
  );
  render(
    <SocialStream
      query="tab=following&kind=ALL"
      active
      me="me"
      person={() => {}}
    />,
  );
  expect(await screen.findByText("Sugestões para você")).toBeInTheDocument();
  expect(shownPosts()).toEqual(["p1", "s1"]);
  expect(
    api.mock.calls.some(([path]) =>
      String(path).startsWith("/social/feed?tab=for-you&kind=ALL"),
    ),
  ).toBe(true);
});

it("uma busca em Seguindo não é completada com sugestões", async () => {
  api.mockResolvedValue({ items: [post("p1")], nextCursor: "", snapshot: "s" });
  render(
    <SocialStream
      query="tab=following&kind=ALL&q=java"
      active
      me="me"
      person={() => {}}
    />,
  );
  await screen.findByText(/Você está em dia/);
  expect(screen.queryByText("Sugestões para você")).toBeNull();
  expect(
    api.mock.calls.some(([path]) => String(path).includes("tab=for-you")),
  ).toBe(false);
});
