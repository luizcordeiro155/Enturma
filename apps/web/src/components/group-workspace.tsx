"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Plus, Trash2, Users } from "lucide-react";
import { api, post } from "@/lib/api";
import { Feedback } from "./feedback";
import { Shell } from "./shell";

type Task={id:string;title:string;description:string;status:"TODO"|"DOING"|"DONE";position:number;assignedTo?:string;assignedName?:string;dueAt?:string};
type Member={id:string;name:string;username:string;role:string};
type Workspace={id:string;name:string;description:string;subjectName?:string;members:Member[];tasks:Task[]};

const columns:[Task["status"],string][]=[["TODO","A fazer"],["DOING","Em andamento"],["DONE","Concluído"]];

export function GroupWorkspace({id}:{id:string}){
 const [data,setData]=useState<Workspace>();
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [busy,setBusy]=useState(false);
 const board=useRef<HTMLDivElement>(null);
 async function load(){try{setData(await api<Workspace>("/campus/groups/"+id+"/workspace",{cache:"no-store"}))}catch(e){setError((e as Error).message)}}
 useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[id]);
 useEffect(()=>{board.current?.querySelectorAll<HTMLElement>("[data-task]").forEach((el,i)=>el.animate([{opacity:.55,transform:"translateY(7px)"},{opacity:1,transform:"none"}],{duration:170+i*20,easing:"cubic-bezier(.16,1,.3,1)"}))},[data?.tasks]);

 async function create(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setBusy(true);const fd=new FormData(e.currentTarget);
   try{await post("/campus/groups/"+id+"/tasks",{title:String(fd.get("title")||""),description:String(fd.get("description")||""),assignedTo:fd.get("assignedTo")||null,dueAt:fd.get("dueAt")?new Date(String(fd.get("dueAt"))).toISOString():null});e.currentTarget.reset();setSuccess("Tarefa adicionada.");await load()}
   catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function move(task:Task,direction:number){
   const idx=columns.findIndex(([s])=>s===task.status);const next=columns[idx+direction]?.[0];if(!next)return;
   try{await api("/campus/groups/"+id+"/tasks/"+task.id,{method:"PATCH",body:JSON.stringify({status:next,position:0})});await load()}catch(e){setError((e as Error).message)}
 }
 async function remove(taskId:string){try{await api("/campus/groups/"+id+"/tasks/"+taskId,{method:"DELETE"});await load()}catch(e){setError((e as Error).message)}}
 if(!data)return <Shell><p role="status">Abrindo grupo…</p></Shell>;
 return <Shell><div className="group-workspace-page">
   <Link href="/campus#grupos-estudo" className="back-link"><ArrowLeft size={16}/> Voltar para Hoje / Agenda</Link>
   <header className="suite-heading"><div><Users size={32}/><h1>{data.name}</h1></div><p>{data.description||data.subjectName||"Espaço permanente para organizar estudos e trabalhos."}</p></header>
   <Feedback error={error} success={success}/>
   <form className="group-task-create" onSubmit={create}><input name="title" required maxLength={180} placeholder="Nova tarefa do grupo"/><input name="dueAt" type="datetime-local"/><select name="assignedTo" defaultValue=""><option value="">Sem responsável</option>{data.members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select><textarea name="description" maxLength={1200} placeholder="Detalhes, links ou definição de pronto"/><button disabled={busy}><Plus size={16}/> Adicionar tarefa</button></form>
   <div className="kanban-board" ref={board}>{columns.map(([status,label])=><section key={status}><header><h2>{label}</h2><span>{data.tasks.filter(t=>t.status===status).length}</span></header><div>{data.tasks.filter(t=>t.status===status).map(task=><article key={task.id} data-task><h3>{task.title}</h3>{task.description?<p>{task.description}</p>:null}<div className="task-meta">{task.assignedName?<span>{task.assignedName}</span>:null}{task.dueAt?<span><CalendarDays size={13}/>{new Date(task.dueAt).toLocaleDateString("pt-BR")}</span>:null}</div><footer>{status!=="TODO"?<button className="secondary" onClick={()=>void move(task,-1)}><ArrowLeft size={14}/></button>:null}{status!=="DONE"?<button className="secondary" onClick={()=>void move(task,1)}><ArrowRight size={14}/></button>:null}<button className="text-button" aria-label="Excluir tarefa" onClick={()=>void remove(task.id)}><Trash2 size={14}/></button></footer></article>)}</div></section>)}</div>
 </div></Shell>;
}
