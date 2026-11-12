"use client";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Bookmark, Check, Copy, Heart, MessageCircle, MoreHorizontal, Repeat2, Send, Share2 } from "lucide-react";
import { api, post } from "@/lib/api";
import { socialWrite, socialLink, postPerson, type SocialPerson, type SocialPost as Post } from "@/lib/social";
import { relativeTime } from "@/lib/social-media";
import { preparePrivateShare } from "@/lib/send-room-invitation";
import { Avatar } from "../user-identity";
import { ConfirmedLink } from "../forum-links";
import { SocialDialog } from "./social-dialog";
import { SocialText } from "./social-text";
import { SocialMediaCarousel } from "./social-media-carousel";
import { usePostActions } from "./use-post-actions";
import { SocialPostOptions } from "./social-post-options";
import { SocialComments } from "./social-comments";
export { SocialComments } from "./social-comments";
export function SocialAuthor({user,open}:{user:SocialPerson;open:(id:string)=>void}) {
  return <button className="social-author" onClick={()=>open(user.id)}><Avatar user={user}/><span><strong>{user.name}{user.verified&&<BadgeCheck size={16} aria-label="Conta social verificada"/>}</strong><small>@{user.username}</small></span></button>;
}
export function FollowButton({id,me,changed}:{id:string;me:string;changed?:()=>void}) {
  const [relation,setRelation]=useState<{status:string;followsYou:boolean}>(),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;if(id===me)return;
    void api<{relationship:NonNullable<typeof relation>}>(`/social/people/${id}`,{cache:"no-store"}).then(result=>{if(active)setRelation(result.relationship);}).catch(()=>{});
    return()=>{active=false;};
  },[id,me]);
  if(id===me)return null;
  return <span className="social-follow"><button className="secondary" disabled={!relation||busy} onClick={async()=>{
    setBusy(true);setError("");try{setRelation(await socialWrite(`/people/${id}/follow`,{active:relation?.status==="NONE"}));changed?.();}catch(cause){setError((cause as Error).message);}finally{setBusy(false);}
  }}>{relation?.status==="ACCEPTED"?"Seguindo":relation?.status==="PENDING"?"Solicitado":relation?.followsYou?"Seguir de volta":"Seguir"}</button>{relation?.followsYou&&<small>Te segue</small>}{error&&<small role="alert">{error}</small>}</span>;
}
export function SocialShare({item,close,reply=false}:{item:Post;close:()=>void;reply?:boolean}) {
  const [friends,setFriends]=useState<(SocialPerson&{userId:string;status:string})[]>([]),[query,setQuery]=useState(""),[note,setNote]=useState(""),[error,setError]=useState(""),[sent,setSent]=useState<string[]>([]),[busy,setBusy]=useState("");
  const pending=useRef(new Map<string,Awaited<ReturnType<typeof preparePrivateShare>>>());
  useEffect(()=>{let active=true;void api<typeof friends>("/friends",{cache:"no-store"}).then(result=>{if(active)setFriends(result.filter(friend=>friend.status==="ACCEPTED"&&(!reply||friend.userId===item.authorId)));}).catch(cause=>{if(active)setError(cause.message);});return()=>{active=false;};},[item.authorId,reply]);
  const url=socialLink("post",item.id);
  async function send(friend:string){setBusy(friend);setError("");try{
    await api(`/social/posts/${item.id}`,{cache:"no-store"});let body=pending.current.get(friend);
    if(!body){body=await preparePrivateShare(friend,`${note.trim()}${note.trim()?"\n":""}${url}`,crypto.randomUUID());pending.current.set(friend,body);}
    await post(`/friends/${friend}/messages`,body);pending.current.delete(friend);setSent(previous=>[...previous,friend]);
  }catch(cause){setError((cause as Error).message);}finally{setBusy("");}}
  return <SocialDialog title={reply?"Responder ao Story":"Compartilhar com a turma"} close={close} variant="sheet">
    <div className="social-dialog-body"><p>{"A privacidade da publica\u00e7\u00e3o continua valendo para quem receber o link."}</p>
      <label>Mensagem opcional<input value={note} maxLength={500} onChange={event=>setNote(event.target.value)}/></label>
      <label>Buscar amigos<input type="search" value={query} onChange={event=>setQuery(event.target.value)}/></label>
      {friends.filter(friend=>`${friend.name} ${friend.username}`.toLowerCase().includes(query.toLowerCase())).map(friend=><div className="social-person-row" key={friend.id}><Avatar user={{...friend,id:friend.userId}}/><strong>{friend.name}</strong><button className="secondary" disabled={!!busy||sent.includes(friend.id)} onClick={()=>void send(friend.id)}>{sent.includes(friend.id)?<><Check size={16}/>Enviado</>:"Enviar"}</button></div>)}
      {!friends.length&&<p>{"As amizades aceitas aparecer\u00e3o aqui."}{reply&&" Para responder, voc\u00eas precisam ser amigos no Enturma."}</p>}
      {error&&<p role="alert">{error}</p>}
      <div className="social-row"><button className="secondary" onClick={()=>void navigator.clipboard.writeText(url).then(()=>setError("Link copiado.")).catch(()=>setError("N\u00e3o foi poss\u00edvel copiar o link."))}><Copy size={16}/>Copiar link</button>
        {typeof navigator!=="undefined"&&typeof navigator.share==="function"&&<button className="secondary" onClick={()=>void navigator.share({title:"Enturma Social",url}).catch(cause=>{if(cause.name!=="AbortError")setError("N\u00e3o foi poss\u00edvel compartilhar.");})}><Share2 size={16}/>Compartilhar</button>}
      </div>
    </div>
  </SocialDialog>;
}
export function SocialPost({item,me,person,changed,autoplay=true}:{item:Post;me:string;person:(id:string)=>void;changed:(post:Post)=>void;autoplay?:boolean}) {
  const [dialog,setDialog]=useState<"comments"|"share"|"more"|null>(null),[expanded,setExpanded]=useState(false),[burst,setBurst]=useState(0);
  const lastTap=useRef<number|null>(null),actions=usePostActions(item,changed),{busy,error,react}=actions;
  function tapMedia(){const now=performance.now();if(lastTap.current!==null&&now-lastTap.current<300){lastTap.current=null;setBurst(value=>value+1);void actions.like();}else lastTap.current=now;}
  if(item.mine.includes("HIDE"))return null;
  const hasMedia=item.media.length>0,limit=hasMedia?125:280,long=item.body.length>limit;
  const copy=<div className="social-post-copy">{!!item.body&&<p>{hasMedia&&<button type="button" className="social-caption-author" onClick={()=>person(item.authorId)}>{item.username}</button>}{" "}<SocialText text={expanded||!long?item.body:`${item.body.slice(0,limit)}\u2026`}/>{" "}{long&&<button type="button" className="text-button social-caption-toggle" onClick={()=>setExpanded(!expanded)}>{expanded?"menos":"mais"}</button>}</p>}{item.projectUrl&&<ConfirmedLink href={item.projectUrl} label={"Conhecer o projeto \u2197"}/>}</div>;
  return <article className="social-post" data-post={item.id}>
    <header><SocialAuthor user={postPerson(item)} open={person}/><button className="icon-control" aria-label={"Op\u00e7\u00f5es da publica\u00e7\u00e3o"} onClick={()=>setDialog("more")}><MoreHorizontal size={20}/></button></header>
    {hasMedia?<div className="social-post-media" data-testid="post-media" onClick={event=>{if(!(event.target as HTMLElement).closest("button,a,input"))tapMedia();}}><SocialMediaCarousel media={item.media} authorName={item.name} autoplay={autoplay}/>{burst>0&&<Heart key={burst} className="social-like-burst" size={96} fill="currentColor" aria-hidden="true"/>}</div>:copy}
    <div className="social-post-actions">
      <button className="icon-control" aria-pressed={item.mine.includes("LIKE")} aria-label={`Curtir \u00b7 ${item.likes}`} disabled={busy} onClick={()=>void react("LIKE")}><Heart size={24} fill={item.mine.includes("LIKE")?"currentColor":"none"}/>{item.likes>0&&<span aria-hidden="true">{item.likes}</span>}</button>
      <button className="icon-control" aria-label={`Coment\u00e1rios \u00b7 ${item.comments}`} onClick={()=>setDialog("comments")}><MessageCircle size={24}/>{item.comments>0&&<span aria-hidden="true">{item.comments}</span>}</button>
      <button className="icon-control" aria-pressed={item.mine.includes("REPOST")} aria-label={`Republicar \u00b7 ${item.reposts}`} disabled={busy} onClick={()=>void react("REPOST")}><Repeat2 size={24}/>{item.reposts>0&&<span>{item.reposts}</span>}</button>
      <button className="icon-control" aria-label={"Compartilhar publica\u00e7\u00e3o"} onClick={()=>setDialog("share")}><Send size={23}/></button>
      <button className="icon-control social-save" aria-label={"Salvar publica\u00e7\u00e3o"} aria-pressed={item.mine.includes("SAVE")} disabled={busy} onClick={()=>void react("SAVE")}><Bookmark size={24} fill={item.mine.includes("SAVE")?"currentColor":"none"}/></button>
    </div>
    <div className="social-post-meta">{item.likes>0&&<p className="social-post-likes">{item.likes} {item.likes===1?"curtida":"curtidas"}</p>}{hasMedia&&copy}
      {item.comments>0&&<button type="button" className="text-button social-post-all-comments" onClick={()=>setDialog("comments")}>{item.comments===1?"Ver 1 coment\u00e1rio":`Ver todos os ${item.comments} coment\u00e1rios`}</button>}
      <small>{item.pinned&&"Fixado \u00b7 "}<time dateTime={item.publishedAt}>{relativeTime(item.publishedAt,new Date())}</time></small>
    </div>
    {error&&<p className="social-error" role="alert">{error}</p>}
    {dialog==="comments"&&<SocialComments item={item} me={me} close={()=>setDialog(null)} changed={changed} person={person}/>}
    {dialog==="share"&&<SocialShare item={item} close={()=>setDialog(null)}/>}
    {dialog==="more"&&<SocialPostOptions item={item} me={me} changed={changed} close={()=>setDialog(null)}/>}
  </article>;
}
