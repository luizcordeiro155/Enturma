import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { defaultRecipe } from "@/lib/social";
import { SocialDraftPreview } from "./social-draft-preview";

beforeEach(() => {
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("reviews the selected cover in source time without modifying the recipe", async () => {
  const recipe = {
    ...defaultRecipe(30),
    segments: [{ start: 10, end: 20 }],
    cover: 2,
    captions: [{ text: "Texto na capa", start: 1, end: 4, y: 0.5 }],
  };
  const { container, unmount } = render(
    <SocialDraftPreview
      item={{
        id: "clip",
        file: new File(["video"], "clip.mp4", { type: "video/mp4" }),
        recipe,
      }}
    />,
  );
  await waitFor(() =>
    expect(container.querySelector("video")).toHaveAttribute(
      "src",
      "blob:preview",
    ),
  );
  const video = container.querySelector("video")!;
  Object.defineProperties(video, {
    videoWidth: { value: 1920 },
    videoHeight: { value: 1080 },
  });
  fireEvent.loadedMetadata(video);
  expect(video.currentTime).toBe(12);
  expect(screen.getByText("Texto na capa")).toBeVisible();
  expect(screen.queryByRole("button")).toBeNull();
  expect(recipe.cover).toBe(2);
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
});

it("uses an imported cover without applying video crops or captions a second time", async () => {
  const coverFile = new File(["image"], "cover.png", { type: "image/png" });
  const { container } = render(
    <SocialDraftPreview
      item={{
        id: "clip",
        coverFile,
        file: new File(["video"], "clip.mp4", { type: "video/mp4" }),
        recipe: {
          ...defaultRecipe(10),
          zoom: 2,
          rotation: 90,
          captions: [{ text: "Somente no vídeo", start: 0, end: 10, y: 0.5 }],
        },
      }}
    />,
  );
  await waitFor(() =>
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "blob:preview",
    ),
  );
  expect(URL.createObjectURL).toHaveBeenCalledWith(coverFile);
  expect(container.querySelector("video")).toBeNull();
  expect(screen.queryByText("Somente no vídeo")).toBeNull();
  expect(container.querySelector("img")).toHaveStyle({ objectFit: "contain" });
});
