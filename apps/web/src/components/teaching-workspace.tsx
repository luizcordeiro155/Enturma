"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Archive,
  BookOpenCheck,
  ChevronRight,
  GraduationCap,
  MessageSquareText,
  Plus,
  Save,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Feedback } from "./feedback";
import { Shell } from "./shell";
import { useLiveRefresh } from "@/lib/live-updates";

type TeacherProfile={institution:string;title:string;enabled:boolean;verified:boolean};
type ClassSummary={
 id:string;name:string;description:string;joinCode?:string;subjectName?:string;
 members?:number;assignments?:number;teacherName?:string;archived?:boolean;
};
type Dashboard={profile:TeacherProfile|null;owned:ClassSummary[];joined:ClassSummary[]};
type Assignment={
 id:string;title:string;description:string;dueAt?:string;points:number;
 submissions:number;submitted:boolean;score?:number|null;feedback?:string;
};
type ClassDetail=ClassSummary & {
 owner:boolean;subjectId?:string|null;archived?:boolean;
 members:{id:string;name:string;username:string;role:string}[];
 assignments:Assignment[];
};
type Submission={
 userId:string;name:string;username:string;status?:string|null;note?:string|null;
 submittedAt?:string|null;score?:number|null;feedback?:string|null;reviewedAt?:string|null;
};

export function TeachingWorkspace(){
 const [profile,setProfile]=useState<Profile>();
 const [data,setData]=useState<Dashboard>();
 const [selected,setSelected]=useState<ClassDetail>();
 const [submissions,setSubmissions]=useState<Submission[]>([]);
 const [reviewing,setReviewing]=useState<Assignment>();
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [busy,setBusy]=useState(false);
 const root=useRef<HTMLDivElement>(null);

 async function load(){
   try{
     const [me,d]=await Promise.all([
       api<Profile>("/users/me",{cache:"no-store"}),
       api<Dashboard>("/teaching",{cache:"no-store"})
     ]);
     setProfile(me);setData(d);setError("");
     if(selected?.id){
       const next=await api<ClassDetail>("/teaching/classes/"+selected.id,{cache:"no-store"});
       setSelected(next);
     }
   }catch(e){setError((e as Error).message)}
 }
 useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[]);
 useLiveRefresh("teaching_changed",load,10000);
 useEffect(()=>{
   root.current?.querySelectorAll<HTMLElement>("[data-teaching-reveal]").forEach((el,i)=>{
     el.animate(
       [{opacity:.7,transform:"translateY(8px)"},{opacity:1,transform:"none"}],
       {duration:220+i*28,easing:"cubic-bezier(.16,1,.3,1)"}
     );
   });
 },[data,selected,reviewing]);

 async function saveProfile(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setBusy(true);setError("");
   const fd=new FormData(e.currentTarget);
   try{
     await api("/teaching/profile",{method:"PUT",body:JSON.stringify({
       institution:String(fd.get("institution")||""),
       title:String(fd.get("title")||"Professor(a)"),
       enabled:fd.get("enabled")==="on"
     })});
     setSuccess("Modo professor atualizado.");await load();
   }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function createClass(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setBusy(true);setError("");
   const fd=new FormData(e.currentTarget);
   try{
     const created=await post<{id:string}>("/teaching/classes",{
       name:String(fd.get("name")||""),
       description:String(fd.get("description")||""),
       subjectId:fd.get("subjectId")||null
     });
     e.currentTarget.reset();setSuccess("Turma criada e pronta para receber estudantes.");
     await load();await open(created.id);
   }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function joinClass(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setBusy(true);setError("");
   const fd=new FormData(e.currentTarget);
   try{
     const joined=await post<{id:string}>("/teaching/classes/join",{code:String(fd.get("code")||"")});
     e.currentTarget.reset();setSuccess("Você entrou na turma.");await load();await open(joined.id);
   }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function open(id:string){
   try{
     setReviewing(undefined);setSubmissions([]);
     setSelected(await api<ClassDetail>("/teaching/classes/"+id,{cache:"no-store"}));
   }catch(e){setError((e as Error).message)}
 }
 async function saveClass(e:FormEvent<HTMLFormElement>){
   e.preventDefault();if(!selected)return;setBusy(true);setError("");
   const fd=new FormData(e.currentTarget);
   try{
     await api("/teaching/classes/"+selected.id,{method:"PUT",body:JSON.stringify({
       name:String(fd.get("name")||""),
       description:String(fd.get("description")||""),
       subjectId:fd.get("subjectId")||null,
       archived:fd.get("archived")==="on"
     })});
     setSuccess("Configurações da turma atualizadas.");await load();await open(selected.id);
   }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function deleteClass(){
   if(!selected||!window.confirm(`Apagar definitivamente a turma "${selected.name}"? Atividades e entregas também serão apagadas.`))return;
   setBusy(true);
   try{
     await api("/teaching/classes/"+selected.id,{method:"DELETE"});
     setSelected(undefined);setReviewing(undefined);setSubmissions([]);
     setSuccess("Turma apagada.");await load();
   }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function removeMember(userId:string,name:string){
   if(!selected||!window.confirm(`Remover ${name} desta turma?`))return;
   try{
     await api(`/teaching/classes/${selected.id}/members/${userId}`,{method:"DELETE"});
     setSuccess("Estudante removido da turma.");await open(selected.id);
   }catch(e){setError((e as Error).message)}
 }
 async function assignment(e:FormEvent<HTMLFormElement>){
   e.preventDefault();if(!selected)return;setBusy(true);
   const fd=new FormData(e.currentTarget);
   try{
     await post("/teaching/classes/"+selected.id+"/assignments",{
       title:String(fd.get("title")||""),
       description:String(fd.get("description")||""),
       dueAt:fd.get("dueAt")?new Date(String(fd.get("dueAt"))).toISOString():null,
       points:Number(fd.get("points")||0)
     });
     e.currentTarget.reset();await open(selected.id);setSuccess("Atividade publicada para a turma.");
   }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function deleteAssignment(item:Assignment){
   if(!selected||!window.confirm(`Apagar a atividade "${item.title}" e todas as entregas?`))return;
   try{
     await api("/teaching/assignments/"+item.id,{method:"DELETE"});
     if(reviewing?.id===item.id){setReviewing(undefined);setSubmissions([])}
     setSuccess("Atividade apagada.");await open(selected.id);
   }catch(e){setError((e as Error).message)}
 }
 async function showSubmissions(item:Assignment){
   try{
     setReviewing(item);
     setSubmissions(await api<Submission[]>(`/teaching/assignments/${item.id}/submissions`,{cache:"no-store"}));
   }catch(e){setError((e as Error).message)}
 }
 async function reviewSubmission(e:FormEvent<HTMLFormElement>,student:Submission){
   e.preventDefault();if(!reviewing)return;setBusy(true);
   const fd=new FormData(e.currentTarget);
   try{
     await api(`/teaching/assignments/${reviewing.id}/submissions/${student.userId}`,{
       method:"PUT",
       body:JSON.stringify({
         score:fd.get("score")===""?null:Number(fd.get("score")),
         feedback:String(fd.get("feedback")||"")
       })
     });
     setSuccess(`Feedback de ${student.name} salvo.`);
     await showSubmissions(reviewing);if(selected)await open(selected.id);
   }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 async function submit(id:string){
   const note=window.prompt("Observação da entrega (opcional):","")??"";
   try{
     await post("/teaching/assignments/"+id+"/submit",{note});
     if(selected)await open(selected.id);
     setSuccess("Atividade entregue ao professor.");
   }catch(e){setError((e as Error).message)}
 }

 const activeOwned=data?.owned.filter(c=>!c.archived)??[];
 const archivedOwned=data?.owned.filter(c=>c.archived)??[];

 return <Shell><div className="teaching-page" ref={root}>
   <header className="suite-heading teaching-heading">
     <div><GraduationCap size={32}/><h1>Turmas e modo professor</h1></div>
     <p>Um espaço contínuo entre professor e aluno: organize a turma, publique atividades, acompanhe entregas, dê feedback individual e mantenha o desenvolvimento acadêmico visível para todos.</p>
   </header>
   <Feedback error={error} success={success}/>

   <section className="teaching-role-guide" data-teaching-reveal>
     <div><strong>Professor</strong><p>Cria e administra turmas, compartilha o código, acompanha estudantes, publica atividades, corrige e orienta.</p></div>
     <ChevronRight/>
     <div><strong>Aluno</strong><p>Entra com o código, acompanha prazos, envia entregas e recebe nota e feedback do professor em tempo real.</p></div>
   </section>

   <div className="teaching-top-grid">
     <form className="teacher-mode-form" onSubmit={saveProfile} data-teaching-reveal>
       <h2>Seu perfil de professor</h2>
       <p>Ative este modo apenas quando quiser criar e administrar turmas. Participar como aluno continua disponível normalmente.</p>
       <label>Instituição<input name="institution" defaultValue={data?.profile?.institution??""} maxLength={180} placeholder="Universidade ou escola"/></label>
       <label>Título<input name="title" defaultValue={data?.profile?.title??"Professor(a)"} maxLength={120}/></label>
       <label className="inline-check"><input type="checkbox" name="enabled" defaultChecked={data?.profile?.enabled??false}/><span>Ativar ferramentas de professor</span></label>
       <button disabled={busy}><Save size={16}/> Salvar perfil</button>
     </form>

     <form className="join-class-form" onSubmit={joinClass} data-teaching-reveal>
       <h2>Entrar em uma turma</h2>
       <p>Use o código fornecido pelo professor. A turma aparece aqui e atualiza automaticamente quando atividades ou feedbacks forem publicados.</p>
       <input name="code" required maxLength={10} placeholder="ABC23XYZ"/>
       <button disabled={busy}>Entrar na turma</button>
     </form>
   </div>

   {data?.profile?.enabled?<form className="create-class-form" onSubmit={createClass} data-teaching-reveal>
     <div className="section-heading"><h2>Criar nova turma</h2><Plus size={22}/></div>
     <label>Nome<input name="name" required maxLength={140} placeholder="Banco de Dados · Turma A"/></label>
     <label>Matéria<select name="subjectId" defaultValue=""><option value="">Sem matéria específica</option>{profile?.subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
     <label>Descrição<textarea name="description" maxLength={800} placeholder="Objetivos, metodologia, combinados e o que os alunos vão desenvolver."/></label>
     <button disabled={busy}>Criar turma</button>
   </form>:null}

   <section className="teaching-classes" data-teaching-reveal>
     <div className="section-heading"><h2>Minhas turmas</h2><span>{activeOwned.length+(data?.joined.length??0)} ativas</span></div>
     <div className="class-list">
       {activeOwned.map(c=><button key={c.id} onClick={()=>void open(c.id)} className={selected?.id===c.id?"class-row selected":"class-row"}>
         <span><strong>{c.name}</strong><small>{c.subjectName??"Turma criada por você"} · {c.members??0} estudantes · {c.assignments??0} atividades</small></span>
         <span>Código {c.joinCode}</span>
       </button>)}
       {data?.joined.map(c=><button key={c.id} onClick={()=>void open(c.id)} className={selected?.id===c.id?"class-row selected":"class-row"}>
         <span><strong>{c.name}</strong><small>{c.subjectName??"Turma Enturma"} · Professor: {c.teacherName}</small></span>
         <span>Abrir</span>
       </button>)}
       {!activeOwned.length&&!data?.joined.length?<p className="muted">Nenhuma turma ativa ainda.</p>:null}
     </div>
     {archivedOwned.length?<details className="archived-classes"><summary><Archive size={16}/> Turmas arquivadas ({archivedOwned.length})</summary>
       {archivedOwned.map(c=><button key={c.id} onClick={()=>void open(c.id)} className="class-row"><span><strong>{c.name}</strong><small>Arquivada</small></span><span>Abrir</span></button>)}
     </details>:null}
   </section>

   {selected?<section className="class-workspace" data-teaching-reveal>
     <header className="class-workspace-heading">
       <div><h2>{selected.name}</h2><p>{selected.description||"Sem descrição adicionada."}</p></div>
       {selected.joinCode?<div className="class-code"><small>Código para alunos</small><strong>{selected.joinCode}</strong></div>:null}
     </header>
     <div className="class-stat-line"><span><Users size={15}/>{selected.members.length} estudantes</span><span><BookOpenCheck size={15}/>{selected.assignments.length} atividades</span></div>

     {selected.owner?<div className="teacher-admin-grid">
       <form className="class-settings-form" onSubmit={saveClass}>
         <h3>Configurações da turma</h3>
         <label>Nome<input name="name" required maxLength={140} defaultValue={selected.name}/></label>
         <label>Matéria<select name="subjectId" defaultValue={selected.subjectId??""}><option value="">Sem matéria específica</option>{profile?.subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
         <label>Descrição<textarea name="description" maxLength={800} defaultValue={selected.description}/></label>
         <label className="inline-check"><input type="checkbox" name="archived" defaultChecked={selected.archived??false}/><span>Arquivar turma e impedir novas entradas</span></label>
         <button disabled={busy}><Save size={15}/> Salvar turma</button>
         <button type="button" className="danger-button" disabled={busy} onClick={()=>void deleteClass()}><Trash2 size={15}/> Apagar turma</button>
       </form>
       <div className="class-members-manager">
         <h3>Estudantes</h3>
         <p className="muted">Gerencie quem participa. Remover um aluno não apaga a conta dele.</p>
         {selected.members.map(m=><div className="class-member-row" key={m.id}>
           <span><strong>{m.name}</strong><small>@{m.username} · {m.role==="ASSISTANT"?"Assistente":"Aluno"}</small></span>
           <button className="secondary" title={"Remover "+m.name} onClick={()=>void removeMember(m.id,m.name)}><UserMinus size={15}/> Remover</button>
         </div>)}
         {!selected.members.length?<p className="muted">Aguardando estudantes entrarem com o código.</p>:null}
       </div>
     </div>:null}

     {selected.owner?<form className="assignment-form" onSubmit={assignment}>
       <div><h3>Nova atividade</h3><p>Defina um objetivo claro, prazo e pontuação. As entregas aparecerão abaixo para correção.</p></div>
       <input name="title" required maxLength={180} placeholder="Título da atividade"/>
       <textarea name="description" maxLength={2000} placeholder="Orientações, critérios e objetivo de aprendizagem"/>
       <div><input name="dueAt" type="datetime-local"/><input name="points" type="number" min={0} max={1000} defaultValue={100}/></div>
       <button disabled={busy}>Publicar atividade</button>
     </form>:null}

     <div className="assignment-list">
       {selected.assignments.map(item=><article key={item.id}>
         <div><strong>{item.title}</strong><p>{item.description}</p><small>{item.dueAt?new Date(item.dueAt).toLocaleString("pt-BR"):"Sem prazo"} · {item.points} pontos</small>
           {!selected.owner&&item.submitted?<span className="student-feedback-line">{item.score!=null?`Nota: ${item.score}/${item.points}`:"Entregue, aguardando correção"}{item.feedback?` · Feedback: ${item.feedback}`:""}</span>:null}
         </div>
         {selected.owner?<div className="assignment-owner-actions">
           <button className="secondary" onClick={()=>void showSubmissions(item)}><MessageSquareText size={15}/>{item.submissions} entregas</button>
           <button className="secondary" title="Apagar atividade" onClick={()=>void deleteAssignment(item)}><Trash2 size={15}/></button>
         </div>:item.submitted?<span className="done-label">Entregue</span>:<button onClick={()=>void submit(item.id)}>Entregar atividade</button>}
       </article>)}
       {!selected.assignments.length?<p className="muted">Nenhuma atividade publicada ainda.</p>:null}
     </div>

     {selected.owner&&reviewing?<section className="submission-review-panel">
       <header><div><h3>Correções · {reviewing.title}</h3><p>Leia a observação enviada e registre nota e feedback individual.</p></div><button className="secondary" onClick={()=>{setReviewing(undefined);setSubmissions([])}}>Fechar</button></header>
       {submissions.map(student=><form key={student.userId} className="submission-review-row" onSubmit={e=>void reviewSubmission(e,student)}>
         <div><strong>{student.name}</strong><small>@{student.username}</small><p>{student.submittedAt?student.note||"Entrega sem observação.":"Ainda não entregou."}</p></div>
         {student.submittedAt?<><label>Nota<input name="score" type="number" min={0} max={reviewing.points} defaultValue={student.score??""}/></label><label>Feedback<textarea name="feedback" maxLength={2000} defaultValue={student.feedback??""} placeholder="O que foi bem e o que pode melhorar"/></label><button disabled={busy}>Salvar feedback</button></>:<span className="muted">Pendente</span>}
       </form>)}
     </section>:null}
   </section>:null}
 </div></Shell>;
}
