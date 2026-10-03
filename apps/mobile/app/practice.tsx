import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import type { Profile } from "@enturma/contracts";
import { api } from "../src/api";
import { Screen, Button, ErrorMessage, Field, useStyles } from "../src/ui";

type Question={id:string;topic:string;prompt:string;options:string[];difficulty:number};
type Session={id:string;title:string;questions:Question[]};
type Diagnostic={topics:{topic:string;accuracy:number}[];totals:{attempts:number;correct:number}};
type Result={correct:number;total:number;results:{questionId:string;correct:boolean;explanation:string}[]};

export default function Practice(){
 const styles=useStyles();
 const [profile,setProfile]=useState<Profile>();
 const [diag,setDiag]=useState<Diagnostic>();
 const [session,setSession]=useState<Session>();
 const [subject,setSubject]=useState<string|undefined>();
 const [topic,setTopic]=useState("");
 const [answers,setAnswers]=useState<Record<string,number>>({});
 const [result,setResult]=useState<Result>();
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const entrance=useRef(new Animated.Value(0)).current;
 useEffect(()=>{Promise.all([api<Profile>("/users/me"),api<Diagnostic>("/practice/diagnostic")]).then(([p,d])=>{setProfile(p);setDiag(d);Animated.spring(entrance,{toValue:1,useNativeDriver:true}).start()}).catch(e=>setError(e.message))},[entrance]);
 async function generate(){setBusy(true);setError("");setResult(undefined);setAnswers({});try{setSession(await api<Session>("/practice/generate",{method:"POST",body:JSON.stringify({subjectId:subject??null,topic,questions:5})}))}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function submit(){if(!session)return;setBusy(true);try{setResult(await api<Result>("/practice/"+session.id+"/submit",{method:"POST",body:JSON.stringify({answers:session.questions.map(q=>({questionId:q.id,selectedIndex:answers[q.id]}))})}));setDiag(await api<Diagnostic>("/practice/diagnostic"))}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <Screen title="Prática adaptativa"><ErrorMessage message={error}/><Animated.View style={{gap:14,opacity:entrance}}>
   <View style={[styles.card,{gap:8}]}><Text style={styles.label}>Diagnóstico</Text><Text style={styles.text}>{diag?.totals.attempts??0} questões respondidas</Text>{diag?.topics.slice(0,3).map(t=><Text key={t.topic} style={styles.muted}>{t.topic}: {t.accuracy}%</Text>)}</View>
   <View style={[styles.card,{gap:10}]}><Text style={styles.label}>Nova prática</Text><Field label="Assunto" value={topic} onChangeText={setTopic} placeholder="Ex.: JOIN ou recursividade"/>{profile?.subjects.map(s=><Button key={s.id} title={(subject===s.id?"✓ ":"")+s.name} onPress={()=>setSubject(subject===s.id?undefined:s.id)}/>)}<Button title={busy?"Preparando…":"Gerar 5 questões"} disabled={busy} onPress={()=>void generate()}/></View>
   {session?<View style={{gap:12}}><Text style={styles.title}>{session.title}</Text>{session.questions.map((q,n)=><View style={[styles.card,{gap:8}]} key={q.id}><Text style={styles.muted}>Questão {n+1} · {q.topic}</Text><Text style={styles.label}>{q.prompt}</Text>{q.options.map((o,i)=><Button key={i} title={(answers[q.id]===i?"✓ ":"")+o} disabled={!!result} onPress={()=>setAnswers(v=>({...v,[q.id]:i}))}/>) }{result?.results.find(x=>x.questionId===q.id)?<Text style={styles.muted}>{result.results.find(x=>x.questionId===q.id)!.explanation}</Text>:null}</View>)}{!result?<Button title="Corrigir prática" disabled={busy||Object.keys(answers).length!==session.questions.length} onPress={()=>void submit()}/>:<Text style={styles.label}>Resultado: {result.correct} de {result.total}</Text>}</View>:null}
 </Animated.View></Screen>;
}
