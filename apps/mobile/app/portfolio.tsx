import { useEffect, useState } from "react";
import { Share, Switch, Text, View } from "react-native";
import { api } from "../src/api";
import { Screen, Button, ErrorMessage, FeedbackMessage, Field, useStyles } from "../src/ui";
import { SuiteHero, SuiteSection, SuiteStats } from "../src/suite-ui";

type Project={name:string;description?:string;url?:string};
type Portfolio={
 id:string;username:string;publicProfile:boolean;headline:string;summary:string;skills:string[];
 projects:Project[];studyMinutes:number;stats:{totalXp:number;currentStreak:number};
 subjects:{name:string}[];
};

export default function Portfolio(){
 const styles=useStyles();
 const [data,setData]=useState<Portfolio>();
 const [headline,setHeadline]=useState("");
 const [summary,setSummary]=useState("");
 const [skills,setSkills]=useState("");
 const [pub,setPub]=useState(false);
 const [projects,setProjects]=useState<Project[]>([]);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
   let active=true;
   void api<Portfolio>("/portfolio/me")
     .then(v=>{
       if(!active)return;
       setData(v);setHeadline(v.headline);setSummary(v.summary);
       setSkills((v.skills??[]).join(", "));setPub(v.publicProfile);
       setProjects(v.projects??[]);
     })
     .catch(e=>{if(active)setError(e.message)});
   return()=>{active=false};
 },[]);

 async function save(){
   setBusy(true);setError("");setNotice("");
   try{
     await api("/portfolio/me",{method:"PUT",body:JSON.stringify({
       publicProfile:pub,
       headline,
       summary,
       skills:skills.split(",").map(v=>v.trim()).filter(Boolean),
       projects
     })});
     setNotice("Portfólio salvo.");
     setData(await api<Portfolio>("/portfolio/me"));
   }catch(e){setError((e as Error).message)}
   finally{setBusy(false)}
 }

 async function share(){
   if(!data)return;
   await Share.share({message:"Meu portfólio no Enturma: https://enturma-flax.vercel.app/p/"+data.username});
 }

 function addProject(){
   if(projects.length>=12)return;
   setProjects(v=>[...v,{name:"",description:"",url:""}]);
 }

 return <Screen title="Portfólio acadêmico">
   <ErrorMessage message={error}/>
   <FeedbackMessage message={notice} tone="success"/>
   <SuiteHero
     icon="briefcase-outline"
     title="Sua trajetória, pronta para mostrar"
     description="Organize competências, projetos e progresso acadêmico no mesmo padrão visual do Enturma."
   >
     {data?<SuiteStats items={[
       {label:"Experiência",value:data.stats.totalXp+" XP",icon:"trophy-outline"},
       {label:"Tempo de estudo",value:data.studyMinutes+" min",icon:"time-outline"},
       {label:"Sequência atual",value:data.stats.currentStreak+" dias",icon:"flame-outline"},
     ]}/>:null}
   </SuiteHero>

   <SuiteSection
     icon="globe-outline"
     title="Visibilidade"
     description="Você decide quando o portfólio fica público."
   >
     <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:12}}>
       <View style={{flex:1}}>
         <Text style={styles.text}>Portfólio público</Text>
         <Text style={styles.muted}>{pub?"Seu perfil pode ser compartilhado por link.":"Somente você consegue visualizar e editar."}</Text>
       </View>
       <Switch value={pub} onValueChange={setPub}/>
     </View>
   </SuiteSection>

   <SuiteSection
     icon="person-outline"
     title="Apresentação"
     description="Use uma descrição curta, clara e profissional."
   >
     <Field label="Título profissional" value={headline} onChangeText={setHeadline} placeholder="Estudante de ADS · Java · UI/UX"/>
     <Field label="Apresentação" value={summary} multiline onChangeText={setSummary} placeholder="Conte sua trajetória, objetivos e o tipo de problema que gosta de resolver."/>
     <Field label="Competências separadas por vírgula" value={skills} onChangeText={setSkills} placeholder="Java, SQL, Git, UI/UX"/>
   </SuiteSection>

   <SuiteSection
     icon="folder-open-outline"
     title="Projetos"
     description="Adicione trabalhos da faculdade, projetos pessoais e experiências em equipe."
   >
     {projects.map((project,index)=><View key={index} style={[styles.row,{gap:9}]}>
       <Field label={"Projeto "+(index+1)} value={project.name} onChangeText={value=>setProjects(v=>v.map((p,i)=>i===index?{...p,name:value}:p))} placeholder="Nome do projeto"/>
       <Field label="Descrição" value={project.description??""} multiline onChangeText={value=>setProjects(v=>v.map((p,i)=>i===index?{...p,description:value}:p))} placeholder="O que você desenvolveu e aprendeu"/>
       <Field label="Link" value={project.url??""} autoCapitalize="none" onChangeText={value=>setProjects(v=>v.map((p,i)=>i===index?{...p,url:value}:p))} placeholder="https://"/>
       <Button title="Remover projeto" onPress={()=>setProjects(v=>v.filter((_,i)=>i!==index))}/>
     </View>)}
     {!projects.length?<Text style={styles.muted}>Nenhum projeto adicionado ainda.</Text>:null}
     {projects.length<12?<Button title="Adicionar projeto" onPress={addProject}/>:null}
   </SuiteSection>

   {data?.subjects?.length?<SuiteSection
     icon="book-outline"
     title="Estudos atuais"
     description="Matérias que fazem parte do seu semestre no Enturma."
   >
     <View style={{gap:8}}>
       {data.subjects.map(subject=><View key={subject.name} style={styles.row}><Text style={styles.text}>{subject.name}</Text></View>)}
     </View>
   </SuiteSection>:null}

   <View style={{gap:10}}>
     <Button title={busy?"Salvando…":"Salvar portfólio"} disabled={busy} onPress={()=>void save()}/>
     {pub?<Button title="Compartilhar portfólio" onPress={()=>void share()}/>:null}
   </View>
 </Screen>;
}
