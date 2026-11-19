import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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
const open = () =>
  render(
    <ProfileDetailsEditor
      profile={{
        id: "me",
        name: "Estudante",
        profileDetails: { website: "https://kayn.online" },
      }}
      onSaved={saved}
    />,
  );

beforeEach(() => {
  vi.mocked(api).mockResolvedValue({ appearance: {}, widgets: [] } as never);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("saves the links as a list and retires the old single site", async () => {
  open();
  expect(screen.getByLabelText("Link 1")).toHaveValue("https://kayn.online");
  fireEvent.click(screen.getByRole("button", { name: "Adicionar link" }));
  fireEvent.change(screen.getByLabelText("Link 2"), {
    target: { value: "github.com/ana" },
  });
  await waitFor(() => expect(api).toHaveBeenCalledWith("/users/me/showcase"));
  fireEvent.click(screen.getByRole("button", { name: "Salvar perfil" }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(sentDetails()).toMatchObject({
    website: "",
    links: ["https://kayn.online", "https://github.com/ana"],
  });
});

it("asks to fix a link it cannot understand instead of saving it", async () => {
  open();
  fireEvent.change(screen.getByLabelText("Link 1"), {
    target: { value: "meu site" },
  });
  await waitFor(() => expect(api).toHaveBeenCalledWith("/users/me/showcase"));
  fireEvent.click(screen.getByRole("button", { name: "Salvar perfil" }));
  expect(
    (await screen.findAllByText(/Confira o link 1/)).length,
  ).toBeGreaterThan(0);
  expect(sentDetails()).toBeUndefined();
  expect(saved).not.toHaveBeenCalled();
});
