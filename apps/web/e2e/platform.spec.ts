import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";
const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
const password = "E2E-test-password-123";
test("registro, catálogo, onboarding, sala reutilizada, chat, encerramento e carona", async ({
  page,
  browser,
  request,
}) => {
  const tag = randomUUID().slice(0, 8);
  const email = `e2e-${tag}@example.test`;
  await page.goto("/register");
  await page.getByLabel("Seu nome").fill("Estudante E2E");
  await page.getByLabel("Nome de usuário").fill(`e2e_${tag}`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirmar senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await expect(
    page.getByRole("heading", { name: "Universidade", exact: true }),
  ).toBeVisible();
  await page.goto("/home");
  await expect(
    page.getByRole("heading", { name: "Seu próximo estudo" }),
  ).toBeVisible();
  await page.screenshot({
    path: "../../.local/dashboard-render.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("link", { name: "Completar perfil" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../.local/mobile-render.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1487, height: 1058 });
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  try {
    const current = await db.query("SELECT current_database() name");
    if (!String(current.rows[0].name).includes("e2e"))
      throw Error("E2E exige um banco separado com e2e no nome.");
    await db.query("UPDATE app_user SET role='ADMIN' WHERE email=$1", [email]);
  } finally {
    await db.end();
  }
  const auth = await request.post(`${backend}/api/v1/auth/login`, {
    data: { email, password, device: "E2E setup" },
  });
  expect(auth.ok()).toBe(true);
  const credentials = await auth.json();
  let parentId: string | null = null;
  const ids: Record<string, string> = {};
  const entries = [
    "INSTITUTION",
    "CAMPUS",
    "COURSE",
    "CURRICULUM",
    "PERIOD",
    "SUBJECT",
  ].map((kind) => {
    const id = randomUUID();
    ids[kind] = id;
    const entry = {
      id,
      kind,
      parentId,
      name: `TESTE E2E ${kind} ${tag}`,
      code: null,
      curriculumVersion: kind === "CURRICULUM" ? "fixture-v1" : null,
      periodNumber: kind === "PERIOD" ? 1 : null,
      sourceUrl: "https://example.test/e2e",
      sourceName: "Fixture sintética exclusiva de testes",
      verifiedAt: new Date(Date.now() - 60000).toISOString(),
      validFrom: "2020-01-01",
      validUntil: null,
      status: "VERIFIED",
    };
    parentId = id;
    return entry;
  });
  const imported = await request.post(
    `${backend}/api/v1/admin/academics/import`,
    {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
      data: { entries },
    },
  );
  expect(imported.ok()).toBe(true);
  await page.goto("/onboarding");
  for (const kind of [
    "INSTITUTION",
    "CAMPUS",
    "COURSE",
    "CURRICULUM",
    "PERIOD",
  ]) {
    await page.getByLabel("Buscar no catálogo").fill(tag);
    await page
      .getByRole("button", { name: new RegExp(`TESTE E2E ${kind} ${tag}`) })
      .click();
  }
  await page.getByLabel(`TESTE E2E SUBJECT ${tag}`).check();
  await page.getByRole("button", { name: "Concluir perfil" }).click();
  await expect(page).toHaveURL(/home/);
  await page.getByRole("link", { name: "Estudar agora" }).first().click();
  await page
    .getByRole("combobox", { name: "Matéria", exact: true })
    .selectOption(ids.SUBJECT);
  await page.getByLabel("Objetivo da sessão").fill("Revisão E2E");
  await page.getByRole("button", { name: "Estudar agora" }).click();
  await expect(page).toHaveURL(/rooms\/[0-9a-f-]+/);
  const roomUrl = page.url();
  const roomId = new URL(roomUrl).pathname.split("/").pop()!;
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Mensagem E2E em tempo real");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(
    page.getByText("Mensagem E2E em tempo real", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".image-picker input")).toBeEnabled();
  await page.locator(".image-picker input").setInputFiles({
    name: "teste.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jA1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.locator(".chat-image")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".chat-image")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../.local/room-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1487, height: 1058 });
  const second = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Colega E2E",
      username: `mate_${tag}`,
      email: `mate-${tag}@example.test`,
      password,
      device: "E2E",
    },
  });
  expect(second.ok()).toBe(true);
  const mate = await second.json();
  const mh = { Authorization: `Bearer ${mate.accessToken}` };
  await request.put(`${backend}/api/v1/users/me/enrollment`, {
    headers: mh,
    data: {
      periodId: ids.PERIOD,
      subjectIds: [ids.SUBJECT],
      shift: "EVENING",
      preferences: "",
    },
  });
  const reused = await request.post(`${backend}/api/v1/study-rooms`, {
    headers: mh,
    data: {
      subjectId: ids.SUBJECT,
      topicId: null,
      title: "Outra revisão",
      minutes: 50,
      maxParticipants: 8,
    },
  });
  expect((await reused.json()).id).toBe(roomId);
  const peer = await browser.newContext();
  const peerPage = await peer.newPage();
  await peerPage.goto("http://localhost:3000/login");
  await peerPage.getByLabel("E-mail").fill(`mate-${tag}@example.test`);
  await peerPage.getByLabel("Senha", { exact: true }).fill(password);
  await peerPage.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(peerPage).toHaveURL(/home/);
  await peerPage.goto(roomUrl);
  await expect(
    peerPage.getByText("Mensagem E2E em tempo real", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Atualização pelo WebSocket");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(
    peerPage.getByText("Atualização pelo WebSocket", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    peerPage.getByRole("button", { name: "Nova mensagem · ir para ela" }),
  ).toBeVisible();
  await expect(peerPage.locator(".notification-count")).toHaveCount(0);
  await peerPage
    .getByRole("button", { name: "Nova mensagem · ir para ela" })
    .click();
  await expect(peerPage.locator(".notification-target")).toContainText(
    "Atualização pelo WebSocket",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Encerrar sessão" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Sessão encerrada" }),
  ).toBeVisible();
  await expect(
    peerPage.getByRole("button", { name: "Enviar", exact: true }),
  ).toHaveCount(0);
  const riderContext = peer;
  const riderPage = peerPage;
  await riderPage.goto("/caronas");
  await expect(
    riderPage.getByText("Caronas atualizadas em tempo real"),
  ).toBeVisible();
  await page.goto("/caronas/create");
  await page
    .getByRole("combobox", { name: "Universidade", exact: true })
    .selectOption(ids.INSTITUTION);
  await page
    .getByRole("combobox", { name: "Campus", exact: true })
    .selectOption(ids.CAMPUS);
  await page
    .getByLabel("Bairro ou região de origem")
    .fill(`Região de teste ${tag}`);
  const departure = new Date(Date.now() + 86400000);
  const local = new Date(
    departure.getTime() - departure.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  await page.getByLabel("Saída", { exact: true }).fill(local);
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page).toHaveURL(/caronas\/matches/);
  await expect(
    page.getByRole("region", { name: "Buscas de carona em andamento" }),
  ).toContainText("Procurando passageiro");
  const newRide = riderPage
    .locator("article")
    .filter({ hasText: `Região de teste ${tag}` })
    .filter({
      has: riderPage.getByRole("button", { name: "Tenho interesse" }),
    });
  await expect(newRide).toBeVisible({ timeout: 5000 });
  await newRide.getByRole("button", { name: "Tenho interesse" }).click();
  await expect(riderPage).toHaveURL(/caronas\/matches/);
  await expect(riderPage.getByText(/Aguardando aceite/).first()).toBeVisible();
  await riderPage.getByRole("link", { name: "Fórum", exact: true }).click();
  await expect(
    riderPage.getByRole("complementary", { name: "Sua busca de carona" }),
  ).toContainText("Aguardando aceite");
  await riderPage
    .getByRole("button", { name: "Minimizar busca de carona" })
    .click();
  await expect(
    riderPage.getByRole("button", { name: "Expandir busca de carona" }),
  ).toBeVisible();
  await riderPage.setViewportSize({ width: 390, height: 844 });
  await riderPage.screenshot({
    path: "../../.local/ride-search-mobile.png",
    fullPage: true,
  });
  expect(
    await riderPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Aceitar", exact: true }),
  ).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Aceitar", exact: true }).click();
  const matchDialog = page.getByRole("dialog", {
    name: "Deu match na carona!",
  });
  await expect(matchDialog).toBeVisible();
  const riderDialog = riderPage.getByRole("dialog", {
    name: "Deu match na carona!",
  });
  await expect(riderDialog).toBeVisible({ timeout: 10000 });
  await riderDialog.getByRole("button", { name: "Combinar encontro" }).click();

  await expect(matchDialog).toContainText("Colega E2E");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      matchDialog.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .every((a) => a.playState !== "running"),
      ),
    )
    .toBe(true);
  const placement = await matchDialog.boundingBox();
  expect(placement!.x).toBeGreaterThan(5);
  expect(placement!.y).toBeGreaterThan(5);
  const avatar = await matchDialog
    .locator(".identity-avatar")
    .first()
    .boundingBox();
  expect(Math.abs(avatar!.width - avatar!.height)).toBeLessThan(2);
  await page.screenshot({ path: "../../.local/ride-match-mobile.png" });
  await matchDialog.getByRole("button", { name: "Combinar encontro" }).click();
  await expect(matchDialog).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Conversa privada" }),
  ).toBeVisible();
  await expect(matchDialog).not.toBeVisible();
  await page.getByRole("button", { name: "Conversa privada" }).click();
  await page.getByLabel("Ponto privado").fill("Ponto privado E2E");
  await page.getByRole("button", { name: "Salvar ponto" }).click();
  await expect(
    page.getByText("Ponto de encontro: Ponto privado E2E"),
  ).toBeVisible();
  await page.getByLabel("Mensagem", { exact: true }).fill("Conversa da carona");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(
    page.getByText("Conversa da carona", { exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Encerrar conversa", exact: true })
    .click();
  await expect(page.getByLabel("Mensagem", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ver histórico" }),
  ).toBeVisible();
  await expect(page.getByText(/Exclusão automática:/)).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Excluir conversa", exact: true })
    .click();
  await expect(
    page.getByText("Conversa da carona", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Conversa excluída. A carona continua combinada."),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Cancelar match", exact: true })
    .click();
  await expect(
    page.getByText(/Nenhum pedido de carona por aqui/),
  ).toBeVisible();
  await page.goto("/caronas/create");
  await page.getByLabel("O que você precisa?").selectOption("REQUEST");
  await page
    .getByRole("combobox", { name: "Universidade", exact: true })
    .selectOption(ids.INSTITUTION);
  await page
    .getByRole("combobox", { name: "Campus", exact: true })
    .selectOption(ids.CAMPUS);
  await page
    .getByLabel("Bairro ou região de origem")
    .fill(`Busca de teste ${tag}`);
  await page.getByLabel("Saída", { exact: true }).fill(local);
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page).toHaveURL(/caronas\/matches/);
  const waiting = page.getByRole("region", {
    name: "Buscas de carona em andamento",
  });
  await expect(waiting).toContainText("Procurando carona");
  await page.evaluate(() => {
    document.documentElement.dataset.reducedMotion = "true";
    window.dispatchEvent(new Event("enturma-motion"));
  });
  expect(
    await waiting.evaluate(
      (el) =>
        el
          .getAnimations({ subtree: true })
          .filter((a) => a.playState === "running").length,
    ),
  ).toBe(0);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await page.screenshot({
    path: "../../.local/ride-search-panel-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "../../.local/ride-search-panel-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Fórum", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Sua busca de carona" }),
  ).toBeVisible();
  await page.goto("/caronas");
  const ownRequest = page
    .locator("article")
    .filter({ hasText: `Busca de teste ${tag}` })
    .filter({
      has: page.getByRole("button", { name: "Cancelar", exact: true }),
    });
  page.once("dialog", (dialog) => dialog.accept());
  await ownRequest
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await expect(
    page
      .locator(".ride-search-card")
      .filter({ hasText: `Busca de teste ${tag}` }),
  ).toHaveCount(0);
  await riderContext.close();
});
