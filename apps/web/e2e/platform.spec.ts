import { authenticate } from "./session";
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
  const registered = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Estudante E2E",
      username: `e2e_${tag}`,
      email,
      password,
      device: "E2E",
    },
  });
  expect(registered.ok()).toBe(true);
  await authenticate(page.context(), await registered.json());
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/onboarding/);
  const preHome = await page.context().newPage();
  await preHome.goto("/home");
  await expect(
    preHome.getByRole("heading", { name: "Seu próximo estudo" }),
  ).toBeVisible();
  await preHome.screenshot({
    path: "../../.local/dashboard-render.png",
    fullPage: true,
  });
  await preHome.setViewportSize({ width: 390, height: 844 });
  await expect(
    preHome.getByRole("link", { name: "Completar perfil" }),
  ).toBeVisible();
  expect(
    await preHome.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await preHome.screenshot({
    path: "../../.local/mobile-render.png",
    fullPage: true,
  });
  await preHome.close();
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
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(
    page.getByText("Mensagem E2E em tempo real", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Adicionar imagem", { exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Adicionar imagem", { exact: true }).setInputFiles({
    name: "teste.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jA1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(page.locator(".chat-image-thumbnail img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".chat-image-thumbnail img")
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
  await authenticate(peer, mate);
  await peerPage.goto(roomUrl);
  await expect(
    peerPage.getByText("Mensagem E2E em tempo real", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Atualização pelo WebSocket");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(
    peerPage.getByText("Atualização pelo WebSocket", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  // The recipient is following the bottom of this conversation: the incoming
  // message is already visible and must not create an unread notification.
  await expect(peerPage.locator(".notification-count")).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Encerrar sessão" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Sessão encerrada" }),
  ).toBeVisible();
  await expect(
    peerPage.getByRole("button", { name: "Enviar mensagem", exact: true }),
  ).toHaveCount(0);
  const riderPage = peerPage;
  // The current ride entry is a map with passenger/driver modes. Seed the
  // scheduled ride through the API, then exercise its live match/chat UI.
  await riderPage.goto("/caronas");
  await expect(
    riderPage.getByRole("button", { name: "Passageiro", exact: true }),
  ).toBeVisible();
  await expect(
    riderPage.getByRole("button", { name: "Motorista", exact: true }),
  ).toBeVisible();
  const headers = { Authorization: `Bearer ${credentials.accessToken}` };
  const offered = await request.post(`${backend}/api/v1/rides`, {
    headers,
    data: {
      campusId: ids.CAMPUS,
      type: "OFFER",
      originArea: `Região de teste ${tag}`,
      direction: "TO_CAMPUS",
      departureAt: new Date(Date.now() + 86400000).toISOString(),
      seats: 1,
    },
  });
  expect(offered.ok(), await offered.text()).toBe(true);
  const ride = await offered.json();
  const interested = await request.post(
    `${backend}/api/v1/rides/${ride.id}/interest`,
    { headers: mh },
  );
  expect(interested.ok(), await interested.text()).toBe(true);
  const match = await interested.json();
  await riderPage.goto(`/caronas/matches?match=${match.id}`);
  await expect(riderPage.getByText(/Aguardando confirmação/)).toBeVisible();
  await page.goto(`/caronas/matches?match=${match.id}`);
  await page
    .getByRole("button", { name: "Aceitar combinação", exact: true })
    .click();
  const celebration = page.getByRole("dialog", {
    name: "Deu match na carona!",
  });
  await expect(celebration).toContainText("Colega E2E");
  await celebration.getByRole("button", { name: "Combinar encontro" }).click();
  // Scheduled confirmations update in place. The global passenger celebration
  // is reserved for an on-demand trip whose driver is already on the way.
  await expect(
    riderPage.getByText("Confirmado", { exact: false }).first(),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", {
      name: "Conversa privada da carona",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Ponto privado combinado").fill("Ponto privado E2E");
  await page
    .locator(".ride-chat")
    .getByRole("button", { name: "Salvar ponto", exact: true })
    .click();
  await expect(
    page.getByText("Ponto de encontro atualizado.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Mensagem", { exact: true }).fill("Conversa da carona");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(
    page.getByText("Conversa da carona", { exact: true }),
  ).toBeVisible();
  await expect(
    riderPage.getByText("Conversa da carona", { exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Encerrar conversa", exact: true })
    .click();
  await expect(page.getByLabel("Mensagem", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ver histórico", exact: true }),
  ).toBeVisible();
  const closed = await request.get(`${backend}/api/v1/matches`, { headers });
  expect(
    (await closed.json()).find((row: { id: string }) => row.id === match.id)
      .closedAt,
  ).toBeTruthy();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Excluir histórico privado", exact: true })
    .click();
  await expect(
    page.getByText("Conversa excluída.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Conversa da carona", { exact: true }),
  ).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Cancelar match", exact: true })
    .click();
  await expect(
    page.getByText("Cancelado", { exact: false }).first(),
  ).toBeVisible();
  expect(
    (
      await request.post(`${backend}/api/v1/rides/${ride.id}/cancel`, {
        headers,
      })
    ).ok(),
  ).toBe(true);
  await peer.close();
});
