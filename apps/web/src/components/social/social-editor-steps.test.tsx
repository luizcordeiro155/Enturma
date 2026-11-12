import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { SocialEditor } from "./social-editor";
import { PAGER_IGNORE } from "./social-pager";
const api=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/api",()=>({api,post:vi.fn()}));
vi.mock("@/lib/social-draft",async original=>({...await original<typeof import("@/lib/social-draft")>(),localSocialDraft:vi.fn().mockResolvedValue(null)}));
vi.mock("../navigation-link",()=>({NavigationLink:(props:ComponentProps<"a">)=><a {...props}/> }));
function editor(props:Partial<ComponentProps<typeof SocialEditor>>={}){return render(<SocialEditor user="me" mediaEnabled initialKind="POST" published={()=>{}} {...props}/>);}
beforeEach(()=>{api.mockReset().mockImplementation((path:string,options?:RequestInit)=>Promise.resolve(options?.method?{version:1}:path==="/portfolio/me"?{username:"eu",publicProfile:false,projects:[]}:[]));});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it("a pagina Criar nao bloqueia o arrasto de volta ao Feed",async()=>{
  editor();const region=await screen.findByRole("region",{name:"Central de criação"});expect(region.closest(PAGER_IGNORE)).toBeNull();
  expect(screen.getByRole("textbox",{name:/compartilhar/i}).closest(PAGER_IGNORE)).not.toBeNull();
});
it("avanca um texto aos detalhes sem exigir uma midia e volta sem perder o rascunho",async()=>{
  editor();const field=await screen.findByRole("textbox",{name:/compartilhar/i});
  fireEvent.change(field,{target:{value:"Minha descoberta"}});fireEvent.click(screen.getByRole("button",{name:"Avançar"}));
  expect(screen.getByRole("heading",{name:"Pronto para compartilhar?"})).toBeVisible();expect(screen.getByLabelText("Quem pode ver")).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:/^Voltar$/}));expect(field).toHaveValue("Minha descoberta");
});
it("publicacao so termina depois da confirmacao da API",async()=>{
  const published=vi.fn(),progress=vi.fn();editor({published,onProgress:progress});
  fireEvent.change(await screen.findByRole("textbox",{name:/compartilhar/i}),{target:{value:"Texto real"}});
  fireEvent.click(screen.getByRole("button",{name:/^Publicar Post$/}));
  await waitFor(()=>expect(published).toHaveBeenCalledTimes(1));expect(screen.getByRole("status")).toHaveTextContent("Publicado no Enturma.");
  expect(screen.getByRole("textbox",{name:/compartilhar/i})).toHaveValue("");
  await waitFor(()=>expect(progress).toHaveBeenLastCalledWith(expect.objectContaining({state:"done",percent:100})));
});
it("uma falha no envio conserva o texto e nao anuncia publicacao",async()=>{
  const published=vi.fn();api.mockImplementation((path:string,options?:RequestInit)=>{
    if(path.endsWith("/publish"))return Promise.reject(new Error("Servidor indisponivel"));
    return Promise.resolve(options?.method?{version:1}:path==="/portfolio/me"?{username:"eu",publicProfile:false,projects:[]}:[]);
  });editor({published});fireEvent.change(await screen.findByRole("textbox",{name:/compartilhar/i}),{target:{value:"Nao perder meu texto"}});
  fireEvent.click(screen.getByRole("button",{name:/^Publicar Post$/}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Servidor indisponivel");
  expect(screen.getByRole("textbox",{name:/compartilhar/i})).toHaveValue("Nao perder meu texto");expect(published).not.toHaveBeenCalled();
});
