import { useCallback, useEffect, useState } from "react";
import { Alert, Switch, Text, View } from "react-native";
import type { Profile } from "@enturma/contracts";
import { api } from "../src/api";
import { useRealtime } from "../src/realtime";
import { Screen, Button, ErrorMessage, Field, useStyles } from "../src/ui";

type Summary={id:string;name:string;description?:string;joinCode?:string;teacherName?:string;subjectName?:string;archived?:boolean};
type Dashboard={profile:{institution:string;title:string;enabled:boolean}|null;owned:Summary[];joined:Summary[]};
type Assignment={id:string;title:string;description:string;dueAt?:string;points:number;submitted:boolean;score?:number|null;feedback?:string};
type Detail=Summary&{owner:boolean;members:{id:string;name:string;username:string}[];assignments:Assignment[]};

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
 const [status,setStatus]=useState("");

 const load=useCallback(async()=>{
   try{
     const [profile,d]=await Promise.all([api<Profile>("/users/me"),api<Dashboard>("/teaching")]);
     setMe(profile);setData(d);setInstitution(d.profile?.institution??"");setTitle(d.profile?.title??"Professor(a)");setEnabled(d.profile?.enabled??false);
     if(selected?.id)setSelected(await api<Detail>("/teaching/classes/"+selected.id));
   }catch(e){setStatus((e as Error).message)}
 },[selected?.id]);

 useEffect(()=>{void load()},[load]);
 useRealtime(e=>{if(e.type==="teaching_changed")void load()});

 async function save(){try{await api("/teaching/profile",{method:"PUT",body:JSON.stringify({institution,title,enabled})});setStatus("Modo professor atualizado.");await load()}catch(e){setStatus((e as Error).message)}}
 async function join(){try{const item=await api<{id:string}>("/teaching/classes/join",{method:"POST",body:JSON.stringify({code})});setCode("");setStatus("Você entrou na turma.");await load();setSelected(await api<Detail>("/teaching/classes/"+item.id))}catch(e){setStatus((e as Error).message)}}
 async function create(){
   if(!className.trim())return;
   try{
     const item=await api<{id:string}>("/teaching/classes",{method:"POST",body:JSON.stringify({name:className,description,subjectId:me?.subjects[0]?.id??null})});
     setClassName("");setDescription("");setStatus("Turma criada.");await load();setSelected(await api<Detail>("/teaching/classes/"+item.id));
   }catch(e){setStatus((e as Error).message)}
 }
 async function removeClass(){
   if(!selected)return;
   Alert.alert("Apagar turma","Apagar definitivamente \""+selected.name+"\"?",[
     {text:"Cancelar",style:"cancel"},
     {text:"Apagar",style:"destructive",onPress:()=>void api("/teaching/classes/"+selected.id,{method:"DELETE"}).then(async()=>{setSelected(undefined);setStatus("Turma apagada.");await load()}).catch(e=>setStatus(e.message))}
   ]);
 }
 async function submit(item:Assignment){
   try{await api("/teaching/assignments/"+item.id+"/submit",{method:"POST",body:JSON.stringify({note:"Entrega enviada pelo aplicativo Enturma."})});setStatus("Atividade entregue.");if(selected)setSelected(await api<Detail>("/teaching/classes/"+selected.id))}catch(e){setStatus((e as Error).message)}
 }

 return <Screen title="Turmas / Professor">
   <ErrorMessage message={status}/>
   <View style={[styles.card,{gap:10}]}>
     <Text style={styles.label}>Professor e aluno no mesmo espaço</Text>
     <Text style={styles.muted}>Professores criam turmas, publicam atividades e acompanham estudantes. Alunos entram por código, entregam trabalhos e recebem feedback sem precisar atualizar a tela manualmente.</Text>
   </View>

   <View style={[styles.card,{gap:10}]}>
     <Text style={styles.label}>Modo professor</Text>
     <Field label="Instituição" value={institution} onChangeText={setInstitution}/>
     <Field label="Título" value={title} onChangeText={setTitle}/>
     <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Text style={styles.text}>Ativar ferramentas de professor</Text><Switch value={enabled} onValueChange={setEnabled}/></View>
     <Button title="Salvar perfil" onPress={()=>void save()}/>
   </View>

   <View style={[styles.card,{gap:10}]}>
     <Text style={styles.label}>Entrar em uma turma</Text>
     <Field label="Código da turma" value={code} autoCapitalize="characters" onChangeText={setCode}/>
     <Button title="Entrar na turma" disabled={!code.trim()} onPress={()=>void join()}/>
   </View>

   {enabled?<View style={[styles.card,{gap:10}]}>
     <Text style={styles.label}>Criar turma</Text>
     <Field label="Nome" value={className} onChangeText={setClassName} placeholder="Banco de Dados · Turma A"/>
     <Field label="Descrição" value={description} onChangeText={setDescription} multiline placeholder="Objetivos, metodologia e desenvolvimento esperado"/>
     <Text style={styles.muted}>A matéria principal será {me?.subjects[0]?.name??"geral"}. Configurações avançadas ficam disponíveis na versão Web/Desktop.</Text>
     <Button title="Criar turma" disabled={!className.trim()} onPress={()=>void create()}/>
   </View>:null}

   <Text style={styles.label}>Suas turmas</Text>
   {[...(data?.owned.filter(c=>!c.archived)??[]),...(data?.joined??[])].map(item=><View style={styles.row} key={item.id}>
     <Text style={styles.label}>{item.name}</Text>
     <Text style={styles.muted}>{item.subjectName??item.teacherName??"Turma Enturma"}{item.joinCode?" · Código "+item.joinCode:""}</Text>
     <Button title="Abrir turma" onPress={()=>void api<Detail>("/teaching/classes/"+item.id).then(setSelected).catch(e=>setStatus(e.message))}/>
   </View>)}

   {selected?<View style={[styles.card,{gap:12}]}>
     <Text style={[styles.title,{fontSize:24,lineHeight:30}]}>{selected.name}</Text>
     <Text style={styles.text}>{selected.description||"Sem descrição."}</Text>
     {selected.joinCode?<Text style={styles.muted}>Código para estudantes: {selected.joinCode}</Text>:null}
     <Text style={styles.label}>Estudantes · {selected.members.length}</Text>
     {selected.members.map(member=><View key={member.id} style={styles.row}><Text style={styles.label}>{member.name}</Text><Text style={styles.muted}>@{member.username}</Text></View>)}
     <Text style={styles.label}>Atividades · {selected.assignments.length}</Text>
     {selected.assignments.map(item=><View key={item.id} style={styles.row}>
       <Text style={styles.label}>{item.title}</Text>
       <Text style={styles.text}>{item.description}</Text>
       <Text style={styles.muted}>{item.dueAt?new Date(item.dueAt).toLocaleString("pt-BR"):"Sem prazo"} · {item.points} pontos</Text>
       {!selected.owner?(item.submitted?<Text style={styles.muted}>{item.score!=null?"Nota "+item.score+"/"+item.points:"Entregue, aguardando correção"}{item.feedback?" · "+item.feedback:""}</Text>:<Button title="Entregar atividade" onPress={()=>void submit(item)}/>):null}
     </View>)}
     {selected.owner?<Button title="Apagar turma" onPress={()=>void removeClass()}/>:null}
     <Button title="Fechar turma" onPress={()=>setSelected(undefined)}/>
   </View>:null}
 </Screen>;
}
