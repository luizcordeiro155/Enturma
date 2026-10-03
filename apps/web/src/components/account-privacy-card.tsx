"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { api, post } from "@/lib/api";
import { useRouter } from "next/navigation";

type Deletion={status?:string;requestedAt?:string;executeAt?:string;mode?:string;cancelledAt?:string|null;executedAt?:string|null};

export function AccountPrivacyCard(){
 const [data,setData]=useState<Deletion>();
 const [busy,setBusy]=useState(false);
 const [mode,setMode]=useState<"schedule"|"now"|null>(null);
 const [confirm,setConfirm]=useState("");
 const [message,setMessage]=useState("");
 const modal=useRef<HTMLDivElement>(null);
 const router=useRouter();
 async function load(){try{setData(await api<Deletion>("/account/privacy/deletion",{cache:"no-store"}));}catch{}}
 useEffect(()=>{void load();},[]);
 useEffect(()=>{if(mode&&modal.current)modal.current.animate([{opacity:0,transform:"translateY(12px) scale(.98)"},{opacity:1,transform:"none"}],{duration:260,easing:"cubic-bezier(.2,.8,.2,1)"});},[mode]);
 const pending=!!data?.executeAt&&!data.cancelledAt&&!data.executedAt&&data.mode==="DELAYED";
 async function schedule(){
   setBusy(true);setMessage("");
   try{await post("/account/privacy/deletion/schedule");setMode(null);setConfirm("");setMessage("Exclusão agendada. Você pode cancelar durante os próximos 5 dias.");await load();}
   catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
 }
 async function cancel(){
   setBusy(true);try{await post("/account/privacy/deletion/cancel");setMessage("Exclusão cancelada. Sua conta continuará ativa.");await load();}finally{setBusy(false);}
 }
 async function erase(){
   setBusy(true);setMessage("");
   try{
     await api("/account/privacy/deletion/now",{method:"DELETE"});
     localStorage.clear();sessionStorage.clear();router.replace("/login?deleted=1");
   }catch(e){setMessage((e as Error).message);setBusy(false);}
 }
 return <section className="privacy-zone">
   <div className="privacy-zone-heading"><ShieldCheck/><div><h2>Privacidade e controle dos seus dados</h2><p>Você controla quando sua conta e seus dados pessoais devem ser removidos.</p></div></div>
   {pending?<div className="deletion-pending"><AlertTriangle/><div><strong>Exclusão agendada</strong><p>A remoção está programada para {new Date(data!.executeAt!).toLocaleString("pt-BR")}. Até lá, você pode cancelar.</p></div><button className="button secondary" disabled={busy} onClick={()=>void cancel()}><Undo2 size={16}/> Cancelar exclusão</button></div>:null}
   <div className="privacy-actions">
     <article><div><strong>Excluir em 5 dias</strong><p>Agenda a remoção e mantém uma janela de 5 dias para você desistir.</p></div><button className="button secondary" disabled={busy||pending} onClick={()=>{setMode("schedule");setConfirm("")}}>Agendar exclusão</button></article>
     <article className="danger"><div><strong>Apagar tudo agora</strong><p>Encerra suas sessões e remove ou anonimiza de forma irreversível seus dados pessoais imediatamente.</p></div><button className="button danger-button" disabled={busy} onClick={()=>{setMode("now");setConfirm("")}}><Trash2 size={16}/> Excluir agora</button></article>
   </div>
   {message?<p className="privacy-message" role="status">{message}</p>:null}
   {mode?<div className="privacy-modal-backdrop" role="dialog" aria-modal="true"><div className="privacy-modal" ref={modal}>
      <AlertTriangle size={34}/>
      <h3>{mode==="now"?"Excluir conta imediatamente?":"Agendar exclusão da conta?"}</h3>
      <p>{mode==="now"?"Esta ação é irreversível. Seus identificadores pessoais, perfil, cadernos privados, chaves e sessões serão removidos; conteúdo comunitário necessário à integridade do serviço ficará anonimizado.":"A conta será removida após 5 dias. Você poderá cancelar a solicitação antes do prazo."}</p>
      <label>Digite <strong>EXCLUIR</strong> para confirmar<input autoFocus value={confirm} onChange={e=>setConfirm(e.target.value)} /></label>
      <div className="actions"><button className={mode==="now"?"button danger-button":"button"} disabled={confirm!=="EXCLUIR"||busy} onClick={()=>void(mode==="now"?erase():schedule())}>{busy?"Processando…":mode==="now"?"Apagar tudo agora":"Agendar para 5 dias"}</button><button className="button secondary" disabled={busy} onClick={()=>setMode(null)}>Cancelar</button></div>
   </div></div>:null}
 </section>;
}
