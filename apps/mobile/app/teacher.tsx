import { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { api } from "../src/api";
import { Screen, Button, ErrorMessage, Field, useStyles } from "../src/ui";

type Dashboard={profile:{institution:string;title:string;enabled:boolean}|null;owned:{id:string;name:string;joinCode:string}[];joined:{id:string;name:string;teacherName:string}[]};
export default function Teacher(){
 const styles=useStyles();const [data,setData]=useState<Dashboard>();const [institution,setInstitution]=useState("");const [title,setTitle]=useState("Professor(a)");const [enabled,setEnabled]=useState(false);const [code,setCode]=useState("");const [status,setStatus]=useState("");
 async function load(){const d=await api<Dashboard>("/teaching");setData(d);setInstitution(d.profile?.institution??"");setTitle(d.profile?.title??"Professor(a)");setEnabled(d.profile?.enabled??false)}
 useEffect(()=>{void load().catch(e=>setStatus(e.message))},[]);
 async function save(){try{await api("/teaching/profile",{method:"PUT",body:JSON.stringify({institution,title,enabled})});setStatus("Modo professor atualizado.");await load()}catch(e){setStatus((e as Error).message)}}
 async function join(){try{await api("/teaching/classes/join",{method:"POST",body:JSON.stringify({code})});setCode("");setStatus("Você entrou na turma.");await load()}catch(e){setStatus((e as Error).message)}}
 return <Screen title="Turmas / Professor"><ErrorMessage message={status}/><View style={[styles.card,{gap:10}]}><Text style={styles.label}>Modo professor</Text><Field label="Instituição" value={institution} onChangeText={setInstitution}/><Field label="Título" value={title} onChangeText={setTitle}/><View style={{flexDirection:"row",justifyContent:"space-between"}}><Text style={styles.text}>Ativar</Text><Switch value={enabled} onValueChange={setEnabled}/></View><Button title="Salvar" onPress={()=>void save()}/></View><View style={[styles.card,{gap:10}]}><Text style={styles.label}>Entrar pelo código</Text><Field label="Código da turma" value={code} autoCapitalize="characters" onChangeText={setCode}/><Button title="Entrar na turma" onPress={()=>void join()}/></View><Text style={styles.label}>Turmas que você criou</Text>{data?.owned.map(c=><View style={styles.card} key={c.id}><Text style={styles.label}>{c.name}</Text><Text style={styles.muted}>Código {c.joinCode}</Text></View>)}<Text style={styles.label}>Turmas que você participa</Text>{data?.joined.map(c=><View style={styles.card} key={c.id}><Text style={styles.label}>{c.name}</Text><Text style={styles.muted}>{c.teacherName}</Text></View>)}</Screen>;
}
