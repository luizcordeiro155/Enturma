import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Profile } from "@enturma/contracts";
import { api } from "../src/api";
import { Screen, Button, ErrorMessage, FeedbackMessage, Field, useStyles } from "../src/ui";
import { SuiteHero, SuiteSection, SuiteStats } from "../src/suite-ui";
import { useRealtime } from "../src/realtime";

type Task = { id:string; title:string; kind:string; dueAt:string; subjectName?:string; completedAt?:string|null };
type Group={id:string;name:string;description:string;visibility:string;subjectName?:string|null;members:number;joined?:boolean|null};
type Question={id:string;topic:string;prompt:string;options:string[];difficulty:number};
type PracticeSession={id:string;title:string;questions:Question[]};
type Diagnostic={topics:{topic:string;accuracy:number}[];totals:{attempts:number;correct:number}};
type PracticeResult={correct:number;total:number;results:{questionId:string;correct:boolean;explanation:string}[]};
type TutorReply={id:string;text:string;action:string};
type Flashcard={id:string;front:string;back:string;nextReviewAt:string;reviewCount:number;subjectName?:string|null;notebookTitle?:string|null};

type Today = {
 tasks: Task[];
 focus: { focusSeconds:number; focusSessions:number };
 flashcards: { dueFlashcards:number; totalFlashcards:number };
 study: { totalXp:number; streak:number };
 activeRooms:number;
 matches: { id:string; name:string; goal:string; subjectName?:string }[];
 ownMatch: {subjectId?:string|null;goal:string;availableNow:boolean;preferredMode:string};
};

export default function Campus() {
 const styles=useStyles();
 const router=useRouter();
 const [profile,setProfile]=useState<Profile>();
 const [data,setData]=useState<Today>();
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [flashcards,setFlashcards]=useState<Flashcard[]>([]);
 const [cardFront,setCardFront]=useState("");
 const [cardBack,setCardBack]=useState("");
 const [cardSubject,setCardSubject]=useState("");
 const [planTitle,setPlanTitle]=useState("");
 const [planAt,setPlanAt]=useState("");
 const [planTopics,setPlanTopics]=useState("");
 const [planSubject,setPlanSubject]=useState("");
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

 const generations=useRef({profile:0,today:0,groups:0,diagnostic:0,cards:0});

 const loadProfile=useCallback(async()=>{
   const request=++generations.current.profile;
   try{const value=await api<Profile>("/users/me");if(request===generations.current.profile)setProfile(value)}
   catch(e){if(request===generations.current.profile)setError((e as Error).message)}
 },[]);
 const loadToday=useCallback(async()=>{
   const request=++generations.current.today;
   try{
     const value=await api<Today>("/campus/today");
     if(request!==generations.current.today)return;
     setData(value);setError("");
   }catch(e){if(request===generations.current.today)setError((e as Error).message)}
 },[]);
 const loadGroups=useCallback(async()=>{
   const request=++generations.current.groups;
   try{const value=await api<Group[]>("/campus/groups");if(request===generations.current.groups)setGroups(value)}
   catch(e){if(request===generations.current.groups)setError((e as Error).message)}
 },[]);
 const loadDiagnostic=useCallback(async()=>{
   const request=++generations.current.diagnostic;
   try{const value=await api<Diagnostic>("/practice/diagnostic");if(request===generations.current.diagnostic)setDiag(value)}
   catch(e){if(request===generations.current.diagnostic)setError((e as Error).message)}
 },[]);
 const loadFlashcards=useCallback(async()=>{
   const request=++generations.current.cards;
   try{const value=await api<Flashcard[]>("/campus/flashcards/due");if(request===generations.current.cards)setFlashcards(value)}
   catch(e){if(request===generations.current.cards)setError((e as Error).message)}
 },[]);

 useFocusEffect(useCallback(()=>{
   void Promise.all([loadProfile(),loadToday(),loadGroups(),loadDiagnostic(),loadFlashcards()]);
   return()=>{
     generations.current.profile++;generations.current.today++;generations.current.groups++;
     generations.current.diagnostic++;generations.current.cards++;
   };
 },[loadProfile,loadToday,loadGroups,loadDiagnostic,loadFlashcards]));
 useRealtime(event=>{
   if(event.type==="campus_changed")void Promise.all([loadToday(),loadFlashcards()]);
   else if(event.type==="groups_changed")void loadGroups();
   else if(event.type==="profile_changed")void loadProfile();
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
     setFocusId(null);started.current=null;setSeconds(0);await loadToday();
   }catch(e){setError((e as Error).message)}
 }
 async function joinGroup(id:string){
   try{await api("/campus/groups/"+id+"/join",{method:"POST",body:"{}"});await loadGroups()}
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
     await loadDiagnostic();
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
   try{await api("/campus/tasks/"+id+"/complete",{method:"POST",body:"{}"});await loadToday();}
   catch(e){setError((e as Error).message)}
 }

 async function createPlan(){
   setError("");setNotice("");
   const date=new Date(planAt);
   if(!planTitle.trim()||Number.isNaN(date.getTime())){setError("Informe o nome e uma data/hora válida para a prova.");return}
   try{
     await api("/campus/exam-plan",{method:"POST",body:JSON.stringify({
       subjectId:planSubject||null,title:planTitle.trim(),examAt:date.toISOString(),
       topics:planTopics.split(",").map(v=>v.trim()).filter(Boolean)
     })});
     setPlanTitle("");setPlanAt("");setPlanTopics("");setNotice("Plano inteligente criado e adicionado à agenda.");
     await loadToday();
   }catch(e){setError((e as Error).message)}
 }
 async function createFlashcard(){
   if(!cardFront.trim()||!cardBack.trim())return;
   setError("");setNotice("");
   try{
     await api("/campus/flashcards",{method:"POST",body:JSON.stringify({
       subjectId:cardSubject||null,notebookId:null,front:cardFront.trim(),back:cardBack.trim()
     })});
     setCardFront("");setCardBack("");setNotice("Flashcard criado para revisão espaçada.");
     await Promise.all([loadFlashcards(),loadToday()]);
   }catch(e){setError((e as Error).message)}
 }
 async function reviewFlashcard(id:string,rating:number){
   try{
     await api("/campus/flashcards/"+id+"/review",{method:"POST",body:JSON.stringify({rating})});
     await Promise.all([loadFlashcards(),loadToday()]);
   }catch(e){setError((e as Error).message)}
 }
 async function setMatchAvailable(availableNow:boolean){
   setError("");setNotice("");
   try{
     await api("/campus/study-match",{method:"PUT",body:JSON.stringify({
       subjectId:data?.ownMatch.subjectId??profile?.subjects[0]?.id??null,
       goal:availableNow?(data?.ownMatch.goal||"Disponível para estudar agora"):"",
       availableNow,preferredMode:data?.ownMatch.preferredMode||"ANY"
     })});
     setNotice(availableNow?"Você está disponível no Match de Estudo.":"Você saiu do Match de Estudo.");
     await loadToday();
   }catch(e){setError((e as Error).message)}
 }

 const clock=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
 const title="Hoje / Agenda";
 const openTasks=useMemo(()=>data?.tasks.filter(t=>!t.completedAt)??[],[data]);
 const nextTask=openTasks[0];
 const firstName=profile?.name.split(" ")[0]??"estudante";
 return (
  <Screen title={title}>
   <ErrorMessage message={error}/>
   <FeedbackMessage message={notice} tone="success"/>
   {data?(
    <>
      <SuiteHero
       icon="calendar-outline"
       title={"Boa jornada, "+firstName}
       description="Seu dia acadêmico, suas prioridades e seus próximos passos em um único lugar."
      >
       <View style={[styles.row,{gap:6}]}>
        <Text style={styles.muted}>Próximo compromisso</Text>
        <Text style={[styles.label,{marginBottom:0,fontSize:17}]}>{nextTask?.title??"Agenda livre"}</Text>
        <Text style={styles.muted}>{nextTask?new Date(nextTask.dueAt).toLocaleString("pt-BR"):"Aproveite para focar, revisar ou estudar com alguém."}</Text>
       </View>
       <SuiteStats items={[
        {label:"Sequência",value:data.study.streak+" dias",icon:"flame-outline"},
        {label:"Foco acumulado",value:Math.round(data.focus.focusSeconds/60)+" min",icon:"time-outline"},
        {label:"Revisões",value:data.flashcards.dueFlashcards+" pendentes",icon:"layers-outline"},
        {label:"Salas ativas",value:String(data.activeRooms),icon:"people-outline"},
       ]}/>
      </SuiteHero>

      <SuiteSection icon="calendar-outline" title="Próximos compromissos" description={openTasks.length+" pendentes na sua rotina."}>
       {openTasks.slice(0,5).map(t=>(
        <View key={t.id} style={styles.row}>
         <Text style={styles.label}>{t.title}</Text>
         <Text style={styles.muted}>{(t.subjectName??t.kind)+" · "+new Date(t.dueAt).toLocaleString("pt-BR")}</Text>
         <Button title="Concluir" onPress={()=>void complete(t.id)}/>
        </View>
       ))}
       {openTasks.length===0?<Text style={styles.muted}>Nada urgente por aqui. Adicione compromissos pela versão Web/Desktop ou aproveite para iniciar um foco.</Text>:null}
      </SuiteSection>

      <SuiteSection icon="calendar-number-outline" title="Plano inteligente" description="Crie a mesma preparação de prova disponível no Web/Desktop.">
       <Field label="Prova" value={planTitle} onChangeText={setPlanTitle} placeholder="Ex.: Prova de Banco de Dados"/>
       <Field label="Data e hora" value={planAt} onChangeText={setPlanAt} placeholder="2026-10-15T19:00"/>
       <Field label="Tópicos separados por vírgula" value={planTopics} onChangeText={setPlanTopics} placeholder="JOIN, Normalização, Procedures"/>
       <View style={{gap:8}}>
        <Button title={(planSubject===""?"✓ ":"")+"Geral"} onPress={()=>setPlanSubject("")}/>
        {profile?.subjects.slice(0,8).map(subject=><Button key={subject.id} title={(planSubject===subject.id?"✓ ":"")+subject.name} onPress={()=>setPlanSubject(subject.id)}/>)}
       </View>
       <Button title="Gerar plano" disabled={!planTitle.trim()||!planAt.trim()} onPress={()=>void createPlan()}/>
      </SuiteSection>

      <SuiteSection icon="layers-outline" title="Flashcards" description="Crie e revise cartões com repetição espaçada no Android.">
       <Field label="Pergunta" value={cardFront} onChangeText={setCardFront} placeholder="O que é normalização 3FN?"/>
       <Field label="Resposta" value={cardBack} onChangeText={setCardBack} multiline placeholder="Resposta objetiva para revisão"/>
       <View style={{gap:8}}>
        <Button title={(cardSubject===""?"✓ ":"")+"Geral"} onPress={()=>setCardSubject("")}/>
        {profile?.subjects.slice(0,8).map(subject=><Button key={subject.id} title={(cardSubject===subject.id?"✓ ":"")+subject.name} onPress={()=>setCardSubject(subject.id)}/>)}
       </View>
       <Button title="Criar flashcard" disabled={!cardFront.trim()||!cardBack.trim()} onPress={()=>void createFlashcard()}/>
       {flashcards.slice(0,12).map(card=><View key={card.id} style={styles.row}>
        <Text style={styles.muted}>{card.subjectName??card.notebookTitle??"Revisão geral"}</Text>
        <Text style={styles.label}>{card.front}</Text>
        <Text style={styles.text}>{card.back}</Text>
        <View style={{gap:7}}>
         <Button title="Errei" onPress={()=>void reviewFlashcard(card.id,1)}/>
         <Button title="Difícil" onPress={()=>void reviewFlashcard(card.id,2)}/>
         <Button title="Bom" onPress={()=>void reviewFlashcard(card.id,3)}/>
         <Button title="Fácil" onPress={()=>void reviewFlashcard(card.id,4)}/>
        </View>
       </View>)}
       {!flashcards.length?<Text style={styles.muted}>Nenhum cartão pendente agora.</Text>:null}
      </SuiteSection>

      <SuiteSection icon="people-outline" title="Match de Estudo" description="Controle sua disponibilidade sem precisar abrir a versão Web.">
       <Text style={styles.muted}>{data.ownMatch.availableNow?"Seu perfil está visível para colegas compatíveis.":"Seu perfil não está visível no Match agora."}</Text>
       <Button title={data.ownMatch.availableNow?"Sair do Match":"Ficar disponível agora"} onPress={()=>void setMatchAvailable(!data.ownMatch.availableNow)}/>
      </SuiteSection>

      <SuiteSection icon="timer-outline" title={focusId?clock:"Modo Foco com Tutor"} description={focusId?"A IA está disponível durante toda a sessão para adaptar o ensino.":"Defina o assunto antes de iniciar os 50 minutos."}>
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
      </SuiteSection>

      <SuiteSection icon="people-outline" title="Colegas disponíveis agora" description="Encontre pessoas compatíveis para estudar sem sair da sua rotina.">
       {data.matches.slice(0,4).map(m=>(
        <View key={m.id} style={styles.row}>
         <Text style={styles.label}>{m.name}</Text>
         <Text style={styles.muted}>{(m.subjectName??"Estudo geral")+" · "+(m.goal||"Disponível agora")}</Text>
        </View>
       ))}
       {data.matches.length===0?<Text style={styles.muted}>Nenhum match compatível disponível agora.</Text>:null}
       <Button title="Ver amigos" onPress={()=>router.push("/friends")}/>
      </SuiteSection>

      <SuiteSection icon="bulb-outline" title="Prática adaptativa" description="Questões ajustadas ao seu desempenho e ao assunto que você quer dominar.">
       <Text style={styles.muted}>{diag?.totals.attempts??0} questões respondidas{diag?.topics[0]?" · próximo foco: "+diag.topics[0].topic:""}</Text>
       <Field label="Assunto" value={practiceTopic} onChangeText={setPracticeTopic} placeholder="Ex.: JOIN ou recursividade"/>
       {profile?.subjects.slice(0,6).map(s=><Button key={s.id} title={(practiceSubject===s.id?"✓ ":"")+s.name} onPress={()=>setPracticeSubject(practiceSubject===s.id?undefined:s.id)}/>)}
       <Button title={practiceBusy?"Preparando…":"Gerar 5 questões"} disabled={practiceBusy} onPress={()=>void generatePractice()}/>
       {practice?<View style={{gap:10}}>{practice.questions.map((q,n)=><View key={q.id} style={[styles.row,{gap:8}]}><Text style={styles.muted}>Questão {n+1} · {q.topic}</Text><Text style={styles.label}>{q.prompt}</Text>{q.options.map((o,i)=><Button key={i} title={(answers[q.id]===i?"✓ ":"")+o} disabled={!!practiceResult} onPress={()=>setAnswers(v=>({...v,[q.id]:i}))}/>) }{practiceResult?.results.find(x=>x.questionId===q.id)?<Text style={styles.muted}>{practiceResult.results.find(x=>x.questionId===q.id)!.explanation}</Text>:null}</View>)}{!practiceResult?<Button title="Corrigir prática" disabled={practiceBusy||Object.keys(answers).length!==practice.questions.length} onPress={()=>void submitPractice()}/>:<Text style={styles.label}>Resultado: {practiceResult.correct} de {practiceResult.total}</Text>}</View>:null}
      </SuiteSection>

      <SuiteSection icon="people-circle-outline" title="Grupos de estudo" description="Comunidades permanentes para matérias, provas e projetos.">
       <Text style={styles.muted}>Grupos permanentes ficam juntos da sua agenda, sem uma página separada.</Text>
       {groups.slice(0,8).map(g=><View key={g.id} style={styles.row}><Text style={styles.label}>{g.name}</Text><Text style={styles.muted}>{g.subjectName??"Comunidade acadêmica"} · {g.members} membros</Text><Text style={styles.text}>{g.description||"Grupo de estudo do Enturma."}</Text>{g.joined?<Text style={styles.muted}>✓ Você participa</Text>:g.visibility!=="PRIVATE"?<Button title="Entrar no grupo" onPress={()=>void joinGroup(g.id)}/>:null}</View>)}
       {!groups.length?<Text style={styles.muted}>Nenhum grupo disponível ainda.</Text>:null}
      </SuiteSection>

      <SuiteSection icon="grid-outline" title="Continue estudando" description="Atalhos rápidos para o que você usa durante o semestre.">
       <Button title="Abrir Cadernos IA" onPress={()=>router.push("/notebooks")}/>
       <Button title="Desafios acadêmicos" onPress={()=>router.push("/challenges")}/>
       <Button title="Entrar em uma sala" onPress={()=>router.push("/rooms")}/>
      </SuiteSection>
    </>
   ):<Text style={styles.muted}>Montando seu dia…</Text>}
  </Screen>
 );
}