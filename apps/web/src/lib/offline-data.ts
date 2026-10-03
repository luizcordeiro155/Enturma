"use client";

const DB_NAME="enturma-offline";
const STORE="records";
const VERSION=1;

function db():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,VERSION);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

async function write<T>(key:string,value:T){
  if(typeof indexedDB==="undefined")return;
  const database=await db();
  await new Promise<void>((resolve,reject)=>{
    const tx=database.transaction(STORE,"readwrite");
    tx.objectStore(STORE).put({value,savedAt:Date.now()},key);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
  database.close();
}

async function read<T>(key:string):Promise<T|undefined>{
  if(typeof indexedDB==="undefined")return undefined;
  const database=await db();
  const value=await new Promise<{value:T}|undefined>((resolve,reject)=>{
    const tx=database.transaction(STORE,"readonly");
    const request=tx.objectStore(STORE).get(key);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  database.close();
  return value?.value;
}

export async function resilientRead<T>(key:string,loader:()=>Promise<T>):Promise<{value:T;offline:boolean}>{
  try{
    const value=await loader();
    void write(key,value).catch(()=>{});
    return {value,offline:false};
  }catch(error){
    const cached=await read<T>(key).catch(()=>undefined);
    if(cached!==undefined)return {value:cached,offline:true};
    throw error;
  }
}

export function refreshWhenOnline(callback:()=>void){
  const handler=()=>callback();
  window.addEventListener("online",handler);
  return()=>window.removeEventListener("online",handler);
}
