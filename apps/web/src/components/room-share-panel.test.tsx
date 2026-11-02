import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { api, post } from "@/lib/api";
import { prepareRoomInvitation } from "@/lib/send-room-invitation";
import { RoomSharePanel } from "./room-share-panel";

const platform = vi.hoisted(() => ({ desktop: false, mobile: false }));
vi.mock("./desktop-updates", () => ({
  isDesktop: () => platform.desktop,
  isMobileApp: () => platform.mobile,
}));
vi.mock("@/lib/api", () => ({ api: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/send-room-invitation", () => ({
  prepareRoomInvitation: vi.fn(),
}));
vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));
vi.mock("@/lib/use-overlay-history", () => ({
  useOverlayHistory: vi.fn(),
  waitForOverlayHistory: () => Promise.resolve(),
}));
vi.mock("./user-identity", () => ({ Avatar: () => <span>Avatar</span> }));
vi.mock("./room-artwork", () => ({
  RoomArtwork: () => <div>Imagens da sala</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  platform.mobile = false;
  platform.desktop = false;
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.mocked(api).mockImplementation(async (path) =>
    path === "/friends"
      ? [
          {
            id: "accepted",
            userId: "person-a",
            name: "Ana",
            username: "ana",
            status: "ACCEPTED",
          },
          {
            id: "pending",
            userId: "person-b",
            name: "Beto",
            username: "beto",
            status: "PENDING",
          },
        ]
      : {
          id: "room",
          title: "Algoritmos",
          subjectName: "Computação",
          available: true,
        },
  );
  vi.mocked(post).mockResolvedValue({
    code: "MDUT2SGT",
    url: "https://enturma.test/join/MDUT2SGT",
  });
  vi.mocked(prepareRoomInvitation).mockResolvedValue({
    ciphertext: "encrypted",
    iv: "iv",
    clientId: "stable-id",
  });
});
afterEach(cleanup);

it("keeps Web copy/QR and sends only after an accepted friend is explicitly chosen", async () => {
  render(<RoomSharePanel roomId="room" />);
  fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));
  expect(
    await screen.findByRole("button", { name: "Convidar Ana" }),
  ).toBeEnabled();
  expect(screen.queryByText("Beto")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Copiar link" }),
  ).toBeInTheDocument();
  expect(prepareRoomInvitation).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Convidar Ana" }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith("/friends/accepted/messages", {
      ciphertext: "encrypted",
      iv: "iv",
      clientId: "stable-id",
    }),
  );
  expect(
    await screen.findByRole("button", { name: "Convite enviado para Ana" }),
  ).toBeDisabled();
});

it.each(["mobile", "desktop"] as const)(
  "hides copy link in the %s app while preserving the friend picker",
  async (kind) => {
    platform[kind] = true;
    render(<RoomSharePanel roomId="room" />);
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));
    await screen.findByRole("button", { name: "Convidar Ana" });
    expect(
      screen.queryByRole("button", { name: "Copiar link" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Link do convite" }),
    ).not.toBeInTheDocument();
    expect(screen.getByAltText(/QR Code para entrar/)).toBeInTheDocument();
  },
);

it("retries an uncertain response with the same client id and encrypted envelope", async () => {
  let sends = 0;
  vi.mocked(post).mockImplementation(async (path) => {
    if (path.includes("/messages") && ++sends === 1) throw Error("Sem conexão");
    return { code: "MDUT2SGT", url: "https://enturma.test/join/MDUT2SGT" };
  });
  render(<RoomSharePanel roomId="room" />);
  fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));
  fireEvent.click(await screen.findByRole("button", { name: "Convidar Ana" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Sem conexão");
  fireEvent.click(screen.getByRole("button", { name: "Convidar Ana" }));
  await screen.findByRole("button", { name: "Convite enviado para Ana" });
  expect(prepareRoomInvitation).toHaveBeenCalledTimes(1);
  const payloads = vi
    .mocked(post)
    .mock.calls.filter(([path]) => path.includes("/messages"))
    .map(([, body]) => body);
  expect(payloads).toHaveLength(2);
  expect(payloads[0]).toEqual(payloads[1]);
});
