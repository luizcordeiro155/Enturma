import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";

test.use({ timezoneId: "America/Sao_Paulo" });

const iso = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
const shift = (days: number) => iso(new Date(Date.now() + days * 86400000));

test("an ended semester leads to the new one, straight to its period and subjects", async ({ page, request }) => {
  test.setTimeout(90000);
  const tag = randomUUID().slice(0, 8),
    email = `term-${tag}@example.test`;
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: { name: "Estudante Semestre", username: `term_${tag}`, email, password: "E2E-test-password-123", device: "E2E" },
  });
  expect(registration.ok()).toBe(true);
  const credentials = await registration.json();
  const headers = { Authorization: `Bearer ${credentials.accessToken}` };
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  let period: { id: string; subject: string };
  try {
    period = (
      await db.query(
        `SELECT p.id, s.id subject FROM academic_entry s JOIN academic_entry p ON p.id=s.parent_id AND p.kind='PERIOD'
         AND p.status='VERIFIED' JOIN academic_entry cu ON cu.id=p.parent_id AND cu.status='VERIFIED'
         JOIN academic_entry co ON co.id=cu.parent_id AND co.status='VERIFIED' JOIN academic_entry ca ON ca.id=co.parent_id
         AND ca.status='VERIFIED' JOIN academic_entry i ON i.id=ca.parent_id AND i.status='VERIFIED'
         WHERE s.kind='SUBJECT' AND s.status='VERIFIED' ORDER BY s.id LIMIT 1`,
      )
    ).rows[0];
  } finally {
    await db.end();
  }
  expect(
    (
      await request.put(`${backend}/api/v1/users/me/enrollment`, {
        headers,
        data: { periodId: period.id, subjectIds: [period.subject], shift: "EVENING", preferences: "" },
      })
    ).ok(),
  ).toBe(true);
  const routine = await (await request.get(`${backend}/api/v1/planner/routine`, { headers })).json();
  expect(
    (
      await request.put(`${backend}/api/v1/planner/routine`, {
        headers,
        data: { ...routine, focusMode: undefined, updatedAt: undefined, semesterStart: shift(-140), semesterEnd: shift(-8) },
      })
    ).ok(),
  ).toBe(true);

  await page.addInitScript(() => localStorage.setItem("enturma-intro:v0.3", "seen"));
  await authenticate(page.context(), credentials);
  await page.goto("/home#enturma-study");
  const notice = page.getByRole("region", { name: "Semestre", exact: true });
  await expect(notice.getByRole("heading", { name: /Seu semestre .* terminou/ })).toBeVisible();
  await notice.getByLabel("Começa em").fill(shift(-1));
  await notice.getByLabel("Termina em").fill(shift(120));
  await notice.getByRole("button", { name: /Começar novo semestre/ }).click();

  await expect(page).toHaveURL(/\/onboarding\?semestre=novo/);
  await expect(page.getByRole("heading", { name: /Novo semestre/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Período", exact: true })).toBeVisible();

  // Until the subjects are chosen, the study area keeps asking for them.
  await page.goto("/home#enturma-study");
  await expect(
    page.getByRole("region", { name: "Semestre", exact: true }).getByRole("link", { name: /Escolher período e matérias/ }),
  ).toBeVisible();
  const card = page.getByRole("region", { name: "Presença no semestre" });
  await expect(card.getByLabel("Semestre")).toBeVisible();
});

test("on a phone, Agendar estudo brings the form into view", async ({ page, request }) => {
  const tag = randomUUID().slice(0, 8);
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: { name: "Estudante Celular", username: `phone_${tag}`, email: `phone-${tag}@example.test`, password: "E2E-test-password-123", device: "E2E" },
  });
  const credentials = await registration.json();
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  try {
    const row = await db.query("SELECT id FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' ORDER BY name LIMIT 1");
    await db.query("INSERT INTO user_subject(user_id,subject_id) SELECT id,$2 FROM app_user WHERE email=$1", [
      `phone-${tag}@example.test`,
      row.rows[0].id,
    ]);
  } finally {
    await db.end();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("enturma-intro:v0.3", "seen"));
  await authenticate(page.context(), credentials);
  await page.goto("/home#enturma-study");
  await page.locator(".enturma-launch-overlay").waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
  const sessions = page.getByRole("region", { name: "Sessões de estudo" });
  await sessions.getByRole("button", { name: "Agendar estudo" }).scrollIntoViewIfNeeded();
  await sessions.getByRole("button", { name: "Agendar estudo" }).click();
  const form = page.locator(".study-session-form");
  await expect(form).toBeInViewport({ ratio: 0.5, timeout: 5000 });
});
