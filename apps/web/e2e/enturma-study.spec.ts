import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";

test("Enturma Study: routine, weekly classes, one cancelled class and a holiday", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  const tag = randomUUID().slice(0, 8),
    email = `study-${tag}@example.test`;
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: { name: "Estudante Study", username: `study_${tag}`, email, password: "E2E-test-password-123", device: "E2E" },
  });
  expect(registration.ok()).toBe(true);
  const credentials = await registration.json();
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  let subject = "";
  try {
    const row = await db.query(
      "SELECT id,name FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' ORDER BY name LIMIT 1",
    );
    subject = row.rows[0].name;
    await db.query(
      "INSERT INTO user_subject(user_id,subject_id) SELECT id,$2 FROM app_user WHERE email=$1",
      [email, row.rows[0].id],
    );
  } finally {
    await db.end();
  }
  await page.addInitScript(() => localStorage.setItem("enturma-intro:v0.3", "seen"));
  await authenticate(page.context(), credentials);
  await page.goto("/home?day=2026-04-20#enturma-study");

  const study = page.locator("#enturma-study");
  await expect(study.getByRole("heading", { name: /Seu estudo, sua rotina/ })).toBeVisible();
  await expect(study.getByRole("button", { name: /21 de abril.*Tiradentes/ })).toHaveClass(/is-holiday/);

  const day = study.getByRole("region", { name: /segunda-feira, 20 de abril/ });
  await day.getByRole("button", { name: "Adicionar aula" }).click();
  await day.getByRole("button", { name: "quarta-feira" }).click();
  await day.getByLabel("Início").fill("19:00");
  await day.getByLabel("Fim").fill("22:30");
  await day.getByRole("button", { name: "Salvar aulas" }).click();
  await expect(day.getByText(subject)).toBeVisible();

  await day.getByRole("button", { name: "Cancelar esta aula" }).click();
  await expect(day.getByText(/Aula · Cancelada/)).toBeVisible();
  await expect(day.getByRole("button", { name: /Desfazer alteração/ })).toBeVisible();

  await study.getByRole("button", { name: /^22 de abril/ }).click();
  const wednesday = study.getByRole("region", { name: /quarta-feira, 22 de abril/ });
  await expect(wednesday.getByText(subject)).toBeVisible();
  await expect(wednesday.getByText("19:00 – 22:30")).toBeVisible();

  await study.getByRole("button", { name: "Minha rotina" }).click();
  const routine = study.getByRole("region", { name: "Minha rotina acadêmica" });
  await routine.getByLabel("Lembrete antes de cada aula").selectOption("60");
  await routine.getByRole("button", { name: "Salvar rotina" }).click();
  await expect(study.getByText("O Enturma vai te notificar 1 hora antes de cada aula.")).toBeVisible();
});
