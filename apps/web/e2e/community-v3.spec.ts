import { authenticate } from "./session";
import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";
const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
const password = "E2E-community-password-123";
type E2EUser = {
  email: string;
  token: string;
  accessToken: string;
  refreshToken: string;
  userId: string;
  name: string;
};
test("sala longa, typing e chamada persistente com mídia LiveKit", async ({
  request,
  browser,
}) => {
  test.setTimeout(150000);
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  expect((await db.query("SELECT current_database() name")).rows[0].name).toBe(
    "enturma_e2e",
  );
  const tag = randomUUID().slice(0, 8);
  const users: E2EUser[] = [];
  for (const name of ["Alice", "Bruno"]) {
    const email = `v3-${name}-${tag}@example.test`;
    const response = await request.post(`${backend}/api/v1/auth/register`, {
      data: {
        name,
        username: `v3_${name}_${tag}`,
        email,
        password,
        device: "E2E",
      },
    });
    expect(response.ok()).toBe(true);
    const credentials = await response.json();
    users.push({ email, token: credentials.accessToken, ...credentials, name });
  }
  const subject = (
    await db.query(
      "SELECT s.id,s.parent_id FROM academic_entry s JOIN academic_entry p ON p.id=s.parent_id WHERE s.name='Algoritmos e programação' AND s.status='VERIFIED' AND p.status='VERIFIED' LIMIT 1",
    )
  ).rows[0];
  expect(subject).toBeTruthy();
  await db.query(
    "UPDATE app_user SET email_verified=true WHERE email=ANY($1)",
    [users.map((u) => u.email)],
  );
  for (const u of users) {
    const enrollment = await request.put(
      `${backend}/api/v1/users/me/enrollment`,
      {
        headers: { Authorization: `Bearer ${u.token}` },
        data: {
          periodId: subject.parent_id,
          subjectIds: [subject.id],
          shift: "EVENING",
          preferences: "",
        },
      },
    );
    expect(enrollment.ok()).toBe(true);
  }
  const created = await request.post(`${backend}/api/v1/study-rooms`, {
    headers: { Authorization: `Bearer ${users[0].token}` },
    data: {
      subjectId: subject.id,
      title: `Comunidade ${tag}`,
      minutes: 50,
      days: 2,
      maxParticipants: 8,
    },
  });
  expect(created.ok()).toBe(true);
  const room = await created.json();
  expect(
    (
      await request.post(`${backend}/api/v1/study-rooms/${room.id}/join`, {
        headers: { Authorization: `Bearer ${users[1].token}` },
      })
    ).ok(),
  ).toBe(true);
  const a = await browser.newContext({
      baseURL: "http://localhost:3000",
      permissions: ["microphone", "camera"],
    }),
    b = await browser.newContext({
      baseURL: "http://localhost:3000",
      permissions: ["microphone", "camera"],
    });
  const page = await a.newPage(),
    peer = await b.newPage();
  async function login(p: Page, user: (typeof users)[number]) {
    await authenticate(p.context(), user);
    await p.goto(`/rooms/${room.id}`);
  }
  try {
    await login(page, users[0]);
    await login(peer, users[1]);
    await expect(page.getByText(/Sala de vários dias/)).toBeVisible();
    await page
      .getByLabel("Mensagem", { exact: true })
      .fill("Uma dúvida de algoritmos");
    await expect(peer.getByText(/Alice está digitando/)).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(
      peer.getByText("Uma dúvida de algoritmos", { exact: true }),
    ).toBeVisible();
    for (const p of [page, peer]) {
      await p.getByRole("button", { name: "Chamada", exact: true }).click();
      await p
        .getByRole("button", { name: "Entrar na chamada", exact: true })
        .click();
      await expect(p.getByText("Voz conectada", { exact: true })).toBeVisible({
        timeout: 20000,
      });
    }
    await expect(page.getByText("2 pessoas na chamada")).toBeVisible();
    await page.getByTitle("Ligar câmera").click();
    await expect
      .poll(() =>
        peer
          .locator(".call-media-tile video")
          .evaluateAll((videos) =>
            videos.some((v) => (v as HTMLVideoElement).videoWidth > 0),
          ),
      )
      .toBe(true);
    await page.getByTitle("Compartilhar tela", { exact: true }).click();
    await expect
      .poll(() =>
        peer
          .locator(".screen-share video")
          .evaluateAll((videos) =>
            videos.some((v) => (v as HTMLVideoElement).videoWidth > 0),
          ),
      )
      .toBe(true);
    // Client navigation must preserve the same media elements/connection, not rejoin.
    await page
      .locator(".sidebar")
      .getByRole("link", { name: "Fórum", exact: true })
      .click();
    await expect(page).toHaveURL(/forum/);
    await expect(
      page.locator(".global-call-dock .call-controls"),
    ).toBeVisible();
    await expect(peer.getByText("2 pessoas na chamada")).toBeVisible();
    await expect
      .poll(() =>
        peer
          .locator(".call-media-tile video")
          .evaluateAll((videos) =>
            videos.some((v) => (v as HTMLVideoElement).videoWidth > 0),
          ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        peer
          .locator(".screen-share video")
          .evaluateAll((videos) =>
            videos.some((v) => (v as HTMLVideoElement).videoWidth > 0),
          ),
      )
      .toBe(true);
    await page.getByRole("link", { name: /Você está em chamada/ }).click();
    await expect(page).toHaveURL(/panel=call/);
    await expect(page.locator(".call-mount .call-controls")).toBeVisible();
    await page.screenshot({ path: "../../.local/v03-real-call.png" });
    await page.getByTitle("Sair da chamada").click();
    await expect(peer.getByText("1 pessoa na chamada")).toBeVisible();
  } finally {
    await a.close();
    await b.close();
    await request.post(`${backend}/api/v1/study-rooms/${room.id}/end`, {
      headers: { Authorization: `Bearer ${users[0].token}` },
    });
    await db.end();
  }
});
