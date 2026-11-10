import type { SocialMedia, VideoRecipe } from "./social";
export type DraftFile = {
  id: string;
  file?: File;
  media?: SocialMedia;
  recipe?: VideoRecipe;
  duration?: number;
};
export type SocialDraft = {
  id: string;
  version: number;
  kind: "POST" | "STORY" | "CLIP";
  body: string;
  visibility: "PUBLIC" | "FOLLOWERS";
  projectUrl: string;
  files: DraftFile[];
};
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("enturma-social-drafts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function localSocialDraft(
  user: string,
  value?: SocialDraft | null,
): Promise<SocialDraft | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
        "drafts",
        value === undefined ? "readonly" : "readwrite",
      ),
      store = tx.objectStore("drafts");
    const request =
      value === undefined
        ? store.get(user)
        : value === null
          ? store.delete(user)
          : store.put(value, user);
    tx.oncomplete = () => {
      resolve(request.result);
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}
export function emptySocialDraft(): SocialDraft {
  return {
    id: crypto.randomUUID(),
    version: 0,
    kind: "POST",
    body: "",
    visibility: "PUBLIC",
    projectUrl: "",
    files: [],
  };
}
