import { beforeEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { api } from "./api";
import { synchronizeAccountIdentity } from "./account-chat-sync";
import {
  createIdentity,
  encryptAccountIdentity,
  readIdentity,
  storeIdentity,
  publicFields,
  type AccountIdentityVault,
} from "./private-chat-crypto";

vi.stubGlobal("crypto", webcrypto);
vi.mock("./api", () => ({ api: vi.fn() }));
vi.mock("./private-chat-crypto", async (original) => ({
  ...(await original<typeof import("./private-chat-crypto")>()),
  readIdentity: vi.fn(),
  storeIdentity: vi.fn(),
  readAccountWrappingKey: vi.fn().mockResolvedValue(null),
}));
beforeEach(() => vi.clearAllMocks());

async function server(envelope?: AccountIdentityVault) {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
  const state = { epoch: 1, key: btoa(String.fromCharCode(...raw)), envelope };
  return { state, wrapping: { epoch: 1, key } };
}

it("migrates an existing identity and restores it on a device with no local key or password", async () => {
  const original = await createIdentity();
  const { state } = await server();
  vi.mocked(readIdentity).mockResolvedValue(original);
  vi.mocked(api).mockImplementation(async (path, options) => {
    if (path.endsWith("/capabilities")) return { accountSessionSync: true };
    if (path === "/private-identity")
      return [{ publicKey: publicFields(original.publicKey) }];
    if (path.endsWith("/session") && options?.method === "PUT") {
      state.envelope = JSON.parse(options.body as string);
      return undefined;
    }
    if (path.endsWith("/session")) return { ...state };
    throw Error(`Unexpected request: ${path}`);
  });
  const [first, concurrent] = await Promise.all([
    synchronizeAccountIdentity("alice"),
    synchronizeAccountIdentity("alice"),
  ]);
  expect(first).toEqual(concurrent);
  expect(state.envelope).toBeDefined();
  expect(JSON.stringify(state.envelope)).not.toContain(original.privateKey.d!);
  vi.mocked(readIdentity).mockResolvedValue(undefined);
  const secondDevice = await synchronizeAccountIdentity("alice");
  expect(secondDevice.identity).toEqual(original);
  expect(storeIdentity).toHaveBeenCalledWith("alice", original);
  expect(
    vi
      .mocked(api)
      .mock.calls.filter(
        ([p, o]) => p.endsWith("/session") && o?.method === "PUT",
      ),
  ).toHaveLength(1);
});

it("rejects another account's envelope and preserves local keys after tampering", async () => {
  const original = await createIdentity();
  const { state, wrapping } = await server();
  state.envelope = await encryptAccountIdentity(original, wrapping, "alice");
  vi.mocked(api).mockImplementation(async (path) =>
    path.endsWith("/capabilities")
      ? { accountSessionSync: true }
      : path === "/private-identity"
        ? [{ publicKey: publicFields(original.publicKey) }]
        : state,
  );
  await expect(synchronizeAccountIdentity("bob")).rejects.toThrow();
  state.envelope.data =
    (state.envelope.data[0] === "A" ? "B" : "A") + state.envelope.data.slice(1);
  await expect(synchronizeAccountIdentity("alice")).rejects.toThrow();
  expect(storeIdentity).not.toHaveBeenCalled();
});

it("does not replace an old identity whose private key was never synchronized", async () => {
  const original = await createIdentity();
  const { state } = await server();
  vi.mocked(readIdentity).mockResolvedValue(undefined);
  vi.mocked(api).mockImplementation(async (path) => {
    if (path.endsWith("/capabilities")) return { accountSessionSync: true };
    if (path === "/private-identity")
      return [{ publicKey: publicFields(original.publicKey) }];
    return path.endsWith("/session") ? state : { epoch: 2 };
  });
  await expect(synchronizeAccountIdentity("alice")).rejects.toThrow(
    /histórico antigo/,
  );
  expect(storeIdentity).not.toHaveBeenCalled();
  expect(vi.mocked(api).mock.calls.some(([, o]) => o?.method === "PUT")).toBe(
    false,
  );
});
