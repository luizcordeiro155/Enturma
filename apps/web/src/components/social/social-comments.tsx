"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { api } from "@/lib/api";
import { socialWrite, type SocialPerson, type SocialPost as Post } from "@/lib/social";
import { SocialDialog } from "./social-dialog";
import { SocialAuthor } from "./social-post";
import { SocialText } from "./social-text";
type Comment = SocialPerson & {authorId:string;body:string;parentId?:string;createdAt:string};
export function SocialComments({item,me,close,changed,person}: {
  item:Post;me:string;close:()=>void;changed:(post:Post)=>void;person:(id:string)=>void;
}) {
  const [rows,setRows]=useState<Comment[]>([]),[page,setPage]=useState(0),[more,setMore]=useState(false);
  const [text,setText]=useState(""),[parent,setParent]=useState<Comment>(),[busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true),[error,setError]=useState(""),[revision,setRevision]=useState(0);
  const clientId=useRef(crypto.randomUUID()),writing=useRef(false),generation=useRef(0);
  const field=useRef<HTMLTextAreaElement>(null),id=useId();
  useEffect(()=>{
    const request=++generation.current;
    void api<Comment[]>(`/social/posts/${item.id}/comments?page=${page}`,{cache:"no-store"})
      .then(result=>{if(request!==generation.current)return;setRows(previous=>page?[...previous,...result.filter(comment=>!previous.some(row=>row.id===comment.id))]:result);setMore(result.length===30);setError("");})
      .catch(cause=>{if(request===generation.current)setError(cause.message);})
      .finally(()=>{if(request===generation.current)setLoading(false);});
    return()=>{generation.current++;};
  },[item.id,page,revision]);
  async function refreshPost(){try{changed(await api<Post>(`/social/posts/${item.id}`,{cache:"no-store"}));}catch{window.dispatchEvent(new Event("enturma-social_changed"));}}
  async function submit(){
    if(!text.trim()||writing.current)return;
    writing.current=true;setBusy(true);setError("");
    try{
      await socialWrite(`/posts/${item.id}/comments`,{id:clientId.current,body:text,parentId:parent?.parentId??parent?.id??null},"POST");
      clientId.current=crypto.randomUUID();setText("");setParent(undefined);
      setLoading(true);setPage(0);setRevision(value=>value+1);await refreshPost();
    }catch(cause){setError((cause as Error).message);}
    finally{writing.current=false;setBusy(false);}
  }
  async function remove(comment:Comment){
    if(writing.current)return;writing.current=true;setBusy(true);setError("");
    try{await socialWrite(`/posts/${item.id}/comments/${comment.id}`,undefined,"DELETE");setRows(previous=>previous.filter(row=>row.id!==comment.id));if(parent?.id===comment.id)setParent(undefined);await refreshPost();}
    catch(cause){setError((cause as Error).message);}
    finally{writing.current=false;setBusy(false);}
  }
  return <SocialDialog title={"Conversa da publica\u00e7\u00e3o"} close={close} variant="panel">
    <div className="social-dialog-body social-comments-body">
      <div className="social-comment-list" aria-busy={loading}>
        {loading&&!rows.length&&<p role="status">{"Carregando coment\u00e1rios\u2026"}</p>}
        {rows.map(comment=><article key={comment.id} className={comment.parentId?"social-comment-reply":""}>
          <SocialAuthor user={{...comment,id:comment.authorId}} open={person}/>
          <p><SocialText text={comment.body}/></p>
          <div className="social-row"><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString("pt-BR")}</time>
            <button className="text-button" onClick={()=>{setParent(comment);field.current?.focus();}}>Responder</button>
            {(me===comment.authorId||me===item.authorId)&&<button className="text-button" disabled={busy} onClick={()=>void remove(comment)}>Remover</button>}
          </div>
        </article>)}
        {more&&<button className="secondary" disabled={loading} onClick={()=>{setLoading(true);setPage(value=>value+1);}}>{"Mais coment\u00e1rios"}</button>}
        {!loading&&!rows.length&&!error&&<p>Comece a conversa com uma pergunta ou uma ideia.</p>}
      </div>
      <div className="social-comment-composer">
        {parent&&<div className="social-comment-replying"><span>Respondendo a @{parent.username}</span><button type="button" className="icon-control" aria-label="Cancelar resposta" onClick={()=>setParent(undefined)}><X size={16}/></button></div>}
        <form noValidate className="social-comment-form" onSubmit={event=>{event.preventDefault();void submit();}}>
          <label className="sr-only" htmlFor={id}>{"Seu coment\u00e1rio"}</label>
          <textarea id={id} ref={field} className="resize-none" rows={1} maxLength={1500} value={text} disabled={busy}
            onChange={event=>setText(event.target.value)} placeholder={"Adicione um coment\u00e1rio\u2026"}/>
          <button disabled={busy||!text.trim()} aria-label={"Enviar coment\u00e1rio"}><Send size={22}/></button>
        </form>
        {error&&<div role="alert" className="social-error"><p>{error}</p><button type="button" className="text-button" disabled={loading||busy} onClick={()=>{setLoading(true);setRevision(value=>value+1);}}>Tentar novamente</button></div>}
      </div>
    </div>
  </SocialDialog>;
}
