import { expect, it, vi } from "vitest";
import { latestPreview, previewLabel } from "./private-chat-preview";

const row = (
  id: string,
  createdAt: string,
  over: Record<string, unknown> = {},
) => ({
  id,
  createdAt,
  senderId: "bia",
  clientId: id,
  iv: "iv",
  ciphertext: "c",
  ...over,
});

it("decrypts only the newest visible message, on this device", async () => {
  const decrypt = vi.fn(async (m: { id: string }) => `texto ${m.id}`);
  const preview = await latestPreview(
    [
      row("a", "2026-11-14T10:00:00Z"),
      row("b", "2026-11-14T12:00:00Z"),
      row("c", "2026-11-14T13:00:00Z", { deletedAt: "2026-11-14T13:01:00Z" }),
    ],
    "me",
    decrypt,
  );
  expect(preview).toEqual({ id: "b", text: "texto b", mine: false });
  expect(decrypt).toHaveBeenCalledTimes(1);
});

it("marks your own last message and names attachments without opening them", async () => {
  const decrypt = vi.fn(async () => "");
  expect(
    await latestPreview(
      [
        row("v", "2026-11-14T10:00:00Z", {
          senderId: "me",
          attachmentMime: "audio/webm",
        }),
      ],
      "me",
      decrypt,
    ),
  ).toEqual({ id: "v", text: "Mensagem de voz", mine: true });
  expect(
    await latestPreview(
      [
        row("s", "2026-11-14T10:00:00Z", {
          attachmentMime: "image/webp",
          mediaKind: "STICKER",
        }),
      ],
      "me",
      decrypt,
    ),
  ).toMatchObject({ text: "Figurinha" });
  expect(
    await latestPreview(
      [row("i", "2026-11-14T10:00:00Z", { attachmentMime: "image/jpeg" })],
      "me",
      decrypt,
    ),
  ).toMatchObject({ text: "Imagem" });
});

it("never shows text it could not authenticate", async () => {
  const preview = await latestPreview(
    [row("x", "2026-11-14T10:00:00Z")],
    "me",
    async () => {
      throw new Error("bad tag");
    },
  );
  expect(preview).toEqual({ id: "x", text: "Mensagem privada", mine: false });
});

it("has nothing to show for an empty conversation", async () => {
  expect(await latestPreview([], "me", async () => "")).toBeNull();
});

it("names a GIF or a shared Social post instead of showing the raw link", async () => {
  const at = "2026-11-14T10:00:00Z";
  const gif = await latestPreview(
    [row("g", at)],
    "me",
    async () => "https://static.klipy.com/ii/c3a19a0b747a76e/aa/bb.gif",
  );
  expect(gif).toMatchObject({ text: "GIF" });
  const shared = await latestPreview(
    [row("p", at)],
    "me",
    async () =>
      "https://enturma-flax.vercel.app/social?post=8a6c2f9e-0000-4000-8000-000000000001",
  );
  expect(shared).toMatchObject({ text: "Publicação do Social" });
  const talk = await latestPreview(
    [row("t", at)],
    "me",
    async () =>
      "olha isso https://enturma-flax.vercel.app/social?post=8a6c2f9e-0000-4000-8000-000000000001",
  );
  expect(talk).toMatchObject({
    text: "olha isso https://enturma-flax.vercel.app/social?post=8a6c2f9e-0000-4000-8000-000000000001",
  });
});

it("names a shared profile, in the list and in the open conversation alike", async () => {
  const link =
    "https://enturma-flax.vercel.app/social?person=8a6c2f9e-0000-4000-8000-000000000001";
  const shared = await latestPreview(
    [row("p", "2026-11-14T10:00:00Z")],
    "me",
    async () => link,
  );
  expect(shared).toMatchObject({ text: "Perfil compartilhado" });
  expect(previewLabel(link)).toBe("Perfil compartilhado");
  // Words around the link are the message: they stay.
  expect(previewLabel(`olha ${link}`)).toBe(`olha ${link}`);
});
