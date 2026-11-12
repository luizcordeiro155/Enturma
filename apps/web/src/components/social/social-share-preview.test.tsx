import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { SocialSharePreview } from "./social-share-preview";
const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const url =
  "https://enturma-flax.vercel.app/social?post=198b4058-2776-4bac-840e-f696a15fe890";
it("does not reveal a thumbnail or author when the viewer has no access", async () => {
  api.mockRejectedValue(new Error("forbidden"));
  render(<SocialSharePreview text={url} />);
  await waitFor(() =>
    expect(
      screen.getByText("Publica\u00e7\u00e3o indispon\u00edvel."),
    ).toBeVisible(),
  );
  expect(screen.queryByRole("img")).toBeNull();
});
it("does not request arbitrary links from private messages", () => {
  render(
    <SocialSharePreview text="https://evil.test/social?post=198b4058-2776-4bac-840e-f696a15fe890" />,
  );
  expect(api).not.toHaveBeenCalled();
});
