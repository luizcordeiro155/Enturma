import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { defaultRecipe } from "@/lib/social";
import { emptySocialDraft } from "@/lib/social-draft";
import { SocialEditor } from "./social-editor";

const { localDraft } = vi.hoisted(() => ({ localDraft: vi.fn() }));
vi.mock("@/lib/api", () => ({
  api: vi.fn().mockResolvedValue([]),
  post: vi.fn(),
}));
vi.mock("@/lib/social-draft", async (original) => ({
  ...(await original<typeof import("@/lib/social-draft")>()),
  localSocialDraft: localDraft,
}));
vi.mock("../navigation-link", () => ({ NavigationLink: () => null }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("keeps the selected video frame when replacing a gallery cover in the same event", async () => {
  localDraft.mockResolvedValue({
    ...emptySocialDraft(),
    kind: "CLIP",
    files: [
      {
        id: "video-cover",
        file: new File(["video"], "clip.mp4", { type: "video/mp4" }),
        duration: 30,
        recipe: defaultRecipe(30),
        coverFile: new File(["cover"], "cover.png", { type: "image/png" }),
      },
    ],
  });
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:cover-test"),
      revokeObjectURL: vi.fn(),
    }),
  );
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  render(
    <SocialEditor
      user="me"
      mediaEnabled
      initialKind="CLIP"
      published={() => {}}
    />,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Escolher capa" }));
  const cursor = screen.getByRole("slider", {
    name: "Escolher quadro da capa",
  });
  fireEvent.keyDown(cursor, { key: "ArrowRight" });
  expect(cursor).toHaveAttribute("aria-valuenow", "0.1");
  expect(screen.getByLabelText("Posição de reprodução")).toHaveValue("0.1");
  expect(
    screen.queryByText(/Capa selecionada: cover.png/),
  ).not.toBeInTheDocument();
});
