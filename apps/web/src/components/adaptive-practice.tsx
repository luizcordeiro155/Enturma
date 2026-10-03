"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BrainCircuit, CheckCircle2, RefreshCw, Target } from "lucide-react";
import type { Profile } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Feedback } from "./feedback";
import { Shell } from "./shell";

type Diagnostic = {
  topics: { topic:string; attempts:number; correct:number; accuracy:number }[];
  totals: { attempts:number; correct:number };
};
type Question = {
  id:string; topic:string; prompt:string; options:string[]; difficulty:number;
};
type Session = { id:string; title:string; questions:Question[] };
type Result = {
  correct:number; total:number;
  results:{questionId:string;correct:boolean;topic:string;explanation:string}[];
  weakTopics:{topic:string;attempts:number;correct:number;accuracy:number}[];
};

export function AdaptivePractice({ embedded = false }: { embedded?: boolean } = {}){
  const [profile,setProfile]=useState<Profile>();
  const [diagnostic,setDiagnostic]=useState<Diagnostic>();
  const [session,setSession]=useState<Session>();
  const [answers,setAnswers]=useState<Record<string,number>>({});
  const [result,setResult]=useState<Result>();
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const panel=useRef<HTMLDivElement>(null);

  async function loadDiagnostic(){
    try{setDiagnostic(await api<Diagnostic>("/practice/diagnostic",{cache:"no-store"}));}
    catch(e){setError((e as Error).message);}
  }
  useEffect(()=>{
    void Promise.all([api<Profile>("/users/me"),api<Diagnostic>("/practice/diagnostic",{cache:"no-store"})])
      .then(([p,d])=>{setProfile(p);setDiagnostic(d);})
      .catch(e=>setError(e.message));
  },[]);
  useEffect(()=>{
    if(!panel.current)return;
    const nodes=panel.current.querySelectorAll<HTMLElement>("[data-practice-reveal]");
    nodes.forEach((node,i)=>node.animate(
      [{opacity:.35,transform:"translateY(10px)"},{opacity:1,transform:"none"}],
      {duration:190+i*25,easing:"cubic-bezier(.16,1,.3,1)"}
    ));
  },[session,result]);

  async function generate(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError("");setResult(undefined);setAnswers({});
    const fd=new FormData(e.currentTarget);
    try{
      setSession(await post<Session>("/practice/generate",{
        subjectId:fd.get("subjectId")||null,
        topic:String(fd.get("topic")||""),
        questions:Number(fd.get("questions")||5)
      }));
    }catch(err){setError((err as Error).message);}
    finally{setBusy(false);}
  }

  async function submit(){
    if(!session)return;
    setBusy(true);setError("");
    try{
      const out=await post<Result>(`/practice/${session.id}/submit`,{
        answers:session.questions.map(q=>({questionId:q.id,selectedIndex:answers[q.id]}))
      });
      setResult(out);await loadDiagnostic();
    }catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  }

  const accuracy=diagnostic?.totals.attempts
    ? Math.round((diagnostic.totals.correct/diagnostic.totals.attempts)*100)
    : null;

  const content = <section id="pratica-adaptativa" className={embedded ? "practice-page embedded-suite" : "practice-page"} ref={panel}>
    <header className="suite-heading">
      <div><BrainCircuit size={32}/>{embedded ? <h2>Prática adaptativa</h2> : <h1>Prática adaptativa</h1>}</div>
      <p>O Enturma usa seus próprios resultados para reforçar os assuntos em que você mais erra, sem transformar estudo em spam de XP.</p>
    </header>
    <Feedback error={error}/>

    <section className="practice-summary" data-practice-reveal>
      <div><strong>{diagnostic?.totals.attempts??0}</strong><span>questões respondidas</span></div>
      <div><strong>{accuracy===null?"—":accuracy+"%"}</strong><span>aproveitamento geral</span></div>
      <div><strong>{diagnostic?.topics[0]?.topic??"Sem diagnóstico"}</strong><span>próximo foco recomendado</span></div>
    </section>

    <form className="practice-generator" onSubmit={generate} data-practice-reveal>
      <label>Matéria<select name="subjectId" defaultValue=""><option value="">Estudo geral</option>{profile?.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label>Assunto específico<input name="topic" maxLength={160} placeholder="Ex.: JOIN, recursividade, UX research"/></label>
      <label>Quantidade<select name="questions" defaultValue="5"><option value="3">3 questões</option><option value="5">5 questões</option><option value="8">8 questões</option><option value="10">10 questões</option></select></label>
      <button disabled={busy}>{busy?"Preparando…":"Gerar prática"}</button>
    </form>

    {diagnostic?.topics.length?<section className="diagnostic-list" data-practice-reveal>
      <h2>Seu mapa de domínio</h2>
      {diagnostic.topics.map(t=><div key={t.topic}><span>{t.topic}</span><meter min={0} max={100} value={Number(t.accuracy)}/><strong>{t.accuracy}%</strong></div>)}
    </section>:null}

    {session?<section className="practice-session" data-practice-reveal>
      <div className="section-heading"><h2>{session.title}</h2><button className="secondary" onClick={()=>setSession(undefined)}><RefreshCw size={16}/> Trocar prática</button></div>
      {session.questions.map((q,index)=><article className="practice-question" key={q.id}>
        <header><span>Questão {index+1}</span><small>Nível {q.difficulty} · {q.topic}</small></header>
        <h3>{q.prompt}</h3>
        <div className="practice-options">{q.options.map((option,i)=><button type="button" key={i} aria-pressed={answers[q.id]===i} disabled={!!result} onClick={()=>setAnswers(v=>({...v,[q.id]:i}))}>{option}</button>)}</div>
        {result?(()=>{const r=result.results.find(x=>x.questionId===q.id);return r?<div className={r.correct?"practice-explanation correct":"practice-explanation wrong"}><strong>{r.correct?"Acertou":"Revisar este ponto"}</strong><p>{r.explanation}</p></div>:null})():null}
      </article>)}
      {!result?<button className="button practice-submit" disabled={busy||Object.keys(answers).length!==session.questions.length} onClick={()=>void submit()}><Target size={17}/> Corrigir prática</button>:<div className="practice-result"><CheckCircle2/><strong>{result.correct} de {result.total}</strong><span>Use o diagnóstico acima para decidir o próximo estudo.</span></div>}
    </section>:null}
  </section>;
  return embedded ? content : <Shell>{content}</Shell>;
}
