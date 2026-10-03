import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Profile } from "@enturma/contracts";
import { api } from "../src/api";
import { Screen, Button, ErrorMessage, useStyles } from "../src/ui";

type Task = { id:string; title:string; kind:string; dueAt:string; subjectName?:string; completedAt?:string|null };
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
 const started=useRef<number|null>(null);
 const entrance=useRef(new Animated.Value(0)).current;

 const load=useCallback(()=>{
   let alive=true;
   Promise.all([api<Profile>("/users/me"),api<Today>("/campus/today")])
    .then(([p,d])=>{
      if(!alive)return;
      setProfile(p);setData(d);setError("");
      entrance.setValue(0);
      Animated.spring(entrance,{toValue:1,useNativeDriver:true,tension:55,friction:8}).start();
    })
    .catch(e=>{if(alive)setError(e.message)});
   return()=>{alive=false};
 },[entrance]);
 useFocusEffect(load);

 useEffect(()=>{
   if(!focusId||!started.current)return;
   const id=setInterval(()=>setSeconds(Math.floor((Date.now()-started.current!)/1000)),1000);
   return()=>clearInterval(id);
 },[focusId]);

 async function startFocus(){
   try{
     const x=await api<{id:string}>("/campus/focus",{method:"POST",body:JSON.stringify({label:"Modo Foco mobile",minutes:50})});
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

      <View style={[styles.card,{gap:12,alignItems:"center"}]}>
       <Ionicons name="timer-outline" size={34} color={styles.text.color}/>
       <Text style={[styles.title,{fontSize:focusId?46:23,lineHeight:52}]}>{focusId?clock:"Modo Foco"}</Text>
       <Text style={styles.muted}>{focusId?"Continue. O Enturma está registrando esta sessão.":"Sessão de 50 minutos para estudar sem distrações."}</Text>
       <Button title={focusId?"Concluir sessão":"Iniciar 50 min"} onPress={()=>void(focusId?finishFocus():startFocus())}/>
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