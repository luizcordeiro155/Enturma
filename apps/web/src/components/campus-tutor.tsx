"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Brain, CheckCircle2, Lightbulb, Send, Sparkles } from "lucide-react";
import { api, post } from "@/lib/api";

type TutorAction="EXPLAIN"|"SIMPLIFY"|"EXAMPLE"|"TEST"|"FLASHCARD"|"PLAN";
type TutorReply={id:string;text:string;action:TutorAction;learningNotes?:string};
type TutorProfile={learningNotes:string;interactionCount:number;helpfulCount:number};

export function CampusTutor({
  subjectId,
  focusSessionId,
  goal,
  mode="EXPLAIN",
  compact=false,
  autoPrompt,
}:{
  subjectId?:string|null;
  focusSessionId?:string|null;
  goal:string;
  mode?:TutorAction;
  compact?:boolean;
  autoPrompt?:string;
}){
  const [profile,setProfile]=useState<TutorProfile>();
  const [message,setMessage]=useState("");
  const [reply,setReply]=useState<TutorReply>();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [rated,setRated]=useState(false);
  const autoStarted=useRef(false);

  useEffect(()=>{
    let active=true;
    void api<TutorProfile>("/campus/tutor/profile",{cache:"no-store"})
      .then(value=>{if(active)setProfile(value)})
      .catch(()=>{});
    return()=>{active=false};
  },[]);

  async function ask(action:TutorAction,prompt?:string){
    const text=(prompt??message).trim();
    if(!text)return;
    setBusy(true);setError("");setRated(false);
    try{
      const result=await post<TutorReply>("/campus/tutor",{
        subjectId:subjectId??null,
        focusSessionId:focusSessionId??null,
        goal,
        message:text,
        action,
      });
      setReply(result);
      setMessage("");
      void api<TutorProfile>("/campus/tutor/profile",{cache:"no-store"}).then(setProfile).catch(()=>{});
    }catch(e){setError((e as Error).message)}
    finally{setBusy(false)}
  }

  useEffect(()=>{
    if(!autoPrompt||autoStarted.current)return;
    autoStarted.current=true;
    const timer=window.setTimeout(()=>void ask("PLAN",autoPrompt),120);
    return()=>window.clearTimeout(timer);
  },[autoPrompt]);

  async function rate(rating:number,preference?:string){
    if(!reply)return;
    try{
      await post(`/campus/tutor/${reply.id}/feedback`,{rating,preference:preference??""});
      setRated(true);
      void api<TutorProfile>("/campus/tutor/profile",{cache:"no-store"}).then(setProfile).catch(()=>{});
    }catch(e){setError((e as Error).message)}
  }

  function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    void ask(mode);
  }

  return <section className={compact?"campus-tutor compact":"campus-tutor"}>
    <header className="campus-tutor-heading">
      <div><Sparkles size={20}/><span><strong>Enturma AI Tutor</strong><small>Adapta a explicação ao seu jeito de aprender</small></span></div>
      {profile?<span className="campus-tutor-memory"><Brain size={15}/>{profile.interactionCount} interações</span>:null}
    </header>

    {profile?.learningNotes&&profile.learningNotes!=="Perfil adaptativo em formação."?
      <p className="campus-tutor-note"><Brain size={15}/><span><strong>Como estou te ensinando:</strong> {profile.learningNotes}</span></p>:null}

    {reply?<div className="campus-tutor-answer" aria-live="polite">
      <div className="campus-tutor-answer-label"><Lightbulb size={16}/>Tutor</div>
      <p>{reply.text}</p>
      <div className="campus-tutor-feedback">
        {rated?<span><CheckCircle2 size={15}/>Preferência aprendida</span>:<>
          <span>Essa forma ajudou?</span>
          <button type="button" className="secondary" onClick={()=>void rate(5)}>Sim</button>
          <button type="button" className="secondary" onClick={()=>void rate(2)}>Não muito</button>
        </>}
      </div>
    </div>:null}

    <div className="campus-tutor-actions">
      <button type="button" className="secondary" disabled={busy} onClick={()=>void ask("SIMPLIFY",message||"Explique o conteúdo atual de um jeito mais simples, em passos curtos.")}>Mais simples</button>
      <button type="button" className="secondary" disabled={busy} onClick={()=>void ask("EXAMPLE",message||"Dê um exemplo concreto e depois conecte cada parte ao conceito.")}>Dar exemplo</button>
      <button type="button" className="secondary" disabled={busy} onClick={()=>void ask("TEST",message||"Me faça uma pergunta curta para conferir se eu entendi. Não revele a resposta antes da minha tentativa.")}>Me testar</button>
    </div>

    <form className="campus-tutor-compose" onSubmit={submit}>
      <textarea
        value={message}
        onChange={e=>setMessage(e.target.value)}
        maxLength={2000}
        placeholder="Diga o que você está estudando, onde travou ou peça outra explicação…"
        aria-label="Mensagem para o tutor"
      />
      <button disabled={busy||!message.trim()}>{busy?"Pensando…":<><Send size={16}/>Perguntar</>}</button>
    </form>
    {error?<p className="error" role="alert">{error}</p>:null}
  </section>;
}
