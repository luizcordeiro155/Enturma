import { api, post } from "./api";
import { synchronizeAccountIdentity } from "./account-chat-sync";
import { conversationKey, encryptMessage } from "./private-chat-crypto";

/** Uses the same account identity and authenticated friendship as private chat. */
export async function prepareRoomInvitation(
  roomId: string,
  friendshipId: string,
  clientId: string,
) {
  const [user, invitation, peer] = await Promise.all([
    api<{ id: string }>("/users/me", { cache: "no-store" }),
    // Recheck membership and retrieve the current invite code at send time.
    post<{ url: string }>(`/study-rooms/${roomId}/share-code`),
    api<{ publicKey: JsonWebKey }>(`/friends/${friendshipId}/identity`, {
      cache: "no-store",
    }),
  ]);
  const { identity } = await synchronizeAccountIdentity(user.id);
  const key = await conversationKey(identity, peer.publicKey, friendshipId);
  return encryptMessage(key, invitation.url, friendshipId, user.id, clientId);
}
