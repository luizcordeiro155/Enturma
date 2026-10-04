import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
type Submission={userId:string;name:string;username:string;status?:string|null;note?:string|null;score?:number|null;feedback?:string|null};

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

     {selected.owner?<View style={[styles.row,{gap:9}]}>
       <Text style={styles.label}>Configurar turma</Text>
       <Field label="Nome da turma" value={selected.name} onChangeText={value=>setSelected(v=>v?{...v,name:value}:v)}/>
       <Field label="Descrição" value={selected.description??""} multiline onChangeText={value=>setSelected(v=>v?{...v,description:value}:v)}/>
       <Button title="Salvar configurações" disabled={busy||!selected.name.trim()} onPress={()=>void updateClass(false)}/>
       <Button title={selected.archived?"Desarquivar turma":"Arquivar turma"} disabled={busy} onPress={()=>void updateClass(!selected.archived)}/>
      </View>:null}

     <Text style={[styles.label,{marginBottom:0}]}>Estudantes · {selected.members.length}</Text>
     {selected.members.map(member=><View key={member.id} style={[styles.row,{paddingVertical:12}]}>
       <Text style={[styles.label,{marginBottom:0}]}>{member.name}</Text>
       <Text style={styles.muted}>@{member.username}</Text>
       {selected.owner?<Button title="Remover estudante" onPress={()=>void removeMember(member.id)}/>:null}
     </View>)}
     {!selected.members.length?<Text style={styles.muted}>Aguardando estudantes entrarem com o código.</Text>:null}

     {selected.owner?<View style={[styles.row,{gap:9}]}>
       <Text style={styles.label}>Nova atividade</Text>
       <Field label="Título" value={assignmentTitle} onChangeText={setAssignmentTitle}/>
       <Field label="Descrição" value={assignmentDescription} multiline onChangeText={setAssignmentDescription}/>
       <Field label="Prazo" value={assignmentDue} onChangeText={setAssignmentDue} placeholder="2026-10-20T23:59"/>
       <Field label="Pontos" value={assignmentPoints} keyboardType="numeric" onChangeText={setAssignmentPoints}/>
       <Button title="Publicar atividade" disabled={busy||!assignmentTitle.trim()} onPress={()=>void createAssignment()}/>
      </View>:null}

     <Text style={[styles.label,{marginBottom:0}]}>Atividades · {selected.assignments.length}</Text>
     {selected.assignments.map(item=><View key={item.id} style={styles.row}>
       <Text style={[styles.label,{marginBottom:0}]}>{item.title}</Text>
       {item.description?<Text style={styles.text}>{item.description}</Text>:null}
       <Text style={styles.muted}>{item.dueAt?new Date(item.dueAt).toLocaleString("pt-BR"):"Sem prazo"} · {item.points} pontos</Text>
       {!selected.owner?(item.submitted?
         <Text style={styles.muted}>{item.score!=null?"Nota "+item.score+"/"+item.points:"Entregue, aguardando correção"}{item.feedback?" · "+item.feedback:""}</Text>:
         <Button title="Entregar atividade" onPress={()=>void submit(item)}/>):null}
       {selected.owner?<>
         <Button title="Ver entregas / corrigir" onPress={()=>void loadSubmissions(item.id)}/>
         <Button title="Excluir atividade" onPress={()=>void deleteAssignment(item.id)}/>
         {(submissions[item.id]??[]).map(student=><View key={student.userId} style={[styles.row,{gap:7}]}>
           <Text style={styles.label}>{student.name} · @{student.username}</Text>
           <Text style={styles.muted}>{student.note||"Ainda não entregou"}</Text>
           {student.status?<><Field label="Nota" value={reviewScore[student.userId]??(student.score==null?"":String(student.score))} keyboardType="numeric" onChangeText={value=>setReviewScore(v=>({...v,[student.userId]:value}))}/>
           <Field label="Feedback" value={reviewFeedback[student.userId]??student.feedback??""} multiline onChangeText={value=>setReviewFeedback(v=>({...v,[student.userId]:value}))}/>
           <Button title="Salvar correção" onPress={()=>void reviewSubmission(item.id,student.userId)}/></>:null}
         </View>)}
       </>:null}
     </View>)}
     {!selected.assignments.length?<Text style={styles.muted}>Nenhuma atividade publicada ainda.</Text>:null}

     {selected.owner?<Button title="Apagar turma" onPress={()=>void removeClass()}/>:null}
     <Button title="Fechar turma" onPress={()=>setSelected(undefined)}/>
   </SuiteSection>:null}
 </Screen>;
}
