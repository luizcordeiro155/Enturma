"use client";
import { useEffect } from "react";
import { ArrowRight, Check, CircleAlert, LoaderCircle, X } from "lucide-react";
import type { SocialEditorProgress } from "./social-editor";

/** How long the "published" toast stays before leaving on its own. */
export const PUBLISH_TOAST_MS = 6000;

/**
 * The publication status floating over the Social: progress while sending, a
 * celebratory "published" that opens the post (and leaves by itself), or an error
 * that stays until closed.
 */
export function SocialPublishToast({
  progress,
  postId,
  openProgress,
  openPost,
  dismiss,
}: {
  progress: SocialEditorProgress;
  postId?: string;
  openProgress: () => void;
  openPost: (id: string) => void;
  dismiss: () => void;
}) {
  const { state } = progress;
  useEffect(() => {
    if (state !== "done") return;
    const timer = setTimeout(dismiss, PUBLISH_TOAST_MS);
    return () => clearTimeout(timer);
  }, [state, postId, dismiss]);
  const done = state === "done";
  return (
    <div
      className={`social-publish-toast social-publish-${state}`}
      style={{ ["--toast-ms" as string]: `${PUBLISH_TOAST_MS}ms` }}
    >
      <button
        type="button"
        className="social-publish-toast-main"
        aria-label={
          done && postId ? "Ver sua publicação" : "Abrir progresso da publicação"
        }
        onClick={() => (done && postId ? openPost(postId) : openProgress())}
      >
        <span className="social-publish-toast-icon" aria-hidden>
          {state === "working" ? (
            <LoaderCircle className="social-upload-spinning" />
          ) : done ? (
            <Check />
          ) : (
            <CircleAlert />
          )}
        </span>
        <span className="social-publish-toast-text">
          {done ? (
            <>
              <strong role="status">Publicado!</strong>
              <small>{postId ? "Toque para ver sua publicação" : progress.message}</small>
            </>
          ) : state === "error" ? (
            <strong role="alert">{progress.message}</strong>
          ) : (
            <>
              <strong role="status">{progress.message}</strong>
              <progress value={progress.percent} max={100} aria-label="Progresso do envio" />
            </>
          )}
        </span>
        {done && postId && <ArrowRight className="social-publish-toast-go" size={18} aria-hidden />}
      </button>
      {state !== "working" && (
        <button type="button" className="social-publish-toast-close" aria-label="Fechar aviso" onClick={dismiss}>
          <X size={16} />
        </button>
      )}
      {done && <span className="social-publish-toast-timer" aria-hidden />}
    </div>
  );
}
