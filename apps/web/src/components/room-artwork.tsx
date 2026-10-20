"use client";
/* eslint-disable @next/next/no-img-element -- authenticated room artwork */
import { useState } from "react";
import { BookOpen, Camera, ImagePlus, Trash2 } from "lucide-react";
import type { Room } from "@enturma/contracts";
import { api } from "@/lib/api";

export function RoomArtwork({
  room,
}: {
  room: Pick<Room, "id" | "hasAvatar" | "hasBanner" | "mediaVersion">;
}) {
  const source = (kind: string) =>
    `/api/backend/study-rooms/${room.id}/media/${kind}?v=${room.mediaVersion ?? 0}`;
  return (
    <div className="room-artwork" aria-hidden="true">
      <div className="room-artwork-banner">
        {room.hasBanner ? (
          <img src={source("banner")} alt="" loading="lazy" />
        ) : (
          <>
            <i />
            <i />
            <BookOpen size={64} />
          </>
        )}
      </div>
      <span className="room-artwork-avatar">
        {room.hasAvatar ? (
          <img src={source("avatar")} alt="" loading="lazy" />
        ) : (
          <BookOpen size={28} />
        )}
      </span>
    </div>
  );
}

export function RoomArtworkEditor({
  room,
  onSaved,
}: {
  room: Room;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  async function change(kind: "avatar" | "banner", file?: File) {
    setBusy(true);
    setStatus("");
    try {
      if (file) {
        if (
          !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
            file.type,
          ) ||
          file.size > 3 * 1024 * 1024
        )
          throw Error("Use JPG, PNG, WEBP ou GIF de até 3 MB.");
        const form = new FormData();
        form.set("file", file);
        const response = await fetch(
          `/api/backend/study-rooms/${room.id}/media/${kind}`,
          { method: "POST", body: form },
        );
        if (!response.ok)
          throw Error(
            (await response.json().catch(() => ({}))).message ??
              "Não foi possível atualizar a imagem.",
          );
      } else
        await api(`/study-rooms/${room.id}/media/${kind}`, {
          method: "DELETE",
        });
      await onSaved();
      setStatus(file ? "Imagem da sala atualizada." : "Imagem removida.");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="room-artwork-editor" aria-label="Imagens da sala">
      <RoomArtwork room={room} />
      <p>Deixe a sala com a cara da turma. Foto e banner são opcionais.</p>
      {(["avatar", "banner"] as const).map((kind) => (
        <div key={kind}>
          <label>
            {kind === "avatar" ? <Camera size={16} /> : <ImagePlus size={16} />}
            {kind === "avatar" ? "Foto da sala" : "Banner da sala"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={busy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void change(kind, file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          {(kind === "avatar" ? room.hasAvatar : room.hasBanner) && (
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => void change(kind)}
              aria-label={`Remover ${kind === "avatar" ? "foto" : "banner"} da sala`}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
      <small>
        PNG, JPG, GIF ou WEBP, até 3 MB. O banner usa proporção 3:1.
      </small>
      <p role="status">{busy ? "Atualizando imagem…" : status}</p>
    </section>
  );
}

export function RoomSettings({
  room,
  onSaved,
}: {
  room: Room;
  onSaved: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <details className="room-owner-settings">
      <summary>Gerenciar sala</summary>
      <RoomArtworkEditor room={room} onSaved={onSaved} />
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setBusy(true);
          setError("");
          try {
            await api(`/study-rooms/${room.id}/settings`, {
              method: "PUT",
              body: JSON.stringify({
                title: form.get("title"),
                topic: form.get("topic"),
                locked: form.get("locked") === "on",
              }),
            });
            await onSaved();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Nome
          <input
            name="title"
            defaultValue={room.title}
            required
            maxLength={150}
          />
        </label>
        <label>
          Tópico
          <textarea
            name="topic"
            defaultValue={room.topicText}
            maxLength={500}
          />
        </label>
        <label>
          <input
            type="checkbox"
            name="locked"
            defaultChecked={room.entriesLocked}
          />{" "}
          Fechar novas entradas e estudar com o Monitor
        </label>
        <small>
          O código continua aceitando convidados. O Monitor responde a @Monitor
          Enturma e pode ajudar após uma pausa na conversa.
        </small>
        <button disabled={busy}>{busy ? "Salvando…" : "Salvar sala"}</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </details>
  );
}
