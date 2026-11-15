import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
test.use({ timezoneId: "America/Sao_Paulo" });

async function theme(page: Page, value: string) {
  await page.evaluate((theme) => {
    const root = document.documentElement;
    root.dataset.theme = theme === "light" ? "light" : "dark";
    if (theme === "enturma") root.dataset.palette = "enturma";
    else delete root.dataset.palette;
  }, value);
}

test("Modo foco: estudo com a IA pausa o Social, explica e pode ser desativado; marcações são editáveis", async ({
  page,
  request,
}, info) => {
  test.setTimeout(120000);
  const tag = randomUUID().slice(0, 8),
    email = `foco-${tag}@example.test`;
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: { name: "Estudante Foco", username: `foco_${tag}`, email, password: "E2E-test-password-123", device: "E2E" },
  });
  expect(registration.ok()).toBe(true);
  const credentials = await registration.json();
  const bearer = { Authorization: `Bearer ${credentials.accessToken}` };
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  try {
    const subject = (
      await db.query("SELECT id,name FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' ORDER BY name LIMIT 1")
    ).rows[0];
    await db.query("INSERT INTO user_subject(user_id,subject_id) SELECT id,$2 FROM app_user WHERE email=$1", [email, subject.id]);
    const created = await request.post(`${backend}/api/v1/study/sessions`, {
      headers: bearer,
      data: { subjectId: subject.id, startsAt: new Date(Date.now() + 60000).toISOString(), minutes: 45, goal: "" },
    });
    expect(created.ok(), await created.text()).toBe(true);
    const { id } = await created.json();
    expect((await request.post(`${backend}/api/v1/study/sessions/${id}/start`, { headers: bearer })).ok()).toBe(true);

    await page.addInitScript(() => localStorage.setItem("enturma-intro:v0.3", "seen"));
    await authenticate(page.context(), credentials);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 860 });
      await page.goto("/social");
      await page.locator(".enturma-launch-overlay").waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
      const paused = block(page);
      await expect(paused).toBeVisible();
      await expect(paused).toContainText(subject.name);
      await expect(paused).toContainText("pode desativar isso nas configurações");
      await expect(paused.getByRole("link", { name: "Voltar para a sala de estudo" })).toHaveAttribute("href", `/study/${id}`);
      for (const value of ["light", "dark", "enturma", "system"]) {
        await theme(page, value);
        await page.screenshot({ path: info.outputPath(`focus-block-${width}-${value}.png`) });
      }
    }

    await block(page).getByRole("link", { name: /Configurar modo foco/ }).click();
    await expect(page).toHaveURL(/\/settings#modo-foco/);
    await settle(page);
    const settings = page.locator("#modo-foco");
    await expect(settings.getByRole("status")).toContainText("Em foco agora");
    await settings.scrollIntoViewIfNeeded();
    for (const value of ["light", "dark", "enturma", "system"]) {
      await theme(page, value);
      await settings.screenshot({ path: info.outputPath(`focus-settings-${value}.png`) });
    }
    await settings.getByRole("switch").click();
    await expect(settings.getByRole("switch")).not.toBeChecked();
    await page.goto("/social");
    await expect(page.getByRole("region", { name: "O Enturma Social está pausado agora" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Ambientes do Social" }).first()).toBeVisible();

    // A reminder, exam or assignment can be edited again.
    const tomorrow = new Date(Date.now() + 86400000);
    const day = tomorrow.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const task = await request.post(`${backend}/api/v1/planner/tasks`, {
      headers: bearer,
      data: { kind: "ASSIGNMENT", title: "RT4 Low-Code Enturma", subjectId: null, dueAt: `${day}T22:00:00.000Z`, minutes: 60 },
    });
    expect(task.ok(), await task.text()).toBe(true);
    await page.goto("/home#enturma-study");
    await settle(page);
    const study = page.locator("#enturma-study");
    const label = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(tomorrow);
    await study.locator(`.study-calendar-grid button[aria-label^="${label},"]`).first().click();
    await study.getByRole("button", { name: "Editar RT4 Low-Code Enturma" }).click();
    const form = study.getByRole("form", { name: "Editar marcação" });
    await expect(form.getByLabel("Título")).toHaveValue("RT4 Low-Code Enturma");
    for (const value of ["light", "dark", "enturma", "system"]) {
      await theme(page, value);
      await study.locator(".study-day-panel").screenshot({ path: info.outputPath(`task-edit-${value}.png`) });
    }
    await form.getByLabel("Tipo").selectOption("EXAM");
    await form.getByLabel("Título").fill("Prova RT4");
    await form.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(study.locator(".study-day-panel").getByText("Prova RT4")).toBeVisible();
    await expect(study.locator(".study-day-panel").getByText("Prova", { exact: true })).toBeVisible();
  } finally {
    await db.end();
  }
});

/** Waits for the opening animation and puts the "time to study" invitation aside. */
async function settle(page: Page) {
  await page.waitForTimeout(1500);
  await page.locator(".enturma-launch-overlay").waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
  const later = page.getByRole("button", { name: "Lembrar em 10 min" });
  await later.waitFor({ timeout: 4000 }).catch(() => {});
  if (await later.isVisible()) await later.click();
}

function block(page: Page) {
  return page.getByRole("region", { name: "O Enturma Social está pausado agora" });
}
