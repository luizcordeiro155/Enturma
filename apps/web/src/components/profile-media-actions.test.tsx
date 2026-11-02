import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileDetailsEditor } from "./profile-details-editor";
import { api } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({
  api: vi.fn(),
  peekApiSnapshot: () => undefined,
}));
vi.mock("./profile-motion", () => ({
  ProfileBackdrop: () => null,
  profileEntrance: vi.fn(),
}));
vi.mock("./profile-edit-panel", () => ({ ProfileEditPanel: () => null }));
vi.mock("./profile-visual-surface", () => ({
  ProfileVisualSurface: () => null,
}));

beforeEach(() => {
  vi.mocked(api).mockImplementation(async (_path, options) => {
    if (options?.method === "DELETE") return undefined as never;
    return { appearance: {}, widgets: [] } as never;
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("profile image removal", () => {
  it("only offers removal for an existing image and updates the draft after the API confirms", async () => {
    const saved = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileDetailsEditor
        profile={{
          id: "me",
          name: "Estudante",
          hasAvatar: true,
          hasBanner: false,
        }}
        onSaved={saved}
      />,
    );
    expect(screen.queryByRole("button", { name: "Remover banner" })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Remover foto de perfil" }),
    );
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(api).toHaveBeenCalledWith("/users/me/avatar", { method: "DELETE" });
    expect(
      screen.queryByRole("button", { name: "Remover foto de perfil" }),
    ).toBeNull();
  });
  it("keeps the image and removal action available when deletion fails", async () => {
    vi.mocked(api).mockImplementation(async (_path, options) => {
      if (options?.method === "DELETE")
        throw new Error("Sem conexão. Tente novamente.");
      return { appearance: {}, widgets: [] } as never;
    });
    const saved = vi.fn();
    render(
      <ProfileDetailsEditor
        profile={{ id: "me", name: "Estudante", hasBanner: true }}
        onSaved={saved}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remover banner" }));
    await waitFor(() =>
      expect(
        screen.getAllByText("Sem conexão. Tente novamente.").length,
      ).toBeGreaterThan(0),
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Remover banner",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(saved).not.toHaveBeenCalled();
  });
});
