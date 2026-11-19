import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { api, post } from "@/lib/api";
import { preparePrivateShare } from "@/lib/send-room-invitation";
import { ProfileShareButton } from "./profile-share";
import { SharedProfilePreview } from "./profile-share-preview";

vi.mock("@/lib/api", () => ({ api: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/send-room-invitation", () => ({
  preparePrivateShare: vi.fn(async () => ({ sealed: true })),
}));
vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));
vi.mock("@/lib/use-overlay-history", () => ({
  useOverlayHistory: vi.fn(),
  waitForOverlayHistory: vi.fn(async () => {}),
}));

const person = "198b4058-2776-4bac-840e-f696a15fe890";
const link = `https://enturma-flax.vercel.app/social?person=${person}`;

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.mocked(post).mockResolvedValue({});
  vi.mocked(api).mockImplementation(async (path: string) =>
    path === "/friends"
      ? [
          {
            id: "f1",
            userId: "u1",
            name: "Bruno",
            username: "bruno",
            status: "ACCEPTED",
          },
          {
            id: "f2",
            userId: "u2",
            name: "Carla",
            username: "carla",
            status: "PENDING",
          },
          {
            id: "f3",
            userId: person,
            name: "Ana",
            username: "ana",
            status: "ACCEPTED",
          },
        ]
      : {
          id: person,
          name: "Ana Lima",
          username: "ana",
          bio: "Estudando redes.",
        },
  );
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("sends a profile to a friend's conversation from the share button", async () => {
  render(
    <ProfileShareButton
      person={{ id: person, name: "Ana Lima", username: "ana" }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Compartilhar perfil" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Compartilhar perfil",
  });
  expect(dialog.textContent).toContain("Ana Lima");
  // Accepted friends only, and never the person whose profile it is.
  const send = await screen.findByRole("button", { name: "Enviar para Bruno" });
  expect(screen.queryByRole("button", { name: /Carla/ })).toBeNull();
  expect(screen.queryByRole("button", { name: "Enviar para Ana" })).toBeNull();
  fireEvent.click(send);
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith("/friends/f1/messages", { sealed: true }),
  );
  // What travels is the profile's link, sealed like any private message.
  expect(vi.mocked(preparePrivateShare).mock.calls[0].slice(0, 2)).toEqual([
    "f1",
    link,
  ]);
  expect(
    (
      (await screen.findByRole("button", {
        name: "Perfil enviado para Bruno",
      })) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});

it("copies the profile link for sharing anywhere else", async () => {
  const writeText = vi.fn(async () => {});
  Object.assign(navigator, { clipboard: { writeText } });
  render(<ProfileShareButton person={{ id: person, name: "Ana Lima" }} />);
  fireEvent.click(screen.getByRole("button", { name: "Compartilhar perfil" }));
  fireEvent.click(await screen.findByRole("button", { name: /Copiar link/ }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(link));
});

it("shows a shared profile in the conversation as a card that opens it", async () => {
  render(<SharedProfilePreview text={`Olha quem achei\n${link}`} />);
  const card = await screen.findByRole("link", {
    name: "Abrir perfil de Ana Lima",
  });
  expect(card.getAttribute("href")).toBe(`/social?person=${person}`);
  expect(card.textContent).toContain("@ana");
  expect(card.textContent).toContain("Estudando redes.");
  // What the sender wrote stays; the bare link does not show.
  expect(screen.getByText("Olha quem achei")).toBeTruthy();
  expect(screen.queryByText(link)).toBeNull();
});

it("shows nothing for a message that shares no profile", () => {
  const { container } = render(<SharedProfilePreview text="oi, tudo bem?" />);
  expect(container.firstChild).toBeNull();
});
