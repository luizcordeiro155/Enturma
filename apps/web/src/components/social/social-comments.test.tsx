import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SocialPost } from "@/lib/social";
import { SocialComments } from "./social-comments";
const api=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/api",()=>({api,post:vi.fn()}));
vi.mock("./social-dialog",()=>({SocialDialog:({title,children,variant}:{title:string;children:ReactNode;variant:string})=><div role="dialog" aria-label={title} data-variant={variant}>{children}</div>}));
vi.mock("./social-post",()=>({SocialAuthor:({user}:{user:{name:string}})=><span>{user.name}</span>}));
vi.mock("./social-text",()=>({SocialText:({text}:{text:string})=><span>{text}</span>}));
const item:SocialPost={id:"post",authorId:"author",name:"Autora",username:"autora",kind:"POST",body:"Publicacao",publishedAt:"2026-11-11T12:00:00Z",likes:0,comments:0,reposts:0,pinned:false,mine:[],media:[]};
beforeEach(()=>{api.mockReset().mockImplementation(async(path:string)=>path.includes("/comments?")?[]:item);});
afterEach(cleanup);
it("abre o painel e mantem o campo de comentario acessivel",async()=>{
  render(<SocialComments item={item} me="me" person={()=>{}} changed={()=>{}} close={()=>{}}/>);
  expect(screen.getByRole("dialog")).toHaveAttribute("data-variant","panel");
  expect(screen.getByRole("textbox",{name:"Seu coment\u00e1rio"})).toBeVisible();
  expect(screen.getByRole("button",{name:"Enviar coment\u00e1rio"})).toBeDisabled();
  await screen.findByText("Comece a conversa com uma pergunta ou uma ideia.");
});
it("conserva o comentario quando o servidor rejeita o envio",async()=>{
  api.mockImplementation(async(path:string,options?:RequestInit)=>{if(options?.method==="POST")throw new Error("Sem conexao");return path.includes("/comments?")?[]:item;});
  render(<SocialComments item={item} me="me" person={()=>{}} changed={()=>{}} close={()=>{}}/>);
  await screen.findByText("Comece a conversa com uma pergunta ou uma ideia.");
  fireEvent.change(screen.getByRole("textbox"),{target:{value:"Meu comentario"}});fireEvent.click(screen.getByRole("button",{name:"Enviar coment\u00e1rio"}));
  await waitFor(()=>expect(screen.getByRole("alert")).toHaveTextContent("Sem conexao"));expect(screen.getByRole("textbox")).toHaveValue("Meu comentario");
});
