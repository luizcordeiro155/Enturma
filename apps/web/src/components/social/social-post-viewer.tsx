"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SocialPost as Post } from "@/lib/social";
import { SocialDialog } from "./social-dialog";
import { SocialPost } from "./social-post";

export function SocialPostViewer({
  items,
  start,
  me,
  person,
  changed,
  close,
}: {
  items: Post[];
  start: number;
  me: string;
  person: (id: string) => void;
  changed: (post: Post) => void;
  close: () => void;
}) {
  const [rows, setRows] = useState(items);
  const [index, setIndex] = useState(
    Math.max(0, Math.min(start, items.length - 1)),
  );
  const current = Math.min(index, rows.length - 1);
  function move(delta: number) {
    setIndex(Math.max(0, Math.min(rows.length - 1, current + delta)));
  }
  function change(post: Post) {
    setRows((previous) =>
      previous
        .map((row) => (row.id === post.id ? post : row))
        .filter((row) => !row.mine.includes("HIDE")),
    );
    window.dispatchEvent(
      new CustomEvent("enturma-social-post-updated", { detail: { post } }),
    );
    if (post.mine.includes("HIDE"))
      window.dispatchEvent(
        new CustomEvent("enturma-social-post-removed", {
          detail: { id: post.id },
        }),
      );
    changed(post);
  }
  return (
    <SocialDialog
      title={"Publica\u00e7\u00f5es"}
      close={close}
      variant="viewer"
    >
      <div className="social-viewer-controls">
        <button
          className="icon-control"
          aria-label={"Publica\u00e7\u00e3o anterior"}
          disabled={current <= 0}
          onClick={() => move(-1)}
        >
          <ChevronLeft />
        </button>
        <span aria-live="polite">
          {rows.length ? Math.min(index + 1, rows.length) : 0} / {rows.length}
        </span>
        <button
          className="icon-control"
          aria-label={"Pr\u00f3xima publica\u00e7\u00e3o"}
          disabled={current >= rows.length - 1}
          onClick={() => move(1)}
        >
          <ChevronRight />
        </button>
      </div>
      <div
        className="social-post-viewer-scroll"
        aria-label="Publicações do perfil"
      >
        {rows[current] && (
          <SocialPost
            key={rows[current].id}
            item={rows[current]}
            me={me}
            person={person}
            changed={change}
            autoplay={false}
            detail
          />
        )}
        {!rows.length && (
          <p className="social-grid-empty">
            {
              "Esta publica\u00e7\u00e3o n\u00e3o est\u00e1 mais dispon\u00edvel."
            }
          </p>
        )}
      </div>
    </SocialDialog>
  );
}
