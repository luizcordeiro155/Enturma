"use client";
import { useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
} from "lucide-react";
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
}: {
  item: Post;
  me: string;
  person: (id: string) => void;
  changed: (p: Post) => void;
  progress: number;
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
          onClick={() => void react("LIKE")}
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
