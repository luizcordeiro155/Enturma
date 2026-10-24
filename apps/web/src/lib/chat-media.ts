import { api } from "./api";
import { preparePrivateChatImage } from "./chat-image";

export type ChatMedia = {
  id: string;
  name: string;
  kind: "STICKER" | "GIF";
  favorite: boolean;
  src?: string;
};
export const ENTURMA_GIFS: ChatMedia[] = [
  ["vamos-estudar", "Vamos estudar"],
  ["consegui", "Consegui!"],
  ["boa-ideia", "Boa ideia"],
  ["pausa", "Hora da pausa"],
  ["obrigado", "Valeu, turma"],
  ["foco", "Modo foco"],
].map(([id, name]) => ({
  id,
  name,
  kind: "GIF",
  favorite: false,
  src: `/chat-media/${id}.gif`,
}));

export async function saveChatMedia(
  file: File,
  kind: ChatMedia["kind"],
  name = file.name,
) {
  const prepared = await preparePrivateChatImage(file);
  const body = new FormData();
  body.set("file", prepared);
  body.set("kind", kind);
  body.set("name", name);
  return api<ChatMedia>("/chat-media", { method: "POST", body });
}
export async function chatMediaFile(item: ChatMedia): Promise<File> {
  const response = await fetch(
    item.src ?? `/api/backend/chat-media/${item.id}/file`,
  );
  if (!response.ok) throw Error("Não foi possível carregar esta mídia.");
  const blob = await response.blob();
  return new File(
    [blob],
    `${item.name}.${blob.type === "image/gif" ? "gif" : "webp"}`,
    { type: blob.type },
  );
}
