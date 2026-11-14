"use client";
/* eslint-disable @next/next/no-img-element -- private draft media */
import { useState } from "react";
import { Clapperboard, FileText, Images, Sparkles, Trash2 } from "lucide-react";
import { mediaUrl } from "@/lib/social";
import { relativeTime } from "@/lib/social-media";

export type SavedDraft = {
  id: string;
  kind: string;
  body: string;
  updatedAt?: string;
  coverId?: string | null;
  coverKind?: "IMAGE" | "VIDEO" | null;
  coverState?: string | null;
  mediaCount?: number;
};

const KIND_LABEL: Record<string, string> = { POST: "Post", STORY: "Story", CLIP: "Clip" };

function KindIcon({ kind }: { kind: string }) {
  if (kind === "CLIP") return <Clapperboard size={22} aria-hidden />;
  if (kind === "STORY") return <Sparkles size={22} aria-hidden />;
  return <FileText size={22} aria-hidden />;
}

/** Saved drafts as a scrollable shelf of previews: open with a tap, delete after confirming. */
export function SocialDraftsShelf({
  drafts,
  busy = false,
  onOpen,
  onDelete,
}: {
  drafts: SavedDraft[];
  busy?: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  if (!drafts.length) return null;
  const now = new Date();
  return (
    <section className="social-drafts-shelf" aria-labelledby="social-drafts-title">
      <header>
        <h3 id="social-drafts-title">Rascunhos</h3>
        <span>{drafts.length}</span>
      </header>
      <ul aria-label="Rascunhos salvos">
        {drafts.map((draft) => {
          const kind = KIND_LABEL[draft.kind] ?? "Post";
          const caption = draft.body.trim() || "Sem legenda";
          const count = draft.mediaCount ?? 0;
          const cover =
            draft.coverId && draft.coverState === "READY"
              ? mediaUrl(draft.coverId, draft.coverKind === "VIDEO")
              : "";
          return (
            <li key={draft.id} className="social-draft-card" data-kind={draft.kind}>
              <button
                type="button"
                className="social-draft-open"
                disabled={busy}
                aria-label={`Abrir rascunho: ${caption.slice(0, 60)}`}
                onClick={() => onOpen(draft.id)}
              >
                <span className="social-draft-thumb">
                  {cover ? (
                    <img src={cover} alt={`Capa do ${kind}`} loading="lazy" decoding="async" />
                  ) : (
                    <KindIcon kind={draft.kind} />
                  )}
                  <span className="social-draft-kind">{kind}</span>
                  {count > 1 && (
                    <span className="social-draft-count">
                      <Images size={13} aria-hidden />
                      {count}
                    </span>
                  )}
                </span>
                <span className="social-draft-caption">{caption}</span>
                <span className="social-draft-meta">
                  {count === 0 ? "Só texto" : count === 1 ? "1 mídia" : `${count} mídias`}
                  {draft.updatedAt ? ` · ${relativeTime(draft.updatedAt, now)}` : ""}
                </span>
              </button>
              {confirming === draft.id ? (
                <div className="social-draft-confirm" role="group" aria-label="Confirmar exclusão">
                  <span>Excluir este rascunho?</span>
                  <button
                    type="button"
                    className="danger"
                    disabled={busy}
                    onClick={() => {
                      setConfirming(null);
                      onDelete(draft.id);
                    }}
                  >
                    Excluir de vez
                  </button>
                  <button type="button" className="text-button" onClick={() => setConfirming(null)}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="social-draft-delete"
                  aria-label="Excluir rascunho"
                  disabled={busy}
                  onClick={() => setConfirming(draft.id)}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
