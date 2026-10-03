import { useCallback, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/api";
import { Screen, Button, ErrorMessage, useStyles } from "../src/ui";

type Group={
  id:string;name:string;description:string;visibility:string;
  subjectName?:string|null;members:number;joined?:boolean|null;
};

export default function Groups(){
  const styles=useStyles();
  const [groups,setGroups]=useState<Group[]>([]);
  const [error,setError]=useState("");
  const entrance=useRef(new Animated.Value(0)).current;

  const load=useCallback(()=>{
    let alive=true;
    api<Group[]>("/campus/groups").then(items=>{
      if(!alive)return;
      setGroups(items);setError("");entrance.setValue(0);
      Animated.spring(entrance,{toValue:1,useNativeDriver:true,tension:55,friction:8}).start();
    }).catch(e=>alive&&setError(e.message));
    return()=>{alive=false};
  },[entrance]);
  useFocusEffect(load);

  async function join(id:string){
    try{
      await api("/campus/groups/"+id+"/join",{method:"POST",body:"{}"});
      load();
    }catch(e){setError((e as Error).message);}
  }

  return <Screen title="Grupos de estudo">
    <ErrorMessage message={error}/>
    <Animated.View style={{gap:12,opacity:entrance,transform:[{translateY:entrance.interpolate({inputRange:[0,1],outputRange:[16,0]})}]}}>
      <View style={[styles.card,{gap:8}]}>
        <Ionicons name="people-circle-outline" size={34} color={styles.text.color}/>
        <Text style={styles.label}>Comunidades permanentes</Text>
        <Text style={styles.muted}>Continue estudando com a mesma turma além de uma única sala.</Text>
      </View>
      {groups.map(g=><View style={[styles.card,{gap:9}]} key={g.id}>
        <Text style={styles.label}>{g.name}</Text>
        <Text style={styles.muted}>{g.subjectName??"Comunidade acadêmica"} · {g.members} membros</Text>
        <Text style={styles.text}>{g.description||"Grupo de estudo permanente no Enturma."}</Text>
        {g.joined?<Text style={styles.muted}>✓ Você participa</Text>:g.visibility!=="PRIVATE"?<Button title="Entrar no grupo" onPress={()=>void join(g.id)}/>:null}
      </View>)}
      {!groups.length?<View style={styles.card}><Text style={styles.muted}>Nenhum grupo disponível ainda. Crie grupos pela versão Web.</Text></View>:null}
    </Animated.View>
  </Screen>;
}
