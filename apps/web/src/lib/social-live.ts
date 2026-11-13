import type { SocialPerson } from "./social";
export type SocialLive = SocialPerson & {
  authorId: string;
  title: string;
  state: "STARTING" | "LIVE" | "ENDED";
  visibility: "PUBLIC" | "FOLLOWERS";
  startedAt: string;
  viewers: number;
  peakViewers: number;
};
export type LiveMessage = { id: string; kind: "CHAT" | "HEART"; body: string };
export function decodeLiveMessage(bytes: Uint8Array): LiveMessage | null {
  if (bytes.byteLength > 4096) return null;
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (
      typeof value.id !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(value.id) ||
      !["CHAT", "HEART"].includes(value.kind) ||
      typeof value.body !== "string" ||
      value.body.length > 500
    )
      return null;
    if (value.kind === "CHAT" && !value.body.trim()) return null;
    return { id: value.id, kind: value.kind, body: value.body };
  } catch {
    return null;
  }
}
export function encodeLiveMessage(
  kind: LiveMessage["kind"],
  body: string,
): Uint8Array<ArrayBuffer> {
  const value = { id: crypto.randomUUID(), kind, body: body.trim() };
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  if (!decodeLiveMessage(bytes))
    throw new Error("Escreva uma mensagem de at\u00e9 500 caracteres.");
  return bytes;
}
