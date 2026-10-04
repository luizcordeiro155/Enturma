"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen, CalendarDays, CheckCircle2, Clock3, Flame, GraduationCap,
  Plus, Target, TimerReset, Users, BriefcaseBusiness, Trophy
} from "lucide-react";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Feedback, Loading } from "./feedback";
import { resilientRead, refreshWhenOnline } from "@/lib/offline-data";
import { CampusTools } from "./campus-tools";
import { AdaptivePractice } from "./adaptive-practice";
import { StudyGroups } from "./study-groups";
import { LiveMemberIdentityCard } from "./user-identity";
import { useLiveRefresh } from "@/lib/live-updates";
import { CampusTutor } from "./campus-tutor";

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

function formatDay(value:string){
  return new Date(value).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
}
function formatTime(value:string){
  return new Date(value).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
}

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
  const [focusGoal,setFocusGoal]=useState("");
  const [focusSubjectId,setFocusSubjectId]=useState("");
  const root=useRef<HTMLDivElement>(null);
  const initialRevealDone=useRef(false);

  async function load(){
    try{
      const [p,t]=await Promise.all([
        resilientRead("profile:me",()=>api<Profile>("/users/me",{cache:"no-store"})),
        resilientRead("campus:today",()=>api<Today>("/campus/today",{cache:"no-store"}))
      ]);
      setProfile(p.value);
      setData(t.value);
      setOffline(p.offline||t.offline);
      setError("");
    }catch(e){setError((e as Error).message);}
  }

  useEffect(()=>{
    const timer=window.setTimeout(()=>void load(),0);
    const stop=refreshWhenOnline(()=>void load());
    return()=>{window.clearTimeout(timer);stop();};
  },[]);
  useLiveRefresh("campus_changed",load,12000);
  useLiveRefresh("rooms_changed",load,12000);

  useEffect(()=>{
    if(!data||initialRevealDone.current)return;
    initialRevealDone.current=true;
    const cards=root.current?.querySelectorAll<HTMLElement>("[data-campus-reveal]");
    cards?.forEach((card,index)=>{
      card.animate(
        [
          {opacity:.72,transform:"translateY(14px)",filter:"blur(3px)"},
          {opacity:1,transform:"translateY(0)",filter:"blur(0)"}
        ],
        {duration:360+index*34,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"}
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

  const openTasks=useMemo(()=>data?.tasks.filter(x=>!x.completedAt)??[],[data]);
  const next=openTasks.slice(0,6);
  const nextTask=next[0];
  const firstName=profile?.name?.split(" ")[0]??"estudante";
  const focusClock=`${String(Math.floor(focusSeconds/60)).padStart(2,"0")}:${String(focusSeconds%60).padStart(2,"0")}`;
  const todayLabel=new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"2-digit",month:"long"}).format(new Date());

  async function complete(id:string){
    await post(`/campus/tasks/${id}/complete`);
    setNotice("Atividade concluída. Seu painel foi atualizado.");
    await load();
  }
  async function startFocus(){
    try{
      const goal=focusGoal.trim()||"Sessão de foco guiada";
      const result=await post<{id:string}>("/campus/focus",{
        subjectId:focusSubjectId||null,
        label:goal,
        minutes:50
      });
      setFocusId(result.id);
      setFocusStarted(Date.now());
      setFocusSeconds(0);
    }catch(e){setError((e as Error).message);}
  }
  async function finishFocus(){
    if(!focusId)return;
    try{
      await post(`/campus/focus/${focusId}/finish`);
      setFocusId(null);
      setFocusStarted(null);
      setNotice("Sessão de foco concluída.");
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
      e.currentTarget.reset();
      setShowTask(false);
      setNotice("Compromisso adicionado à sua rotina.");
      await load();
    }catch(err){setError((err as Error).message);}
  }

  if(!data)return <div className="campus-loading"><Loading/><Feedback error={error}/></div>;

  return <div ref={root} className="campus-hub">
    <header className="today-hero" data-campus-reveal>
      <div className="today-hero-copy">
        <div className="today-date-line"><CalendarDays size={17}/><span>{todayLabel}</span></div>
        <h1>Hoje / Agenda</h1>
        <p>Boa jornada, <strong>{firstName}</strong>. Veja o que pede atenção agora e continue estudando sem sair do seu fluxo.</p>
        <div className="today-hero-actions">
          <button className="button" onClick={()=>setShowTask(v=>!v)}><Plus size={17}/> Adicionar compromisso</button>
          <Link className="button secondary" href="/rooms/new"><Users size={17}/> Abrir sala de estudo</Link>
        </div>
      </div>

      <aside className="today-next-panel" aria-label="Próximo compromisso">
        <div className="today-next-heading">
          <span>Próximo compromisso</span>
          {nextTask?<strong>{formatDay(nextTask.dueAt)} · {formatTime(nextTask.dueAt)}</strong>:<strong>Agenda livre</strong>}
        </div>
        {nextTask?<div className="today-next-content">
          <small>{taskLabels[nextTask.kind]??nextTask.kind}{nextTask.subjectName?` · ${nextTask.subjectName}`:""}</small>
          <h2>{nextTask.title}</h2>
          {nextTask.notes?<p>{nextTask.notes}</p>:<p>Abra sua rotina abaixo para ver os próximos itens.</p>}
        </div>:<div className="today-next-content">
          <h2>Nada urgente agora.</h2>
          <p>Aproveite para iniciar um foco, revisar flashcards ou estudar com alguém.</p>
        </div>}
      </aside>
    </header>

    <section className="today-status-strip" data-campus-reveal aria-label="Resumo do dia">
      <div><Flame/><span>Sequência</span><strong>{data.study.streak} dias</strong></div>
      <div><Clock3/><span>Foco acumulado</span><strong>{Math.round(data.focus.focusSeconds/60)} min</strong></div>
      <div><BookOpen/><span>Revisões pendentes</span><strong>{data.flashcards.dueFlashcards}</strong></div>
      <div><Users/><span>Salas ativas</span><strong>{data.activeRooms}</strong></div>
      <div><Trophy/><span>Experiência</span><strong>{data.study.totalXp} XP</strong></div>
    </section>

    <Feedback error={error} success={offline?"Modo offline: exibindo a última sincronização salva neste dispositivo.":notice}/>

    {showTask&&<form className="campus-task-form" onSubmit={taskSubmit} data-campus-reveal>
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

    <div className="today-primary-grid">
      <section className="campus-card today-agenda-card" data-campus-reveal>
        <div className="campus-card-title">
          <div><CalendarDays/><span><h2>Próximos compromissos</h2><small>{openTasks.length} pendentes na sua rotina</small></span></div>
          <button className="text-button" onClick={()=>setShowTask(true)}>Adicionar</button>
        </div>
        {next.length?<div className="campus-timeline">{next.map(task=><article key={task.id} className={`campus-task priority-${task.priority.toLowerCase()}`}>
          <div className="campus-task-date"><strong>{formatDay(task.dueAt)}</strong><span>{formatTime(task.dueAt)}</span></div>
          <div className="campus-task-copy"><small>{taskLabels[task.kind]??task.kind}{task.subjectName?` · ${task.subjectName}`:""}</small><h3>{task.title}</h3>{task.notes&&<p>{task.notes}</p>}</div>
          <button className="icon-action" title="Concluir" aria-label={`Concluir ${task.title}`} onClick={()=>void complete(task.id)}><CheckCircle2/></button>
        </article>)}</div>:<div className="campus-empty"><CheckCircle2/><h3>Sua agenda está tranquila.</h3><p>Adicione aulas, provas e trabalhos para o Enturma organizar seu dia.</p></div>}
      </section>

      <section className="campus-card today-focus-card" data-campus-reveal>
        <div className="campus-card-title">
          <div><TimerReset/><span><h2>{focusId?"Foco em andamento":"Modo Foco com Tutor"}</h2><small>{focusId?focusGoal||"Sessão guiada":"50 minutos para estudar com orientação da IA"}</small></span></div>
        </div>
        {focusId?<>
          <div className="focus-running">
            <div><strong>{focusClock}</strong><p>O tutor acompanha seu ritmo e adapta as explicações enquanto você estuda.</p></div>
            <button className="button" onClick={()=>void finishFocus()}>Concluir sessão</button>
          </div>
          <CampusTutor
            subjectId={focusSubjectId||null}
            focusSessionId={focusId}
            goal={focusGoal.trim()||"Aprender o conteúdo desta sessão de foco"}
            autoPrompt="Comece esta sessão criando um roteiro curto para os próximos 50 minutos. Explique o primeiro passo e faça uma checagem rápida de conhecimento."
          />
        </>:<div className="focus-setup">
          <p className="focus-ready-copy">Escolha a matéria e diga o que você quer aprender. A Enturma AI explica, testa seu entendimento e ajusta o ensino ao seu ritmo.</p>
          <div className="focus-setup-fields">
            <label>Matéria<select value={focusSubjectId} onChange={e=>setFocusSubjectId(e.target.value)}>
              <option value="">Estudo geral</option>
              {profile?.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select></label>
            <label>Objetivo da sessão<input value={focusGoal} onChange={e=>setFocusGoal(e.target.value)} maxLength={180} placeholder="Ex.: JOINs e normalização para a prova"/></label>
          </div>
          <button className="button focus-start" onClick={()=>void startFocus()}><Target size={17}/> Iniciar foco com tutor</button>
        </div>}
      </section>
    </div>

    <CampusTools />

    <div className="today-secondary-grid">
      <section className="campus-card today-match-card" data-campus-reveal>
        <div className="campus-card-title">
          <div><Users/><span><h2>Colegas disponíveis agora</h2><small>Match de estudo por matéria e objetivo</small></span></div>
          <Link href="/friends">Ver amigos</Link>
        </div>
        {data.matches.length?<div className="campus-match-grid">{data.matches.slice(0,6).map(m=><article className="campus-match" key={m.id}><LiveMemberIdentityCard id={m.id} name={m.name} subtitle={`${m.subjectName??"Estudo geral"} · ${m.goal||"Disponível para estudar"}`} /></article>)}</div>:
        <div className="campus-empty compact"><Users/><p>Ainda não há colegas compatíveis marcados como disponíveis.</p></div>}
      </section>

      <section className="campus-card today-shortcuts" data-campus-reveal>
        <div className="campus-card-title">
          <div><GraduationCap/><span><h2>Continue estudando</h2><small>Atalhos para o que você usa durante o semestre</small></span></div>
        </div>
        <div className="campus-links">
          <Link href="/notebooks"><BookOpen/> Cadernos IA <span>→</span></Link>
          <Link href="/challenges"><Trophy/> Desafios acadêmicos <span>→</span></Link>
          <Link href="/home#minhas-materias"><GraduationCap/> Minhas matérias no Início <span>→</span></Link>
        </div>
      </section>
    </div>

    <section className="campus-card today-discovery" data-campus-reveal>
      <div className="today-discovery-column">
        <div className="campus-card-title"><div><BriefcaseBusiness/><span><h2>Oportunidades</h2><small>Itens adicionados e verificados no Enturma</small></span></div></div>
        {data.opportunities.length?<div>{data.opportunities.slice(0,4).map(o=><a className="campus-opportunity" href={o.url} target="_blank" rel="noreferrer" key={o.id}><strong>{o.title}</strong><span>{o.organization}{o.city?` · ${o.city}`:""}</span></a>)}</div>:<p className="muted">Novas oportunidades aparecerão aqui quando forem adicionadas.</p>}
      </div>
      <div className="today-discovery-column">
        <div className="campus-card-title"><div><CalendarDays/><span><h2>Próximos eventos</h2><small>Agenda acadêmica compartilhada</small></span></div></div>
        {data.events.length?<div>{data.events.slice(0,4).map(ev=><article className="campus-event" key={ev.id}><strong>{ev.title}</strong><span>{new Date(ev.startsAt).toLocaleString("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span></article>)}</div>:<p className="muted">Eventos acadêmicos aparecerão aqui quando forem adicionados.</p>}
      </div>
    </section>

    <div className="campus-integrated-suites">
      <AdaptivePractice embedded />
      <StudyGroups embedded />
    </div>
  </div>;
}
