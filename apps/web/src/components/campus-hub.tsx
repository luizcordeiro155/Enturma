"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen, CalendarDays, CheckCircle2, Clock3, Flame, GraduationCap,
  Plus, Sparkles, Target, TimerReset, Users, BriefcaseBusiness, Trophy
} from "lucide-react";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Feedback, Loading } from "./feedback";
import { resilientRead, refreshWhenOnline } from "@/lib/offline-data";
import { CampusTools } from "./campus-tools";
import { AdaptivePractice } from "./adaptive-practice";
import { StudyGroups } from "./study-groups";

type Task={id:string;kind:string;title:string;notes:string;dueAt:string;estimatedMinutes:number;priority:string;completedAt?:string|null;subjectName?:string|null};
type Match={id:string;name:string;username:string;goal:string;preferredMode:string;subjectName?:string|null};
type Opportunity={id:string;title:string;organization:string;kind:string;url:string;city?:string};
type EventItem={id:string;title:string;organization:string;description:string;startsAt:string;url?:string;city?:string};
type Today={
 tasks:Task[];
 focus:{focusSeconds:number;focusSessions:number};
 flashcards:{dueFlashcards:number;totalFlashcards:number};
 study:{totalXp:number;streak:number};
 activeRooms:number;
 matches:Match[];
 opportunities:Opportunity[];
 events:EventItem[];
};

const taskLabels:Record<string,string>={
 CLASS:"Aula",EXAM:"Prova",ASSIGNMENT:"Trabalho",PRESENTATION:"Apresentação",
 STUDY:"Estudo",GROUP:"Grupo",EVENT:"Evento"
};

export function CampusHub(){
  const [profile,setProfile]=useState<Profile>();
  const [data,setData]=useState<Today>();
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [offline,setOffline]=useState(false);
  const [showTask,setShowTask]=useState(false);
  const [focusId,setFocusId]=useState<string|null>(null);
  const [focusStarted,setFocusStarted]=useState<number|null>(null);
  const [focusSeconds,setFocusSeconds]=useState(0);
  const root=useRef<HTMLDivElement>(null);

  async function load(){
    try{
      const [p,t]=await Promise.all([
        resilientRead("profile:me",()=>api<Profile>("/users/me",{cache:"no-store"})),
        resilientRead("campus:today",()=>api<Today>("/campus/today",{cache:"no-store"}))
      ]);
      setProfile(p.value); setData(t.value); setOffline(p.offline||t.offline); setError("");
    }catch(e){setError((e as Error).message);}
  }
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);const stop=refreshWhenOnline(()=>void load());return()=>{window.clearTimeout(timer);stop();};},[]);
  useEffect(()=>{
    const cards=root.current?.querySelectorAll<HTMLElement>("[data-campus-card]");
    cards?.forEach((card,index)=>{
      card.animate(
        [{opacity:0,transform:"translateY(18px) scale(.985)"},{opacity:1,transform:"translateY(0) scale(1)"}],
        {duration:420+index*45,easing:"cubic-bezier(.2,.8,.2,1)",fill:"both"}
      );
    });
  },[data]);
  useEffect(()=>{
    if(!focusStarted)return;
    let frame=0;
    const tick=()=>{
      setFocusSeconds(Math.floor((Date.now()-focusStarted)/1000));
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[focusStarted]);

  const next=useMemo(()=>data?.tasks.filter(x=>!x.completedAt).slice(0,6)??[],[data]);
  const firstName=profile?.name?.split(" ")[0]??"estudante";
  const focusClock=`${String(Math.floor(focusSeconds/60)).padStart(2,"0")}:${String(focusSeconds%60).padStart(2,"0")}`;

  async function complete(id:string){
    await post(`/campus/tasks/${id}/complete`);
    setNotice("Atividade concluída. Seu painel foi atualizado.");
    await load();
  }
  async function startFocus(){
    try{
      const result=await post<{id:string}>("/campus/focus",{label:"Modo Foco",minutes:50});
      setFocusId(result.id);setFocusStarted(Date.now());setFocusSeconds(0);
    }catch(e){setError((e as Error).message);}
  }
  async function finishFocus(){
    if(!focusId)return;
    try{
      await post(`/campus/focus/${focusId}/finish`);
      setFocusId(null);setFocusStarted(null);setNotice("Sessão de foco concluída.");
      await load();
    }catch(e){setError((e as Error).message);}
  }
  async function taskSubmit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    try{
      await post("/campus/tasks",{
        title:String(fd.get("title")||""),
        notes:String(fd.get("notes")||""),
        kind:String(fd.get("kind")||"STUDY"),
        dueAt:new Date(String(fd.get("dueAt"))).toISOString(),
        estimatedMinutes:Number(fd.get("minutes")||30),
        priority:String(fd.get("priority")||"NORMAL"),
        subjectId:fd.get("subjectId")||null
      });
      e.currentTarget.reset();setShowTask(false);setNotice("Compromisso adicionado à sua rotina.");
      await load();
    }catch(err){setError((err as Error).message);}
  }

  if(!data)return <div className="campus-loading"><Loading/><Feedback error={error}/></div>;

  return <div ref={root} className="campus-hub">
    <header className="campus-hero" data-campus-card>
      <div>
        <span className="campus-kicker"><Sparkles size={16}/> Hoje no Enturma</span>
        <h1>Boa jornada, {firstName}.</h1>
        <p>Seu estudo, sua turma e seus próximos passos em um único lugar.</p>
      </div>
      <div className="campus-hero-actions">
        <button className="button" onClick={()=>setShowTask(v=>!v)}><Plus size={17}/> Adicionar compromisso</button>
        <Link className="button secondary" href="/rooms/new"><Users size={17}/> Estudar em grupo</Link>
      </div>
    </header>

    <Feedback error={error} success={offline?"Modo offline: exibindo a última sincronização salva neste dispositivo.":notice}/>

    {showTask&&<form className="campus-task-form" onSubmit={taskSubmit} data-campus-card>
      <div className="campus-form-grid">
        <label>Título<input name="title" required maxLength={180} placeholder="Ex.: Prova de Banco de Dados"/></label>
        <label>Tipo<select name="kind" defaultValue="STUDY">
          <option value="STUDY">Estudo</option><option value="CLASS">Aula</option><option value="EXAM">Prova</option>
          <option value="ASSIGNMENT">Trabalho</option><option value="PRESENTATION">Apresentação</option><option value="GROUP">Grupo</option>
        </select></label>
        <label>Data e hora<input name="dueAt" type="datetime-local" required/></label>
        <label>Duração estimada<input name="minutes" type="number" min={5} max={1440} defaultValue={30}/></label>
        <label>Prioridade<select name="priority" defaultValue="NORMAL"><option value="LOW">Baixa</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></label>
        <label>Matéria<select name="subjectId" defaultValue=""><option value="">Geral</option>{profile?.subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
      </div>
      <label>Observações<textarea name="notes" maxLength={1200} placeholder="Conteúdo, local, instruções ou objetivo..."/></label>
      <div className="actions"><button className="button" type="submit">Salvar</button><button className="button secondary" type="button" onClick={()=>setShowTask(false)}>Cancelar</button></div>
    </form>}

    <section className="campus-metrics">
      <article data-campus-card><Flame/><span>Sequência</span><strong>{data.study.streak} dias</strong></article>
      <article data-campus-card><Trophy/><span>Experiência</span><strong>{data.study.totalXp} XP</strong></article>
      <article data-campus-card><Clock3/><span>Foco nesta semana</span><strong>{Math.round(data.focus.focusSeconds/60)} min</strong></article>
      <article data-campus-card><BookOpen/><span>Flashcards para revisar</span><strong>{data.flashcards.dueFlashcards}</strong></article>
    </section>

    <div className="campus-layout">
      <main className="campus-main">
        <section className="campus-card" data-campus-card>
          <div className="campus-card-title"><div><CalendarDays/><span><small>Sua rotina</small><h2>Próximos compromissos</h2></span></div><button className="text-button" onClick={()=>setShowTask(true)}>Adicionar</button></div>
          {next.length? <div className="campus-timeline">{next.map(task=><article key={task.id} className={`campus-task priority-${task.priority.toLowerCase()}`}>
            <div className="campus-task-date"><strong>{new Date(task.dueAt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</strong><span>{new Date(task.dueAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span></div>
            <div><small>{taskLabels[task.kind]??task.kind}{task.subjectName?` · ${task.subjectName}`:""}</small><h3>{task.title}</h3>{task.notes&&<p>{task.notes}</p>}</div>
            <button className="icon-action" title="Concluir" onClick={()=>void complete(task.id)}><CheckCircle2/></button>
          </article>)}</div>:<div className="campus-empty"><CheckCircle2/><h3>Sua agenda está tranquila.</h3><p>Adicione aulas, provas e trabalhos para o Enturma organizar seu dia.</p></div>}
        </section>

        <section className="campus-card focus-card" data-campus-card>
          <div className="campus-card-title"><div><TimerReset/><span><small>Modo foco</small><h2>{focusId?"Você está estudando agora":"Comece uma sessão sem distrações"}</h2></span></div></div>
          {focusId?<div className="focus-running"><strong>{focusClock}</strong><p>O tempo é sincronizado com seu progresso quando você concluir.</p><button className="button" onClick={()=>void finishFocus()}>Concluir sessão</button></div>:
          <div className="focus-ready"><p>Inicie uma sessão de 50 minutos. O Enturma registra seu tempo de estudo sem recompensar spam.</p><button className="button" onClick={()=>void startFocus()}><Target size={17}/> Iniciar 50 min</button></div>}
        </section>

        <CampusTools />

        <section className="campus-card" data-campus-card>
          <div className="campus-card-title"><div><Users/><span><small>Match de estudo</small><h2>Colegas disponíveis agora</h2></span></div><Link href="/friends">Ver amigos</Link></div>
          {data.matches.length?<div className="campus-match-grid">{data.matches.map(m=><article className="campus-match" key={m.id}><span className="campus-avatar">{m.name.slice(0,1).toUpperCase()}</span><div><strong>{m.name}</strong><small>{m.subjectName??"Estudo geral"} · {m.goal||"Disponível para estudar"}</small></div></article>)}</div>:
          <div className="campus-empty compact"><Users/><p>Ainda não há colegas compatíveis marcados como disponíveis.</p></div>}
        </section>
      </main>

      <aside className="campus-side">
        <section className="campus-card" data-campus-card>
          <div className="campus-card-title"><div><GraduationCap/><span><small>Preparação</small><h2>Estudar melhor</h2></span></div></div>
          <div className="campus-links">
            <Link href="/notebooks"><BookOpen/> Cadernos IA <span>→</span></Link>
            <Link href="/challenges"><Trophy/> Desafios acadêmicos <span>→</span></Link>
            <Link href="/home#minhas-materias"><GraduationCap/> Minhas matérias no Início <span>→</span></Link>
          </div>
        </section>

        <section className="campus-card" data-campus-card>
          <div className="campus-card-title"><div><BriefcaseBusiness/><span><small>Carreira</small><h2>Oportunidades</h2></span></div></div>
          {data.opportunities.length?data.opportunities.slice(0,4).map(o=><a className="campus-opportunity" href={o.url} target="_blank" rel="noreferrer" key={o.id}><strong>{o.title}</strong><span>{o.organization}{o.city?` · ${o.city}`:""}</span></a>):<p className="muted">Novas oportunidades verificadas aparecerão aqui.</p>}
        </section>

        <section className="campus-card" data-campus-card>
          <div className="campus-card-title"><div><CalendarDays/><span><small>Campus</small><h2>Próximos eventos</h2></span></div></div>
          {data.events.length?data.events.slice(0,4).map(ev=><article className="campus-event" key={ev.id}><strong>{ev.title}</strong><span>{new Date(ev.startsAt).toLocaleString("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span></article>):<p className="muted">Eventos acadêmicos aparecerão aqui.</p>}
        </section>
      </aside>
    </div>

    <div className="campus-integrated-suites">
      <AdaptivePractice embedded />
      <StudyGroups embedded />
    </div>
  </div>;
}
