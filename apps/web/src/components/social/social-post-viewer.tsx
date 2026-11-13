"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SocialPost as Post } from "@/lib/social";
import { SocialDialog } from "./social-dialog";
import { SocialPost } from "./social-post";

export function SocialPostViewer({ items, start, me, person, changed, close }: {
  items: Post[]; start: number; me: string; person: (id: string) => void;
  changed: (post: Post) => void; close: () => void;
}) {
  const [rows, setRows] = useState(items);
  const [index, setIndex] = useState(Math.max(0, Math.min(start, items.length - 1)));
  const panel = useRef<HTMLDivElement>(null), cells = useRef(new Map<string, HTMLDivElement>());
  const initial = useRef(items[start]?.id ?? items[0]?.id);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const node = initial.current ? cells.current.get(initial.current) : undefined;
      const viewport = panel.current;
      if (node && viewport) viewport.scrollTo({top:node.getBoundingClientRect().top-viewport.getBoundingClientRect().top+viewport.scrollTop,behavior:"auto"});
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!panel.current) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (visible) setIndex(Number((visible.target as HTMLElement).dataset.viewerIndex));
    }, {root:panel.current,threshold:[0.1,0.4,0.6]});
    cells.current.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [rows.length]);
  function move(delta: number) {
    const target = Math.max(0,Math.min(rows.length-1,index+delta));
    const node = rows[target] ? cells.current.get(rows[target].id) : undefined, viewport = panel.current;
    if (!node || !viewport) return;
    viewport.scrollTo({top:node.getBoundingClientRect().top-viewport.getBoundingClientRect().top+viewport.scrollTop,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
    setIndex(target);
  }
  function change(post: Post) {
    setRows(previous => previous.map(row => row.id === post.id ? post : row).filter(row => !row.mine.includes("HIDE")));
    window.dispatchEvent(new CustomEvent("enturma-social-post-updated", {detail:{post}}));
    if (post.mine.includes("HIDE")) window.dispatchEvent(new CustomEvent("enturma-social-post-removed", {detail:{id:post.id}}));
    changed(post);
  }
  return <SocialDialog title={"Publica\u00e7\u00f5es"} close={close} variant="viewer">
    <div className="social-viewer-controls">
      <button className="icon-control" aria-label={"Publica\u00e7\u00e3o anterior"} disabled={index <= 0} onClick={() => move(-1)}><ChevronLeft /></button>
      <span aria-live="polite">{rows.length ? Math.min(index+1,rows.length) : 0} / {rows.length}</span>
      <button className="icon-control" aria-label={"Pr\u00f3xima publica\u00e7\u00e3o"} disabled={index >= rows.length-1} onClick={() => move(1)}><ChevronRight /></button>
    </div>
    <div ref={panel} className="social-post-viewer-scroll" tabIndex={0} aria-label={"Publica\u00e7\u00f5es do perfil"}>
      {rows.map((item, position) => <div key={item.id} data-viewer-index={position} ref={node => {if(node) cells.current.set(item.id,node);else cells.current.delete(item.id);}}>
        <SocialPost item={item} me={me} person={person} changed={change} autoplay={false} />
      </div>)}
      {!rows.length && <p className="social-grid-empty">{"Esta publica\u00e7\u00e3o n\u00e3o est\u00e1 mais dispon\u00edvel."}</p>}
    </div>
  </SocialDialog>;
}
