import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Switch, Text, View } from "react-native";
import type { Profile } from "@enturma/contracts";
import { api } from "../src/api";
import { useRealtime } from "../src/realtime";
import { Screen, Button, ErrorMessage, Field, useStyles } from "../src/ui";
import { SuiteHero, SuiteSection, SuiteStats } from "../src/suite-ui";

type Summary={
 id:string;name:string;description?:string;joinCode?:string;teacherName?:string;
 subjectName?:string;archived?:boolean;members?:number;assignments?:number;
};
type Dashboard={profile:{institution:string;title:string;enabled:boolean}|null;owned:Summary[];joined:Summary[]};
type Assignment={id:string;title:string;description:string;dueAt?:string;points:number;submitted:boolean;score?:number|null;feedback?:string};
type Detail=Summary&{owner:boolean;subjectId?:string|null;members:{id:string;name:string;username:string}[];assignments:Assignment[]};

export default function Teacher(){
 const styles=useStyles();
 const [me,setMe]=useState<Profile>();
 const [data,setData]=useState<Dashboard>();
 const [selected,setSelected]=useState<Detail>();
 const [institution,setInstitution]=useState("");
 const [title,setTitle]=useState("Professor(a)");
 const [enabled,setEnabled]=useState(false);
 const [code,setCode]=useState("");
 const [className,setClassName]=useState("");
 const [description,setDescription]=useState("");
 const [subjectId,setSubjectId]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);

 const load=useCallback(async()=>{
   try{
     const [profile,d]=await Promise.all([
       api<Profile>("/users/me"),
       api<Dashboard>("/teaching")
     ]);
     setMe(profile);setData(d);
     setInstitution(d.profile?.institution??"");
     setTitle(d.profile?.title??"Professor(a)");
     setEnabled(d.profile?.enabled??false);
     if(selected?.id)setSelected(await api<Detail>("/teaching/classes/"+selected.id));
     setError("");
   }catch(e){setError((e as Error).message)}
 },[selected?.id]);

 useEffect(()=>{void load()},[load]);
 useRealtime(e=>{if(e.type==="teaching_changed")void load()});

 const activeOwned=useMemo(()=>data?.owned.filter(item=>!item.archived)??[],[data]);
 const joined=data?.joined??[];

 async function save(){
   setBusy(true);setError("");setNotice("");
   try{
     await api("/teaching/profile",{method:"PUT",body:JSON.stringify({institution,title,enabled})});
     setNotice("Modo professor atualizado.");
     await load();
   }catch(e){setError((e as Error).message)}
   finally{setBusy(false)}
 }

 async function join(){
   const normalized=code.replace(/[^A-Za-z0-9]/g,"").toUpperCase();
   if(!normalized)return;
   setBusy(true);setError("");setNotice("");
   try{
     const item=await api<{id:string}>("/teaching/classes/join",{method:"POST",body:JSON.stringify({code:normalized})});
     setCode("");
     setNotice("Você entrou na turma.");
     await load();
     setSelected(await api<Detail>("/teaching/classes/"+item.id));
   }catch(e){setError((e as Error).message)}
   finally{setBusy(false)}
 }

 async function create(){
   if(!className.trim())return;
   setBusy(true);setError("");setNotice("");
   try{
     if(!enabled){
       await api("/teaching/profile",{method:"PUT",body:JSON.stringify({institution,title,enabled:true})});
       setEnabled(true);
     }
     const item=await api<{id:string}>("/teaching/classes",{method:"POST",body:JSON.stringify({
       name:className.trim(),
       description:description.trim(),
       subjectId:subjectId||null
     })});
     setClassName("");setDescription("");setSubjectId("");
     setNotice("Turma criada e pronta para receber estudantes.");
     await load();
     setSelected(await api<Detail>("/teaching/classes/"+item.id));
   }catch(e){setError((e as Error).message)}
   finally{setBusy(false)}
 }

 async function openClass(id:string){
   setBusy(true);setError("");
   try{setSelected(await api<Detail>("/teaching/classes/"+id))}
   catch(e){setError((e as Error).message)}
   finally{setBusy(false)}
 }

 async function removeClass(){
   if(!selected)return;
   Alert.alert("Apagar turma","Apagar definitivamente \""+selected.name+"\"? Atividades e entregas também serão removidas.",[
     {text:"Cancelar",style:"cancel"},
     {text:"Apagar",style:"destructive",onPress:()=>void api("/teaching/classes/"+selected.id,{method:"DELETE"})
       .then(async()=>{setSelected(undefined);setNotice("Turma apagada.");await load()})
       .catch(e=>setError(e.message))}
   ]);
 }

 async function submit(item:Assignment){
   setError("");setNotice("");
   try{
     await api("/teaching/assignments/"+item.id+"/submit",{method:"POST",body:JSON.stringify({note:"Entrega enviada pelo aplicativo Enturma."})});
     setNotice("Atividade entregue.");
     if(selected)setSelected(await api<Detail>("/teaching/classes/"+selected.id));
   }catch(e){setError((e as Error).message)}
 }

 return <Screen title="Turmas / Professor">
   <ErrorMessage message={error}/>
   {notice?<View style={[styles.card,{backgroundColor:styles.elevated.backgroundColor}]}><Text style={styles.text}>{notice}</Text></View>:null}

   <SuiteHero
     icon="school-outline"
     title="Professor e aluno no mesmo espaço"
     description="Crie turmas, acompanhe atividades e mantenha a comunicação acadêmica organizada no Enturma."
   >
     <SuiteStats items={[
       {label:"Turmas criadas",value:String(activeOwned.length),icon:"people-outline"},
       {label:"Turmas como aluno",value:String(joined.length),icon:"book-outline"},
       {label:"Modo professor",value:enabled?"Ativo":"Desativado",icon:"person-outline"},
     ]}/>
   </SuiteHero>

   <SuiteSection
     icon="person-circle-outline"
     title="Modo professor"
     description="Ative para criar e administrar turmas. Você continua podendo participar normalmente como aluno."
   >
     <Field label="Instituição" value={institution} onChangeText={setInstitution} placeholder="Universidade ou escola"/>
     <Field label="Título" value={title} onChangeText={setTitle} placeholder="Professor(a)"/>
     <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:12,minHeight:48}}>
       <View style={{flex:1}}>
         <Text style={styles.text}>Ativar ferramentas de professor</Text>
         <Text style={styles.muted}>Libera criação e gerenciamento de turmas.</Text>
       </View>
       <Switch value={enabled} onValueChange={setEnabled}/>
     </View>
     <Button title={busy?"Salvando…":"Salvar perfil"} disabled={busy} onPress={()=>void save()}/>
   </SuiteSection>

   <SuiteSection
     icon="enter-outline"
     title="Entrar em uma turma"
     description="Digite o código compartilhado pelo professor. O código pode ser colado com espaços ou traços."
   >
     <Field
       label="Código da turma"
       value={code}
       autoCapitalize="characters"
       autoCorrect={false}
       onChangeText={setCode}
       placeholder="ABC23XYZ"
     />
     <Button title={busy?"Abrindo…":"Entrar na turma"} disabled={busy||!code.trim()} onPress={()=>void join()}/>
   </SuiteSection>

   <SuiteSection
     icon="add-circle-outline"
     title="Criar turma"
     description="Defina o objetivo da turma e a matéria principal. Se o modo professor estiver desligado, ele será ativado ao criar."
   >
     <Field label="Nome" value={className} onChangeText={setClassName} placeholder="Banco de Dados · Turma A"/>
     <Field label="Descrição" value={description} onChangeText={setDescription} multiline placeholder="Objetivos, metodologia e desenvolvimento esperado"/>
     <Text style={[styles.label,{marginBottom:0}]}>Matéria principal</Text>
     <View style={{gap:8}}>
       <Button title={(subjectId===""?"✓ ":"")+"Geral"} onPress={()=>setSubjectId("")}/>
       {me?.subjects.slice(0,8).map(subject=><Button
         key={subject.id}
         title={(subjectId===subject.id?"✓ ":"")+subject.name}
         onPress={()=>setSubjectId(subject.id)}
       />)}
     </View>
     <Button title={busy?"Criando…":"Criar turma"} disabled={busy||!className.trim()} onPress={()=>void create()}/>
   </SuiteSection>

   <SuiteSection
     icon="albums-outline"
     title="Suas turmas"
     description="Abra uma turma para acompanhar estudantes, atividades, prazos e feedbacks."
   >
     {[...activeOwned,...joined].map(item=><View style={[styles.row,{gap:7}]} key={item.id}>
       <Text style={[styles.label,{marginBottom:0,fontSize:16}]}>{item.name}</Text>
       <Text style={styles.muted}>
         {item.subjectName??item.teacherName??"Turma Enturma"}
         {item.joinCode?" · Código "+item.joinCode:""}
       </Text>
       {typeof item.members==="number"?<Text style={styles.muted}>{item.members} estudantes · {item.assignments??0} atividades</Text>:null}
       <Button title="Abrir turma" disabled={busy} onPress={()=>void openClass(item.id)}/>
     </View>)}
     {!activeOwned.length&&!joined.length?<Text style={styles.muted}>Nenhuma turma ativa ainda.</Text>:null}
   </SuiteSection>

   {selected?<SuiteSection
     icon="easel-outline"
     title={selected.name}
     description={selected.description||"Espaço de acompanhamento da turma."}
   >
     {selected.joinCode?<View style={[styles.row,{gap:4}]}><Text style={styles.muted}>Código para estudantes</Text><Text style={[styles.title,{fontSize:24,lineHeight:30,letterSpacing:2}]}>{selected.joinCode}</Text></View>:null}

     <Text style={[styles.label,{marginBottom:0}]}>Estudantes · {selected.members.length}</Text>
     {selected.members.map(member=><View key={member.id} style={[styles.row,{paddingVertical:12}]}>
       <Text style={[styles.label,{marginBottom:0}]}>{member.name}</Text>
       <Text style={styles.muted}>@{member.username}</Text>
     </View>)}
     {!selected.members.length?<Text style={styles.muted}>Aguardando estudantes entrarem com o código.</Text>:null}

     <Text style={[styles.label,{marginBottom:0}]}>Atividades · {selected.assignments.length}</Text>
     {selected.assignments.map(item=><View key={item.id} style={styles.row}>
       <Text style={[styles.label,{marginBottom:0}]}>{item.title}</Text>
       {item.description?<Text style={styles.text}>{item.description}</Text>:null}
       <Text style={styles.muted}>{item.dueAt?new Date(item.dueAt).toLocaleString("pt-BR"):"Sem prazo"} · {item.points} pontos</Text>
       {!selected.owner?(item.submitted?
         <Text style={styles.muted}>{item.score!=null?"Nota "+item.score+"/"+item.points:"Entregue, aguardando correção"}{item.feedback?" · "+item.feedback:""}</Text>:
         <Button title="Entregar atividade" onPress={()=>void submit(item)}/>):null}
     </View>)}
     {!selected.assignments.length?<Text style={styles.muted}>Nenhuma atividade publicada ainda.</Text>:null}

     {selected.owner?<Button title="Apagar turma" onPress={()=>void removeClass()}/>:null}
     <Button title="Fechar turma" onPress={()=>setSelected(undefined)}/>
   </SuiteSection>:null}
 </Screen>;
}
