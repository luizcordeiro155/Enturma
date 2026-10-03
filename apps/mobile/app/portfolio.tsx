import { useEffect, useState } from "react";
import { Share, Switch, Text, View } from "react-native";
import { api } from "../src/api";
import { Screen, Button, ErrorMessage, Field, useStyles } from "../src/ui";

type Portfolio={username:string;publicProfile:boolean;headline:string;summary:string;skills:string[]};
export default function Portfolio(){
 const styles=useStyles();const [data,setData]=useState<Portfolio>();const [headline,setHeadline]=useState("");const [summary,setSummary]=useState("");const [skills,setSkills]=useState("");const [pub,setPub]=useState(false);const [status,setStatus]=useState("");
 useEffect(()=>{api<Portfolio>("/portfolio/me").then(v=>{setData(v);setHeadline(v.headline);setSummary(v.summary);setSkills((v.skills??[]).join(", "));setPub(v.publicProfile)}).catch(e=>setStatus(e.message))},[]);
 async function save(){try{await api("/portfolio/me",{method:"PUT",body:JSON.stringify({publicProfile:pub,headline,summary,skills:skills.split(",").map(v=>v.trim()).filter(Boolean),projects:[]})});setStatus("Portfólio salvo.")}catch(e){setStatus((e as Error).message)}}
 async function share(){if(!data)return;await Share.share({message:"Meu portfólio no Enturma: https://enturma-flax.vercel.app/p/"+data.username})}
 return <Screen title="Portfólio acadêmico"><ErrorMessage message={status}/><View style={[styles.card,{gap:10}]}><View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Text style={styles.label}>Portfólio público</Text><Switch value={pub} onValueChange={setPub}/></View><Field label="Título profissional" value={headline} onChangeText={setHeadline}/><Field label="Apresentação" value={summary} multiline onChangeText={setSummary}/><Field label="Competências separadas por vírgula" value={skills} onChangeText={setSkills}/><Button title="Salvar portfólio" onPress={()=>void save()}/>{pub?<Button title="Compartilhar portfólio" onPress={()=>void share()}/>:null}</View></Screen>;
}
