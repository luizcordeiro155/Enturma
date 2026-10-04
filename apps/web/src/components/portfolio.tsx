"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, ExternalLink, Plus, Printer, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Feedback } from "./feedback";
import { Shell } from "./shell";

type Project={name:string;description?:string;url?:string};
type Portfolio={
 id:string;name:string;username:string;bio?:string;accentColor?:string;hasAvatar?:boolean;hasBanner?:boolean;
 publicProfile:boolean;headline:string;summary:string;skills:string[];projects:Project[];
 subjects:{name:string}[];achievements:{name:string;description:string;tier:string}[];
 stats:{totalXp:number;currentStreak:number};studyMinutes:number;
};

export function PortfolioEditor(){
 const [data,setData]=useState<Portfolio>();
 const [projects,setProjects]=useState<Project[]>([]);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [busy,setBusy]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const initialRevealDone=useRef(false);
 useEffect(()=>{void api<Portfolio>("/portfolio/me",{cache:"no-store"}).then(v=>{setData(v);setProjects(v.projects??[])}).catch(e=>setError(e.message))},[]);
 useEffect(()=>{
   if(!data||initialRevealDone.current)return;
   initialRevealDone.current=true;
   root.current?.querySelectorAll<HTMLElement>("[data-portfolio-reveal]").forEach((el,i)=>
     el.animate(
       [{opacity:.72,transform:"translateY(8px)"},{opacity:1,transform:"none"}],
       {duration:220+i*28,easing:"cubic-bezier(.16,1,.3,1)"}
     )
   );
 },[data]);

 async function save(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setBusy(true);setError("");setSuccess("");
   const fd=new FormData(e.currentTarget);
   try{
     await api("/portfolio/me",{method:"PUT",body:JSON.stringify({
       publicProfile:fd.get("publicProfile")==="on",
       headline:String(fd.get("headline")||""),
       summary:String(fd.get("summary")||""),
       skills:String(fd.get("skills")||"").split(",").map(v=>v.trim()).filter(Boolean),
       projects
     })});
     setSuccess("Portfólio atualizado.");
     setData(await api<Portfolio>("/portfolio/me",{cache:"no-store"}));
   }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 if(!data)return <Shell><p role="status">Montando seu portfólio…</p></Shell>;
 return <Shell><div className="portfolio-editor-page" ref={root}>
   <header className="suite-heading suite-hero portfolio-hero"><div><BriefcaseBusiness size={32}/><h1>Portfólio acadêmico</h1></div><p>Transforme sua trajetória no Enturma em uma apresentação profissional que você controla e pode deixar pública quando quiser.</p></header>
   <Feedback error={error} success={success}/>
   <section className="portfolio-metrics" aria-label="Resumo do portfólio">
     <div><span>Experiência</span><strong>{data.stats.totalXp} XP</strong></div>
     <div><span>Tempo de estudo</span><strong>{data.studyMinutes} min</strong></div>
     <div><span>Sequência atual</span><strong>{data.stats.currentStreak} dias</strong></div>
   </section>
   <form onSubmit={save}>
     <section className="portfolio-settings" data-portfolio-reveal>
       <label className="portfolio-public-toggle"><input type="checkbox" name="publicProfile" defaultChecked={data.publicProfile}/><span><strong>Portfólio público</strong><small>Disponível em /p/{data.username}</small></span></label>
       <label>Título profissional<input name="headline" defaultValue={data.headline} maxLength={140} placeholder="Estudante de ADS · Java · UX"/></label>
       <label>Apresentação<textarea name="summary" defaultValue={data.summary} maxLength={1200} placeholder="Conte sua trajetória, objetivos e o tipo de problema que gosta de resolver."/></label>
       <label>Competências<input name="skills" defaultValue={(data.skills??[]).join(", ")} placeholder="Java, SQL, Git, UI/UX"/></label>
     </section>

     <section className="portfolio-project-editor" data-portfolio-reveal>
       <div className="section-heading"><h2>Projetos</h2><button type="button" className="secondary" disabled={projects.length>=12} onClick={()=>setProjects(v=>[...v,{name:"Novo projeto",description:"",url:""}])}><Plus size={16}/> Adicionar</button></div>
       {projects.map((p,i)=><article key={i}>
         <input aria-label={"Nome do projeto "+(i+1)} value={p.name} maxLength={120} onChange={e=>setProjects(v=>v.map((x,n)=>n===i?{...x,name:e.target.value}:x))}/>
         <textarea aria-label={"Descrição do projeto "+(i+1)} value={p.description??""} maxLength={500} onChange={e=>setProjects(v=>v.map((x,n)=>n===i?{...x,description:e.target.value}:x))}/>
         <input aria-label={"Link do projeto "+(i+1)} value={p.url??""} maxLength={300} placeholder="https://" onChange={e=>setProjects(v=>v.map((x,n)=>n===i?{...x,url:e.target.value}:x))}/>
         <button type="button" className="text-button" onClick={()=>setProjects(v=>v.filter((_,n)=>n!==i))}><Trash2 size={15}/> Remover</button>
       </article>)}
       {!projects.length?<p className="muted">Adicione projetos da faculdade, pessoais, open source ou trabalhos em equipe.</p>:null}
     </section>
     <div className="portfolio-actions"><button disabled={busy}>{busy?"Salvando…":"Salvar portfólio"}</button>{data.publicProfile?<a className="button secondary" href={"/p/"+data.username} target="_blank"><ExternalLink size={16}/> Ver público</a>:null}<button type="button" className="secondary" onClick={()=>window.print()}><Printer size={16}/> Gerar PDF pelo navegador</button></div>
   </form>
 </div></Shell>;
}

export function PublicPortfolio({username}:{username:string}){
 const [data,setData]=useState<Portfolio>();
 const [error,setError]=useState("");
 useEffect(()=>{void api<Portfolio>("/public/portfolio/"+encodeURIComponent(username),{cache:"no-store"}).then(setData).catch(e=>setError(e.message))},[username]);
 if(error)return <main className="public-portfolio"><h1>Portfólio indisponível</h1><p>{error}</p></main>;
 if(!data)return <main className="public-portfolio"><p>Carregando portfólio…</p></main>;
 return <main className="public-portfolio" style={{"--portfolio-accent":data.accentColor??"#183f36"} as React.CSSProperties}>
   <header><div>{data.hasAvatar?<img src={"/api/backend/users/"+data.id+"/avatar"} alt=""/>:<span>{data.name.slice(0,2).toUpperCase()}</span>}<div><h1>{data.name}</h1><p>{data.headline||"Estudante no Enturma"}</p></div></div><button onClick={()=>window.print()}><Printer size={16}/> Salvar em PDF</button></header>
   <section className="portfolio-intro"><p>{data.summary||data.bio||"Construindo minha trajetória acadêmica."}</p><div><strong>{data.stats.totalXp} XP</strong><strong>{data.studyMinutes} min de estudo</strong><strong>{data.stats.currentStreak} dias de sequência</strong></div></section>
   {data.skills?.length?<section><h2>Competências</h2><div className="portfolio-tags">{data.skills.map(s=><span key={s}>{s}</span>)}</div></section>:null}
   {data.projects?.length?<section><h2>Projetos</h2><div className="public-projects">{data.projects.map((p,i)=><article key={i}><h3>{p.name}</h3><p>{p.description}</p>{p.url?<a href={p.url} target="_blank" rel="noreferrer">Abrir projeto <ExternalLink size={14}/></a>:null}</article>)}</div></section>:null}
   {data.subjects?.length?<section><h2>Estudos atuais</h2><div className="portfolio-tags">{data.subjects.map(s=><span key={s.name}>{s.name}</span>)}</div></section>:null}
   {data.achievements?.length?<section><h2>Conquistas</h2><div className="public-achievements">{data.achievements.map(a=><article key={a.name}><strong>{a.name}</strong><span>{a.tier}</span><p>{a.description}</p></article>)}</div></section>:null}
 </main>;
}
