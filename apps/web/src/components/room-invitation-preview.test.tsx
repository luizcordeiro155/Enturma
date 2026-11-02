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
import { RoomInvitationPreview } from "./room-invitation-preview";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/lib/api", () => ({ api: vi.fn(), post: vi.fn() }));
vi.mock("./room-artwork", () => ({
  RoomArtwork: () => <div>Banner e foto da sala</div>,
}));
const invite = {
  id: "room",
  title: "Revisão de algoritmos",
  subjectName: "Programação",
  status: "ACTIVE",
  available: true,
  participantCount: 12,
  hasAvatar: true,
  hasBanner: true,
};
beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.stubGlobal("IntersectionObserver", undefined);
  vi.mocked(api).mockResolvedValue(invite);
  vi.mocked(post).mockResolvedValue({ id: "room" });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("loads a real invite preview but never joins until the user chooses to enter", async () => {
  render(
    <RoomInvitationPreview text={`${window.location.origin}/join/MDUT2SGT`} />,
  );
  expect(
    await screen.findByRole("heading", { name: invite.title }),
  ).toBeInTheDocument();
  expect(screen.getByText("12 participantes")).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Entrar na sala" }));
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: "Agora não" }));
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Entrar na sala" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Aceitar e entrar" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Aceitar e entrar" }));
  await waitFor(() =>
    expect(navigation.push).toHaveBeenCalledWith("/rooms/room"),
  );
  expect(post).toHaveBeenCalledWith("/study-rooms/join-code/MDUT2SGT/join");
});

it("cannot enter an ended room or silently navigate after a rejected join", async () => {
  vi.mocked(post).mockRejectedValue(Error("Você não pode entrar nesta sala."));
  const { rerender } = render(
    <RoomInvitationPreview text={`${window.location.origin}/join/MDUT2SGT`} />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Entrar na sala" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Aceitar e entrar" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Aceitar e entrar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Você não pode entrar nesta sala.",
  );
  expect(navigation.push).not.toHaveBeenCalled();
  vi.mocked(api).mockResolvedValue({
    ...invite,
    available: false,
    status: "ENDED",
  });
  rerender(
    <RoomInvitationPreview text={`${window.location.origin}/join/AAAAAAAA`} />,
  );
  expect(
    await screen.findByRole("button", { name: "Sala encerrada" }),
  ).toBeDisabled();
});

it("does not make metadata requests for external links", () => {
  const { container } = render(
    <RoomInvitationPreview text="https://malicious.example/join/MDUT2SGT" />,
  );
  expect(container).toBeEmptyDOMElement();
  expect(api).not.toHaveBeenCalled();
});
