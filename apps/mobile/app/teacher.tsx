import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Switch, Text, View } from "react-native";
import type { Profile } from "@enturma/contracts";
import { api } from "../src/api";
import { useRealtime } from "../src/realtime";
import { Button, ErrorMessage, Field, useStyles } from "../src/ui";
import { SuiteHero, SuiteSection, SuiteStats } from "../src/suite-ui";

type Summary={
 id:string;name:string;description?:string;joinCode?:string;teacherName?:string;
 subjectName?:string;archived?:boolean;members?:number;assignments?:number;
};
type Dashboard={profile:{institution:string;title:string;enabled:boolean}|null;owned:Summary[];joined:Summary[]};
type Assignment={id:string;title:string;description:string;dueAt?:string;points:number;submitted:boolean;score?:number|null;feedback?:string};
type Detail=Summary&{owner:boolean;subjectId?:string|null;members:{id:string;name:string;username:string}[];assignments:Assignment[]};
type Submission={userId:string;name:string;username:string;status?:string|null;note?:string|null;score?:number|null;feedback?:string|null};
type TeacherRow=
 | {kind:"heading";id:string;title:string;description?:string}
 | {kind:"class";id:string;item:Summary}
 | {kind:"empty";id:string;text:string}
 | {kind:"class-config";id:string}
 | {kind:"member";id:string;member:Detail["members"][number]}
 | {kind:"new-assignment";id:string}
 | {kind:"assignment";id:string;item:Assignment}
 | {kind:"submission";id:string;assignmentId:string;student:Submission}
 | {kind:"class-actions";id:string};

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
 const generation=useRef(0);
 const [assignmentTitle,setAssignmentTitle]=useState("");
 const [assignmentDescription,setAssignmentDescription]=useState("");
 const [assignmentDue,setAssignmentDue]=useState("");
 const [assignmentPoints,setAssignmentPoints]=useState("10");
 const [submissions,setSubmissions]=useState<Record<string,Submission[]>>({});
 const [reviewScore,setReviewScore]=useState<Record<string,string>>({});
 const [reviewFeedback,setReviewFeedback]=useState<Record<string,string>>({});

 const loadDashboard=useCallback(async()=>{
   const request=++generation.current;
   try{
     const [profile,d]=await Promise.all([api<Profile>("/users/me"),api<Dashboard>("/teaching")]);
     if(request!==generation.current)return;
     setMe(profile);setData(d);
     setInstitution(d.profile?.institution??"");
     setTitle(d.profile?.title??"Professor(a)");
     setEnabled(d.profile?.enabled??false);
     setError("");
   }catch(e){if(request===generation.current)setError((e as Error).message)}
 },[]);
 const refreshSelected=useCallback(async(id?:string)=>{
   const target=id??selected?.id;if(!target)return;
   try{setSelected(await api<Detail>("/teaching/classes/"+target))}
   catch(e){setError((e as Error).message)}
 },[selected?.id]);
 const load=useCallback(async()=>{await loadDashboard();if(selected?.id)await refreshSelected(selected.id)},[loadDashboard,refreshSelected,selected?.id]);

 useEffect(()=>{void loadDashboard();return()=>{generation.current++}},[loadDashboard]);
 useRealtime(e=>{
   if(e.type==="teaching_changed"){
     void loadDashboard();
     if(selected?.id)void refreshSelected(selected.id);
   }
 });

 const activeOwned=useMemo(()=>data?.owned.filter(item=>!item.archived)??[],[data]);
 const joined=data?.joined??[];

 async function save(){
   setBusy(true);setError("");setNotice("");
   try{
     await api("/teaching/profile",{method:"PUT",body:JSON.stringify({institution,title,enabled})});
     setNotice("Modo professor atualizado.");
     await loadDashboard();
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
     await loadDashboard();
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
     await loadDashboard();
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

 async function updateClass(archived=selected?.archived??false){
   if(!selected)return;
   setBusy(true);setError("");setNotice("");
   try{
     await api("/teaching/classes/"+selected.id,{method:"PUT",body:JSON.stringify({
       subjectId:selected.subjectId??null,name:selected.name,description:selected.description??"",archived
     })});
     setNotice(archived?"Turma arquivada.":"Configurações da turma atualizadas.");
     await Promise.all([loadDashboard(),refreshSelected(selected.id)]);
   }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function removeMember(userId:string){
   if(!selected)return;
   try{
     await api("/teaching/classes/"+selected.id+"/members/"+userId,{method:"DELETE"});
     setNotice("Estudante removido da turma.");await refreshSelected(selected.id);
   }catch(e){setError((e as Error).message)}
 }
 async function createAssignment(){
   if(!selected||!assignmentTitle.trim())return;
   const due=assignmentDue.trim()?new Date(assignmentDue):null;
   if(due&&Number.isNaN(due.getTime())){setError("Informe uma data/hora válida para a atividade.");return}
   setBusy(true);setError("");setNotice("");
   try{
     await api("/teaching/classes/"+selected.id+"/assignments",{method:"POST",body:JSON.stringify({
       title:assignmentTitle.trim(),description:assignmentDescription.trim(),
       dueAt:due?.toISOString()??null,points:Math.max(0,Math.min(1000,Number(assignmentPoints)||0))
     })});
     setAssignmentTitle("");setAssignmentDescription("");setAssignmentDue("");setAssignmentPoints("10");
     setNotice("Atividade publicada.");await refreshSelected(selected.id);
   }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function loadSubmissions(assignmentId:string){
   try{
     const values=await api<Submission[]>("/teaching/assignments/"+assignmentId+"/submissions");
     setSubmissions(v=>({...v,[assignmentId]:values}));
   }catch(e){setError((e as Error).message)}
 }
 async function reviewSubmission(assignmentId:string,userId:string){
   try{
     await api("/teaching/assignments/"+assignmentId+"/submissions/"+userId,{method:"PUT",body:JSON.stringify({
       score:reviewScore[userId]?.trim()===""||reviewScore[userId]==null?null:Number(reviewScore[userId]),
       feedback:reviewFeedback[userId]??""
     })});
     setNotice("Nota e feedback salvos.");await loadSubmissions(assignmentId);await refreshSelected(selected?.id);
   }catch(e){setError((e as Error).message)}
 }
 async function deleteAssignment(id:string){
   try{
     await api("/teaching/assignments/"+id,{method:"DELETE"});
     setNotice("Atividade removida.");if(selected)await refreshSelected(selected.id);
   }catch(e){setError((e as Error).message)}
 }

 const rows=useMemo<TeacherRow[]>(()=>{
   const values:TeacherRow[]=[
     {kind:"heading",id:"classes-heading",title:"Suas turmas",description:"Abra uma turma para acompanhar estudantes, atividades, prazos e feedbacks."},
   ];
   const classes=[...activeOwned,...joined];
   if(!classes.length)values.push({kind:"empty",id:"classes-empty",text:"Nenhuma turma ativa ainda."});
   else classes.forEach(item=>values.push({kind:"class",id:"class-"+item.id,item}));
   if(!selected)return values;
   values.push({kind:"heading",id:"selected-"+selected.id,title:selected.name,description:selected.description||"Espaço de acompanhamento da turma."});
   if(selected.owner)values.push({kind:"class-config",id:"config-"+selected.id});
   values.push({kind:"heading",id:"members-heading-"+selected.id,title:"Estudantes · "+selected.members.length});
   if(!selected.members.length)values.push({kind:"empty",id:"members-empty-"+selected.id,text:"Aguardando estudantes entrarem com o código."});
   else selected.members.forEach(member=>values.push({kind:"member",id:"member-"+member.id,member}));
   values.push({kind:"heading",id:"assignments-heading-"+selected.id,title:"Atividades · "+selected.assignments.length});
   if(selected.owner)values.push({kind:"new-assignment",id:"new-assignment-"+selected.id});
   if(!selected.assignments.length)values.push({kind:"empty",id:"assignments-empty-"+selected.id,text:"Nenhuma atividade publicada ainda."});
   else selected.assignments.forEach(item=>{
     values.push({kind:"assignment",id:"assignment-"+item.id,item});
     if(selected.owner)(submissions[item.id]??[]).forEach(student=>values.push({
       kind:"submission",id:"submission-"+item.id+"-"+student.userId,assignmentId:item.id,student
     }));
   });
   values.push({kind:"class-actions",id:"actions-"+selected.id});
   return values;
 },[activeOwned,joined,selected,submissions]);

 return <FlatList
   style={{flex:1,backgroundColor:styles.screen.backgroundColor}}
   contentContainerStyle={{paddingHorizontal:18,paddingTop:18,paddingBottom:110,gap:12}}
   data={rows}
   keyExtractor={item=>item.id}
   keyboardShouldPersistTaps="handled"
   ListHeaderComponent={<View style={{gap:14,marginBottom:2}}>
     <Text style={styles.title} accessibilityRole="header">Turmas / Professor</Text>
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
       <Field label="Código da turma" value={code} autoCapitalize="characters" autoCorrect={false} onChangeText={setCode} placeholder="ABC23XYZ"/>
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
         {me?.subjects.slice(0,8).map(subject=><Button key={subject.id} title={(subjectId===subject.id?"✓ ":"")+subject.name} onPress={()=>setSubjectId(subject.id)}/>)}
       </View>
       <Button title={busy?"Criando…":"Criar turma"} disabled={busy||!className.trim()} onPress={()=>void create()}/>
     </SuiteSection>
   </View>}
   renderItem={({item})=>{
     if(item.kind==="heading")return <View style={[styles.card,{gap:4}]}>
       <Text style={[styles.label,{marginBottom:0,fontSize:17}]}>{item.title}</Text>
       {item.description?<Text style={styles.muted}>{item.description}</Text>:null}
       {selected&&item.id==="selected-"+selected.id&&selected.joinCode?<Text style={[styles.title,{fontSize:22,lineHeight:28,letterSpacing:2}]}>{selected.joinCode}</Text>:null}
     </View>;
     if(item.kind==="empty")return <View style={styles.card}><Text style={styles.muted}>{item.text}</Text></View>;
     if(item.kind==="class")return <View style={styles.row}>
       <Text style={[styles.label,{marginBottom:0,fontSize:16}]}>{item.item.name}</Text>
       <Text style={styles.muted}>{item.item.subjectName??item.item.teacherName??"Turma Enturma"}{item.item.joinCode?" · Código "+item.item.joinCode:""}</Text>
       {typeof item.item.members==="number"?<Text style={styles.muted}>{item.item.members} estudantes · {item.item.assignments??0} atividades</Text>:null}
       <Button title="Abrir turma" disabled={busy} onPress={()=>void openClass(item.item.id)}/>
     </View>;
     if(item.kind==="class-config"&&selected)return <View style={styles.row}>
       <Text style={styles.label}>Configurar turma</Text>
       <Field label="Nome da turma" value={selected.name} onChangeText={value=>setSelected(v=>v?{...v,name:value}:v)}/>
       <Field label="Descrição" value={selected.description??""} multiline onChangeText={value=>setSelected(v=>v?{...v,description:value}:v)}/>
       <Button title="Salvar configurações" disabled={busy||!selected.name.trim()} onPress={()=>void updateClass(false)}/>
       <Button title={selected.archived?"Desarquivar turma":"Arquivar turma"} disabled={busy} onPress={()=>void updateClass(!selected.archived)}/>
     </View>;
     if(item.kind==="member")return <View style={styles.row}>
       <Text style={[styles.label,{marginBottom:0}]}>{item.member.name}</Text>
       <Text style={styles.muted}>@{item.member.username}</Text>
       {selected?.owner?<Button title="Remover estudante" onPress={()=>void removeMember(item.member.id)}/>:null}
     </View>;
     if(item.kind==="new-assignment")return <View style={styles.row}>
       <Text style={styles.label}>Nova atividade</Text>
       <Field label="Título" value={assignmentTitle} onChangeText={setAssignmentTitle}/>
       <Field label="Descrição" value={assignmentDescription} multiline onChangeText={setAssignmentDescription}/>
       <Field label="Prazo" value={assignmentDue} onChangeText={setAssignmentDue} placeholder="2026-10-20T23:59"/>
       <Field label="Pontos" value={assignmentPoints} keyboardType="numeric" onChangeText={setAssignmentPoints}/>
       <Button title="Publicar atividade" disabled={busy||!assignmentTitle.trim()} onPress={()=>void createAssignment()}/>
     </View>;
     if(item.kind==="assignment")return <View style={styles.row}>
       <Text style={[styles.label,{marginBottom:0}]}>{item.item.title}</Text>
       {item.item.description?<Text style={styles.text}>{item.item.description}</Text>:null}
       <Text style={styles.muted}>{item.item.dueAt?new Date(item.item.dueAt).toLocaleString("pt-BR"):"Sem prazo"} · {item.item.points} pontos</Text>
       {!selected?.owner?(item.item.submitted?
         <Text style={styles.muted}>{item.item.score!=null?"Nota "+item.item.score+"/"+item.item.points:"Entregue, aguardando correção"}{item.item.feedback?" · "+item.item.feedback:""}</Text>:
         <Button title="Entregar atividade" onPress={()=>void submit(item.item)}/>):<>
         <Button title="Ver entregas / corrigir" onPress={()=>void loadSubmissions(item.item.id)}/>
         <Button title="Excluir atividade" onPress={()=>void deleteAssignment(item.item.id)}/>
       </>}
     </View>;
     if(item.kind==="submission")return <View style={styles.row}>
       <Text style={styles.label}>{item.student.name} · @{item.student.username}</Text>
       <Text style={styles.muted}>{item.student.note||"Ainda não entregou"}</Text>
       {item.student.status?<><Field label="Nota" value={reviewScore[item.student.userId]??(item.student.score==null?"":String(item.student.score))} keyboardType="numeric" onChangeText={value=>setReviewScore(v=>({...v,[item.student.userId]:value}))}/>
       <Field label="Feedback" value={reviewFeedback[item.student.userId]??item.student.feedback??""} multiline onChangeText={value=>setReviewFeedback(v=>({...v,[item.student.userId]:value}))}/>
       <Button title="Salvar correção" onPress={()=>void reviewSubmission(item.assignmentId,item.student.userId)}/></>:null}
     </View>;
     if(item.kind==="class-actions")return <View style={{gap:8}}>
       {selected?.owner?<Button title="Apagar turma" onPress={()=>void removeClass()}/>:null}
       <Button title="Fechar turma" onPress={()=>setSelected(undefined)}/>
     </View>;
     return null;
   }}
 />;
}
