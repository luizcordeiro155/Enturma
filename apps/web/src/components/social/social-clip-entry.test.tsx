import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { Social } from "./social";
import { post, video } from "./social-test-kit";

const { api, route } = vi.hoisted(() => ({
  api: vi.fn(),
  route: { post: null as string | null },
}));
vi.mock("@/lib/api", () => ({ api }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "post" ? route.post : null),
  }),
}));
vi.mock("../shell", () => ({
  Shell: ({
    children,
    navigation,
  }: {
    children: ReactNode;
    navigation: ReactNode;
  }) => (
    <>
      {navigation}
      {children}
    </>
  ),
}));
vi.mock("../navigation-link", () => ({
  NavigationLink: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("./social-opening", () => ({
  SocialOpening: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("./use-social-viewport", () => ({ useSocialViewport: () => {} }));
vi.mock("./social-live-context", () => ({
  SocialLiveProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("./social-navigation", () => ({
  SocialNavigation: ({ select }: { select: (view: string) => void }) => (
    <button onClick={() => select("feed")}>Feed</button>
  ),
}));
vi.mock("./social-pager", () => ({
  SocialPager: ({
    view,
    children,
  }: {
    view: string;
    children: (page: string) => ReactNode;
  }) => (
    <div data-testid="pager" data-view={view}>
      {["feed", "clips"].map((page) => (
        <section key={page} hidden={view !== page}>
          {children(page)}
        </section>
      ))}
    </div>
  ),
}));
vi.mock("./social-stream", () => ({
  SocialStream: () => <p>Leitura preservada</p>,
}));
vi.mock("./social-clips", () => ({
  SocialClips: ({
    initialClip,
    active,
  }: {
    initialClip?: { id: string };
    active: boolean;
  }) => (
    <div data-testid="clips" data-id={initialClip?.id} data-active={active} />
  ),
}));
vi.mock("./social-stories", () => ({
  SocialStories: () => null,
  StoryViewer: () => null,
}));
vi.mock("./social-feed-aside", () => ({ SocialFeedAside: () => null }));
vi.mock("./social-editor", () => ({ SocialEditor: () => null }));
vi.mock("./social-explore", () => ({ SocialExplore: () => null }));
vi.mock("./social-profile", () => ({ SocialProfile: () => null }));
vi.mock("./social-settings", () => ({ SocialSettings: () => null }));
vi.mock("./social-post", () => ({
  SocialAuthor: () => null,
  SocialPost: () => null,
}));
vi.mock("./social-dialog", () => ({
  SocialDialog: () => <div role="dialog" />,
}));
const id = "22222222-2222-4222-8222-222222222222";
const clip = post(id, { kind: "CLIP", media: [video("v")] });
beforeEach(() => {
  route.post = null;
  api.mockReset().mockImplementation(async (path: string) => {
    if (path === "/social/capabilities") return { enabled: true };
    if (path === "/social/preferences")
      return {
        navigation: { automatic: false, order: ["feed", "clips", "create"] },
        autoplay: true,
      };
    if (path === "/users/me") return { id: "me" };
    if (path === `/social/posts/${id}`) return clip;
    throw new Error(`Unexpected test request ${path}`);
  });
});
afterEach(cleanup);

it("revalidates the selected Clip, opens its feed and restores the same Feed DOM on Back", async () => {
  const { rerender, container } = render(<Social />);
  await screen.findByTestId("pager");
  const feed = container.querySelector(".social-feed-scroll")!;
  feed.scrollTop = 184;
  route.post = id;
  rerender(<Social />);
  await waitFor(() =>
    expect(screen.getByTestId("pager")).toHaveAttribute("data-view", "clips"),
  );
  expect(api).toHaveBeenCalledWith(`/social/posts/${id}`, {
    cache: "no-store",
  });
  expect(screen.getByTestId("clips")).toHaveAttribute("data-id", id);
  expect(screen.queryByRole("dialog")).toBeNull();
  route.post = null;
  rerender(<Social />);
  await waitFor(() =>
    expect(screen.getByTestId("pager")).toHaveAttribute("data-view", "feed"),
  );
  expect(container.querySelector(".social-feed-scroll")).toBe(feed);
  expect(feed.scrollTop).toBe(184);
});

it("does not open a deleted or unauthorized Clip", async () => {
  route.post = id;
  const original = api.getMockImplementation()!;
  api.mockImplementation((path: string) =>
    path.startsWith("/social/posts/")
      ? Promise.reject(new Error("Publicação indisponível"))
      : original(path),
  );
  render(<Social />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Publicação indisponível",
  );
  expect(screen.getByTestId("pager")).toHaveAttribute("data-view", "feed");
  expect(screen.queryByTestId("clips")).toBeNull();
});

it("leaving a linked Clip removes its post query without reloading the Feed", async () => {
  route.post = id;
  const replace = vi.spyOn(window.history, "replaceState");
  render(<Social />);
  await waitFor(() =>
    expect(screen.getByTestId("pager")).toHaveAttribute("data-view", "clips"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Feed" }));
  expect(screen.getByTestId("pager")).toHaveAttribute("data-view", "feed");
  expect(replace).toHaveBeenCalled();
  replace.mockRestore();
});
