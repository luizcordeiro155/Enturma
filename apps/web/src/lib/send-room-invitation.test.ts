import { beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { api, post } from "./api";
import { synchronizeAccountIdentity } from "./account-chat-sync";
import {
  createIdentity,
  conversationKey,
  decryptMessage,
} from "./private-chat-crypto";
import { prepareRoomInvitation } from "./send-room-invitation";

vi.mock("./api", () => ({ api: vi.fn(), post: vi.fn() }));
vi.mock("./account-chat-sync", () => ({ synchronizeAccountIdentity: vi.fn() }));
vi.stubGlobal("crypto", webcrypto);
beforeEach(() => vi.resetAllMocks());

describe("encrypted room invitations", () => {
  it("revalidates room membership and friendship, encrypting only for the accepted peer", async () => {
    const sender = await createIdentity();
    const recipient = await createIdentity();
    vi.mocked(api).mockImplementation(async (path) =>
      path === "/users/me"
        ? { id: "sender" }
        : { publicKey: recipient.publicKey },
    );
    vi.mocked(post).mockResolvedValue({
      url: "https://enturma.test/join/MDUT2SGT",
    });
    vi.mocked(synchronizeAccountIdentity).mockResolvedValue({
      identity: sender,
      synced: true,
    });
    const payload = await prepareRoomInvitation("room", "friendship", "client");
    expect(post).toHaveBeenCalledWith("/study-rooms/room/share-code");
    expect(api).toHaveBeenCalledWith("/friends/friendship/identity", {
      cache: "no-store",
    });
    expect(JSON.stringify(payload)).not.toContain("/join/");
    const key = await conversationKey(
      recipient,
      sender.publicKey,
      "friendship",
    );
    expect(
      await decryptMessage(
        key,
        { ...payload, senderId: "sender" },
        "friendship",
      ),
    ).toBe("https://enturma.test/join/MDUT2SGT");
    expect(post).toHaveBeenCalledTimes(1); // Preparing does not send a private message.
  });
  it("cannot prepare an invite when membership or friendship is rejected", async () => {
    vi.mocked(api).mockResolvedValue({ id: "sender" });
    vi.mocked(post).mockRejectedValue(Error("Acesso negado"));
    await expect(
      prepareRoomInvitation("room", "friendship", "client"),
    ).rejects.toThrow("Acesso negado");
    expect(synchronizeAccountIdentity).not.toHaveBeenCalled();
  });
});
