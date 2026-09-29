import { describe, it, expect, vi } from "vitest";
import { webcrypto } from "node:crypto";
import {
  createIdentity,
  conversationKey,
  encryptMessage,
  decryptMessage,
  fingerprint,
  exportBackup,
  importBackup,
} from "./private-chat-crypto";
vi.stubGlobal("crypto", webcrypto);
describe("private chat cryptography", () => {
  it("derives matching keys and rejects changed ciphertext, sender and conversation", async () => {
    const a = await createIdentity(),
      b = await createIdentity(),
      c = await createIdentity();
    const ka = await conversationKey(a, b.publicKey, "friendship"),
      kb = await conversationKey(b, a.publicKey, "friendship");
    const envelope = {
      ...(await encryptMessage(
        ka,
        "Mensagem privada 🔒",
        "friendship",
        "alice",
        "message-id",
      )),
      senderId: "alice",
    };
    expect(await decryptMessage(kb, envelope, "friendship")).toBe(
      "Mensagem privada 🔒",
    );
    expect(await fingerprint(a.publicKey, b.publicKey)).toBe(
      await fingerprint(b.publicKey, a.publicKey),
    );
    await expect(
      decryptMessage(kb, { ...envelope, senderId: "attacker" }, "friendship"),
    ).rejects.toThrow();
    await expect(
      decryptMessage(kb, envelope, "another-room"),
    ).rejects.toThrow();
    await expect(
      decryptMessage(
        await conversationKey(c, a.publicKey, "friendship"),
        envelope,
        "friendship",
      ),
    ).rejects.toThrow();
    const altered = {
      ...envelope,
      ciphertext:
        (envelope.ciphertext[0] === "A" ? "B" : "A") +
        envelope.ciphertext.slice(1),
    };
    await expect(decryptMessage(kb, altered, "friendship")).rejects.toThrow();
  });
  it("exports only a password encrypted backup and restores the same identity", async () => {
    const identity = await createIdentity();
    const backup = await exportBackup(identity, "a-long-backup-password");
    expect(backup).not.toContain(identity.privateKey.d!);
    expect(await importBackup(backup, "a-long-backup-password")).toEqual(
      identity,
    );
    await expect(importBackup(backup, "incorrect-password")).rejects.toThrow();
  });
});
