"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Lock, Plus, Users } from "lucide-react";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Feedback, Loading } from "./feedback";
import { Shell } from "./shell";

type Group={
  id:string;name:string;description:string;visibility:string;ownerId:string;
  subjectName?:string|null;members:number;joined?:boolean|null;
};

export function StudyGroups(){
  const [profile,setProfile]=useState<Profile>();
  const [groups,setGroups]=useState<Group[]>([]);
  const [showCreate,setShowCreate]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [loading,setLoading]=useState(true);
  const root=useRef<HTMLDivElement>(null);

  async function load(){
    try{
      const [p,g]=await Promise.all([api<Profile>("/users/me"),api<Group[]>("/campus/groups",{cache:"no-store"})]);
      setProfile(p);setGroups(g);setError("");
    }catch(e){setError((e as Error).message);}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  useEffect(()=>{
    root.current?.querySelectorAll<HTMLElement>("[data-group-card]").forEach((el,i)=>{
      el.animate(
        [{opacity:0,transform:"translateY(18px) scale(.985)"},{opacity:1,transform:"none"}],
        {duration:360+i*45,easing:"cubic-bezier(.2,.8,.2,1)",fill:"both"}
      );
    });
  },[groups.length,showCreate]);

  async function create(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError("");setNotice("");
    const fd=new FormData(e.currentTarget);
    try{
      await post("/campus/groups",{
        name:String(fd.get("name")||""),
        description:String(fd.get("description")||""),
        subjectId:fd.get("subjectId")||null,
        visibility:String(fd.get("visibility")||"PRIVATE")
      });
      setShowCreate(false);e.currentTarget.reset();setNotice("Grupo criado.");
      await load();
    }catch(err){setError((err as Error).message);}
  }
  async function join(id:string){
    try{await post(`/campus/groups/${id}/join`);setNotice("Você entrou no grupo.");await load();}
    catch(e){setError((e as Error).message);}
  }

  return <Shell><div ref={root} className="groups-page">
    <header className="groups-hero" data-group-card>
      <div><span className="campus-kicker"><Users size={16}/> Comunidade permanente</span>
      <h1>Grupos de estudo</h1><p>Organize a turma além de uma única sessão: matéria, projetos, provas e rotina do semestre.</p></div>
      <button className="button" onClick={()=>setShowCreate(v=>!v)}><Plus size={17}/> Criar grupo</button>
    </header>
    <Feedback error={error} success={notice}/>

    {showCreate?<form className="campus-task-form" onSubmit={create} data-group-card>
      <div className="campus-form-grid">
        <label>Nome<input name="name" required maxLength={120} placeholder="ADS · Banco de Dados"/></label>
        <label>Matéria<select name="subjectId" defaultValue=""><option value="">Grupo geral</option>{profile?.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>Visibilidade<select name="visibility" defaultValue="PRIVATE"><option value="PRIVATE">Privado</option><option value="PUBLIC">Público</option></select></label>
      </div>
      <label>Descrição<textarea name="description" maxLength={600} placeholder="Objetivo, regras e assunto do grupo..."/></label>
      <div className="actions"><button className="button" type="submit">Criar grupo</button><button className="button secondary" type="button" onClick={()=>setShowCreate(false)}>Cancelar</button></div>
    </form>:null}

    {loading?<Loading/>:<section className="groups-grid">
      {groups.map(g=><article className="group-card" data-group-card key={g.id}>
        <div className="group-card-icon">{g.visibility==="PRIVATE"?<Lock/>:<Users/>}</div>
        <small>{g.subjectName??"Comunidade acadêmica"}</small>
        <h2>{g.name}</h2>
        <p>{g.description||"Grupo de estudo permanente no Enturma."}</p>
        <div className="group-card-meta"><span><Users size={15}/>{g.members} membros</span><span><BookOpen size={15}/>{g.visibility==="PRIVATE"?"Privado":"Público"}</span></div>
        {g.joined?<><span className="group-joined">Você participa</span><Link className="button secondary" href={`/groups/${g.id}`}>Abrir espaço</Link></>:g.visibility!=="PRIVATE"?<button className="button secondary" onClick={()=>void join(g.id)}>Entrar no grupo</button>:null}
      </article>)}
      {!groups.length?<div className="campus-empty"><Users/><h3>Nenhum grupo por aqui ainda.</h3><p>Crie o primeiro grupo permanente da sua turma.</p></div>:null}
    </section>}
  </div></Shell>;
}
