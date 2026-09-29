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
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await expect(
    page.getByRole("heading", { name: "Universidade", exact: true }),
  ).toBeVisible();
  await page.goto("/home");
  await expect(
    page.getByRole("heading", { name: "Seu próximo estudo" }),
  ).toBeVisible();
  await expect(page.getByText("Ainda não há salas abertas.")).toBeVisible();
  await page.screenshot({
    path: "../../docs/design/dashboard-render.png",
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
    path: "../../docs/design/mobile-render.png",
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
  ])
    await page
      .getByRole("button", { name: new RegExp(`TESTE E2E ${kind} ${tag}`) })
      .click();
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
  const second = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Colega E2E",
      username: `mate_${tag}`,
      email: `mate-${tag}@example.test`,
      password,
      device: "E2E",
    },
  });
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
  ).toHaveCount(0);
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Atualização pelo WebSocket");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(
    peerPage.getByText("Atualização pelo WebSocket", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Encerrar sessão" }).click();
  await expect(
    page.getByText("Sessão encerrada", { exact: false }),
  ).toBeVisible();
  await expect(
    peerPage.getByRole("button", { name: "Enviar", exact: true }),
  ).toBeDisabled();
  await peer.close();
  await page.goto("/caronas/create");
  await page
    .getByRole("combobox", { name: "Universidade", exact: true })
    .selectOption(ids.INSTITUTION);
  await page
    .getByRole("combobox", { name: "Campus", exact: true })
    .selectOption(ids.CAMPUS);
  await page
    .getByLabel("Bairro ou região de origem")
    .fill("Região de teste E2E");
  const departure = new Date(Date.now() + 86400000);
  const local = new Date(
    departure.getTime() - departure.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  await page.getByLabel("Saída", { exact: true }).fill(local);
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText(/Carona publicada/)).toBeVisible();
  const mine = await request.get(`${backend}/api/v1/rides/mine`, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
  });
  const ride = (await mine.json())[0];
  const interest = await request.post(
    `${backend}/api/v1/rides/${ride.id}/interest`,
    { headers: mh },
  );
  expect(interest.ok()).toBe(true);
  await page.goto("/caronas/matches");
  await page.getByRole("button", { name: "Aceitar", exact: true }).click();
  await page.getByRole("button", { name: "Conversa privada" }).click();
  await page.getByLabel("Ponto privado").fill("Ponto privado E2E");
  await page.getByRole("button", { name: "Salvar ponto" }).click();
  await expect(
    page.getByText("Ponto de encontro: Ponto privado E2E"),
  ).toBeVisible();
});
