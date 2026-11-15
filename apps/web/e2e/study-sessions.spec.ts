import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";
const shots = process.env.STUDY_SHOTS;
// The calendar follows the student's routine time zone; keep the browser in it too.
test.use({ timezoneId: "America/Sao_Paulo" });

const QUIZ = JSON.stringify({
  questions: [
    { question: "Quanto vale o limite de x+1 quando x tende a 1?", options: ["1", "2", "3", "0"], answer: 1, explanation: "Substitua x por 1: 1+1 = 2.", topic: "Limites" },
    { question: "Qual é a derivada de x²?", options: ["2x", "x", "x²", "2"], answer: 0, explanation: "Regra da potência.", topic: "Derivadas" },
  ],
});

async function theme(page: Page, value: string) {
  await page.evaluate((theme) => {
    const key = "enturma-experience";
    const next = JSON.stringify({ ...JSON.parse(localStorage.getItem(key) ?? "{}"), theme: theme.toUpperCase(), reducedMotion: true });
    localStorage.setItem(key, next);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: next }));
  }, value);
  await page.waitForTimeout(400);
}

async function shoot(page: Page, name: string) {
  if (!shots) return;
  for (const value of ["light", "dark", "enturma", "system"]) {
    await theme(page, value);
    await page.screenshot({ path: `${shots}/${name}-${page.viewportSize()!.width}-${value}.png`, fullPage: false });
  }
  await theme(page, "light");
}

test("Study session: scheduled on the calendar, invitation, tutor room, quiz and the finished notebook", async ({
  page,
  request,
}) => {
  test.setTimeout(150000);
  const tag = randomUUID().slice(0, 8),
    email = `session-${tag}@example.test`;
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: { name: "Estudante Sessão", username: `sess_${tag}`, email, password: "E2E-test-password-123", device: "E2E" },
  });
  expect(registration.ok()).toBe(true);
  const credentials = await registration.json();
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  try {
    const row = await db.query(
      "SELECT id,name FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' ORDER BY name LIMIT 1",
    );
    const subject = row.rows[0].name as string;
    await db.query("INSERT INTO user_subject(user_id,subject_id) SELECT id,$2 FROM app_user WHERE email=$1", [
      email,
      row.rows[0].id,
    ]);

    await page.addInitScript(() => localStorage.setItem("enturma-intro:v0.3", "seen"));
    await authenticate(page.context(), credentials);
    await page.setViewportSize({ width: Number(process.env.STUDY_WIDTH ?? 1280), height: 860 });
    await page.goto("/home#enturma-study");
    await page.locator(".enturma-launch-overlay").waitFor({ state: "detached", timeout: 20000 }).catch(() => {});

    const study = page.locator("#enturma-study");
    const sessions = study.getByRole("region", { name: "Sessões de estudo" });
    await expect(sessions.getByText(/Nenhum estudo marcado/)).toBeVisible();
    await sessions.getByRole("button", { name: "Agendar estudo" }).click();

    // The time as the student's browser sees it, five minutes from now.
    const hhmm = await page.evaluate(() => {
      const soon = new Date(Date.now() + 5 * 60000);
      return `${String(soon.getHours()).padStart(2, "0")}:${String(soon.getMinutes()).padStart(2, "0")}`;
    });
    const form = study.locator(".study-session-form");
    await expect(form).toBeVisible();
    await form.getByLabel("Horário").fill(hhmm);
    await form.getByLabel("Duração").selectOption("30");
    await form.getByLabel(/O que você quer estudar/).fill("Limites laterais");
    await form.getByRole("button", { name: "Agendar estudo" }).click();
    await expect(sessions.getByRole("link", { name: /Abrir sala/ })).toBeVisible();
    await expect(study.locator(".study-day-panel").getByText("Limites laterais")).toBeVisible();
    if (shots) {
      await form.isHidden();
      await study.locator(".study-day-panel").scrollIntoViewIfNeeded();
      await shoot(page, "home-day");
      await sessions.scrollIntoViewIfNeeded();
      await shoot(page, "home-sessions");
    }

    // A reload behaves like opening the app: the invitation shows up.
    await page.reload();
    const invite = page.getByRole("dialog", { name: subject });
    await expect(invite).toBeVisible({ timeout: 20000 });
    await expect(invite.getByText(/em \d+ min · 30 min/)).toBeVisible();
    await shoot(page, "invite");
    await invite.getByRole("link", { name: "Ir para a sala" }).click();

    await expect(page).toHaveURL(/\/study\//);
    const id = page.url().split("/study/")[1];
    await expect(page.getByRole("heading", { name: `Pronto para estudar ${subject}?` })).toBeVisible();
    await expect(page.getByRole("dialog", { name: subject })).toHaveCount(0);
    await shoot(page, "room-planned");
    await page.getByRole("button", { name: "Começar estudo" }).click();
    await expect(page.getByText(/qual é a sua maior dificuldade/i)).toBeVisible();
    await expect(page.getByLabel("Mensagem para o tutor")).toBeVisible();
    // Like the private chats: the page itself does not scroll, the composer rests at the bottom.
    const composer = page.locator(".study-room-composer");
    const viewport = page.viewportSize()!;
    const box = (await composer.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 64);
    expect(await page.evaluate(() => document.scrollingElement!.scrollHeight <= innerHeight + 1)).toBe(true);
    await shoot(page, "room-active");
    if (viewport.width < 700) {
      // Android app: the keyboard is reported and the composer rests right above it.
      await page.evaluate(() => {
        const root = document.documentElement;
        root.dataset.enturmaMobile = "true";
        root.style.setProperty("--native-keyboard-bottom", "300px");
      });
      await expect
        .poll(async () => {
          const rect = (await composer.boundingBox())!;
          return Math.round(rect.y + rect.height);
        })
        .toBeLessThanOrEqual(viewport.height - 300);
      expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0);
      await page.evaluate(() => {
        const root = document.documentElement;
        delete root.dataset.enturmaMobile;
        root.style.removeProperty("--native-keyboard-bottom");
      });
    }

    // The model is not available locally: write the tutor's answers as the queue would.
    const notebook = (await db.query("SELECT notebook_id FROM study_session WHERE id=$1", [id])).rows[0].notebook_id;
    await db.query(
      "INSERT INTO notebook_generation(id,notebook_id,question,answer,mode,level,context,citations,status,created_at) VALUES (gen_random_uuid(),$1,'Não entendo limites laterais','Vamos por partes. O **limite lateral** olha a função chegando por um lado só.\nQual é o limite de x+1 quando x tende a 1 pela direita?','TUTOR','INTERMEDIATE','','[]','READY',now()-interval '2 minutes')",
      [notebook],
    );
    const quizId = randomUUID();
    await db.query(
      "INSERT INTO notebook_generation(id,notebook_id,question,answer,mode,level,context,citations,status,created_at) VALUES ($2,$1,'Gerar quiz para avaliar o que estudei',$3,'QUIZ_JSON','INTERMEDIATE','','[]','READY',now())",
      [notebook, quizId, QUIZ],
    );
    await page.reload();
    await expect(page.getByText(/limite lateral/)).toBeVisible();
    const quiz = page.locator(".study-quiz");
    await expect(quiz.getByRole("heading", { name: "Quiz da sessão" })).toBeVisible();
    await shoot(page, "room-quiz");

    await quiz.getByRole("group", { name: /Limites/ }).getByLabel("3").check();
    await quiz.getByRole("group", { name: /Derivadas/ }).getByLabel("2x").check();
    await quiz.getByRole("button", { name: "Enviar respostas" }).click();
    await expect(quiz.getByText("Você acertou 1 de 2.")).toBeVisible();
    await expect(quiz.getByText("Substitua x por 1: 1+1 = 2.")).toBeVisible();
    const next = page.getByRole("group", { name: "Próximo passo" });
    await expect(next).toContainText("Limites");
    await shoot(page, "room-graded");

    const perfect = randomUUID();
    await db.query(
      "INSERT INTO notebook_generation(id,notebook_id,question,answer,mode,level,context,citations,status,created_at) VALUES ($2,$1,'Gerar quiz para avaliar o que estudei',$3,'QUIZ_JSON','INTERMEDIATE','','[]','READY',now())",
      [notebook, perfect, QUIZ],
    );
    await page.reload();
    const second = page.locator(".study-quiz").last();
    await second.getByRole("group", { name: /Limites/ }).getByLabel("2", { exact: true }).check();
    await second.getByRole("group", { name: /Derivadas/ }).getByLabel("2x").check();
    await second.getByRole("button", { name: "Enviar respostas" }).click();
    await expect(page.getByRole("heading", { name: "Sessão concluída!" })).toBeVisible();
    await expect(page.getByLabel("Mensagem para o tutor")).toHaveCount(0);
    await shoot(page, "room-done");
    await expect(page.getByRole("link", { name: /Abrir caderno/ })).toHaveAttribute("href", `/notebooks/${notebook}`);

    await page.getByRole("button", { name: /Excluir caderno/ }).click();
    await page.getByRole("button", { name: /Confirmar exclusão/ }).click();
    await expect(page).toHaveURL(/\/home/);
    expect((await db.query("SELECT count(*)::int n FROM study_notebook WHERE id=$1", [notebook])).rows[0].n).toBe(0);
  } finally {
    await db.end();
  }
});
