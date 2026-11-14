"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { socialWrite, type SocialPost } from "@/lib/social";
import { SocialDialog } from "./social-dialog";
import { SocialProfileGrid } from "./social-profile-grid";
import { SocialPostViewer } from "./social-post-viewer";

type Collection = { id: string; name: string; selected: boolean };
export function SocialCollections({
  me,
  post,
  saved,
  person,
  close,
}: {
  me: string;
  post?: string;
  saved?: () => void;
  person: (id: string) => void;
  close: () => void;
}) {
  const [rows, setRows] = useState<Collection[]>([]);
  const [selected, setSelected] = useState<Collection>();
  const [name, setName] = useState("");
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(false);
  const [viewer, setViewer] = useState<{
    items: SocialPost[];
    start: number;
  }>();
  const writing = useRef(false),
    draft = useRef<string | null>(null);
  useEffect(() => {
    let current = true;
    void api<Collection[]>(
      `/social/collections${post ? `?post=${post}` : ""}`,
      { cache: "no-store" },
    )
      .then((value) => {
        if (current) setRows(value);
      })
      .catch((cause: Error) => {
        if (current) setError(cause.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [post, revision]);
  async function perform(work: () => Promise<void>) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
      setRevision((value) => value + 1);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <SocialDialog title="Coleções privadas" close={close} wide>
      <div className="social-dialog-body social-collections">
        <p>
          Só você vê suas coleções. Publicações deixam de aparecer quando você
          perde acesso a elas.
        </p>
        {removing && selected ? (
          <div>
            <p>
              Excluir a coleção “{selected.name}”? As publicações continuam em
              Salvos.
            </p>
            <div className="social-row">
              <button
                disabled={busy}
                className="secondary"
                onClick={() => setRemoving(false)}
              >
                Manter coleção
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void perform(async () => {
                    await socialWrite(
                      `/collections/${selected.id}`,
                      undefined,
                      "DELETE",
                    );
                    setSelected(undefined);
                    setName("");
                    setRemoving(false);
                  })
                }
              >
                Excluir coleção
              </button>
            </div>
          </div>
        ) : (
          <>
            <form
              className="social-collection-form"
              onSubmit={(event) => {
                event.preventDefault();
                void perform(async () => {
                  const id =
                    selected && !post
                      ? selected.id
                      : (draft.current ??= crypto.randomUUID());
                  await socialWrite(`/collections/${id}`, {
                    name: name.trim(),
                  });
                  if (selected && !post)
                    setSelected({ ...selected, name: name.trim() });
                  else setName("");
                  draft.current = null;
                });
              }}
            >
              <label>
                Nome da coleção
                <input
                  value={name}
                  maxLength={60}
                  required
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <button disabled={busy || !name.trim()}>
                {selected && !post ? "Renomear coleção" : "Criar coleção"}
              </button>
            </form>
            {loading && <p role="status">Carregando coleções…</p>}
            {!loading && !rows.length && !error && (
              <p>Nenhuma coleção ainda. Crie a primeira acima.</p>
            )}
            <div className="social-collection-list">
              {selected && !post && (
                <button
                  className="secondary"
                  onClick={() => {
                    setSelected(undefined);
                    setName("");
                  }}
                >
                  Todas as coleções
                </button>
              )}
              {rows.map((row) => (
                <button
                  className="secondary"
                  disabled={busy}
                  key={row.id}
                  aria-pressed={post ? row.selected : selected?.id === row.id}
                  onClick={() => {
                    if (post)
                      void perform(async () => {
                        await socialWrite(
                          `/collections/${row.id}/posts/${post}`,
                          { active: !row.selected },
                        );
                        if (!row.selected) saved?.();
                      });
                    else {
                      setSelected(row);
                      setName(row.name);
                    }
                  }}
                >
                  {row.name}
                </button>
              ))}
            </div>
            {selected && !post && (
              <>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => setRemoving(true)}
                >
                  Excluir esta coleção
                </button>
                <SocialProfileGrid
                  key={selected.id}
                  query={`author=${me}&kind=ALL&collection=saved&collectionId=${selected.id}`}
                  active={!viewer}
                  refreshKey={revision}
                  shape="square"
                  open={(items, start) => setViewer({ items, start })}
                />
              </>
            )}
          </>
        )}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => {
                setError("");
                setLoading(true);
                setRevision((value) => value + 1);
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
      {viewer && (
        <SocialPostViewer
          {...viewer}
          me={me}
          person={person}
          changed={() => {}}
          close={() => {
            setViewer(undefined);
            setRevision((value) => value + 1);
          }}
        />
      )}
    </SocialDialog>
  );
}
