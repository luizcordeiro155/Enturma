import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { SocialShare } from "./social-post";
import { post as fixture } from "./social-test-kit";
const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  post: vi.fn(),
  preparePrivateShare: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ api: mocks.api, post: mocks.post }));
vi.mock("@/lib/send-room-invitation", () => ({
  preparePrivateShare: mocks.preparePrivateShare,
}));
vi.mock("./social-dialog", () => ({
  SocialDialog: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("../user-identity", () => ({ Avatar: () => null }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("selects a friend before sending through the existing encrypted channel", async () => {
  mocks.api.mockImplementation(async (path: string) =>
    path === "/friends"
      ? [
          {
            id: "friendship",
            userId: "person",
            name: "Ana",
            username: "ana",
            status: "ACCEPTED",
          },
        ]
      : fixture("post"),
  );
  mocks.preparePrivateShare.mockResolvedValue({ ciphertext: "encrypted" });
  mocks.post.mockResolvedValue({});
  render(<SocialShare item={fixture("post")} close={() => {}} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Selecionar Ana" }),
  );
  expect(mocks.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Enviar para 1 pessoa" }));
  await waitFor(() =>
    expect(mocks.post).toHaveBeenCalledWith("/friends/friendship/messages", {
      ciphertext: "encrypted",
    }),
  );
  expect(mocks.preparePrivateShare).toHaveBeenCalledWith(
    "friendship",
    expect.stringContaining("/social?post=post"),
    expect.any(String),
  );
});
