"use client";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
} from "lucide-react";
import { popLike } from "@/lib/motion";
import { postPerson, type SocialPost as Post } from "@/lib/social";
import {
  FollowButton,
  SocialAuthor,
  SocialComments,
  SocialShare,
} from "./social-post";
import { SocialPostOptions } from "./social-post-options";
import { SocialText } from "./social-text";
import { usePostActions } from "./use-post-actions";

const CAPTION_LIMIT = 90;

/**
 * Everything drawn over a full-screen Clip: author and caption at the bottom,
 * the action rail on the right and the playback progress along the lower edge.
 */
export function SocialClipOverlay({
  item,
  me,
  person,
  changed,
  progress,
  duration = 0,
  seek,
}: {
  item: Post;
  me: string;
  person: (id: string) => void;
  changed: (p: Post) => void;
  progress: number;
  /** Length of the Clip in seconds, once known. */
  duration?: number;
  /** Jumps to a point of the Clip (0 to 1). */
  seek?: (fraction: number) => void;
}) {
  const [dialog, setDialog] = useState<"comments" | "share" | "more" | null>(
      null,
    ),
    [expanded, setExpanded] = useState(false);
  const { busy, error, react } = usePostActions(item, changed);
  const long = item.body.length > CAPTION_LIMIT,
    percent = Math.round(Math.min(1, Math.max(0, progress || 0)) * 100);
  return (
    <div className="social-clip-overlay" data-post={item.id}>
      <div className="social-clip-caption">
        <header>
          <SocialAuthor user={postPerson(item)} open={person} />
          {item.authorId !== me && <FollowButton id={item.authorId} me={me} />}
        </header>
        {!!item.body && (
          <p>
            <SocialText
              text={
                expanded || !long
                  ? item.body
                  : `${item.body.slice(0, CAPTION_LIMIT)}…`
              }
            />{" "}
            {long && (
              <button
                type="button"
                className="text-button social-caption-toggle"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "menos" : "mais"}
              </button>
            )}
          </p>
        )}
        {error && (
          <p className="social-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="social-post-actions social-clip-rail">
        <button
          className="icon-control"
          aria-pressed={item.mine.includes("LIKE")}
          aria-label={`Curtir · ${item.likes}`}
          disabled={busy}
          onClick={(event) => {
            if (!item.mine.includes("LIKE")) popLike(event.currentTarget);
            void react("LIKE");
          }}
        >
          <Heart
            size={28}
            fill={item.mine.includes("LIKE") ? "currentColor" : "none"}
          />
          <span aria-hidden="true">{item.likes}</span>
        </button>
        <button
          className="icon-control"
          aria-label={`Comentários · ${item.comments}`}
          onClick={() => setDialog("comments")}
        >
          <MessageCircle size={28} />
          <span aria-hidden="true">{item.comments}</span>
        </button>
        <button
          className="icon-control"
          aria-pressed={item.mine.includes("REPOST")}
          aria-label={`Republicar · ${item.reposts}`}
          disabled={busy}
          onClick={() => void react("REPOST")}
        >
          <Repeat2 size={28} />
          <span aria-hidden="true">{item.reposts}</span>
        </button>
        <button
          className="icon-control"
          aria-label="Compartilhar publicação"
          onClick={() => setDialog("share")}
        >
          <Send size={26} />
        </button>
        <button
          className="icon-control"
          aria-label="Salvar publicação"
          aria-pressed={item.mine.includes("SAVE")}
          disabled={busy}
          onClick={() => void react("SAVE")}
        >
          <Bookmark
            size={27}
            fill={item.mine.includes("SAVE") ? "currentColor" : "none"}
          />
        </button>
        <button
          className="icon-control"
          aria-label="Opções da publicação"
          onClick={() => setDialog("more")}
        >
          <MoreHorizontal size={26} />
        </button>
      </div>
      <div
        className="social-clip-progress"
        role="progressbar"
        aria-label="Progresso do Clip"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      {seek && duration > 0 && (
        <ClipScrubber progress={progress} duration={duration} seek={seek} />
      )}
      {dialog === "comments" && (
        <SocialComments
          item={item}
          me={me}
          close={() => setDialog(null)}
          changed={changed}
          person={person}
        />
      )}
      {dialog === "share" && (
        <SocialShare item={item} close={() => setDialog(null)} />
      )}
      {dialog === "more" && (
        <SocialPostOptions
          item={item}
          me={me}
          changed={changed}
          close={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * Tapping the thin progress line reveals a handle to move through the Clip,
 * with the current time and the length on each side, like Instagram Reels.
 * It hides again after a few seconds without use.
 */
function ClipScrubber({
  progress,
  duration,
  seek,
}: {
  progress: number;
  duration: number;
  seek: (fraction: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function keepOpen() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setDragging(null);
    }, 3000);
  }
  const fraction = Math.min(1, Math.max(0, dragging ?? progress ?? 0));
  const stop = (event: React.SyntheticEvent) => event.stopPropagation();
  if (!open)
    return (
      <button
        type="button"
        className="social-clip-progress-hit"
        aria-label="Mostrar controle de tempo do Clip"
        data-social-gesture="ignore"
        onPointerDown={stop}
        onClick={(event) => {
          event.stopPropagation();
          const box = event.currentTarget.getBoundingClientRect();
          if (box.width > 0 && event.clientX > 0)
            seek((event.clientX - box.left) / box.width);
          setOpen(true);
          keepOpen();
        }}
      />
    );
  return (
    <div
      className="social-clip-scrubber"
      data-social-gesture="ignore"
      onPointerDown={stop}
      onClick={stop}
    >
      <span className="social-clip-time">{clock(fraction * duration)}</span>
      <input
        type="range"
        min={0}
        max={1000}
        step={1}
        value={Math.round(fraction * 1000)}
        aria-label="Avançar ou voltar o Clip"
        aria-valuetext={`${clock(fraction * duration)} de ${clock(duration)}`}
        onChange={(event) => {
          const next = Number(event.target.value) / 1000;
          setDragging(next);
          seek(next);
          keepOpen();
        }}
        onPointerUp={() => setDragging(null)}
        onKeyDown={keepOpen}
      />
      <span className="social-clip-time">{clock(duration)}</span>
    </div>
  );
}
