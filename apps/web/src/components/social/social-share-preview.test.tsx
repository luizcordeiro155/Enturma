import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { SocialSharePreview } from "./social-share-preview";
const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
let intersect: (visible: boolean) => void;
beforeEach(() => {
  api.mockReset();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) {
      intersect = (isIntersecting: boolean) => callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const url = "https://enturma-flax.vercel.app/social?post=198b4058-2776-4bac-840e-f696a15fe890";
it("does not reveal a thumbnail or author when a visible card has no access", async () => {
  api.mockRejectedValue(new Error("forbidden"));
  render(<SocialSharePreview text={url} />);
  expect(api).not.toHaveBeenCalled();
  act(() => intersect(true));
  await waitFor(() => expect(screen.getByText("Publica\u00e7\u00e3o indispon\u00edvel.")).toBeVisible());
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
});
it("does not request a hidden card until it enters the viewport", async () => {
  api.mockRejectedValue(new Error("forbidden"));
  render(<SocialSharePreview text={url} />);
  act(() => intersect(false));
  expect(api).not.toHaveBeenCalled();
  act(() => intersect(true));
  await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
});
it("clears author and media when a later authorization check fails", async () => {
  api.mockResolvedValueOnce({id:"198b4058-2776-4bac-840e-f696a15fe890",kind:"CLIP",name:"Autora",username:"autora",body:"Projeto",media:[{id:"private-media",kind:"VIDEO"}]}).mockRejectedValue(new Error("forbidden"));
  const { container } = render(<SocialSharePreview text={url} />);
  act(() => intersect(true));
  await screen.findByRole("link", { name: "Abrir Clip de Autora" });
  expect(container.querySelector("img")).not.toBeNull();
  act(() => window.dispatchEvent(new Event("enturma-social_changed")));
  await screen.findByText("Publica\u00e7\u00e3o indispon\u00edvel.");
  expect(container.querySelector("img")).toBeNull();
  expect(screen.queryByText("Autora")).toBeNull();
});
it("does not request arbitrary links from private messages", () => {
  render(<SocialSharePreview text="https://evil.test/social?post=198b4058-2776-4bac-840e-f696a15fe890" />);
  expect(api).not.toHaveBeenCalled();
});
