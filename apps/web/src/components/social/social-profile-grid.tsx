"use client";
/* eslint-disable @next/next/no-img-element -- private thumbnails require the authenticated proxy */
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Pin, Play } from "lucide-react";
import { mediaUrl, type SocialPost as Post } from "@/lib/social";
import { useSocialStream } from "./social-stream";

export function SocialProfileGrid({ query, active, shape, open, pinnedQuery, refreshKey = 0 }: {
  query: string; active: boolean; shape: "square" | "portrait";
  open: (items: Post[], index: number) => void; pinnedQuery?: string; refreshKey?: number;
}) {
  const stream = useSocialStream(query, active);
  const pinned = useSocialStream(pinnedQuery ?? query, active && Boolean(pinnedQuery));
  const root = useRef<HTMLDivElement>(null), sentinel = useRef<HTMLDivElement>(null);
  const latestLoad = useRef(stream.load), latestPinned = useRef(pinned.load);
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const previousRefresh = useRef(refreshKey);
  useEffect(() => { latestLoad.current = stream.load; latestPinned.current = pinned.load; }, [stream.load, pinned.load]);
  useEffect(() => {
    if (!active || previousRefresh.current === refreshKey || stream.busy || pinned.busy) return;
    previousRefresh.current = refreshKey;
    void latestLoad.current(true);
    if (pinnedQuery) void latestPinned.current(true);
  }, [active, refreshKey, stream.busy, pinned.busy, pinnedQuery]);
  useEffect(() => {
    if (!active || !sentinel.current || stream.cursor === "" || stream.error) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void latestLoad.current();
    }, {root:root.current, rootMargin:"250px"});
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [active, stream.cursor, stream.error]);
  useEffect(() => {
    const remove = (event: Event) => {
      const id = (event as CustomEvent<{id?:string}>).detail?.id;
      if (id) setRemoved(previous => new Set([...previous, id]));
    };
    const change = (event: Event) => {
      const post = (event as CustomEvent<{post?:Post}>).detail?.post;
      if (post) {stream.change(post);pinned.change(post);}
    };
    window.addEventListener("enturma-social-post-removed", remove);
    window.addEventListener("enturma-social-post-updated", change);
    return () => {window.removeEventListener("enturma-social-post-removed", remove);window.removeEventListener("enturma-social-post-updated", change);};
  }, [stream.change, pinned.change]);
  const items = useMemo(() => {
    const seen = new Set<string>();
    return [...(pinnedQuery ? pinned.items : []), ...stream.items].filter(item => {
      if (removed.has(item.id) || item.mine.includes("HIDE") || seen.has(item.id)) return false;
      seen.add(item.id); return true;
    });
  }, [pinnedQuery, pinned.items, stream.items, removed]);
  return <div ref={root} className="social-profile-grid-scroll" aria-busy={stream.busy}>
    <ul role="list" className={`social-profile-grid social-profile-grid-${shape}`} aria-label={"Grade de publica\u00e7\u00f5es"}>
      {items.map((item, index) => <li key={item.id}>
        <button type="button" className="social-profile-cell" aria-label={`Abrir publica\u00e7\u00e3o de ${new Date(item.publishedAt).toLocaleDateString("pt-BR")}`} onClick={() => open(items, index)}>
          {item.media[0] ? <img src={mediaUrl(item.media[0].id, true)} alt={`Publica\u00e7\u00e3o de ${item.name}`} loading="lazy" /> :
            <span className="social-grid-text">{item.body || "Publica\u00e7\u00e3o de texto"}</span>}
          <span className="social-grid-badges">
            {item.pinned && <Pin size={17} aria-label="Fixado" />}
            {item.media.length > 1 ? <Copy size={17} aria-label="Carrossel" /> : item.media[0]?.kind === "VIDEO" ? <Play size={17} aria-label={"V\u00eddeo"} /> : null}
          </span>
        </button>
      </li>)}
    </ul>
    {stream.busy && !items.length && <div className="social-grid-skeleton" aria-label={"Carregando publica\u00e7\u00f5es"}>{[0,1,2,3,4,5].map(id => <span key={id} />)}</div>}
    {!stream.busy && !items.length && !stream.error && <p className="social-grid-empty">{"Nenhuma publica\u00e7\u00e3o nesta aba ainda."}</p>}
    {(stream.error || pinnedQuery && pinned.error) && <div role="alert" className="social-error"><p>{stream.error || pinned.error}</p><button className="secondary" onClick={() => {void stream.load(true);if (pinnedQuery) void pinned.load(true);}}>Tentar novamente</button></div>}
    <div ref={sentinel} className="social-load">
      {stream.cursor && <button type="button" className="secondary" disabled={stream.busy} onClick={() => void stream.load()}>Carregar mais</button>}
    </div>
  </div>;
}
