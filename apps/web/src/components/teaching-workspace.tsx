"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BookOpenCheck, GraduationCap, Plus, Users } from "lucide-react";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Feedback } from "./feedback";
import { Shell } from "./shell";

type TeacherProfile={institution:string;title:string;enabled:boolean;verified:boolean};
type ClassSummary={id:string;name:string;description:string;joinCode?:string;subjectName?:string;members?:number;assignments?:number;teacherName?:string};
type Dashboard={profile:TeacherProfile|null;owned:ClassSummary[];joined:ClassSummary[]};
type ClassDetail=ClassSummary & {
 owner:boolean;
 members:{id:string;name:string;username:string;role:string}[];
 assignments:{id:string;title:string;description:string;dueAt?:string;points:number;submissions:number;submitted:boolean}[];
};

export function TeachingWorkspace(){
 const [profile,setProfile]=useState<Profile>();
 const [data,setData]=useState<Dashboard>();
 const [selected,setSelected]=useState<ClassDetail>();
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [busy,setBusy]=useState(false);
 const root=useRef<HTMLDivElement>(null);

 async function load(){
   try{
     const [me,d]=await Promise.all([api<Profile>("/users/me"),api<Dashboard>("/teaching",{cache:"no-store"})]);
     setProfile(me);setData(d);
   }catch(e){setError((e as Error).message)}
 }
 useEffect(()=>{void load()},[]);
 useEffect(()=>{root.current?.querySelectorAll<HTMLElement>("[data-teaching-reveal]").forEach((el,i)=>el.animate([{opacity:.45,transform:"translateY(9px)"},{opacity:1,transform:"none"}],{duration:180+i*30,easing:"cubic-bezier(.16,1,.3,1)"}))},[data,selected]);

 async function saveProfile(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setBusy(true);setError("");
   const fd=new FormData(e.currentTarget);
   try{
     await api("/teaching/profile",{method:"PUT",body:JSON.stringify({institution:String(fd.get("institution")||""),title:String(fd.get("title")||"Professor(a)"),enabled:fd.get("enabled")==="on"})});
     setSuccess("Modo professor atualizado.");await load();
   }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function createClass(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setBusy(true);setError("");
   const fd=new FormData(e.currentTarget);
   try{
     await post("/teaching/classes",{name:String(fd.get("name")||""),description:String(fd.get("description")||""),subjectId:fd.get("subjectId")||null});
     e.currentTarget.reset();setSuccess("Turma criada.");await load();
   }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function joinClass(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setBusy(true);setError("");
   const fd=new FormData(e.currentTarget);
   try{await post("/teaching/classes/join",{code:String(fd.get("code")||"")});e.currentTarget.reset();setSuccess("Você entrou na turma.");await load()}
   catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function open(id:string){
   try{setSelected(await api<ClassDetail>("/teaching/classes/"+id,{cache:"no-store"}));}
   catch(e){setError((e as Error).message)}
 }
 async function assignment(e:FormEvent<HTMLFormElement>){
   e.preventDefault();if(!selected)return;setBusy(true);
   const fd=new FormData(e.currentTarget);
   try{
     await post("/teaching/classes/"+selected.id+"/assignments",{title:String(fd.get("title")||""),description:String(fd.get("description")||""),dueAt:fd.get("dueAt")?new Date(String(fd.get("dueAt"))).toISOString():null,points:Number(fd.get("points")||0)});
     e.currentTarget.reset();await open(selected.id);setSuccess("Atividade publicada.");
   }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function submit(id:string){
   const note=window.prompt("Observação da entrega (opcional):","")??"";
   try{await post("/teaching/assignments/"+id+"/submit",{note});if(selected)await open(selected.id);setSuccess("Atividade marcada como entregue.")}
   catch(e){setError((e as Error).message)}
 }

 return <Shell><div className="teaching-page" ref={root}>
   <header className="suite-heading"><div><GraduationCap size={32}/><h1>Turmas e modo professor</h1></div><p>Professores podem organizar turmas, atividades e acompanhamento básico; estudantes entram pelo código da turma sem substituir as salas de estudo do Enturma.</p></header>
   <Feedback error={error} success={success}/>

   <div className="teaching-top-grid">
     <form className="teacher-mode-form" onSubmit={saveProfile} data-teaching-reveal>
       <h2>Modo professor</h2>
       <label>Instituição<input name="institution" defaultValue={data?.profile?.institution??""} maxLength={180} placeholder="Universidade ou escola"/></label>
       <label>Título<input name="title" defaultValue={data?.profile?.title??"Professor(a)"} maxLength={120}/></label>
       <label className="inline-check"><input type="checkbox" name="enabled" defaultChecked={data?.profile?.enabled??false}/><span>Ativar criação de turmas</span></label>
       <button disabled={busy}>Salvar</button>
     </form>
     <form className="join-class-form" onSubmit={joinClass} data-teaching-reveal>
       <h2>Entrar em turma</h2><p>Recebeu um código do professor? Digite abaixo.</p>
       <input name="code" required maxLength={10} placeholder="ABC23XYZ"/>
       <button disabled={busy}>Entrar</button>
     </form>
   </div>

   {data?.profile?.enabled?<form className="create-class-form" onSubmit={createClass} data-teaching-reveal>
     <div className="section-heading"><h2>Criar turma</h2><Plus size={22}/></div>
     <label>Nome<input name="name" required maxLength={140} placeholder="Banco de Dados · Turma A"/></label>
     <label>Matéria<select name="subjectId" defaultValue=""><option value="">Sem matéria específica</option>{profile?.subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
     <label>Descrição<textarea name="description" maxLength={800}/></label>
     <button disabled={busy}>Criar turma</button>
   </form>:null}

   <section className="teaching-classes" data-teaching-reveal>
     <h2>Minhas turmas</h2>
     <div>{[...(data?.owned??[]),...(data?.joined??[])].map(c=><button key={c.id} onClick={()=>void open(c.id)} className={selected?.id===c.id?"class-row selected":"class-row"}><span><strong>{c.name}</strong><small>{c.subjectName??c.teacherName??"Turma Enturma"}</small></span><span>{c.joinCode?"Código "+c.joinCode:"Abrir"}</span></button>)}</div>
   </section>

   {selected?<section className="class-workspace" data-teaching-reveal>
     <header><div><h2>{selected.name}</h2><p>{selected.description}</p></div>{selected.joinCode?<strong className="join-code">{selected.joinCode}</strong>:null}</header>
     <div className="class-stat-line"><span><Users size={15}/>{selected.members.length} estudantes</span><span><BookOpenCheck size={15}/>{selected.assignments.length} atividades</span></div>
     {selected.owner?<form className="assignment-form" onSubmit={assignment}>
       <h3>Nova atividade</h3><input name="title" required maxLength={180} placeholder="Título"/><textarea name="description" maxLength={2000} placeholder="Orientações"/><div><input name="dueAt" type="datetime-local"/><input name="points" type="number" min={0} max={1000} defaultValue={0}/></div><button disabled={busy}>Publicar atividade</button>
     </form>:null}
     <div className="assignment-list">{selected.assignments.map(a=><article key={a.id}><div><strong>{a.title}</strong><p>{a.description}</p><small>{a.dueAt?new Date(a.dueAt).toLocaleString("pt-BR"):"Sem prazo"} · {a.points} pontos</small></div>{selected.owner?<span>{a.submissions} entregas</span>:a.submitted?<span className="done-label">Entregue</span>:<button onClick={()=>void submit(a.id)}>Marcar como entregue</button>}</article>)}</div>
   </section>:null}
 </div></Shell>;
}
