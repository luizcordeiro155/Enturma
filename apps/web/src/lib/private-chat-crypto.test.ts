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
  encryptIdentityVault,
  decryptIdentityVault,
  deriveAccountWrappingKey,
  encryptAccountIdentity,
  decryptAccountIdentity,
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

it("unlocks the same identity on another device, preserving old messages and rejecting tampering", async () => {
  const original = await createIdentity(),
    peer = await createIdentity();
  const password = "exclusive-conversation-passphrase";
  const vault = await encryptIdentityVault(original, password, "alice");
  expect(JSON.stringify(vault)).not.toContain(original.privateKey.d!);
  expect(JSON.stringify(vault)).not.toContain(password);
  const message = {
    ...(await encryptMessage(
      await conversationKey(peer, original.publicKey, "thread"),
      "Existing history",
      "thread",
      "bob",
      "m1",
    )),
    senderId: "bob",
  };
  const restored = await decryptIdentityVault(vault, password, "alice");
  expect(restored).toEqual(original);
  expect(
    await decryptMessage(
      await conversationKey(restored, peer.publicKey, "thread"),
      message,
      "thread",
    ),
  ).toBe("Existing history");
  await expect(
    decryptIdentityVault(vault, "wrong-password", "alice"),
  ).rejects.toThrow();
  await expect(decryptIdentityVault(vault, password, "bob")).rejects.toThrow();
  await expect(
    decryptIdentityVault(
      {
        ...vault,
        data: (vault.data[0] === "A" ? "B" : "A") + vault.data.slice(1),
      },
      password,
      "alice",
    ),
  ).rejects.toThrow();
  await expect(
    decryptIdentityVault(
      { ...vault, publicKey: { ...vault.publicKey, x: peer.publicKey.x! } },
      password,
      "alice",
    ),
  ).rejects.toThrow();
  await expect(
    encryptIdentityVault(original, "short", "alice"),
  ).rejects.toThrow();
});

it("opens the same account identity on a new device without a separate chat password", async () => {
  const identity = await createIdentity();
  const first = await deriveAccountWrappingKey(
    "account-password-123",
    "alice",
    1,
  );
  const vault = await encryptAccountIdentity(identity, first, "alice");
  const second = await deriveAccountWrappingKey(
    "account-password-123",
    "alice",
    1,
  );
  expect(first.key.extractable).toBe(false);
  expect(JSON.stringify(vault)).not.toContain(identity.privateKey.d!);
  expect(await decryptAccountIdentity(vault, second, "alice")).toEqual(
    identity,
  );
  await expect(
    decryptAccountIdentity(
      vault,
      await deriveAccountWrappingKey("wrong-password", "alice", 1),
      "alice",
    ),
  ).rejects.toThrow();
  await expect(decryptAccountIdentity(vault, first, "bob")).rejects.toThrow();
  await expect(
    decryptAccountIdentity({ ...vault, epoch: 2 }, first, "alice"),
  ).rejects.toThrow();
  const rotated = await deriveAccountWrappingKey(
    "new-account-password",
    "alice",
    2,
  );
  const migrated = await encryptAccountIdentity(identity, rotated, "alice");
  expect(await decryptAccountIdentity(migrated, rotated, "alice")).toEqual(
    identity,
  );
});
