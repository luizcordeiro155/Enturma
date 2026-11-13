import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SocialPost } from "@/lib/social";
import { StoryViewer, SocialStories } from "./social-stories";
const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api",()=>({api,post:vi.fn()}));
vi.mock("./social-dialog",()=>({SocialDialog:({title,children}:{title:string;children:ReactNode})=><div role="dialog" aria-label={title}>{children}</div>}));
vi.mock("./social-post",()=>({SocialAuthor:({user}:{user:{name:string}})=><span>{user.name}</span>,SocialShare:()=>null}));
vi.mock("../user-identity",()=>({Avatar:()=> <span aria-hidden="true"/>}));
vi.mock("../forum-links",()=>({ForumLinks:({text}:{text:string})=><span>{text}</span>,ConfirmedLink:()=>null}));
vi.mock("./story-decorations",()=>({StoryDecorations:()=>null}));
const make=(id:string,authorId:string,body:string,time:string):SocialPost=>({id,authorId,name:authorId,username:authorId,kind:"STORY",body,publishedAt:time,pinned:false,likes:0,reposts:0,comments:0,mine:[],media:[]});
const stories=[make("a1","a","Primeiro A","2026-11-11T10:00:00Z"),make("a2","a","Segundo A","2026-11-11T11:00:00Z"),make("b1","b","Primeiro B","2026-11-11T12:00:00Z")];
beforeEach(()=>{
  vi.stubGlobal("PointerEvent",MouseEvent);
  api.mockReset().mockImplementation(async(path:string,options?:RequestInit)=>{
    if(path.includes("/feed?"))return {items:stories,nextCursor:"",snapshot:"test"};
    if(options?.method)return undefined;
    return stories.find(story=>path===`/social/posts/${story.id}`);
  });
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
function stage(){const node=screen.getByTestId("story-stage");vi.spyOn(node,"getBoundingClientRect").mockReturnValue({x:0,y:0,left:0,top:0,right:390,bottom:700,width:390,height:700,toJSON:()=>({})});return node;}
function tap(x:number){const node=stage();fireEvent.pointerDown(node,{clientX:x,clientY:300,button:0});fireEvent.pointerUp(node,{clientX:x,clientY:300,button:0});}
it("navega por toque e mostra somente o progresso do autor atual",async()=>{
  render(<StoryViewer stories={stories} me="a" close={()=>{}} person={()=>{}}/>);
  await screen.findByText("Primeiro A");expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  tap(300);await screen.findByText("Segundo A");tap(50);await screen.findByText("Primeiro A");
  tap(300);await screen.findByText("Segundo A");tap(300);await screen.findByText("Primeiro B");
  expect(screen.getAllByRole("progressbar")).toHaveLength(1);
});
it("segurar pausa e deslizar para baixo fecha",async()=>{
  const close=vi.fn();render(<StoryViewer stories={stories} me="a" close={close} person={()=>{}}/>);
  await screen.findByText("Primeiro A");const node=stage();
  fireEvent.pointerDown(node,{clientX:200,clientY:250,button:0});
  expect(screen.getByRole("button",{name:"Reproduzir Story"})).toBeVisible();
  fireEvent.pointerUp(node,{clientX:202,clientY:370,button:0});expect(close).toHaveBeenCalledTimes(1);
});
it("a bandeja agrupa varios Stories da mesma pessoa",async()=>{
  render(<SocialStories me={{id:"me",name:"Eu",username:"eu"}} create={()=>{}} person={()=>{}} refreshKey={0}/>);
  await waitFor(()=>expect(screen.getAllByRole("button",{name:/Ver Stories de/})).toHaveLength(2));
});
it("nao oferece exclusao para Story de outra pessoa",async()=>{
  render(<StoryViewer stories={stories} me="other" close={()=>{}} person={()=>{}}/>);
  await screen.findByText("Primeiro A");expect(screen.queryByRole("button",{name:"Excluir meu Story"})).toBeNull();
});
