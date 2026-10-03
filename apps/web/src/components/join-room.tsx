"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users } from "lucide-react";
import { api, post } from "@/lib/api";
import { Feedback } from "./feedback";
import { Shell } from "./shell";

type Room={id:string;title:string;status:string;endsAt:string;subjectName:string};
export function JoinRoom({code}:{code:string}){
 const [room,setRoom]=useState<Room>();const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
 useEffect(()=>{void api<Room>("/study-rooms/join-code/"+encodeURIComponent(code),{cache:"no-store"}).then(setRoom).catch(e=>setError(e.message))},[code]);
 async function join(){setBusy(true);try{const r=await post<Room>("/study-rooms/join-code/"+encodeURIComponent(code)+"/join");router.replace("/rooms/"+r.id)}catch(e){setError((e as Error).message);setBusy(false)}}
 return <Shell><div className="join-room-page"><Feedback error={error}/>{room?<section><BookOpen size={40}/><small>Código {code}</small><h1>{room.title}</h1><p>{room.subjectName}</p><div><Users size={17}/><span>Sala de estudo do Enturma</span></div><button disabled={busy||room.status==="ENDED"} onClick={()=>void join()}>{busy?"Entrando…":"Entrar na sala"}</button></section>:!error?<p>Localizando sala…</p>:null}</div></Shell>;
}
