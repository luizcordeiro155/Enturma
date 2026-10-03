import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Profile } from "@enturma/contracts";
import { api } from "../src/api";
import { Screen, Button, ErrorMessage, Field, useStyles } from "../src/ui";
import { useRealtime } from "../src/realtime";

type Task = { id:string; title:string; kind:string; dueAt:string; subjectName?:string; completedAt?:string|null };
type Group={id:string;name:string;description:string;visibility:string;subjectName?:string|null;members:number;joined?:boolean|null};
type Question={id:string;topic:string;prompt:string;options:string[];difficulty:number};
type PracticeSession={id:string;title:string;questions:Question[]};
type Diagnostic={topics:{topic:string;accuracy:number}[];totals:{attempts:number;correct:number}};
type PracticeResult={correct:number;total:number;results:{questionId:string;correct:boolean;explanation:string}[]};
type TutorReply={id:string;text:string;action:string};

type Today = {
 tasks: Task[];
 focus: { focusSeconds:number; focusSessions:number };
 flashcards: { dueFlashcards:number; totalFlashcards:number };
 study: { totalXp:number; streak:number };
 activeRooms:number;
 matches: { id:string; name:string; goal:string; subjectName?:string }[];
};

export default function Campus() {
 const styles=useStyles();
 const router=useRouter();
 const [profile,setProfile]=useState<Profile>();
 const [data,setData]=useState<Today>();
 const [error,setError]=useState("");
 const [focusId,setFocusId]=useState<string|null>(null);
 const [seconds,setSeconds]=useState(0);
 const [groups,setGroups]=useState<Group[]>([]);
 const [diag,setDiag]=useState<Diagnostic>();
 const [practice,setPractice]=useState<PracticeSession>();
 const [practiceTopic,setPracticeTopic]=useState("");
 const [practiceSubject,setPracticeSubject]=useState<string|undefined>();
 const [answers,setAnswers]=useState<Record<string,number>>({});
 const [practiceResult,setPracticeResult]=useState<PracticeResult>();
 const [practiceBusy,setPracticeBusy]=useState(false);
 const [focusGoal,setFocusGoal]=useState("");
 const [focusSubject,setFocusSubject]=useState<string|undefined>();
 const [tutorMessage,setTutorMessage]=useState("");
 const [tutorReply,setTutorReply]=useState<TutorReply>();
 const [tutorBusy,setTutorBusy]=useState(false);
 const started=useRef<number|null>(null);
 const entrance=useRef(new Animated.Value(0)).current;

 const load=useCallback(()=>{
   let alive=true;
   Promise.all([
     api<Profile>("/users/me"),
     api<Today>("/campus/today"),
     api<Group[]>("/campus/groups"),
     api<Diagnostic>("/practice/diagnostic")
   ])
    .then(([p,d,g,diagnostic])=>{
      if(!alive)return;
      setProfile(p);setData(d);setGroups(g);setDiag(diagnostic);setError("");
      entrance.setValue(0);
      Animated.spring(entrance,{toValue:1,useNativeDriver:true,tension:55,friction:8}).start();
    })
    .catch(e=>{if(alive)setError(e.message)});
   return()=>{alive=false};
 },[entrance]);
 useFocusEffect(load);
 useRealtime(event=>{
   if(event.type==="campus_changed"||event.type==="groups_changed")load();
 });

 useEffect(()=>{
   if(!focusId||!started.current)return;
   const id=setInterval(()=>setSeconds(Math.floor((Date.now()-started.current!)/1000)),1000);
   return()=>clearInterval(id);
 },[focusId]);

 async function startFocus(){
   try{
     const x=await api<{id:string}>("/campus/focus",{method:"POST",body:JSON.stringify({
       subjectId:focusSubject??null,
       label:focusGoal.trim()||"Modo Foco mobile com tutor",
       minutes:50
     })});
     started.current=Date.now();setSeconds(0);setFocusId(x.id);
   }catch(e){setError((e as Error).message)}
 }
 async function finishFocus(){
   if(!focusId)return;
   try{
     await api("/campus/focus/"+focusId+"/finish",{method:"POST",body:"{}"});
     setFocusId(null);started.current=null;setSeconds(0);load();
   }catch(e){setError((e as Error).message)}
 }
 async function joinGroup(id:string){
   try{await api("/campus/groups/"+id+"/join",{method:"POST",body:"{}"});setGroups(await api<Group[]>("/campus/groups"))}
   catch(e){setError((e as Error).message)}
 }
 async function generatePractice(){
   setPracticeBusy(true);setError("");setPracticeResult(undefined);setAnswers({});
   try{setPractice(await api<PracticeSession>("/practice/generate",{method:"POST",body:JSON.stringify({subjectId:practiceSubject??null,topic:practiceTopic,questions:5})}))}
   catch(e){setError((e as Error).message)}finally{setPracticeBusy(false)}
 }
 async function submitPractice(){
   if(!practice)return;setPracticeBusy(true);
   try{
     setPracticeResult(await api<PracticeResult>("/practice/"+practice.id+"/submit",{method:"POST",body:JSON.stringify({answers:practice.questions.map(q=>({questionId:q.id,selectedIndex:answers[q.id]}))})}));
     setDiag(await api<Diagnostic>("/practice/diagnostic"));
   }catch(e){setError((e as Error).message)}finally{setPracticeBusy(false)}
 }
 async function askTutor(action="EXPLAIN",fallback?:string){
   const message=(tutorMessage.trim()||fallback||"Explique o conteúdo que estou estudando e confira se eu entendi.").trim();
   setTutorBusy(true);
   try{
     const reply=await api<TutorReply>("/campus/tutor",{method:"POST",body:JSON.stringify({
       subjectId:focusSubject??practiceSubject??null,
       focusSessionId:focusId,
       goal:focusGoal.trim()||practiceTopic||"Aprender e revisar o conteúdo",
       message,
       action
     })});
     setTutorReply(reply);setTutorMessage("");
   }catch(e){setError((e as Error).message)}finally{setTutorBusy(false)}
 }
 async function complete(id:string){
   try{await api("/campus/tasks/"+id+"/complete",{method:"POST",body:"{}"});load();}
   catch(e){setError((e as Error).message)}
 }

 const clock=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
 const title=profile?"Hoje, "+profile.name.split(" ")[0]:"Hoje no Enturma";
 return (
  <Screen title={title}>
   <ErrorMessage message={error}/>
   {data?(
    <Animated.View style={{gap:14,opacity:entrance,transform:[{translateY:entrance.interpolate({inputRange:[0,1],outputRange:[18,0]})}]}}>
      <View style={[styles.card,{gap:10}]}>
       <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
        <Ionicons name="sparkles-outline" size={24} color={styles.text.color}/>
        <Text style={styles.label}>Seu dia acadêmico</Text>
       </View>
       <Text style={styles.muted}>Agenda, foco, revisão e colegas disponíveis em um único painel.</Text>
       <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
        <Text style={styles.text}>🔥 {data.study.streak} dias</Text>
        <Text style={styles.text}>🏆 {data.study.totalXp} XP</Text>
        <Text style={styles.text}>🧠 {data.flashcards.dueFlashcards} revisões</Text>
       </View>
      </View>

      <View style={[styles.card,{gap:10}]}>
       <Text style={styles.label}>Próximos compromissos</Text>
       {data.tasks.filter(t=>!t.completedAt).slice(0,5).map(t=>(
        <View key={t.id} style={styles.row}>
         <Text style={styles.label}>{t.title}</Text>
         <Text style={styles.muted}>{(t.subjectName??t.kind)+" · "+new Date(t.dueAt).toLocaleString("pt-BR")}</Text>
         <Button title="Concluir" onPress={()=>void complete(t.id)}/>
        </View>
       ))}
       {data.tasks.filter(t=>!t.completedAt).length===0?<Text style={styles.muted}>Nada urgente por aqui. Use a versão Web para adicionar provas, trabalhos e aulas à agenda.</Text>:null}
      </View>

      <View style={[styles.card,{gap:12}]}>
       <View style={{alignItems:"center",gap:8}}>
        <Ionicons name="timer-outline" size={34} color={styles.text.color}/>
        <Text style={[styles.title,{fontSize:focusId?46:23,lineHeight:52}]}>{focusId?clock:"Modo Foco com Tutor"}</Text>
        <Text style={styles.muted}>{focusId?"A IA está disponível durante toda a sessão para explicar, testar e adaptar o ensino.":"Defina o assunto antes de iniciar os 50 minutos."}</Text>
       </View>
       {!focusId?<><Field label="O que você vai estudar?" value={focusGoal} onChangeText={setFocusGoal} placeholder="Ex.: JOINs e normalização"/>{profile?.subjects.slice(0,5).map(s=><Button key={s.id} title={(focusSubject===s.id?"✓ ":"")+s.name} onPress={()=>setFocusSubject(focusSubject===s.id?undefined:s.id)}/>)}</>:null}
       <Button title={focusId?"Concluir sessão":"Iniciar 50 min com tutor"} onPress={()=>void(focusId?finishFocus():startFocus())}/>
       {focusId?<View style={[styles.row,{gap:9}]}>
         <Text style={styles.label}>Enturma AI Tutor</Text>
         <Text style={styles.muted}>Quanto mais você interage e avalia as explicações, mais o tutor aprende como explicar melhor para você.</Text>
         {tutorReply?<Text style={styles.text}>{tutorReply.text}</Text>:null}
         <Field label="Pergunte ao tutor" value={tutorMessage} onChangeText={setTutorMessage} multiline placeholder="Onde você travou? Peça outra explicação ou um exemplo."/>
         <Button title={tutorBusy?"Pensando…":"Perguntar"} disabled={tutorBusy||!tutorMessage.trim()} onPress={()=>void askTutor("EXPLAIN")}/>
         <Button title="Explicar mais simples" disabled={tutorBusy} onPress={()=>void askTutor("SIMPLIFY","Explique o que estou estudando em passos menores e com linguagem mais simples.")}/>
         <Button title="Me testar" disabled={tutorBusy} onPress={()=>void askTutor("TEST","Faça uma pergunta curta para conferir meu entendimento e espere minha tentativa.")}/>
       </View>:null}
      </View>

      <View style={[styles.card,{gap:10}]}>
       <Text style={styles.label}>Colegas disponíveis</Text>
       {data.matches.slice(0,4).map(m=>(
        <View key={m.id} style={styles.row}>
         <Text style={styles.label}>{m.name}</Text>
         <Text style={styles.muted}>{(m.subjectName??"Estudo geral")+" · "+(m.goal||"Disponível agora")}</Text>
        </View>
       ))}
       {data.matches.length===0?<Text style={styles.muted}>Nenhum match compatível disponível agora.</Text>:null}
       <Button title="Ver amigos" onPress={()=>router.push("/friends")}/>
      </View>

      <View style={[styles.card,{gap:10}]}>
       <View style={{flexDirection:"row",alignItems:"center",gap:9}}><Ionicons name="bulb-outline" size={24} color={styles.text.color}/><Text style={styles.label}>Prática adaptativa</Text></View>
       <Text style={styles.muted}>{diag?.totals.attempts??0} questões respondidas{diag?.topics[0]?" · próximo foco: "+diag.topics[0].topic:""}</Text>
       <Field label="Assunto" value={practiceTopic} onChangeText={setPracticeTopic} placeholder="Ex.: JOIN ou recursividade"/>
       {profile?.subjects.slice(0,6).map(s=><Button key={s.id} title={(practiceSubject===s.id?"✓ ":"")+s.name} onPress={()=>setPracticeSubject(practiceSubject===s.id?undefined:s.id)}/>)}
       <Button title={practiceBusy?"Preparando…":"Gerar 5 questões"} disabled={practiceBusy} onPress={()=>void generatePractice()}/>
       {practice?<View style={{gap:10}}>{practice.questions.map((q,n)=><View key={q.id} style={[styles.row,{gap:8}]}><Text style={styles.muted}>Questão {n+1} · {q.topic}</Text><Text style={styles.label}>{q.prompt}</Text>{q.options.map((o,i)=><Button key={i} title={(answers[q.id]===i?"✓ ":"")+o} disabled={!!practiceResult} onPress={()=>setAnswers(v=>({...v,[q.id]:i}))}/>) }{practiceResult?.results.find(x=>x.questionId===q.id)?<Text style={styles.muted}>{practiceResult.results.find(x=>x.questionId===q.id)!.explanation}</Text>:null}</View>)}{!practiceResult?<Button title="Corrigir prática" disabled={practiceBusy||Object.keys(answers).length!==practice.questions.length} onPress={()=>void submitPractice()}/>:<Text style={styles.label}>Resultado: {practiceResult.correct} de {practiceResult.total}</Text>}</View>:null}
      </View>

      <View style={[styles.card,{gap:10}]}>
       <View style={{flexDirection:"row",alignItems:"center",gap:9}}><Ionicons name="people-outline" size={24} color={styles.text.color}/><Text style={styles.label}>Grupos de estudo</Text></View>
       <Text style={styles.muted}>Grupos permanentes ficam juntos da sua agenda, sem uma página separada.</Text>
       {groups.slice(0,8).map(g=><View key={g.id} style={styles.row}><Text style={styles.label}>{g.name}</Text><Text style={styles.muted}>{g.subjectName??"Comunidade acadêmica"} · {g.members} membros</Text><Text style={styles.text}>{g.description||"Grupo de estudo do Enturma."}</Text>{g.joined?<Text style={styles.muted}>✓ Você participa</Text>:g.visibility!=="PRIVATE"?<Button title="Entrar no grupo" onPress={()=>void joinGroup(g.id)}/>:null}</View>)}
       {!groups.length?<Text style={styles.muted}>Nenhum grupo disponível ainda.</Text>:null}
      </View>

      <View style={{gap:10}}>
       <Button title="Abrir Cadernos IA" onPress={()=>router.push("/notebooks")}/>
       <Button title="Desafios acadêmicos" onPress={()=>router.push("/challenges")}/>
       <Button title="Entrar em uma sala" onPress={()=>router.push("/rooms")}/>
      </View>
    </Animated.View>
   ):<Text style={styles.muted}>Montando seu dia…</Text>}
  </Screen>
 );
}