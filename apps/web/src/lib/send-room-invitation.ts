import { api, post } from "./api";
import { synchronizeAccountIdentity } from "./account-chat-sync";
import { conversationKey, encryptMessage } from "./private-chat-crypto";

/** Uses the same account identity and authenticated friendship as private chat. */
export async function prepareRoomInvitation(
  roomId: string,
  friendshipId: string,
  clientId: string,
) {
  const invitation = await post<{ url: string }>(`/study-rooms/${roomId}/share-code`);
  return preparePrivateShare(friendshipId, invitation.url, clientId);
}

/** Reuses authenticated, encrypted private chat for a user-initiated share. */
export async function preparePrivateShare(friendshipId: string, text: string, clientId: string) {
  const [user, peer] = await Promise.all([
    api<{ id: string }>("/users/me", { cache: "no-store" }),
    api<{ publicKey: JsonWebKey }>(`/friends/${friendshipId}/identity`, {
      cache: "no-store",
    }),
  ]);
  const { identity } = await synchronizeAccountIdentity(user.id);
  const key = await conversationKey(identity, peer.publicKey, friendshipId);
  return encryptMessage(key, text, friendshipId, user.id, clientId);
}
