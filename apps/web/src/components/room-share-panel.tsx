"use client";

import { useRef, useState } from "react";
import { Check, Copy, QrCode, X } from "lucide-react";
import { post } from "@/lib/api";

export function RoomSharePanel({roomId}:{roomId:string}){
 const [share,setShare]=useState<{code:string;url:string}>();
 const [open,setOpen]=useState(false);
 const [copied,setCopied]=useState(false);
 const panel=useRef<HTMLDivElement>(null);
 async function show(){
   if(!share)setShare(await post<{code:string;url:string}>("/study-rooms/"+roomId+"/share-code"));
   setOpen(true);
   requestAnimationFrame(()=>panel.current?.animate([{opacity:.4,transform:"translateY(-6px)"},{opacity:1,transform:"none"}],{duration:180,easing:"cubic-bezier(.16,1,.3,1)"}));
 }
 async function copy(){
   if(!share)return;await navigator.clipboard.writeText(share.url);setCopied(true);setTimeout(()=>setCopied(false),1500);
 }
 return <div className="room-share-control">
   <button className="secondary" onClick={()=>void show()}><QrCode size={16}/> Compartilhar</button>
   {open&&share?<div className="room-share-panel" ref={panel}>
     <button className="icon-control room-share-close" aria-label="Fechar" onClick={()=>setOpen(false)}><X size={16}/></button>
     <img src={"/api/backend/study-rooms/"+roomId+"/qr"} alt={"QR Code da sala "+share.code}/>
     <div><small>Código da sala</small><strong>{share.code}</strong><p>Escaneie o QR ou envie o link para colegas entrarem direto no Enturma.</p></div>
     <button className="secondary" onClick={()=>void copy()}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?"Copiado":"Copiar link"}</button>
   </div>:null}
 </div>;
}
