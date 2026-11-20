import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { api, post } from "@/lib/api";
import { preparePrivateShare } from "@/lib/send-room-invitation";
import { PortfolioShareButton } from "./portfolio-share";

vi.mock("@/lib/api", () => ({ api: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/send-room-invitation", () => ({
  preparePrivateShare: vi.fn(async () => ({ sealed: true })),
}));
vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));
vi.mock("@/lib/use-overlay-history", () => ({
  useOverlayHistory: vi.fn(),
  waitForOverlayHistory: vi.fn(async () => {}),
}));

const owner = { name: "Ana Souza", username: "ana.souza" };
const page = "https://enturma-flax.vercel.app/p/ana.souza";
let signedIn = true;

beforeEach(() => {
  signedIn = true;
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.mocked(post).mockResolvedValue({});
  vi.mocked(api).mockImplementation(async () => {
    if (!signedIn) throw Object.assign(new Error("Entre"), { status: 401 });
    return [
      {
        id: "f1",
        userId: "u1",
        name: "Bruno",
        username: "bruno",
        status: "ACCEPTED",
      },
    ] as never;
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("shares one project by link, LinkedIn or a friend's conversation", async () => {
  render(
    <PortfolioShareButton
      owner={owner}
      project={{ id: "p1", name: "Caronas" }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Compartilhar Caronas" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Compartilhar projeto",
  });
  const link = `${page}#projeto-p1`;
  expect(
    within(dialog).getByLabelText<HTMLInputElement>("Link do projeto").value,
  ).toBe(link);
  const linkedIn = within(dialog).getByRole("link", {
    name: "Compartilhar no LinkedIn",
  });
  expect(linkedIn.getAttribute("href")).toBe(
    "https://www.linkedin.com/sharing/share-offsite/?url=" +
      encodeURIComponent(link),
  );
  expect(linkedIn.getAttribute("target")).toBe("_blank");
  expect(linkedIn.getAttribute("rel")).toContain("noopener");
  // a visitor's sheet has no way into the owner's Social
  expect(
    within(dialog).queryByRole("link", { name: "Publicar no Enturma Social" }),
  ).toBeNull();
  fireEvent.click(
    await screen.findByRole("button", { name: "Enviar para Bruno" }),
  );
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith("/friends/f1/messages", { sealed: true }),
  );
  expect(vi.mocked(preparePrivateShare).mock.calls[0].slice(0, 2)).toEqual([
    "f1",
    link,
  ]);
  await screen.findByRole("button", { name: "Projeto enviado para Bruno" });
});

it("shares the whole portfolio, and gives the owner the way to post a project", async () => {
  const { rerender } = render(<PortfolioShareButton owner={owner} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Compartilhar portfólio" }),
  );
  const dialog = await screen.findByRole("dialog", {
    name: "Compartilhar portfólio",
  });
  expect(
    within(dialog).getByLabelText<HTMLInputElement>("Link do portfólio").value,
  ).toBe(page);
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Fechar compartilhamento" }),
  );
  rerender(
    <PortfolioShareButton
      owner={owner}
      project={{ id: "p1", name: "Caronas" }}
      mine
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Compartilhar Caronas" }));
  expect(
    (
      await screen.findByRole("link", { name: "Publicar no Enturma Social" })
    ).getAttribute("href"),
  ).toBe("/social?projeto=p1");
});

it("gives a visitor who is not signed in the link, without a friends list or an error", async () => {
  signedIn = false;
  render(<PortfolioShareButton owner={owner} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Compartilhar portfólio" }),
  );
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText(/Entre no Enturma/)).toBeTruthy();
  expect(within(dialog).queryByRole("alert")).toBeNull();
  expect(within(dialog).queryByPlaceholderText("Buscar amigos")).toBeNull();
  expect(
    within(dialog).getByRole("link", { name: "Compartilhar no LinkedIn" }),
  ).toBeTruthy();
});
