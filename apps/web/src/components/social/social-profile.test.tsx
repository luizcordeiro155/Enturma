import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { SocialProfile } from "./social-profile";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
vi.mock("@/lib/live-updates", () => ({ useLiveRefresh: () => {} }));
vi.mock("./social-live-context", () => ({
  useSocialLives: () => ({ items: [], open: () => {} }),
}));
vi.mock("../navigation-link", () => ({
  NavigationLink: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("./social-dialog", () => ({
  SocialDialog: ({
    title,
    children,
  }: {
    title: string;
    children: ReactNode;
  }) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
}));
vi.mock("./social-post", () => ({
  FollowButton: () => <button>Seguir</button>,
  SocialAuthor: ({ user }: { user: { name: string } }) => (
    <span className="social-author">{user.name}</span>
  ),
}));
vi.mock("./social-profile-grid", () => ({
  SocialProfileGrid: () => <div data-testid="grid" />,
}));
vi.mock("./social-post-viewer", () => ({ SocialPostViewer: () => null }));
vi.mock("./social-stories", () => ({ StoryViewer: () => null }));
vi.mock("./social-collections", () => ({ SocialCollections: () => null }));
vi.mock("../forum-links", () => ({
  ForumLinks: ({ text }: { text: string }) => <>{text}</>,
  ConfirmedLink: ({ label }: { label: string }) => <a>{label}</a>,
}));
vi.mock("../profile-motion", () => ({ ProfileBackdrop: () => null }));
vi.mock("../user-identity", () => ({
  profileStyle: () => ({}),
  ProfileCard: ({
    user,
    actions,
  }: {
    user: { name: string; showcaseAppearance?: { theme?: string } };
    actions?: ReactNode;
  }) => (
    <div data-testid="card" data-theme={user.showcaseAppearance?.theme}>
      {user.name}
      <div className="profile-dialog-actions">{actions}</div>
    </div>
  ),
}));

const person = {
  id: "u1",
  name: "Lucca Rangel",
  username: "caco",
  bio: "Edição e motion design.",
  privateAccount: false,
  followers: 1,
  following: 0,
  posts: 5,
  likesReceived: 9,
  profileDetails: { statusText: "Apple Style" },
  relationship: { status: "ACCEPTED", notify: false, muted: false },
};
const showcase = {
  appearance: { theme: "GRADIENT", muralMode: "PROFILE" },
  widgets: [],
};

function viewport(desktop: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: desktop,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}
function backend(showcaseResult: () => Promise<unknown>) {
  api.mockImplementation((path: string) => {
    if (path === "/social/people/u1") return Promise.resolve(person);
    if (path === "/users/u1/showcase") return showcaseResult();
    return Promise.resolve([]);
  });
}
const open = () =>
  render(<SocialProfile id="u1" me="me" close={vi.fn()} person={vi.fn()} />);

beforeEach(() => api.mockReset());
afterEach(cleanup);

it("no desktop usa a superfície do perfil padrão com o Enturma Social ao lado", async () => {
  viewport(true);
  backend(() => Promise.resolve(showcase));
  const { container } = open();
  const card = await screen.findByTestId("card");
  expect(card).toHaveAttribute("data-theme", "GRADIENT");
  expect(card).toHaveTextContent("Lucca Rangel");
  expect(card).toHaveTextContent("Mensagem");
  const surface = container.querySelector(".social-profile-surface")!;
  expect(surface).toHaveClass("profile-shared-surface", "profile-mural-linked");
  expect(
    screen.getByRole("heading", { name: "Enturma Social" }),
  ).toBeInTheDocument();
  const social = container.querySelector(".social-profile-main")!;
  expect(social.querySelector(".social-profile-counts")).toHaveTextContent(
    "1 Seguidores",
  );
  expect(social.querySelectorAll('[role="tab"]')).toHaveLength(4);
  expect(social.querySelectorAll('[data-testid="grid"]')).toHaveLength(4);
  expect(container.querySelector(".social-profile-intro")).toBeNull();
});

it("no desktop o perfil abre mesmo sem a personalização do perfil padrão", async () => {
  viewport(true);
  backend(() => Promise.reject(new Error("indisponível")));
  const { container } = open();
  const card = await screen.findByTestId("card");
  expect(card).not.toHaveAttribute("data-theme");
  expect(container.querySelector(".social-profile-surface")).not.toHaveClass(
    "profile-mural-linked",
  );
  expect(screen.queryByRole("alert")).toBeNull();
});

it("no celular mantém o perfil empilhado e não busca a personalização", async () => {
  viewport(false);
  backend(() => Promise.resolve(showcase));
  const { container } = open();
  expect(await screen.findByText("Apple Style")).toBeInTheDocument();
  const intro = container.querySelector(".social-profile-intro")!;
  expect(intro.querySelector(".social-author")).toHaveTextContent(
    "Lucca Rangel",
  );
  expect(intro.querySelector(".social-profile-buttons")).toHaveTextContent(
    "Mensagem",
  );
  expect(intro.querySelector(".social-profile-counts")).toHaveTextContent(
    "5 Publicações",
  );
  expect(container.querySelector(".social-profile-banner")).not.toBeNull();
  expect(container.querySelector(".social-profile-surface")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Enturma Social" })).toBeNull();
  expect(api).not.toHaveBeenCalledWith("/users/u1/showcase", expect.anything());
});
