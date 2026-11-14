import { base64 } from "./private-chat-crypto";

/**
 * The Android app decrypts private-message notifications on the phone, so it can
 * show the text and stack messages per person like WhatsApp. It needs each
 * conversation's key; the page hands them over once the person's keys are
 * unlocked here. Outside the Android app this does nothing.
 */
type Bridge = {
  storeConversationKeys?: (json: string) => void;
  clearConversationNotifications?: (conversation: string) => void;
};

function bridge(): Bridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as { EnturmaNative?: Bridge }).EnturmaNative;
}

export function canSyncNotificationKeys() {
  return typeof bridge()?.storeConversationKeys === "function";
}

export async function syncNotificationKeys(
  user: string,
  conversations: string[],
  keyFor: (conversation: string) => Promise<Uint8Array>,
) {
  if (!canSyncNotificationKeys()) return;
  const keys: Record<string, string> = {};
  for (const conversation of conversations) {
    try {
      keys[conversation] = base64(await keyFor(conversation));
    } catch {
      // That friend has no published key yet; its notifications stay generic.
    }
  }
  bridge()?.storeConversationKeys?.(JSON.stringify({ user, keys }));
}

export function clearConversationNotifications(conversation: string) {
  bridge()?.clearConversationNotifications?.(conversation);
}
