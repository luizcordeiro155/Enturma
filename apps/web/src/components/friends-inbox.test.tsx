import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { FriendsInbox, type InboxFriend } from "./friends-inbox";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
vi.mock("./navigation-link", () => ({
  NavigationLink: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("./user-identity", () => ({
  UserIdentity: ({ user }: { user: { name: string } }) => (
    <button type="button">{`Ver perfil de ${user.name}`}</button>
  ),
  Avatar: () => <span aria-hidden="true" />,
}));
vi.mock("./social/social-stories", () => ({
  SocialStories: () => <div aria-label="Stories" />,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const me = { id: "me", name: "Eu", username: "eu" };
function friend(over: Partial<InboxFriend>): InboxFriend {
  return {
    id: "f1",
    userId: "u1",
    name: "Bía Souza",
    username: "bia",
    requester: "me",
    recipient: "u1",
    status: "ACCEPTED",
    ...over,
  } as InboxFriend;
}
const bia = friend({
  lastMessageId: "m1",
  lastMessageAt: "2026-11-14T12:20:00Z",
  unreadCount: 2,
  online: true,
});
const ana = friend({ id: "f2", userId: "u2", name: "Ana Lima", username: "analima" });
const asking = friend({
  id: "f3",
  userId: "u3",
  name: "Caio Reis",
  username: "caio",
  status: "PENDING",
  requester: "u3",
  recipient: "me",
});
const sent = friend({
  id: "f4",
  userId: "u4",
  name: "Duda Melo",
  username: "duda",
  status: "PENDING",
  requester: "me",
  recipient: "u4",
});

function inbox(over: Partial<ComponentProps<typeof FriendsInbox>> = {}) {
  const props = {
    me,
    friends: [bia, ana, asking, sent],
    previews: { f1: { id: "m1", text: "Bora estudar?" } },
    selectedId: undefined,
    socialEnabled: true,
    open: vi.fn(),
    accept: vi.fn(),
    remove: vi.fn(),
    invite: vi.fn(() => Promise.resolve()),
    backup: <p>Conteúdo do backup</p>,
    ...over,
  };
  render(<FriendsInbox {...props} />);
  return props;
}

beforeEach(() => {
  api.mockReset().mockResolvedValue([]);
});
afterEach(cleanup);

it("lists conversations like WhatsApp: name, last message, time and unread count", () => {
  const props = inbox();
  const list = screen.getByRole("list", { name: "Conversas" });
  const row = within(list).getByRole("button", { name: /^Conversar com Bía Souza/ });
  expect(row).toHaveTextContent("Bora estudar?");
  expect(within(row).getByLabelText("2 mensagens não lidas")).toHaveTextContent("2");
  expect(row.querySelector("time")).toHaveAttribute("dateTime", "2026-11-14T12:20:00Z");
  // A friend with no messages yet shows their @ instead of a preview.
  expect(
    within(list).getByRole("button", { name: /^Conversar com Ana Lima/ }),
  ).toHaveTextContent("@analima");
  fireEvent.click(row);
  expect(props.open).toHaveBeenCalledWith(bia);
});

it("keeps invitations apart from conversations", () => {
  const props = inbox();
  const invites = screen.getByRole("region", { name: "Convites" });
  fireEvent.click(within(invites).getByRole("button", { name: "Aceitar convite" }));
  expect(props.accept).toHaveBeenCalledWith(asking);
  expect(within(invites).getByText("Convite enviado")).toBeInTheDocument();
  expect(
    within(screen.getByRole("list", { name: "Conversas" })).queryByText("Caio Reis"),
  ).toBeNull();
});

it("searches friends by @ or by name, ignoring accents", () => {
  inbox();
  const search = screen.getByRole("searchbox", { name: "Pesquisar amigos e pessoas" });
  fireEvent.change(search, { target: { value: "@BIA" } });
  const list = screen.getByRole("list", { name: "Conversas" });
  expect(within(list).getAllByRole("button", { name: /^Conversar com/ })).toHaveLength(1);
  fireEvent.change(search, { target: { value: "bia souza" } });
  expect(within(list).getByRole("button", { name: /^Conversar com Bía/ })).toBeInTheDocument();
  fireEvent.change(search, { target: { value: "lima" } });
  expect(within(list).getByRole("button", { name: /^Conversar com Ana/ })).toBeInTheDocument();
  expect(within(list).queryByRole("button", { name: /^Conversar com Bía/ })).toBeNull();
});

it("finds new people on the Enturma and sends them an invitation", async () => {
  api.mockResolvedValue([
    { id: "u9", name: "Lia Torres", username: "liat" },
    { id: "u1", name: "Bía Souza", username: "bia" },
    { id: "me", name: "Eu", username: "eu" },
  ]);
  const props = inbox();
  fireEvent.change(screen.getByRole("searchbox", { name: "Pesquisar amigos e pessoas" }), {
    target: { value: "@li" },
  });
  const people = await screen.findByRole("region", { name: "Pessoas no Enturma" });
  expect(api).toHaveBeenCalledWith("/social/people?q=li", { cache: "no-store" });
  // Existing friends and yourself are not offered again.
  expect(within(people).getAllByRole("button", { name: /^Adicionar/ })).toHaveLength(1);
  fireEvent.click(within(people).getByRole("button", { name: "Adicionar @liat" }));
  expect(props.invite).toHaveBeenCalledWith("liat");
  expect(await within(people).findByText("Convite enviado")).toBeInTheDocument();
});

it("without the Social, still invites by the exact @", async () => {
  const props = inbox({ socialEnabled: false });
  fireEvent.change(screen.getByRole("searchbox", { name: "Pesquisar amigos e pessoas" }), {
    target: { value: "@dani.r" },
  });
  const people = screen.getByRole("region", { name: "Pessoas no Enturma" });
  fireEvent.click(within(people).getByRole("button", { name: "Adicionar @dani.r" }));
  expect(props.invite).toHaveBeenCalledWith("dani.r");
  await waitFor(() => expect(api).not.toHaveBeenCalled());
});

it("puts keys and backup behind the ⋮ menu", () => {
  inbox();
  expect(screen.queryByText("Conteúdo do backup")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Mais opções" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Chaves e backup das conversas" }));
  const dialog = screen.getByRole("dialog", { name: "Chaves e backup das conversas" });
  expect(within(dialog).getByText("Conteúdo do backup")).toBeInTheDocument();
});

it("shows the Social Stories above the conversations only when the Social is on", () => {
  inbox();
  expect(screen.getByLabelText("Stories")).toBeInTheDocument();
  cleanup();
  inbox({ socialEnabled: false });
  expect(screen.queryByLabelText("Stories")).toBeNull();
});

it("press and hold on a conversation offers to remove the friend", async () => {
  const props = inbox();
  const row = screen.getByRole("button", { name: /^Conversar com Ana Lima/ });
  fireEvent.contextMenu(row);
  fireEvent.click(await screen.findByRole("menuitem", { name: "Remover amizade" }));
  expect(props.remove).toHaveBeenCalledWith(ana);
  expect(props.open).not.toHaveBeenCalled();
});
