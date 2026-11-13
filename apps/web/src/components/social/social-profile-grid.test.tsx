import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { SocialPost } from "@/lib/social";
import { SocialProfileGrid } from "./social-profile-grid";
const state=vi.hoisted(()=>({items:[] as unknown[],change:vi.fn(),load:vi.fn()}));
vi.mock("./social-stream",()=>({useSocialStream:()=>({items:state.items,cursor:"",busy:false,error:"",load:state.load,change:state.change})}));
const make=(id:string,media:SocialPost["media"],body=""):SocialPost=>({id,authorId:"a",name:"Ana",username:"ana",kind:"POST",body,publishedAt:"2026-11-11T12:00:00Z",pinned:false,likes:0,comments:0,reposts:0,mine:[],media});
beforeEach(()=>{state.items=[make("p1",[{id:"m1",kind:"IMAGE"}]),make("p2",[],"Somente texto")];});
afterEach(cleanup);
it("mostra miniatura privada e texto sem reservar uma imagem vazia",()=>{
  render(<SocialProfileGrid query="author=a" active shape="square" open={()=>{}}/>);
  const cells=screen.getAllByRole("listitem");
  expect(within(cells[0]).getByRole("img")).toHaveAttribute("src",expect.stringContaining("/media/m1/content?thumbnail=true"));
  expect(within(cells[1]).queryByRole("img")).toBeNull();expect(within(cells[1]).getByText("Somente texto")).toBeVisible();
});
it("abre a celula no contexto da lista original",()=>{
  const open=vi.fn();render(<SocialProfileGrid query="author=a" active shape="square" open={open}/>);
  fireEvent.click(within(screen.getAllByRole("listitem")[1]).getByRole("button"));
  expect(open).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({id:"p2"})]),1);
});
it("nao renderiza publicacao ocultada",()=>{
  state.items=[make("p1",[]),{...make("p2",[]),mine:["HIDE"]}];
  render(<SocialProfileGrid query="author=a" active shape="portrait" open={()=>{}}/>);
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
});
