/**
 * The last message of a private conversation, for the Amigos list. Messages stay
 * end-to-end encrypted: the text is decrypted here, on the person's device, with
 * the same conversation key used when the chat is opened.
 */
import { providerMessageUrl } from "./klipy";
import {
  sharedSocialPostId,
  sharedSocialProfileId,
} from "./social-stream-state";

export type PreviewRow = {
  id: string;
  createdAt: string;
  senderId: string;
  deletedAt?: string | null;
  hiddenAt?: string | null;
  attachmentMime?: string | null;
  attachmentCiphertext?: string | null;
  mediaKind?: "STICKER" | "GIF" | null;
};

export type ConversationPreview = { id: string; text: string; mine: boolean };

export async function latestPreview<Row extends PreviewRow>(
  rows: Row[],
  me: string,
  decrypt: (row: Row) => Promise<string>,
): Promise<ConversationPreview | null> {
  const newest = rows
    .filter((row) => !row.deletedAt && !row.hiddenAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!newest) return null;
  // Text that fails authentication is never shown.
  const text = await decrypt(newest).catch(() => "");
  return {
    id: newest.id,
    mine: newest.senderId === me,
    text: previewLabel(text.trim()) || attachmentLabel(newest),
  };
}

/** A message that is only a GIF, a shared post or a shared profile reads as such. */
export function previewLabel(text: string) {
  if (!text) return "";
  if (providerMessageUrl(text)) return "GIF";
  if (/^\S+$/.test(text) && sharedSocialPostId(text))
    return "Publicação do Social";
  if (/^\S+$/.test(text) && sharedSocialProfileId(text))
    return "Perfil compartilhado";
  return text;
}

function attachmentLabel(row: PreviewRow) {
  if (row.mediaKind === "STICKER") return "Figurinha";
  if (row.mediaKind === "GIF") return "GIF";
  if (row.attachmentMime?.startsWith("audio/")) return "Mensagem de voz";
  if (row.attachmentMime?.startsWith("image/")) return "Imagem";
  return "Mensagem privada";
}
