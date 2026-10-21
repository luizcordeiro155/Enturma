"use client";
import { useState } from "react";
import { BookOpen, Camera, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import { prepareChatImage } from "@/lib/chat-image";
type Identity = {
  id: string;
  title: string;
  hasAvatar?: boolean;
  hasBanner?: boolean;
  mediaVersion?: number;
};
const url = (notebook: Identity, kind: string) =>
  `/api/backend/notebooks/${notebook.id}/media/${kind}?v=${notebook.mediaVersion ?? 0}`;
export function NotebookArtwork({ notebook }: { notebook: Identity }) {
  return (
    <div className="notebook-artwork">
      {notebook.hasBanner && (
        <img className="notebook-banner" src={url(notebook, "banner")} alt="" />
      )}
      <span className="notebook-avatar">
        {notebook.hasAvatar ? (
          <img src={url(notebook, "avatar")} alt="" />
        ) : (
          <BookOpen size={30} />
        )}
      </span>
      <span className="notebook-artwork-title">{notebook.title}</span>
    </div>
  );
}
export function NotebookArtworkEditor({
  notebook,
  onChanged,
  onError,
}: {
  notebook: Identity;
  onChanged: () => Promise<void>;
  onError: (error: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function upload(kind: string, file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      file = await prepareChatImage(file);
      if (file.size > 3 * 1024 * 1024)
        throw Error("Escolha uma imagem de até 3 MB.");
      const body = new FormData();
      body.set("file", file);
      await api(`/notebooks/${notebook.id}/media/${kind}`, {
        method: "POST",
        body,
      });
      await onChanged();
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="notebook-artwork-editor">
      {(["avatar", "banner"] as const).map((kind) => (
        <div key={kind}>
          <label>
            {kind === "avatar" ? <Camera size={18} /> : <ImageIcon size={18} />}
            {kind === "avatar" ? "Foto do caderno" : "Banner do caderno"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              disabled={busy}
              onChange={(event) => {
                void upload(kind, event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {notebook[kind === "avatar" ? "hasAvatar" : "hasBanner"] && (
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api(`/notebooks/${notebook.id}/media/${kind}`, {
                    method: "DELETE",
                  });
                  await onChanged();
                } catch (error) {
                  onError((error as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Remover {kind === "avatar" ? "foto" : "banner"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
