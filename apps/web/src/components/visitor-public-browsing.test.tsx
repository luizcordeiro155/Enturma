import type { ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api, post } from "@/lib/api";
import {
  VisitorContext,
  canExploreAsVisitor,
  visitorDestination,
} from "@/lib/visitor-context";
import { Forum } from "./forum";
import { StudyRoomsDiscovery } from "./study-rooms-discovery";
import { ExperienceControls } from "./experience-controls";

const requestLogin = vi.hoisted(() => vi.fn());
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api", () => ({
  api: vi.fn(),
  post: vi.fn(),
  peekApiSnapshot: vi.fn(),
}));
vi.mock("@/lib/live-updates", () => ({ useLiveRefresh: vi.fn() }));
vi.mock("./notifications", () => ({
  useNotificationTarget: vi.fn(),
  focusMessage: vi.fn(),
}));
vi.mock("./shell", () => ({
  Shell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("./user-identity", () => ({
  UserIdentity: ({ user }: { user: { name: string } }) => (
    <span>{user.name}</span>
  ),
}));
vi.mock("./emoji-picker", () => ({
  AnimatedEmoji: ({ value }: { value: string }) => <span>{value}</span>,
  EmojiPicker: () => null,
}));
vi.mock("./room-code-entry", () => ({ RoomCodeEntry: () => null }));
vi.mock("./room-artwork", () => ({ RoomArtwork: () => null }));
vi.mock("@/lib/theme-motion", () => ({ applyEnturmaTheme: vi.fn() }));

const entry = {
  id: "a0000000-0000-0000-0000-000000000001",
  authorId: "author",
  name: "Estudante",
  username: "estudante",
  rootId: null,
  parentId: null,
  title: "Como revisar algoritmos?",
  body: "Vamos trocar formas de estudar.",
  category: "ACADEMIC",
  depth: 0,
  deleted: false,
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-01T12:00:00Z",
  score: 3,
  myVote: 0,
  commentsCount: 1,
  reactions: [{ emoji: "👍", count: 2, mine: false }],
  hasAvatar: false,
};
function guest(children: ReactNode) {
  return (
    <VisitorContext.Provider
      value={{ active: true, path: "/forum", requestLogin }}
    >
      {children}
    </VisitorContext.Provider>
  );
}
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it("reads the real community through public APIs and gates votes, reactions and publishing", async () => {
  vi.mocked(api).mockResolvedValue({ items: [entry], hasMore: false });
  render(guest(<Forum visitor />));
  expect(await screen.findByRole("link", { name: entry.title })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Votar a favor" }));
  fireEvent.click(screen.getByRole("button", { name: "Reagir com 👍" }));
  fireEvent.click(screen.getByRole("button", { name: /Nova publicação/ }));
  expect(requestLogin).toHaveBeenCalledTimes(3);
  expect(api).toHaveBeenCalledTimes(1);
  expect(vi.mocked(api).mock.calls[0][0]).toMatch(
    /^\/public\/explore\/forum\?/,
  );
  expect(post).not.toHaveBeenCalled();
});

it("lets a visitor read a full post and its comments while replying requires login", async () => {
  vi.mocked(api).mockImplementation(async (path) => {
    if (path.includes("/comments"))
      return {
        items: [
          {
            ...entry,
            id: "comment",
            title: "",
            body: "Recomendo revisar com exercícios.",
            rootId: entry.id,
            parentId: entry.id,
            depth: 1,
          },
        ],
        hasMore: false,
      } as never;
    if (path.endsWith("/related")) return [] as never;
    return entry as never;
  });
  render(guest(<Forum visitor id={entry.id} />));
  expect(
    await screen.findByText("Recomendo revisar com exercícios."),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Responder" }));
  expect(requestLogin).toHaveBeenCalledWith(`/forum/${entry.id}`);
  expect(
    vi
      .mocked(api)
      .mock.calls.every(
        ([path, options]) =>
          path.startsWith("/public/explore/forum/") && !options?.method,
      ),
  ).toBe(true);
  expect(post).not.toHaveBeenCalled();
});

it("shows real open rooms without loading a profile and gates joining", async () => {
  vi.mocked(api).mockResolvedValue([
    {
      id: "room",
      title: "Revisão de cálculo",
      subjectId: "math",
      subjectName: "Cálculo",
      participants: 2,
      maxParticipants: 10,
      endsAt: "2030-01-01T00:00:00Z",
      lifecycle: "HOURLY",
    },
  ]);
  render(guest(<StudyRoomsDiscovery visitor />));
  expect(await screen.findByText("Revisão de cálculo")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Entrar na sala" }));
  expect(requestLogin).toHaveBeenCalledWith("/rooms/room");
  expect(api).toHaveBeenCalledTimes(1);
  expect(api).toHaveBeenCalledWith("/public/explore/rooms", {
    cache: "no-store",
  });
  expect(post).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
});

it("keeps a guest's saved appearance local without querying or changing an account", async () => {
  localStorage.setItem(
    "enturma-experience",
    JSON.stringify({ theme: "ENTURMA" }),
  );
  render(<ExperienceControls localOnly />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Tema enturma.*Alternar tema/i }),
    ).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole("button", { name: /Alternar tema/ }));
  expect(JSON.parse(localStorage.getItem("enturma-experience")!).theme).toBe(
    "SYSTEM",
  );
  expect(api).not.toHaveBeenCalled();
});

it("only routes explicitly public areas through the visitor shell", () => {
  for (const path of [
    "/home",
    "/forum?category=ACADEMIC",
    `/forum/${entry.id}`,
    "/rooms",
    "/caronas",
    "/settings",
  ])
    expect(canExploreAsVisitor(path)).toBe(true);
  for (const path of [
    "/friends",
    "/portfolio",
    "/rooms/room",
    "/rooms/new",
    "/profile",
    "https://evil.test/forum",
    "//evil.test",
  ])
    expect(canExploreAsVisitor(path)).toBe(false);
  expect(visitorDestination("/home")).toBe("/visitante");
  expect(visitorDestination("/forum?category=ACADEMIC")).toBe(
    "/visitante?path=%2Fforum%3Fcategory%3DACADEMIC",
  );
});
