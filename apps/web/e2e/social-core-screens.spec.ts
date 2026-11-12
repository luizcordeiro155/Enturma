import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
const backend=process.env.E2E_API_URL??"http://localhost:8080";
test("Social 3: Stories por autor, perfil em grade e comentarios no painel",async({page,request},info)=>{
  test.setTimeout(90000);
  const tag=randomUUID().slice(0,8);
  const registered=await request.post(`${backend}/api/v1/auth/register`,{data:{name:"Autora Social 3",username:`core_${tag}`,email:`core-${tag}@example.test`,password:"social-test-123",device:"Core screens E2E"}});
  expect(registered.ok()).toBe(true);
  const user=await registered.json() as {userId:string;accessToken:string;refreshToken:string};
  const headers={Authorization:`Bearer ${user.accessToken}`};
  async function publish(body:string,kind="POST"){
    const id=randomUUID();const draft=await request.put(`${backend}/api/v1/social/drafts`,{headers,data:{id,kind,body,visibility:"PUBLIC",version:0,mediaIds:[]}});expect(draft.ok()).toBe(true);
    const response=await request.post(`${backend}/api/v1/social/posts/${id}/publish`,{headers,data:{version:(await draft.json()).version}});expect(response.ok()).toBe(true);return id;
  }
  for(let i=0;i<3;i++)await publish(`Projeto de teste ${i+1}: aprendendo em comunidade.`);
  await publish("Primeiro Story do teste","STORY");
  const second=await publish("Segundo Story do teste","STORY");
  await request.put(`${backend}/api/v1/users/me/experience`,{headers,data:{theme:"DARK",fontScale:1,highContrast:false,reducedMotion:true,enhancedFocus:true}});
  await authenticate(page.context(),user);await page.setViewportSize({width:390,height:844});await page.goto("/social");
  await expect(page.getByRole("heading",{name:"Enturma Social.",level:1})).toBeVisible();
  const opening=page.getByRole("dialog",{name:"Bem-vindo ao Enturma Social"});
  await expect(opening).not.toBeVisible({timeout:10000});
  await page.getByRole("button",{name:"Ver seus Stories",exact:true}).click();
  const story=page.getByRole("dialog",{name:"Stories da turma"});
  await expect(story.getByText("Primeiro Story do teste",{exact:true})).toBeVisible();
  await expect(story.getByRole("progressbar")).toHaveCount(2);
  await story.getByRole("button",{name:"Pausar Story",exact:true}).click();
  const storyBox=(await story.boundingBox())!;expect(storyBox.width).toBeGreaterThanOrEqual(389);expect(storyBox.height).toBeGreaterThan(800);
  await page.screenshot({path:info.outputPath("social3-stories-mobile.png")});
  await story.getByRole("button",{name:"Próximo Story",exact:true}).click();
  await expect(story.getByText("Segundo Story do teste",{exact:true})).toBeVisible();
  await story.getByRole("button",{name:"Excluir meu Story"}).click();
  const confirmation=page.getByRole("dialog",{name:"Excluir este Story?"});
  await confirmation.getByRole("button",{name:"Excluir Story",exact:true}).click();await expect(story).not.toBeVisible();
  expect((await request.get(`${backend}/api/v1/social/posts/${second}`,{headers})).status()).toBe(404);
  const navigation=page.getByRole("navigation",{name:"Ambientes do Social"});
  await navigation.getByRole("button",{name:"Meu perfil social"}).click();
  const profile=page.getByRole("dialog",{name:"Perfil social"});
  const grid=profile.locator(".social-profile-grid:visible");await expect(grid.getByRole("listitem")).toHaveCount(3);
  for(const width of [390,1440]){
    await page.setViewportSize({width,height:900});
    for(const theme of ["light","dark"]){
      await page.evaluate(value=>{document.documentElement.dataset.theme=value;delete document.documentElement.dataset.palette;},theme);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      await page.screenshot({path:info.outputPath(`social3-profile-${width}-${theme}.png`)});
    }
  }
  await grid.getByRole("button").first().click();
  const viewer=page.getByRole("dialog",{name:"Publicações",exact:true});await expect(viewer).toBeVisible();
  await viewer.getByRole("button",{name:/Comentários/}).first().click();
  const comments=page.getByRole("dialog",{name:"Conversa da publicação"});await expect(comments).toHaveClass(/social-dialog-panel/);
  await comments.getByRole("textbox",{name:"Seu comentário"}).fill("Comentario real da verificacao");
  await comments.getByRole("button",{name:"Enviar comentário"}).click();await expect(comments.getByText("Comentario real da verificacao",{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath("social3-comments-desktop.png")});
});
