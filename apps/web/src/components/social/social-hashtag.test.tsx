import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { HASHTAG_EVENT, SocialHashtagPage, SocialHashtagList } from "./social-hashtag";
import { SocialText } from "./social-text";

const api = vi.hoisted(() => vi.fn());
const grid = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
vi.mock("../navigation-link", () => ({
  NavigationLink: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("./social-profile-grid", () => ({
  SocialProfileGrid: (props: { query: string }) => {
    grid(props.query);
    return <div data-testid="grid" />;
  },
}));
vi.mock("./social-post-viewer", () => ({ SocialPostViewer: () => null }));
vi.mock("./social-dialog", () => ({
  SocialDialog: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
}));

beforeEach(() => {
  api.mockReset();
  grid.mockReset();
});
afterEach(cleanup);

it("uma hashtag na legenda abre a página da hashtag no Social", () => {
  const seen = vi.fn((event: Event) => event.preventDefault());
  window.addEventListener(HASHTAG_EVENT, seen);
  render(<SocialText text="Feira de #Robótica hoje" />);
  const link = screen.getByRole("link", { name: "#Robótica" });
  expect(link).toHaveAttribute("href", "/social?tag=rob%C3%B3tica");
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  link.dispatchEvent(click);
  expect((seen.mock.calls[0][0] as CustomEvent).detail).toBe("robótica");
  expect(click.defaultPrevented).toBe(true);
  window.removeEventListener(HASHTAG_EVENT, seen);
});

it("fora do Social, a hashtag segue o link normalmente", () => {
  render(<SocialText text="#java" />);
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  screen.getByRole("link", { name: "#java" }).dispatchEvent(click);
  expect(click.defaultPrevented).toBe(false);
});

it("a página da hashtag mostra quantas publicações usam a tag e só elas", async () => {
  api.mockResolvedValue([{ tag: "robótica", posts: 12 }]);
  render(<SocialHashtagPage tag="robótica" me="me" person={vi.fn()} close={vi.fn()} />);
  expect(screen.getByRole("dialog", { name: "#robótica" })).toBeInTheDocument();
  expect(await screen.findByText("12 publicações")).toBeVisible();
  expect(api).toHaveBeenCalledWith(
    "/social/hashtags?q=rob%C3%B3tica",
    expect.objectContaining({ cache: "no-store" }),
  );
  expect(grid).toHaveBeenCalledWith("tab=for-you&kind=ALL&q=%23rob%C3%B3tica");
});

it("lista as hashtags mais usadas e abre a escolhida", async () => {
  api.mockResolvedValue([
    { tag: "java", posts: 30 },
    { tag: "tcc", posts: 1 },
  ]);
  const open = vi.fn();
  render(<SocialHashtagList open={open} />);
  await waitFor(() => expect(api).toHaveBeenCalledWith("/social/hashtags", expect.anything()));
  expect(await screen.findByRole("button", { name: "#java, 30 publicações" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "#tcc, 1 publicação" }));
  expect(open).toHaveBeenCalledWith("tcc");
});

it("na busca, mostra as hashtags que começam com o termo", async () => {
  api.mockResolvedValue([{ tag: "javascript", posts: 4 }]);
  render(<SocialHashtagList query="#java" open={vi.fn()} />);
  expect(await screen.findByRole("button", { name: "#javascript, 4 publicações" })).toBeVisible();
  expect(api).toHaveBeenCalledWith("/social/hashtags?q=java", expect.anything());
});
