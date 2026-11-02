import { afterEach, expect, test, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { Blob, File } from "node:buffer";
import {
  createIdentity,
  conversationKey,
  encryptAttachment,
  decryptAttachment,
} from "./private-chat-crypto";
afterEach(() => vi.unstubAllGlobals());
test("audio remains encrypted and authenticated to sender, conversation and mime type", async () => {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("Blob", Blob);
  const a = await createIdentity(),
    b = await createIdentity();
  const sender = await conversationKey(a, b.publicKey, "chat"),
    recipient = await conversationKey(b, a.publicKey, "chat");
  const file = new File(
    [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3])],
    "voice.webm",
    { type: "audio/webm" },
  );
  const encrypted = {
    ...(await encryptAttachment(
      sender,
      file as unknown as globalThis.File,
      "chat",
      "alice",
      "id",
    )),
    senderId: "alice",
    clientId: "id",
  };
  expect(encrypted.attachmentCiphertext).not.toBe(
    Buffer.from(await file.arrayBuffer()).toString("base64"),
  );
  const clear = await decryptAttachment(recipient, encrypted, "chat");
  expect(new Uint8Array(await clear!.arrayBuffer())).toEqual(
    new Uint8Array(await file.arrayBuffer()),
  );
  await expect(
    decryptAttachment(
      recipient,
      { ...encrypted, attachmentMime: "image/png" },
      "chat",
    ),
  ).rejects.toThrow();
  await expect(
    decryptAttachment(recipient, encrypted, "other-chat"),
  ).rejects.toThrow();
});
