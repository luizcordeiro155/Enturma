"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { SocialPost as Post } from "@/lib/social";
import { SocialDialog } from "./social-dialog";
import { FollowButton } from "./social-post";
import { usePostActions } from "./use-post-actions";

/** Owner and viewer options for one publication, shared by the feed card and Clips. */
export function SocialPostOptions({
  item,
  me,
  changed,
  close,
}: {
  item: Post;
  me: string;
  changed: (p: Post) => void;
  close: () => void;
}) {
  const [reason, setReason] = useState(""),
    [removing, setRemoving] = useState(false);
  const actions = usePostActions(item, changed),
    { busy, error, setError, react } = actions;
  async function act(path: string, body?: unknown, method = "PUT") {
    if (await actions.act(path, body, method)) close();
  }
  if (removing)
    return (
      <SocialDialog
          title="Remover esta publicação?"
          close={() => setRemoving(false)}
        >
          <div className="social-dialog-body">
            <p>
              O conteúdo e suas mídias deixarão de estar disponíveis. Esta ação
              não pode ser desfeita.
            </p>
            <div className="social-row">
              <button
                className="secondary"
                onClick={() => setRemoving(false)}
                disabled={busy}
              >
                Manter publicação
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void act(`/posts/${item.id}`, undefined, "DELETE")
                }
              >
                Remover definitivamente
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </div>
        </SocialDialog>
    );
  return (
    <SocialDialog title="Esta publicação" close={close}>
          <div className="social-dialog-body social-options">
            <FollowButton id={item.authorId} me={me} />
            {me !== item.authorId ? (
              <>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => void react("HIDE")}
                >
                  Não tenho interesse
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void act(`/people/${item.authorId}/mute`, { active: true })
                  }
                >
                  Ver menos deste criador
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => {
                    void api(`/blocks/${item.authorId}`, { method: "POST" })
                      .then(() => changed({ ...item, mine: ["HIDE"] }))
                      .catch((e) => setError(e.message));
                  }}
                >
                  Bloquear usuário
                </button>
                <label>
                  Motivo da denúncia
                  <textarea
                    className="resize-none"
                    value={reason}
                    maxLength={1500}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <button
                  disabled={busy || !reason.trim()}
                  onClick={() =>
                    void act(`/posts/${item.id}/report`, { reason }, "POST")
                  }
                >
                  Enviar denúncia
                </button>
              </>
            ) : (
              <>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void act(`/posts/${item.id}/pin`, { active: !item.pinned })
                  }
                >
                  {item.pinned ? "Desafixar" : "Fixar publicação"}
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => setRemoving(true)}
                >
                  Remover publicação
                </button>
              </>
            )}
            {error && <p role="alert">{error}</p>}
          </div>
        </SocialDialog>
  );
}
