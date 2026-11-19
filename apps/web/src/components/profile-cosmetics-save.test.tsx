import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
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
vi.mock("./profile-edit-panel", () => ({
  ProfileEditPanel: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("./profile-visual-surface", () => ({
  ProfileVisualSurface: () => null,
}));

const saved = vi.fn().mockResolvedValue(undefined);
const sentDetails = () => {
  const call = vi
    .mocked(api)
    .mock.calls.find(([path]) => path === "/users/me/profile-details");
  return call ? JSON.parse(String(call[1]?.body)) : undefined;
};
beforeEach(() => {
  vi.mocked(api).mockImplementation(((path: string) =>
    Promise.resolve(
      path === "/cosmetics"
        ? {
            level: 2,
            items: [
              { id: "sakura", level: 1, unlocked: true },
              { id: "dragao", level: 5, unlocked: false },
            ],
          }
        : { appearance: {}, widgets: [] },
    )) as never);
  render(
    <ProfileDetailsEditor
      profile={{ id: "me", name: "Estudante" }}
      onSaved={saved}
    />,
  );
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const save = async () => {
  await waitFor(() => expect(api).toHaveBeenCalledWith("/users/me/showcase"));
  fireEvent.click(screen.getByRole("button", { name: "Salvar perfil" }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
};

it("saves the pack the student put on", async () => {
  const sakura = await screen.findByRole("group", { name: "Sakura" });
  fireEvent.click(
    within(sakura).getByRole("button", { name: "Usar o pacote completo" }),
  );
  await save();
  expect(sentDetails()).toMatchObject({
    cosmeticFrame: "sakura",
    cosmeticAvatar: "sakura",
    cosmeticEffect: "sakura",
  });
  // The pack's colours become the profile's own theme, free to change afterwards.
  const sent = (path: string) =>
    JSON.parse(
      String(
        vi
          .mocked(api)
          .mock.calls.find(
            ([called, options]) => called === path && options?.body,
          )![1]?.body,
      ),
    );
  expect(sent("/users/me/appearance").accentColor).toBe("#e86a9a");
  expect(sent("/users/me/showcase")).toMatchObject({
    secondaryColor: "#6d4bc4",
    theme: "GRADIENT",
  });
});

it("never saves a pack that was only tried on", async () => {
  const dragon = await screen.findByRole("group", { name: "Dragão Imperial" });
  fireEvent.click(within(dragon).getByRole("button", { name: "Experimentar" }));
  await save();
  expect(JSON.stringify(sentDetails())).not.toContain("dragao");
});

it("on a phone, trying a pack on brings the preview into view", async () => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width"),
  }));
  const preview = document.createElement("aside");
  preview.className = "profile-edit-live-preview";
  preview.scrollIntoView = vi.fn();
  document.body.append(preview);
  const dragon = await screen.findByRole("group", { name: "Dragão Imperial" });
  fireEvent.click(within(dragon).getByRole("button", { name: "Experimentar" }));
  await waitFor(() => expect(preview.scrollIntoView).toHaveBeenCalled());
  preview.remove();
  vi.unstubAllGlobals();
});
