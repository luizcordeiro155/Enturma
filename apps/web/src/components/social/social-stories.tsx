"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { postPerson, type SocialPage, type SocialPerson, type SocialPost } from "@/lib/social";
import { groupStories } from "@/lib/social-media";
import { Avatar } from "../user-identity";
import { StoryViewer } from "./social-story-viewer";
export { StoryViewer } from "./social-story-viewer";

export function SocialStories({ me, create, person, refreshKey }: {
  me: SocialPerson; create: () => void; person: (id: string) => void; refreshKey: number;
}) {
  const [stories, setStories] = useState<SocialPost[]>([]), [cursor, setCursor] = useState("");
  const [opened, setOpened] = useState<string | null>(null), [error, setError] = useState("");
  const [busy, setBusy] = useState(false), [retry, setRetry] = useState(0);
  const generation = useRef(0), loading = useRef(false);
  const groups = useMemo(() => groupStories(stories), [stories]);
  useEffect(() => {
    const request = ++generation.current;
    void api<SocialPage>("/social/feed?kind=STORY&tab=for-you", {cache:"no-store"})
      .then(result => {if (request === generation.current) {setStories(result.items);setCursor(result.nextCursor);setError("");}})
      .catch(cause => {if (request === generation.current) setError(cause.message);});
    return () => {generation.current++;};
  }, [refreshKey, retry]);
  async function more() {
    if (!cursor || loading.current) return;
    loading.current = true; setBusy(true); setError("");
    const request = generation.current;
    try {
      const result = await api<SocialPage>(`/social/feed?kind=STORY&tab=for-you&cursor=${encodeURIComponent(cursor)}`, {cache:"no-store"});
      if (request !== generation.current) return;
      setStories(previous => [...previous, ...result.items.filter(item => !previous.some(old => old.id === item.id))]);
      setCursor(result.nextCursor);
    } catch (cause) {if (request === generation.current) setError((cause as Error).message);}
    finally {loading.current = false;setBusy(false);}
  }
  const start = stories.findIndex(story => story.id === opened);
  return <>
    <div className="social-stories" data-social-gesture="ignore" aria-label="Stories">
      <button type="button" className="social-story social-story-create" onClick={create}>
        <span className="social-story-ring"><Avatar user={me} /><Plus size={17} /></span><small>Seu Story</small>
      </button>
      {groups.map(group => {
        const first = group.items.find(story => !story.seen) ?? group.items[0];
        return <button type="button" key={group.authorId}
          className={`social-story ${group.items.every(story => story.seen) ? "seen" : ""}`}
          aria-label={group.authorId === me.id ? "Ver seus Stories" : `Ver Stories de ${first.username}`}
          onClick={() => setOpened(first.id)}>
          <span className="social-story-ring"><Avatar user={postPerson(first)} /></span><small>{first.username}</small>
        </button>;
      })}
      {cursor && <button type="button" className="icon-control" aria-label="Mais Stories" disabled={busy} onClick={() => void more()}><ChevronRight /></button>}
    </div>
    {error && <div role="alert" className="social-stories-error"><small>{error}</small><button className="text-button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div>}
    {opened !== null && start >= 0 && <StoryViewer stories={stories} start={start} me={me.id} person={person}
      onViewed={id => setStories(previous => previous.map(story => story.id === id && !story.seen ? {...story,seen:true} : story))}
      onDeleted={id => {setStories(previous => previous.filter(story => story.id !== id));setOpened(null);}}
      close={() => setOpened(null)} />}
  </>;
}
