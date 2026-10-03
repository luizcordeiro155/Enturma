"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Brain, CalendarClock, Check, Plus, Users } from "lucide-react";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Feedback } from "./feedback";
import { LiveMemberIdentityCard } from "./user-identity";

type Flashcard={
  id:string;front:string;back:string;nextReviewAt:string;reviewCount:number;
  subjectName?:string|null;notebookTitle?:string|null;
};

export function CampusTools(){
  const [profile,setProfile]=useState<Profile>();
  const [cards,setCards]=useState<Flashcard[]>([]);
  const [showExam,setShowExam]=useState(false);
  const [showCard,setShowCard]=useState(false);
  const [available,setAvailable]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const root=useRef<HTMLDivElement>(null);

  async function refreshCards(){
    try{setCards(await api<Flashcard[]>("/campus/flashcards/due",{cache:"no-store"}));}
    catch(e){setError((e as Error).message);}
  }

  useEffect(()=>{
    void Promise.all([api<Profile>("/users/me"),api<Flashcard[]>("/campus/flashcards/due",{cache:"no-store"})])
      .then(([p,c])=>{setProfile(p);setCards(c);})
      .catch(e=>setError(e.message));
  },[]);

  useEffect(()=>{
    root.current?.querySelectorAll<HTMLElement>("[data-tool-panel]").forEach((el,i)=>{
      el.animate(
        [{opacity:0,transform:"translateY(12px)"},{opacity:1,transform:"translateY(0)"}],
        {duration:300+i*55,easing:"cubic-bezier(.2,.8,.2,1)",fill:"both"}
      );
    });
  },[showExam,showCard,cards.length]);

  async function exam(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError("");setNotice("");
    const fd=new FormData(e.currentTarget);
    const topics=String(fd.get("topics")||"").split(",").map(v=>v.trim()).filter(Boolean);
    try{
      await post("/campus/exam-plan",{
        subjectId:fd.get("subjectId")||null,
        title:String(fd.get("title")||""),
        examAt:new Date(String(fd.get("examAt"))).toISOString(),
        topics
      });
      setNotice("Plano criado. As revisões e a prova já entraram na sua agenda.");
      setShowExam(false);e.currentTarget.reset();
    }catch(err){setError((err as Error).message);}
  }

  async function createCard(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError("");setNotice("");
    const fd=new FormData(e.currentTarget);
    try{
      await post("/campus/flashcards",{
        subjectId:fd.get("subjectId")||null,
        notebookId:null,
        front:String(fd.get("front")||""),
        back:String(fd.get("back")||"")
      });
      setNotice("Flashcard criado e colocado na fila de revisão.");
      setShowCard(false);e.currentTarget.reset();await refreshCards();
    }catch(err){setError((err as Error).message);}
  }

  async function review(id:string,rating:number){
    try{
      await post(`/campus/flashcards/${id}/review`,{rating});
      await refreshCards();
    }catch(e){setError((e as Error).message);}
  }

  async function toggleAvailability(){
    const next=!available;
    try{
      await api("/campus/study-match",{
        method:"PUT",
        body:JSON.stringify({
          subjectId:profile?.subjects[0]?.id??null,
          goal:next?"Disponível para estudar agora":"",
          availableNow:next,
          preferredMode:"ANY"
        })
      });
      setAvailable(next);
      setNotice(next?"Você está visível no Match de Estudo.":"Você saiu do Match de Estudo.");
    }catch(e){setError((e as Error).message);}
  }

  return <div ref={root} className="campus-tools-stack">
    <Feedback error={error} success={notice}/>

    <section className="campus-card" data-tool-panel>
      <div className="campus-card-title">
        <div><CalendarClock/><span><small>Plano inteligente</small><h2>Preparar para uma prova</h2></span></div>
        <button className="button secondary compact" onClick={()=>setShowExam(v=>!v)}>{showExam?"Fechar":"Criar plano"}</button>
      </div>
      <p className="muted">Informe a prova e o Enturma distribui sessões de revisão até a data, aumentando a prioridade perto do exame.</p>
      {showExam?<form className="campus-inline-form" onSubmit={exam}>
        <label>Prova<input name="title" required maxLength={180} placeholder="Ex.: Prova de Banco de Dados"/></label>
        <label>Matéria<select name="subjectId" defaultValue=""><option value="">Geral</option>{profile?.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>Data e hora<input name="examAt" type="datetime-local" required/></label>
        <label className="wide">Tópicos separados por vírgula<input name="topics" placeholder="JOIN, Normalização, Procedures"/></label>
        <button className="button" type="submit">Gerar meu plano</button>
      </form>:null}
    </section>

    <section className="campus-card" data-tool-panel>
      <div className="campus-card-title">
        <div><Brain/><span><small>Repetição espaçada</small><h2>Flashcards</h2></span></div>
        <button className="button secondary compact" onClick={()=>setShowCard(v=>!v)}><Plus size={16}/> Novo</button>
      </div>
      {showCard?<form className="campus-inline-form" onSubmit={createCard}>
        <label className="wide">Pergunta<input name="front" required maxLength={1200} placeholder="O que é normalização 3FN?"/></label>
        <label className="wide">Resposta<textarea name="back" required maxLength={2400}/></label>
        <label>Matéria<select name="subjectId" defaultValue=""><option value="">Geral</option>{profile?.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <button className="button" type="submit">Criar flashcard</button>
      </form>:null}
      {cards.length?<div className="flashcard-review-list">{cards.slice(0,5).map(card=><article key={card.id} className="flashcard-review">
        <small>{card.subjectName??card.notebookTitle??"Revisão geral"}</small>
        <h3>{card.front}</h3>
        <details><summary>Mostrar resposta</summary><p>{card.back}</p></details>
        <div className="flashcard-rating">
          <button onClick={()=>void review(card.id,1)}>Errei</button>
          <button onClick={()=>void review(card.id,2)}>Difícil</button>
          <button onClick={()=>void review(card.id,3)}>Bom</button>
          <button onClick={()=>void review(card.id,4)}><Check size={15}/> Fácil</button>
        </div>
      </article>)}</div>:<p className="muted">Nenhum cartão pendente agora. Novos flashcards aparecerão aqui na hora certa.</p>}
    </section>

    <section className="campus-card study-match-control" data-tool-panel>
      <div className="campus-card-title">
        <div><Users/><span><small>Estudo social</small><h2>Quero estudar com alguém</h2></span></div>
      </div>
      <p className="muted">Quando ativado, estudantes com matérias compatíveis podem encontrar você no Match de Estudo.</p>
      {profile ? <div className="study-match-profile-preview">
        <LiveMemberIdentityCard
          id={profile.id}
          name={profile.name}
          subtitle={available ? "Disponível para estudar agora" : "Seu perfil no Match de Estudo"}
        />
      </div> : null}
      <button className={available?"button secondary":"button"} onClick={()=>void toggleAvailability()}>
        {available?"Sair do Match":"Ficar disponível agora"}
      </button>
    </section>
  </div>;
}
