"use client";
/* eslint-disable @next/next/no-img-element -- authenticated media */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Heart, Pause, Play, Send, Star, Trash2, Volume2, VolumeX } from "lucide-react";
import { api } from "@/lib/api";
import { mediaUrl, postPerson, socialWrite, storyDuration, type SocialPerson, type SocialPost } from "@/lib/social";
import { groupStories } from "@/lib/social-media";
import { navigateStory, resolveStoryGesture, type StoryAction } from "@/lib/social-story-controls";
import { ForumLinks, ConfirmedLink } from "../forum-links";
import { SocialDialog } from "./social-dialog";
import { SocialAuthor, SocialShare } from "./social-post";
import { StoryDecorations } from "./story-decorations";

export function StoryViewer({ stories, start = 0, me, close, person, onDeleted, onViewed }: {
  stories: SocialPost[]; start?: number; me: string; close: () => void;
  person: (id: string) => void; onDeleted?: (id: string) => void; onViewed?: (id: string) => void;
}) {
  const groups = useMemo(() => groupStories(stories), [stories]);
  const [selectedId, setSelectedId] = useState(() => stories[start]?.id ?? stories[0]?.id ?? "");
  const currentId = stories.some(story => story.id === selectedId) ? selectedId : groups[0]?.items[0]?.id ?? "";
  const group = groups.find(entry => entry.items.some(story => story.id === currentId));
  const index = group?.items.findIndex(story => story.id === currentId) ?? 0;
  const [item, setItem] = useState<SocialPost>();
  const [paused, setPaused] = useState(false), [holding, setHolding] = useState(false);
  const [muted, setMuted] = useState(true), [progress, setProgress] = useState(0);
  const [error, setError] = useState(""), [share, setShare] = useState(false);
  const [viewers, setViewers] = useState<SocialPerson[] | null>(null), [viewersPage, setViewersPage] = useState(0);
  const [moreViewers, setMoreViewers] = useState(false), [highlight, setHighlight] = useState(false);
  const [title, setTitle] = useState(""), [confirmDeletion, setConfirmDeletion] = useState(false);
  const [busy, setBusy] = useState(false), [retry, setRetry] = useState(0), [readyMedia, setReadyMedia] = useState("");
  const video = useRef<HTMLVideoElement>(null), stage = useRef<HTMLDivElement>(null);
  const elapsed = useRef(0), completed = useRef(""), writing = useRef(false);
  const pointer = useRef<{ id: number; x: number; y: number; time: number; width: number; localX: number } | null>(null);
  const current = useRef(currentId), viewed = useRef(onViewed), closeRef = useRef(close);
  useEffect(() => { current.current = currentId; viewed.current = onViewed; closeRef.current = close; }, [currentId, onViewed, close]);
  const navigate = useCallback((action: StoryAction) => {
    if (writing.current) return;
    const target = navigateStory(groups, currentId, action);
    if (target === null) { closeRef.current(); return; }
    if (target === currentId) return;
    video.current?.pause(); elapsed.current = 0; completed.current = "";
    setSelectedId(target); setReadyMedia(""); setProgress(0); setPaused(false); setHolding(false);
    setViewers(null); setHighlight(false); setShare(false); setConfirmDeletion(false); setError("");
  }, [groups, currentId]);
  const moveNext = useRef(() => {});
  useEffect(() => { moveNext.current = () => navigate("next"); }, [navigate]);
  useEffect(() => {
    if (!currentId) return;
    let alive = true;
    void api<SocialPost>(`/social/posts/${currentId}`, { cache: "no-store" }).then(result => {
      if (!alive) return;
      elapsed.current = 0; completed.current = "";
      setItem(result); setProgress(0); setError("");
      viewed.current?.(currentId);
      void socialWrite(`/posts/${currentId}/view`, { watchedMs: 0, completed: false }).catch(() => {});
    }).catch(cause => { if (alive) { setItem(undefined); setError(cause.message); } });
    return () => { alive = false; };
  }, [currentId, retry]);
  const loaded = item !== undefined && item.id === currentId;
  const isPaused = paused || holding || share || viewers !== null || highlight || confirmDeletion || busy;
  const mediaReady = loaded && (!item.media.length || readyMedia === currentId);
  useEffect(() => {
    const element = video.current;
    if (!loaded || !mediaReady || isPaused || document.hidden) { element?.pause(); return; }
    if (element) void element.play().catch(() => setPaused(true));
    let previous = performance.now();
    const duration = storyDuration(item?.media[0]);
    const timer = window.setInterval(() => {
      const now = performance.now();
      const top = Array.from(document.querySelectorAll("dialog[open]")).at(-1);
      if (!document.hidden && document.hasFocus() && stage.current?.closest("dialog") === top && (!element || (!element.paused && element.readyState >= 2))) elapsed.current += now - previous;
      previous = now;
      const fraction = element ? element.currentTime * 1000 / duration : elapsed.current / duration;
      setProgress(Math.min(1, fraction));
      if (fraction >= 1 && completed.current !== currentId) {
        completed.current = currentId;
        void socialWrite(`/posts/${currentId}/view`, { watchedMs: Math.min(90000, duration), completed: true }).catch(() => {});
        moveNext.current();
      }
    }, 100);
    const blur = () => { element?.pause(); setPaused(true); };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
    return () => { clearInterval(timer); element?.pause(); window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility); };
  }, [currentId, loaded, mediaReady, isPaused, item]);
  async function action(work: () => Promise<unknown>, done?: () => void) {
    if (writing.current) return;
    writing.current = true; setBusy(true); setError("");
    const id = currentId;
    try { await work(); if (current.current === id) done?.(); }
    catch (cause) { if (current.current === id) setError((cause as Error).message); }
    finally { writing.current = false; setBusy(false); }
  }
  async function showViewers(page = 0) {
    await action(async () => {
      const result = await api<SocialPerson[]>(`/social/posts/${currentId}/viewers?page=${page}`, {cache:"no-store"});
      if (current.current !== currentId) return;
      setViewers(old => page ? [...(old ?? []), ...result.filter(row => !old?.some(previous => previous.id === row.id))] : result);
      setViewersPage(page); setMoreViewers(result.length === 30);
    });
  }
  function deleteStory() {
    if (!loaded || item.authorId !== me) return;
    void action(() => socialWrite(`/posts/${currentId}`, undefined, "DELETE"), () => {
      window.dispatchEvent(new CustomEvent("enturma-social-post-removed", {detail:{id:currentId}}));
      window.dispatchEvent(new Event("enturma-social_changed"));
      if (onDeleted) onDeleted(currentId); else close();
    });
  }
  return <SocialDialog title="Stories da turma" close={() => { if (!writing.current) close(); }} variant="story">
    <div ref={stage} className="social-story-viewer social-story-immersive" data-current-story={currentId}>
      <div className="social-story-progress" aria-label={`Story ${index + 1} de ${group?.items.length ?? 0}`}>
        {group?.items.map((story, position) => <span key={story.id} role="progressbar" aria-label={`Story ${position + 1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((position < index ? 1 : position > index ? 0 : progress) * 100)}>
          <i style={{transform:`scaleX(${position < index ? 1 : position > index ? 0 : progress})`}} />
        </span>)}
      </div>
      {loaded ? <>
        <div className="social-story-author"><SocialAuthor user={postPerson(item)} open={person} />
          {item.media[0]?.kind === "VIDEO" && <button type="button" className="icon-control" aria-label={muted ? "Ativar som do Story" : "Silenciar Story"} onClick={() => setMuted(value => !value)}>{muted ? <VolumeX /> : <Volume2 />}</button>}
        </div>
        <div className="social-story-stage" data-testid="story-stage"
          onPointerDown={event => {
            if (event.isPrimary === false || (event.pointerType === "mouse" && event.button !== 0) || (event.target as HTMLElement).closest("button,a,input,textarea,select,[data-social-gesture]")) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            pointer.current = {id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now(),width:bounds.width,localX:event.clientX-bounds.left};
            event.currentTarget.setPointerCapture?.(event.pointerId); setHolding(true);
          }}
          onPointerUp={event => {
            const start = pointer.current; pointer.current = null; setHolding(false);
            if (!start || start.id !== event.pointerId) return;
            const gesture = resolveStoryGesture({dx:event.clientX-start.x,dy:event.clientY-start.y,ms:performance.now()-start.time,x:start.localX,width:start.width});
            if (gesture) navigate(gesture);
          }}
          onPointerCancel={() => { pointer.current = null; setHolding(false); }}
          onLostPointerCapture={() => { pointer.current = null; setHolding(false); }}
          onContextMenu={event => event.preventDefault()}>
          {item.media[0]?.kind === "VIDEO" ? <video key={`${currentId}:${retry}`} ref={video} src={mediaUrl(item.media[0].id)} playsInline muted={muted} preload="metadata"
            onLoadedData={() => setReadyMedia(currentId)}
            onPlay={event => document.querySelectorAll<HTMLVideoElement>(".social-page video,.social-dialog video").forEach(other => {if (other !== event.currentTarget) other.pause();})}
            onEnded={() => {if (!isPaused && completed.current !== currentId) {completed.current = currentId; moveNext.current();}}}
            onError={() => {setError("N\u00e3o foi poss\u00edvel carregar o Story. Tente novamente."); setPaused(true);}} /> : item.media[0] ?
              <img key={`${currentId}:${retry}`} src={mediaUrl(item.media[0].id)} alt={`Story de ${item.name}`} draggable={false} onLoad={() => setReadyMedia(currentId)} onError={() => {setError("N\u00e3o foi poss\u00edvel carregar a imagem.");setPaused(true);}} /> : null}
          {item.body && <p className={item.media.length ? "social-story-caption" : "social-story-text"}><ForumLinks text={item.body} /></p>}
          <StoryDecorations items={item.storyOverlays ?? []} />
        </div>
        {item.projectUrl && <ConfirmedLink href={item.projectUrl} label="Abrir link do Story" />}
        <div className="social-row social-story-actions">
          <button type="button" className="icon-control" aria-label="Story anterior" onClick={() => navigate("previous")} disabled={busy}><ChevronLeft /></button>
          <button type="button" className="icon-control" aria-label={isPaused ? "Reproduzir Story" : "Pausar Story"} onClick={() => setPaused(value => !value)} disabled={busy}>{isPaused ? <Play /> : <Pause />}</button>
          <button type="button" className="icon-control" aria-label="Curtir Story" aria-pressed={item.mine.includes("LIKE")} disabled={busy} onClick={() => void action(async () => {
            const updated = await socialWrite<SocialPost>(`/posts/${currentId}/reactions/LIKE`, {active:!item.mine.includes("LIKE")}); if (current.current === currentId) setItem(updated);
          })}><Heart fill={item.mine.includes("LIKE") ? "currentColor" : "none"} /></button>
          <button type="button" className="icon-control" aria-label="Responder ou compartilhar Story" onClick={() => setShare(true)}><Send /></button>
          {item.authorId === me && <>
            <button type="button" className="icon-control" aria-label={"Ver visualiza\u00e7\u00f5es"} onClick={() => void showViewers()} disabled={busy}><Eye /></button>
            <button type="button" className="icon-control" aria-label="Salvar nos destaques" onClick={() => {setHighlight(true);setTitle(item.highlightTitle ?? "");}}><Star /></button>
            <button type="button" className="icon-control" aria-label="Excluir meu Story" onClick={() => setConfirmDeletion(true)}><Trash2 /></button>
          </>}
          <button type="button" className="icon-control" aria-label={"Pr\u00f3ximo Story"} onClick={() => navigate("next")} disabled={busy}><ChevronRight /></button>
        </div>
      </> : <p role="status">{error ? "Story indispon\u00edvel." : "Carregando Story\u2026"}</p>}
      {error && <div className="social-story-error" role="alert"><p>{error}</p><button type="button" className="secondary" onClick={() => {setError("");setReadyMedia("");setRetry(value => value + 1);setPaused(false);}}>Tentar novamente</button></div>}
    </div>
    {share && loaded && <SocialShare item={item} reply={item.authorId !== me} close={() => setShare(false)} />}
    {viewers !== null && <SocialDialog title="Quem viu" close={() => setViewers(null)} variant="panel"><div className="social-dialog-body">
      {viewers.map(viewer => <SocialAuthor key={viewer.id} user={viewer} open={person} />)}
      {!viewers.length && <p>{"Ainda sem visualiza\u00e7\u00f5es."}</p>}
      {moreViewers && <button disabled={busy} onClick={() => void showViewers(viewersPage + 1)}>Carregar mais</button>}
      <button className="secondary" onClick={() => setViewers(null)}>Voltar ao Story</button>{error && <p role="alert">{error}</p>}
    </div></SocialDialog>}
    {highlight && <SocialDialog title="Salvar nos destaques" close={() => {if (!busy) setHighlight(false);}}><div className="social-dialog-body">
      <label>Nome do destaque<input value={title} maxLength={60} onChange={event => setTitle(event.target.value)} /></label>
      <button disabled={busy || !title.trim()} onClick={() => void action(() => socialWrite(`/posts/${currentId}/highlight`,{title:title.trim()}), () => setHighlight(false))}>Salvar destaque</button>
      <button className="secondary" disabled={busy} onClick={() => void action(() => socialWrite(`/posts/${currentId}/highlight`,{title:null}), () => setHighlight(false))}>Remover destaque</button>
      {error && <p role="alert">{error}</p>}
    </div></SocialDialog>}
    {confirmDeletion && <SocialDialog title="Excluir este Story?" close={() => {if (!busy) setConfirmDeletion(false);}}><div className="social-dialog-body">
      <p>{"O Story deixar\u00e1 de estar dispon\u00edvel. Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita."}</p>
      <div className="social-row"><button className="secondary" disabled={busy} onClick={() => setConfirmDeletion(false)}>Cancelar</button>
      <button className="social-danger-action" disabled={busy} onClick={deleteStory}><Trash2 />{busy ? "Excluindo\u2026" : "Excluir Story"}</button></div>
      {error && <p role="alert">{error}</p>}
    </div></SocialDialog>}
  </SocialDialog>;
}
