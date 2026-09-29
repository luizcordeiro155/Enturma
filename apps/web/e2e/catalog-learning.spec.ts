import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("UNA Aimorés ADS: seleção de UCs reais e três minigames com progresso", async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  const tag = randomUUID().slice(0, 8);
  await expect
    .poll(
      async () => {
        const r = await request.get(
          `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/catalog/subjects?search=Matem%C3%A1tica%20computacional%20aplicada`,
        );
        return r.ok() ? (await r.json()).items.length : 0;
      },
      { timeout: 60000 },
    )
    .toBeGreaterThanOrEqual(3);
  await page.goto("/register");
  await page.getByLabel("Seu nome").fill("Teste catálogo UNA");
  await page.getByLabel("Nome de usuário").fill(`una_${tag}`);
  await page.getByLabel("E-mail").fill(`una_${tag}@example.test`);
  await page.getByLabel("Senha", { exact: true }).fill("E2E-test-password-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.getByRole("button", { name: /Centro Universitário UNA/ }).click();
  await page.getByRole("button", { name: /Campus Sede Aimorés/ }).click();
  await page.getByLabel("Buscar no catálogo").fill("ADS");
  await page
    .getByRole("button", {
      name: /Análise e Desenvolvimento de Sistemas\s+Presencial/,
    })
    .click();
  await page.getByRole("button", { name: /E2A Radial · Presencial/ }).click();
  await page
    .getByRole("button", { name: /Fundamental · semestres 1–2/ })
    .click();
  await expect(
    page.getByText("Interação humano computador e UX", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Algoritmos e programação", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel(/Exploração digital e fundamentos tecnológicos/)
    .check();
  await page.getByLabel(/Matemática computacional aplicada/).check();
  await page.screenshot({
    path: "../../docs/design/una-onboarding.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Concluir perfil" }).click();
  await expect(page).toHaveURL(/home/);
  await page.getByRole("link", { name: "Praticar programação" }).click();
  await expect(
    page.getByRole("heading", { name: "Rota do algoritmo" }),
  ).toBeVisible();
  await page.locator("textarea.robot-code").fill(
    "DOWN\nDOWN\nDOWN\nDOWN\nRIGHT\nRIGHT\nRIGHT\nRIGHT",
  );
  await page.getByRole("button", { name: "Executar programa", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Desafio concluído" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Código Secreto/ }).click();
  await page.getByPlaceholder("5 letras").fill("ARRAY");
  await page.getByRole("button", { name: "Testar termo", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Desafio concluído" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Detetive de código/ }).click();
  await page.getByLabel("Resultado de console.log").fill("20");
  await page.getByRole("button", { name: "Testar hipótese" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Desafio concluído" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("de 12 desafios concluídos")).toContainText("3");
  await page.screenshot({
    path: "../../docs/design/learning-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("tab", { name: /Código Secreto/ }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../docs/design/learning-mobile.png",
    fullPage: true,
  });
});
