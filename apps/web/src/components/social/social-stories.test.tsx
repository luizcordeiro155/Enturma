import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import type { SocialPost } from "@/lib/social";
import { StoryViewer, SocialStories } from "./social-stories";
const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api",()=>({api,post:vi.fn()}));
vi.mock("./social-dialog",()=>({SocialDialog:({title,children}:{title:string;children:ReactNode})=><div role="dialog" aria-label={title}>{children}</div>}));
vi.mock("./social-post",()=>({SocialAuthor:({user}:{user:{name:string}})=><span>{user.name}</span>,SocialShare:()=>null}));
vi.mock("../user-identity",()=>({Avatar:()=> <span aria-hidden="true"/>}));
vi.mock("../forum-links",()=>({ForumLinks:({text}:{text:string})=><span>{text}</span>,ConfirmedLink:()=>null}));
vi.mock("./story-decorations",()=>({StoryDecorations:()=>null}));
vi.mock("../navigation-link",()=>({NavigationLink:(props:ComponentProps<"a">)=><a {...props}/>}));
const make=(id:string,authorId:string,body:string,time:string):SocialPost=>({id,authorId,name:authorId,username:authorId,kind:"STORY",body,publishedAt:time,pinned:false,likes:0,reposts:0,comments:0,mine:[],media:[]});
let feed:SocialPost[]=[];
const stories=[make("a1","a","Primeiro A","2026-11-11T10:00:00Z"),make("a2","a","Segundo A","2026-11-11T11:00:00Z"),make("b1","b","Primeiro B","2026-11-11T12:00:00Z")];
beforeEach(()=>{
  feed=stories;
  vi.stubGlobal("PointerEvent",MouseEvent);
  api.mockReset().mockImplementation(async(path:string,options?:RequestInit)=>{
    if(path.includes("/feed?"))return {items:feed,nextCursor:"",snapshot:"test"};
    if(options?.method)return undefined;
    return feed.find(story=>path===`/social/posts/${story.id}`);
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

const me={id:"me",name:"Eu",username:"eu"};
const mine=make("m1","me","Meu Story","2026-11-11T09:00:00Z");
it("com Stories proprios, tocar no Seu Story abre os seus Stories sem criar outro circulo",async()=>{
  feed=[mine,...stories];const create=vi.fn();
  render(<SocialStories me={me} create={create} person={()=>{}} refreshKey={0}/>);
  const own=await screen.findByRole("button",{name:"Ver seus Stories"});
  expect(own).toHaveTextContent("Seu Story");
  await waitFor(()=>expect(screen.getAllByRole("button",{name:/Ver Stories de/})).toHaveLength(2));
  expect(screen.getAllByRole("button",{name:/seus Stories|Seu Story/})).toHaveLength(1);
  fireEvent.click(own);
  expect(await screen.findByText("Meu Story")).toBeInTheDocument();
  expect(create).not.toHaveBeenCalled();
});
it("sem Stories proprios, tocar no Seu Story cria um",async()=>{
  const create=vi.fn();
  render(<SocialStories me={me} create={create} person={()=>{}} refreshKey={0}/>);
  await waitFor(()=>expect(screen.getAllByRole("button",{name:/Ver Stories de/})).toHaveLength(2));
  fireEvent.click(screen.getByRole("button",{name:"Criar seu Story"}));
  expect(create).toHaveBeenCalledTimes(1);
});
it("segurar o Seu Story mostra Novo Story e Editar perfil, sem abrir os Stories",async()=>{
  feed=[mine,...stories];const create=vi.fn();
  render(<SocialStories me={me} create={create} person={()=>{}} refreshKey={0}/>);
  const own=await screen.findByRole("button",{name:"Ver seus Stories"});
  fireEvent.pointerDown(own,{pointerType:"touch",clientX:10,clientY:10,button:0});
  await new Promise(resolve=>setTimeout(resolve,600));
  fireEvent.pointerUp(own,{pointerType:"touch",clientX:10,clientY:10,button:0});
  fireEvent.click(own);
  const menu=await screen.findByRole("menu",{name:"Opções do seu Story"});
  expect(screen.queryByText("Meu Story")).toBeNull();
  expect(within(menu).getByRole("menuitem",{name:"Editar perfil"})).toHaveAttribute("href","/profile");
  fireEvent.click(within(menu).getByRole("menuitem",{name:"Novo Story"}));
  expect(create).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("menu")).toBeNull();
});
it("no computador, o botao direito abre o mesmo menu",async()=>{
  render(<SocialStories me={me} create={()=>{}} person={()=>{}} refreshKey={0}/>);
  const own=await screen.findByRole("button",{name:"Criar seu Story"});
  fireEvent.contextMenu(own);
  expect(await screen.findByRole("menu",{name:"Opções do seu Story"})).toBeInTheDocument();
  fireEvent.keyDown(document,{key:"Escape"});
  await waitFor(()=>expect(screen.queryByRole("menu")).toBeNull());
});
