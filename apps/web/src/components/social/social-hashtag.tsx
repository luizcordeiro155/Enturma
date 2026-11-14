"use client";
import { useEffect, useState } from "react";
import { Hash, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import type { SocialPost } from "@/lib/social";
import { SocialDialog } from "./social-dialog";
import { SocialProfileGrid } from "./social-profile-grid";
import { SocialPostViewer } from "./social-post-viewer";

/** Fired (cancelable) when a hashtag is tapped; the open Social cancels it and shows the tag page. */
export const HASHTAG_EVENT = "enturma-social-hashtag";

export type SocialHashtag = { tag: string; posts: number };

const countLabel = (posts: number) => `${posts} ${posts === 1 ? "publicação" : "publicações"}`;
export const hashtagHref = (tag: string) => `/social?tag=${encodeURIComponent(tag)}`;

/** Lets the Social open the tag in place; returns true when something handled it. */
export function announceHashtag(tag: string) {
  return !window.dispatchEvent(new CustomEvent(HASHTAG_EVENT, { detail: tag, cancelable: true }));
}

function useHashtags(query: string) {
  const [tags, setTags] = useState<SocialHashtag[]>([]);
  useEffect(() => {
    let alive = true;
    const term = query.replace(/^#/, "").trim().toLowerCase();
    void api<SocialHashtag[]>(
      term ? `/social/hashtags?q=${encodeURIComponent(term)}` : "/social/hashtags",
      { cache: "no-store" },
    )
      .then((rows) => {
        if (alive) setTags(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (alive) setTags([]);
      });
    return () => {
      alive = false;
    };
  }, [query]);
  return tags;
}

/** The most used hashtags (or, with a query, the ones starting with it), Instagram style. */
export function SocialHashtagList({ query = "", open }: { query?: string; open: (tag: string) => void }) {
  const tags = useHashtags(query);
  if (!tags.length) return null;
  return (
    <section className="social-hashtag-list" aria-label={query ? "Hashtags" : "Hashtags em alta"}>
      <h3>
        {query ? <Hash size={16} aria-hidden /> : <TrendingUp size={16} aria-hidden />}
        {query ? "Hashtags" : "Em alta no Enturma"}
      </h3>
      <ul>
        {tags.map((item, index) => (
          <li key={item.tag} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
            <button
              type="button"
              aria-label={`#${item.tag}, ${countLabel(item.posts)}`}
              onClick={() => open(item.tag)}
            >
              <span className="social-hashtag-mark" aria-hidden>
                #
              </span>
              <span>
                <strong>#{item.tag}</strong>
                <small>{countLabel(item.posts)}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A hashtag's page: the tag, how many posts use it, and every post and Clip that does. */
export function SocialHashtagPage({
  tag,
  me,
  person,
  close,
}: {
  tag: string;
  me: string;
  person: (id: string) => void;
  close: () => void;
}) {
  const [count, setCount] = useState<number | null>(null);
  const [viewer, setViewer] = useState<{ items: SocialPost[]; start: number }>();
  useEffect(() => {
    let alive = true;
    void api<SocialHashtag[]>(`/social/hashtags?q=${encodeURIComponent(tag)}`, {
      cache: "no-store",
    })
      .then((rows) => {
        if (alive) setCount(rows.find((row) => row.tag === tag)?.posts ?? 0);
      })
      .catch(() => {
        if (alive) setCount(null);
      });
    return () => {
      alive = false;
    };
  }, [tag]);
  return (
    <SocialDialog title={`#${tag}`} variant="explore" close={close}>
      <header className="social-hashtag-hero">
        <span className="social-hashtag-avatar" aria-hidden>
          #
        </span>
        <div>
          <h3>#{tag}</h3>
          <p>{count === null ? "Publicações e Clips com esta hashtag" : countLabel(count)}</p>
        </div>
      </header>
      <SocialProfileGrid
        key={tag}
        query={`tab=for-you&kind=ALL&q=${encodeURIComponent(`#${tag}`)}`}
        active={!viewer}
        shape="square"
        open={(items, start) => setViewer({ items, start })}
      />
      {viewer && (
        <SocialPostViewer
          {...viewer}
          me={me}
          person={person}
          changed={() => {}}
          close={() => setViewer(undefined)}
        />
      )}
    </SocialDialog>
  );
}
