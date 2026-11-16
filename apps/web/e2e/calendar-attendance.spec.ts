import { test } from "./student-fixture";
import { authenticate } from "./session";
import { expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";

const backend = process.env.E2E_API_URL ?? "http://localhost:8080";

test.use({ timezoneId: "America/Sao_Paulo" });

const iso = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
const shift = (days: number) => iso(new Date(Date.now() + days * 86400000));

/** A student with one subject and a daily 08:00 class that began ten days ago. */
async function student(request: APIRequestContext) {
  const tag = randomUUID().slice(0, 8),
    email = `attend-${tag}@example.test`;
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: { name: "Estudante Presença", username: `attend_${tag}`, email, password: "E2E-test-password-123", device: "E2E" },
  });
  expect(registration.ok()).toBe(true);
  const credentials = await registration.json();
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  let subject: { id: string; name: string };
  try {
    subject = (
      await db.query("SELECT id,name FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' ORDER BY name LIMIT 1")
    ).rows[0];
    await db.query("INSERT INTO user_subject(user_id,subject_id) SELECT id,$2 FROM app_user WHERE email=$1", [email, subject.id]);
  } finally {
    await db.end();
  }
  const headers = { Authorization: `Bearer ${credentials.accessToken}` };
  const routine = await (await request.get(`${backend}/api/v1/planner/routine`, { headers })).json();
  expect(
    (
      await request.put(`${backend}/api/v1/planner/routine`, {
        headers,
        data: {
          timezone: "America/Sao_Paulo",
          defaultStart: routine.defaultStart,
          defaultEnd: routine.defaultEnd,
          weekdays: routine.weekdays,
          semesterStart: shift(-10),
          semesterEnd: shift(40),
          classReminderMinutes: 120,
          quietStart: null,
          quietEnd: null,
          tutorPersonality: "BALANCED",
          state: null,
          city: null,
        },
      })
    ).ok(),
  ).toBe(true);
  expect(
    (
      await request.post(`${backend}/api/v1/planner/classes`, {
        headers,
        data: { subjectId: subject.id, weekdays: [1, 2, 3, 4, 5, 6, 7], startsAt: "08:00", endsAt: "09:00", validFrom: shift(-10), validUntil: "2027-12-31", room: "" },
      })
    ).ok(),
  ).toBe(true);
  return { credentials, subject: subject.name };
}

test("past classes count as attended, a missed one is recorded and breaks hide classes", async ({ page, request }) => {
  test.setTimeout(90000);
  const { credentials, subject } = await student(request);
  await page.addInitScript(() => localStorage.setItem("enturma-intro:v0.3", "seen"));
  await authenticate(page.context(), credentials);
  await page.goto("/home#enturma-study");

  const card = page.getByRole("region", { name: "Presença no semestre" });
  await expect(card.getByText(`Você foi à aula de ${subject}?`)).toBeVisible();
  const present = Number(await card.locator("[data-kind=present] dd").textContent());
  expect(present).toBeGreaterThan(5);
  await expect(card.locator("[data-kind=absent] dd")).toHaveText("0");
  await card.getByRole("button", { name: "Faltei" }).click();
  await expect(card.locator("[data-kind=absent] dd")).toHaveText("1");
  await expect(card.locator("[data-kind=present] dd")).toHaveText(String(present - 1));

  // The answer shows on the day and can be changed there.
  const study = page.locator("#enturma-study");
  const yesterday = shift(-1);
  await page.goto(`/home?day=${yesterday}#enturma-study`);
  const day = study.locator(".study-day-panel");
  const lesson = day.locator("li[data-kind=CLASS]").first();
  await expect(lesson.getByText(/Aula · (Concluída|Falta)/)).toBeVisible();
  if (await lesson.getByText("Aula · Concluída").isVisible()) {
    await lesson.getByRole("button", { name: "Faltei" }).click();
    await expect(lesson.getByText("Aula · Falta")).toBeVisible();
    await lesson.getByRole("button", { name: "Faltei" }).click();
    await expect(lesson.getByText("Aula · Concluída")).toBeVisible();
  }

  // July is a break by default: no regular classes until the student removes it.
  await page.goto("/home?day=2027-07-12#enturma-study");
  await expect(study.getByRole("button", { name: /^12 de julho.*férias: Férias de julho/ })).toHaveClass(/is-vacation/);
  const july = study.locator(".study-day-panel");
  await expect(july.getByText("Férias de julho")).toBeVisible();
  await expect(july.locator("li[data-kind=CLASS]")).toHaveCount(0);
  await july.getByRole("button", { name: "Remover", exact: true }).click();
  await july.getByRole("button", { name: "Remover estas férias" }).click();
  await expect(july.locator("li[data-kind=CLASS]")).toHaveCount(1);
  await expect(study.getByRole("button", { name: /^12 de julho/ })).not.toHaveClass(/is-vacation/);
});
