import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";

test("journey, tutorial, accessible motion and inbox clearing persist", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  const backend = process.env.E2E_API_URL ?? "http://localhost:8080",
    tag = randomUUID().slice(0, 8);
  const email = `journey-${tag}@example.test`,
    password = "E2E-test-password-123";
  const registration = await request.post(`${backend}/api/v1/auth/register`, {
    data: {
      name: "Estudante",
      username: `journey_${tag}`,
      email,
      password,
      device: "E2E",
    },
  });
  expect(registration.ok()).toBe(true);
  const token = (await registration.json()).accessToken,
    headers = { Authorization: `Bearer ${token}` };
  const db = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  try {
    expect(
      (await db.query("SELECT current_database() name")).rows[0].name,
    ).toBe("enturma_e2e");
    await db.query("UPDATE app_user SET role='ADMIN' WHERE email=$1", [email]);
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/home|onboarding/);
    await page.goto("/home");
    const journey = page.getByRole("complementary", {
      name: "Seu espaço de estudo",
    });
    await expect(journey.getByText("0 de 3 concluídos")).toBeVisible();
    await journey.getByRole("button", { name: "Começar guia" }).click();
    const guide = page.getByRole("dialog", {
      name: "Seu espaço, seu próximo passo",
    });
    await expect(guide).toBeVisible();
    await expect(
      guide.getByRole("button", { name: "Anterior", exact: true }),
    ).toBeDisabled();
    for (let i = 0; i < 8; i++)
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Próximo", exact: true })
        .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Concluir guia", exact: true })
      .click();
    await expect(
      journey.getByRole("button", { name: "Começar guia" }),
    ).toHaveCount(0);
    await page.reload();
    await expect(journey.getByText("0 de 3 concluídos")).toBeVisible();
    await expect(
      journey.getByRole("button", { name: "Começar guia" }),
    ).toHaveCount(0);
    // Use a fully isolated academic fixture, exercising real enrollment and room APIs.
    const auth = await request.post(`${backend}/api/v1/auth/login`, {
      data: { email, password, device: "fixture" },
    });
    const adminHeaders = {
      Authorization: `Bearer ${(await auth.json()).accessToken}`,
    };
    const ids: Record<string, string> = {};
    let parentId: string | null = null;
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
        name: `TESTE JORNADA ${kind} ${tag}`,
        code: null,
        curriculumVersion: kind === "CURRICULUM" ? "test-v1" : null,
        periodNumber: kind === "PERIOD" ? 1 : null,
        sourceUrl: "https://example.test/e2e",
        sourceName: "Fixture de teste",
        verifiedAt: new Date(Date.now() - 60000).toISOString(),
        validFrom: "2020-01-01",
        validUntil: null,
        status: "VERIFIED",
      };
      parentId = id;
      return entry;
    });
    expect(
      (
        await request.post(`${backend}/api/v1/admin/academics/import`, {
          headers: adminHeaders,
          data: { entries },
        })
      ).ok(),
    ).toBe(true);
    expect(
      (
        await request.put(`${backend}/api/v1/users/me/enrollment`, {
          headers,
          data: {
            periodId: ids.PERIOD,
            subjectIds: [ids.SUBJECT],
            shift: "EVENING",
            preferences: "",
          },
        })
      ).ok(),
    ).toBe(true);
    await page.reload();
    await expect(journey.getByText("1 de 3 concluídos")).toBeVisible();
    const created = await request.post(`${backend}/api/v1/study-rooms`, {
      headers,
      data: {
        subjectId: ids.SUBJECT,
        topicId: null,
        title: "Jornada de estudo",
        minutes: 50,
        maxParticipants: 8,
      },
    });
    expect(created.ok()).toBe(true);
    const room = (await created.json()).id;
    expect(
      (
        await request.post(`${backend}/api/v1/study-rooms/${room}/messages`, {
          headers,
          data: { body: "Vamos estudar juntos!" },
        })
      ).ok(),
    ).toBe(true);
    await page.reload();
    await expect(journey.getByText("3 de 3 concluídos")).toBeVisible();
    await expect(journey.getByText("Nível 1 · 100 XP")).toBeVisible();
    await expect(
      journey.getByText("Jornada concluída. Bom estudo!"),
    ).toBeVisible();
    await page.reload();
    await expect(journey.getByText("Nível 1 · 100 XP")).toBeVisible();
    // Read and unread notifications can be cleared together, and new ones still arrive.
    const insertNotice = () =>
      db.query(
        "INSERT INTO notification(id,user_id,message) SELECT $1,id,$2 FROM app_user WHERE email=$3",
        [randomUUID(), "Aviso de teste da jornada", email],
      );
    await insertNotice();
    await page.getByRole("button", { name: /^Notificações/ }).click();
    const inbox = page.getByRole("dialog", { name: "Sua caixa de entrada" });
    await expect(inbox.getByText("Aviso de teste da jornada")).toBeVisible();
    await inbox
      .getByRole("button", { name: "Limpar notificações", exact: true })
      .click();
    await expect(inbox.locator(".notification-item")).toHaveCount(0);
    await expect(
      inbox.getByRole("button", { name: "Limpar notificações", exact: true }),
    ).toBeDisabled();
    await page.reload();
    await page.getByRole("button", { name: /^Notificações/ }).click();
    await expect(inbox.locator(".notification-item")).toHaveCount(0);
    await insertNotice();
    await expect(inbox.getByText("Aviso de teste da jornada")).toBeVisible({
      timeout: 10000,
    });
    await inbox.getByRole("button", { name: "Fechar notificações" }).click();
    await page.evaluate(() => {
      localStorage.setItem(
        "enturma-experience",
        JSON.stringify({ theme: "DARK" }),
      );
      localStorage.setItem(
        "enturma-experience-pending",
        JSON.stringify({ theme: "DARK" }),
      );
    });
    await page.reload();
    await expect(journey.getByText("3 de 3 concluídos")).toBeVisible();
    await page.screenshot({
      path: "../../.local/journey-desktop-dark.png",
      fullPage: true,
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: "Acessibilidade", exact: true })
      .click();
    await page.getByLabel("Reduzir animações", { exact: false }).check();
    await expect(page.locator("html")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
    await page.keyboard.press("Escape");
    await journey
      .getByRole("button", { name: "Guia do Enturma", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Próximo", exact: true })
      .click();
    expect(
      await page
        .locator(".study-tutorial")
        .evaluate((el) => el.getAnimations({ subtree: true }).length),
    ).toBe(0);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "../../.local/journey-tutorial-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await expect(
      journey.getByRole("button", { name: "Guia do Enturma", exact: true }),
    ).toBeFocused();
    await page.evaluate(() => {
      localStorage.setItem(
        "enturma-experience",
        JSON.stringify({ theme: "LIGHT", reducedMotion: true }),
      );
      localStorage.setItem(
        "enturma-experience-pending",
        JSON.stringify({ theme: "LIGHT", reducedMotion: true }),
      );
    });
    await page.reload();
    await expect(journey.getByText("3 de 3 concluídos")).toBeVisible();
    await expect(page.locator(".onboarding-banner h2")).toBeVisible();
    await page.screenshot({
      path: "../../.local/journey-mobile-light.png",
      fullPage: true,
      animations: "disabled",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await db.end();
  }
});
