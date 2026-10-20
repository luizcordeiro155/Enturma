"use client";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import { RichMessage } from "./rich-message";
import { useLiveRefresh } from "@/lib/live-updates";

type Shared = {
  id: string;
  title: string;
  sharedBy: string;
  ownerName: string;
};
export function RoomNotebooks({
  roomId,
  ended,
}: {
  roomId: string;
  ended: boolean;
}) {
  const [own, setOwn] = useState<{ id: string; title: string }[]>([]);
  const [shared, setShared] = useState<Shared[]>([]);
  const [me, setMe] = useState("");
  const [selected, setSelected] = useState("");
  const [content, setContent] =
    useState<{ title: string; content: string }[]>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [mine, list, user] = await Promise.all([
      api<{ items: { id: string; title: string }[] }>("/notebooks"),
      api<Shared[]>(`/study-rooms/${roomId}/notebooks`, { cache: "no-store" }),
      api<{ id: string }>("/users/me"),
    ]);
    setOwn(mine.items);
    setShared(list);
    setMe(user.id);
  }, [roomId]);
  useEffect(() => {
    const start = setTimeout(
      () => void load().catch((error) => setError(error.message)),
      0,
    );
    return () => clearTimeout(start);
  }, [load]);
  useLiveRefresh("rooms_changed", load, 20000);
  async function change(id: string, remove = false) {
    setBusy(true);
    setError("");
    try {
      await api(`/study-rooms/${roomId}/notebooks/${id}`, {
        method: remove ? "DELETE" : "PUT",
      });
      await load();
      setSelected("");
      setContent(undefined);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="room-notebooks">
      <h3>
        <BookOpen size={20} /> Cadernos da turma
      </h3>
      <p>
        Compartilhe um caderno para os colegas e o Monitor consultarem as fontes
        durante o estudo.
      </p>
      {shared.map((notebook) => (
        <div className="room-notebook-row" key={notebook.id}>
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              try {
                setContent(
                  await api(`/study-rooms/${roomId}/notebooks/${notebook.id}`, {
                    cache: "no-store",
                  }),
                );
              } catch (error) {
                setError((error as Error).message);
              }
            }}
          >
            <BookOpen size={18} />
            <span>
              {notebook.title}
              <small>Compartilhado por {notebook.ownerName}</small>
            </span>
          </button>
          {notebook.sharedBy === me && (
            <button
              type="button"
              disabled={busy}
              className="text-button"
              onClick={() => void change(notebook.id, true)}
            >
              Parar de compartilhar
            </button>
          )}
        </div>
      ))}
      {!ended && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void change(selected);
          }}
        >
          <label>
            Meu caderno
            <select
              required
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="">Escolha um caderno</option>
              {own
                .filter(
                  (notebook) => !shared.some((item) => item.id === notebook.id),
                )
                .map((notebook) => (
                  <option key={notebook.id} value={notebook.id}>
                    {notebook.title}
                  </option>
                ))}
            </select>
          </label>
          <small>
            As fontes prontas ficam visíveis nesta sala enquanto você mantiver o
            compartilhamento.
          </small>
          <button disabled={busy || !selected}>
            <Share2 size={16} /> Compartilhar caderno
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {content && (
        <div className="shared-notebook-content">
          <button
            type="button"
            className="secondary"
            onClick={() => setContent(undefined)}
          >
            Fechar leitura
          </button>
          {content.length ? (
            content.map((source, index) => (
              <article key={index}>
                <h4>{source.title}</h4>
                <RichMessage text={source.content} />
              </article>
            ))
          ) : (
            <p>Este caderno ainda não tem fontes prontas.</p>
          )}
        </div>
      )}
    </section>
  );
}
