import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { SocialEditor } from "./social-editor";

const { api, localDraft } = vi.hoisted(() => ({ api: vi.fn(), localDraft: vi.fn() }));
vi.mock("@/lib/api", () => ({ api, post: vi.fn() }));
vi.mock("@/lib/social-draft", async original => ({
  ...await original<typeof import("@/lib/social-draft")>(), localSocialDraft: localDraft,
}));
vi.mock("../navigation-link", () => ({ NavigationLink: (props: ComponentProps<"a">) => <a {...props} /> }));
// The image canvas has its own geometry tests. This suite exercises the real
// selection, upload, export, draft and publish coordinator, not the canvas.
vi.mock("./image-editor", () => ({ ImageEditor: () => <div aria-label="Imagem selecionada" /> }));

let mediaId = "";
let exported = false;
const png = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13]);
function respond(path: string, options?: RequestInit) {
  if (path === "/social/media" && options?.method === "POST") {
    mediaId = JSON.parse(String(options.body)).id;
    return Promise.resolve({ id: mediaId, receivedBytes: 0, partCount: 0, chunkBytes: 2097152 });
  }
  if (path.endsWith("/parts/0")) return Promise.resolve({ receivedBytes: png.length });
  if (path.endsWith("/export")) {
    exported = true;
    return Promise.resolve({ id: mediaId, kind: "IMAGE", state: "READY", width: 720, height: 900 });
  }
  if (path === `/social/media/${mediaId}`) return Promise.resolve({ id: mediaId, kind: "IMAGE", state: exported ? "READY" : "UPLOADING" });
  if (path === "/social/drafts" && options?.method === "PUT") return Promise.resolve({ version: 1 });
  if (path.endsWith("/publish")) return Promise.resolve({ state: "PUBLISHED" });
  if (path === "/portfolio/me") return Promise.resolve({ username: "eu", publicProfile: false, projects: [] });
  return Promise.resolve([]);
}
async function selectPhoto(type = "image/png", name = "foto.png") {
  const input = await screen.findByLabelText("Escolher mídia");
  fireEvent.change(input, { target: { files: [new File([png], name, { type })] } });
  await screen.findByLabelText("Imagem selecionada");
}
beforeEach(() => {
  mediaId = "";
  exported = false;
  localDraft.mockReset().mockResolvedValue(null);
  api.mockReset().mockImplementation(respond);
  vi.stubGlobal("URL", Object.assign(URL, {
    createObjectURL: vi.fn(() => "blob:test-photo"), revokeObjectURL: vi.fn(),
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("offers native visual-media selection without forcing camera capture", async () => {
  render(<SocialEditor user="me" mediaEnabled initialKind="POST" published={() => {}} />);
  const input = await screen.findByLabelText("Escolher mídia");
  expect(input).toHaveAttribute("accept", "image/*,video/*");
  expect(input).not.toHaveAttribute("capture");
  expect(input).toHaveAttribute("multiple");
});
it("restricts a Clip picker to videos instead of offering incompatible photos", async () => {
  render(<SocialEditor user="me" mediaEnabled initialKind="CLIP" published={() => {}} />);
  expect(await screen.findByLabelText("Escolher mídia")).toHaveAttribute("accept", "video/*");
});
it("accepts a gallery photo whose provider omits its MIME type", async () => {
  render(<SocialEditor user="me" mediaEnabled initialKind="POST" published={() => {}} />);
  await selectPhoto("", "foto.PNG");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enviar e publicar" })).toBeEnabled();
});
it("publishes a photo only after upload, export, draft and API confirmation", async () => {
  let finish!: (value: unknown) => void;
  api.mockImplementation((path: string, options?: RequestInit) => path.endsWith("/publish")
    ? new Promise(resolve => { finish = resolve; }) : respond(path, options));
  const published = vi.fn();
  render(<SocialEditor user="me" mediaEnabled initialKind="POST" published={published} />);
  await selectPhoto();
  fireEvent.click(screen.getByRole("button", { name: "Enviar e publicar" }));
  await waitFor(() => expect(api.mock.calls.some(([path]) => String(path).endsWith("/publish"))).toBe(true));
  expect(published).not.toHaveBeenCalled();
  const paths = api.mock.calls.map(([path]) => String(path));
  expect(paths.indexOf(`/social/media/${mediaId}/parts/0`)).toBeLessThan(paths.indexOf(`/social/media/${mediaId}/export`));
  expect(api).toHaveBeenCalledWith("/social/drafts", expect.objectContaining({
    method: "PUT", body: expect.stringContaining(mediaId),
  }));
  finish({ state: "PUBLISHED" });
  await waitFor(() => expect(published).toHaveBeenCalledExactlyOnceWith("POST"));
  expect(screen.getByRole("status")).toHaveTextContent("Publicado no Enturma.");
});
it("keeps a selected photo and its caption when upload fails", async () => {
  api.mockImplementation((path: string, options?: RequestInit) => path.endsWith("/parts/0")
    ? Promise.reject(new Error("Falha de conexão")) : respond(path, options));
  const published = vi.fn();
  render(<SocialEditor user="me" mediaEnabled initialKind="POST" published={published} />);
  await selectPhoto();
  fireEvent.change(screen.getByRole("textbox", { name: /compartilhar/i }), { target: { value: "Meu projeto" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar e publicar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Falha de conexão");
  expect(screen.getByLabelText("Imagem selecionada")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /compartilhar/i })).toHaveValue("Meu projeto");
  expect(published).not.toHaveBeenCalled();
});
